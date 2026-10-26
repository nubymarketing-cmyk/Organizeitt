-- Etapa 4 do SaaS: notificações.
-- Duas camadas:
-- 1. notifications: aviso dentro do portal (sino), por pessoa.
-- 2. notification_outbox: fila de envio por canal (e-mail, WhatsApp). Um serviço separado
--    (supabase/functions/notify-dispatch) lê a fila e envia. Ligar um canal novo não mexe nas telas.

alter table public.profiles add column phone text;
alter table public.posts add column reminder_sent_at timestamptz;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  /** Caminho dentro do portal, ex.: /app/aprovar */
  link text,
  post_id uuid references public.posts (id) on delete cascade,
  read_at timestamptz
);
create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);
alter table public.notifications enable row level security;
create policy notifications_select on public.notifications for select to authenticated
  using (recipient_id = auth.uid());

create type public.notification_channel as enum ('email', 'whatsapp');
create type public.outbox_status as enum ('pending', 'sent', 'failed', 'skipped');

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  notification_id uuid not null references public.notifications (id) on delete cascade,
  channel public.notification_channel not null,
  /** E-mail ou telefone de destino. */
  recipient text not null,
  subject text not null,
  body text not null,
  /** Link completo para abrir o portal (montado pelo serviço de envio com a URL pública). */
  link text,
  status public.outbox_status not null default 'pending',
  attempts integer not null default 0,
  last_error text,
  sent_at timestamptz
);
create index notification_outbox_pending_idx on public.notification_outbox (created_at) where status = 'pending';
-- Fila só para o serviço de envio (service_role). Ninguém do portal lê.
alter table public.notification_outbox enable row level security;

revoke insert, update, delete, truncate on public.notifications, public.notification_outbox from anon, authenticated;
revoke all on public.notification_outbox from anon, authenticated;
revoke all on public.notifications from anon;

-- ============================================================
-- Criar aviso + enfileirar envio
-- ============================================================

create function private.notify(
  p_recipient uuid, p_kind text, p_title text, p_body text, p_link text, p_post uuid
) returns void
language plpgsql security definer set search_path = public as $$
declare r public.profiles; n_id uuid;
begin
  select * into r from public.profiles where id = p_recipient;
  if not found then return; end if;
  insert into public.notifications (agency_id, recipient_id, kind, title, body, link, post_id)
  values (r.agency_id, r.id, p_kind, p_title, p_body, p_link, p_post)
  returning id into n_id;
  insert into public.notification_outbox (notification_id, channel, recipient, subject, body, link)
  values (n_id, 'email', r.email, p_title, coalesce(p_body, p_title), p_link);
  if r.phone is not null and length(trim(r.phone)) >= 10 then
    insert into public.notification_outbox (notification_id, channel, recipient, subject, body, link)
    values (n_id, 'whatsapp', trim(r.phone), p_title, coalesce(p_body, p_title), p_link);
  end if;
end $$;

/**
 * Post foi para aprovação: avisa o dono da clínica.
 * Cliente aprovou ou pediu ajuste: avisa o responsável pelo post e o admin da agência.
 */
create function public.notify_post_status() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  c public.clients;
  who uuid := auth.uid();
  rcpt uuid;
begin
  if new.status is not distinct from old.status then return new; end if;
  select * into c from public.clients where id = new.client_id;

  if new.status = 'awaiting_approval' then
    update public.posts set reminder_sent_at = null where id = new.id;
    for rcpt in
      select id from public.profiles where client_id = new.client_id and role = 'client_owner' and id is distinct from who
    loop
      perform private.notify(
        rcpt, 'post_to_approve',
        case when old.status = 'changes_requested' then 'Nova versão para aprovar' else 'Post novo para aprovar' end,
        format('"%s" está esperando seu ok.', new.title),
        '/app/aprovar', new.id);
    end loop;

  elsif new.status in ('approved', 'changes_requested') then
    for rcpt in
      select distinct id from public.profiles
       where agency_id = new.agency_id
         and (id = new.assignee_id or role = 'agency_admin')
         and id is distinct from who
    loop
      perform private.notify(
        rcpt,
        case when new.status = 'approved' then 'post_approved' else 'changes_requested' end,
        case when new.status = 'approved'
             then format('%s aprovou o post', c.name)
             else format('%s pediu ajuste', c.name) end,
        format('"%s"', new.title),
        '/agencia/posts/' || new.id, new.id);
    end loop;
  end if;
  return new;
end $$;
create trigger posts_notify_status after update of status on public.posts
  for each row execute function public.notify_post_status();

/** Lembrete para o dono da clínica: post esperando aprovação há mais de 48h (uma vez por envio). */
create function public.send_approval_reminders() returns integer
language plpgsql security definer set search_path = public as $$
declare post public.posts; rcpt uuid; n integer := 0;
begin
  for post in
    select * from public.posts
     where status = 'awaiting_approval'
       and status_changed_at < now() - interval '48 hours'
       and reminder_sent_at is null
     for update skip locked
  loop
    for rcpt in select id from public.profiles where client_id = post.client_id and role = 'client_owner'
    loop
      perform private.notify(
        rcpt, 'approval_reminder', 'Lembrete: post esperando seu ok',
        format('"%s" está esperando sua aprovação há mais de 2 dias.', post.title),
        '/app/aprovar', post.id);
    end loop;
    update public.posts set reminder_sent_at = now() where id = post.id;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function public.send_approval_reminders() from public, anon, authenticated;

-- ============================================================
-- Leitura e marcação pelo portal
-- ============================================================

/** Marca como lidos os avisos informados, ou todos quando a lista vem vazia. */
create function public.mark_notifications_read(p_ids uuid[] default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.notifications set read_at = now()
   where recipient_id = auth.uid() and read_at is null
     and (p_ids is null or cardinality(p_ids) = 0 or id = any (p_ids));
end $$;
revoke execute on function public.mark_notifications_read(uuid[]) from public, anon;
grant execute on function public.mark_notifications_read(uuid[]) to authenticated;

/** Telefone para receber avisos por WhatsApp (quando o canal for ligado). */
create function public.update_my_phone(p_phone text) returns void
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_profile(); v text := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
begin
  if v <> '' and length(v) < 10 then raise exception 'Telefone incompleto. Use DDD e número.'; end if;
  update public.profiles set phone = nullif(v, '') where id = p.id;
end $$;
revoke execute on function public.update_my_phone(text) from public, anon;
grant execute on function public.update_my_phone(text) to authenticated;

revoke execute on all functions in schema private from public;
grant execute on function private.path_visible(text) to authenticated;

-- ============================================================
-- Lembrete de hora em hora (pg_cron). Se a extensão não existir, o resto continua valendo.
-- ============================================================

do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('lembrete-aprovacao-48h', '0 * * * *', 'select public.send_approval_reminders()');
exception when others then
  raise notice 'pg_cron indisponível: lembrete de 48h não agendado (%).', sqlerrm;
end $$;
