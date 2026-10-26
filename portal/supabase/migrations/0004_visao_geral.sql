-- Etapa 2 do SaaS: visão geral da agência, atividade recente, mensalidade das clínicas,
-- cor do cliente no calendário geral e mudança de data arrastando o post.

-- ============================================================
-- Quando o status mudou (base dos alertas de 24h e 48h)
-- ============================================================

alter table public.posts add column status_changed_at timestamptz not null default now();
update public.posts set status_changed_at = updated_at;

-- ============================================================
-- Atividade recente
-- ============================================================

create type public.activity_action as enum (
  'post_submitted', 'post_version', 'post_approved', 'changes_requested', 'post_published', 'post_returned',
  'comment', 'report_published', 'file_uploaded'
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  post_id uuid references public.posts (id) on delete set null,
  actor_id uuid references public.profiles (id) on delete set null,
  action public.activity_action not null,
  /** Título do post, mês do relatório ou nome do arquivo, guardado na hora do evento. */
  subject text
);
create index activity_log_agency_idx on public.activity_log (agency_id, created_at desc);
alter table public.activity_log enable row level security;
create policy activity_log_select on public.activity_log for select to authenticated
  using (public.is_staff() and public.can_see(agency_id, client_id));

/** Quem fez a ação, se for alguém com profile (o dono da plataforma pode não ter). */
create function private.actor() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.profiles where id = auth.uid()
$$;

create function public.track_post_status() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_action public.activity_action;
begin
  if new.status is not distinct from old.status then return new; end if;
  new.status_changed_at := now();
  v_action := case new.status
    when 'awaiting_approval' then
      case when old.status = 'changes_requested' then 'post_version' else 'post_submitted' end
    when 'approved' then 'post_approved'
    when 'changes_requested' then 'changes_requested'
    when 'published' then 'post_published'
    else 'post_returned'
  end;
  insert into public.activity_log (agency_id, client_id, post_id, actor_id, action, subject)
  values (new.agency_id, new.client_id, new.id, private.actor(), v_action, new.title);
  return new;
end $$;
create trigger posts_track_status before update of status on public.posts
  for each row execute function public.track_post_status();

create function public.track_comment() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.kind = 'comment' then
    insert into public.activity_log (agency_id, client_id, post_id, actor_id, action, subject)
    select new.agency_id, new.client_id, new.post_id, new.author_id, 'comment', p.title
      from public.posts p where p.id = new.post_id;
  end if;
  return new;
end $$;
create trigger post_comments_track after insert on public.post_comments
  for each row execute function public.track_comment();

create function public.track_report() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.published and (tg_op = 'INSERT' or not old.published) then
    insert into public.activity_log (agency_id, client_id, actor_id, action, subject)
    values (new.agency_id, new.client_id, private.actor(), 'report_published', to_char(new.month, 'YYYY-MM-DD'));
  end if;
  return new;
end $$;
create trigger reports_track after insert or update of published on public.reports
  for each row execute function public.track_report();

create function public.track_file() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity_log (agency_id, client_id, actor_id, action, subject)
  values (new.agency_id, new.client_id, new.uploaded_by, 'file_uploaded', new.name);
  return new;
end $$;
create trigger files_track after insert on public.files
  for each row execute function public.track_file();

-- ============================================================
-- Mensalidade da clínica (controle manual da agência)
-- ============================================================

alter table public.clients
  add column monthly_fee numeric(12, 2) check (monthly_fee >= 0),
  add column billing_day integer check (billing_day between 1 and 28);

create table public.client_charges (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  due_date date not null,
  amount numeric(12, 2) not null check (amount >= 0),
  paid_at timestamptz,
  notes text,
  unique (client_id, due_date)
);
create index client_charges_client_idx on public.client_charges (client_id, due_date desc);
alter table public.client_charges enable row level security;
-- Financeiro: só o admin.
create policy client_charges_select on public.client_charges for select to authenticated
  using (agency_id = public.my_agency_id() and public.my_role() = 'agency_admin');

revoke insert, update, delete, truncate on public.activity_log, public.client_charges from anon, authenticated;
revoke all on public.activity_log, public.client_charges from anon;

-- ============================================================
-- Cor de cada cliente
-- ============================================================

create function private.client_palette(i integer) returns text
language sql immutable as $$
  select (array['#8B5CF6', '#3B82F6', '#14B8A6', '#F59E0B', '#EC4899', '#22C55E', '#EF4444', '#06B6D4', '#A855F7', '#F97316'])
         [1 + (i % 10)]
$$;

update public.clients c set color = private.client_palette(n.i)
  from (select id, (row_number() over (partition by agency_id order by created_at))::integer - 1 as i from public.clients) n
 where c.id = n.id and c.color is null;

create or replace function public.create_client(p_name text, p_specialty text, p_contact_email text)
returns public.clients
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_admin(); c public.clients; n integer;
begin
  if length(trim(coalesce(p_name, ''))) < 2 then raise exception 'Informe o nome da clínica.'; end if;
  select count(*) into n from public.clients where agency_id = p.agency_id;
  insert into public.clients (agency_id, name, specialty, contact_email, color)
  values (p.agency_id, trim(p_name), nullif(trim(p_specialty), ''), nullif(trim(p_contact_email), ''),
          private.client_palette(n))
  returning * into c;
  return c;
end $$;

/** Dados do cliente, cor no calendário e mensalidade. Só o admin. */
create function public.update_client(
  p_client uuid, p_name text, p_specialty text, p_contact_email text, p_color text,
  p_monthly_fee numeric, p_billing_day integer
) returns public.clients
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_admin(); c public.clients;
begin
  perform private.client_for(p, p_client);
  if length(trim(coalesce(p_name, ''))) < 2 then raise exception 'Informe o nome da clínica.'; end if;
  if p_color is not null and p_color !~ '^#[0-9a-fA-F]{6}$' then raise exception 'Cor inválida.'; end if;
  if p_monthly_fee is not null and p_monthly_fee < 0 then raise exception 'Valor da mensalidade inválido.'; end if;
  if p_billing_day is not null and (p_billing_day < 1 or p_billing_day > 28) then
    raise exception 'O dia de vencimento vai de 1 a 28.';
  end if;
  update public.clients
     set name = trim(p_name), specialty = nullif(trim(p_specialty), ''), contact_email = nullif(trim(p_contact_email), ''),
         color = p_color, monthly_fee = p_monthly_fee, billing_day = p_billing_day
   where id = p_client
  returning * into c;
  return c;
end $$;

create function public.create_charge(p_client uuid, p_due_date date, p_amount numeric, p_notes text)
returns public.client_charges
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_admin(); c public.clients; ch public.client_charges;
begin
  c := private.client_for(p, p_client);
  if p_due_date is null then raise exception 'Informe o vencimento.'; end if;
  if p_amount is null or p_amount < 0 then raise exception 'Informe o valor.'; end if;
  if exists (select 1 from public.client_charges where client_id = c.id and due_date = p_due_date) then
    raise exception 'Já existe uma cobrança com este vencimento.';
  end if;
  insert into public.client_charges (agency_id, client_id, due_date, amount, notes)
  values (c.agency_id, c.id, p_due_date, p_amount, nullif(trim(p_notes), ''))
  returning * into ch;
  return ch;
end $$;

create function public.set_charge_paid(p_charge uuid, p_paid boolean) returns public.client_charges
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_admin(); ch public.client_charges;
begin
  update public.client_charges set paid_at = case when p_paid then coalesce(paid_at, now()) end
   where id = p_charge and agency_id = p.agency_id
  returning * into ch;
  if not found then raise exception 'Cobrança não encontrada.'; end if;
  return ch;
end $$;

create function public.delete_charge(p_charge uuid) returns void
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_admin();
begin
  delete from public.client_charges where id = p_charge and agency_id = p.agency_id;
  if not found then raise exception 'Cobrança não encontrada.'; end if;
end $$;

/** Nova data do post (arrastar no calendário). Mantém o resto como está. */
create function public.reschedule_post(p_post uuid, p_scheduled_at timestamptz) returns public.posts
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_staff(); post public.posts;
begin
  post := private.post_for(p, p_post);
  update public.posts set scheduled_at = p_scheduled_at, updated_at = now() where id = p_post returning * into post;
  return post;
end $$;

-- ============================================================
-- Leitura da visão geral. Funções "invoker": o RLS de quem chama filtra tudo.
-- Datas no horário de Brasília.
-- ============================================================

create function public.agency_overview() returns json
language sql stable set timezone = 'America/Sao_Paulo' set search_path = public as $$
  with
  cli as (select * from public.clients where active),
  po as (select p.* from public.posts p join cli on cli.id = p.client_id),
  last_month as (select date_trunc('month', now() - interval '1 month')::date as m),
  missing as (
    select cli.id as client_id, cli.name as client_name, cli.color as client_color
      from cli
     where not exists (select 1 from public.reports r, last_month
                        where r.client_id = cli.id and r.month = last_month.m and r.published)
  ),
  attention as (
    select 'no_posts_week' as kind, cli.id as client_id, cli.name as client_name, null::uuid as post_id,
           null::text as post_title, null::timestamptz as since
      from cli
     where not exists (select 1 from po where po.client_id = cli.id
                         and po.scheduled_at >= now() and po.scheduled_at < now() + interval '7 days')
    union all
    select 'awaiting_48h', po.client_id, cli.name, po.id, po.title, po.status_changed_at
      from po join cli on cli.id = po.client_id
     where po.status = 'awaiting_approval' and po.status_changed_at < now() - interval '48 hours'
    union all
    select 'changes_24h', po.client_id, cli.name, po.id, po.title, po.status_changed_at
      from po join cli on cli.id = po.client_id
     where po.status = 'changes_requested' and po.status_changed_at < now() - interval '24 hours'
    union all
    select 'charge_overdue', ch.client_id, cli.name, null, null, ch.due_date::timestamptz
      from public.client_charges ch join cli on cli.id = ch.client_id
     where ch.paid_at is null and ch.due_date < current_date
  )
  select json_build_object(
    'awaiting', (select count(*) from po where status = 'awaiting_approval'),
    'changes', (select count(*) from po where status = 'changes_requested'),
    'overdue', (select count(*) from po where scheduled_at < now() and status <> 'published'),
    'reports_missing', (select count(*) from missing),
    'report_month', (select to_char(m, 'YYYY-MM-DD') from last_month),
    'missing_reports', (select coalesce(json_agg(missing order by client_name), '[]'::json) from missing),
    'attention', (select coalesce(json_agg(attention order by since nulls last, client_name), '[]'::json) from attention)
  )
$$;

/** Números do mês de cada cliente para os cards da lista. */
create function public.clients_summary() returns table (
  client_id uuid, month_published bigint, month_planned bigint, overdue bigint, awaiting bigint, changes bigint,
  payment_status text
)
language sql stable set timezone = 'America/Sao_Paulo' set search_path = public as $$
  select c.id,
         count(p.id) filter (where p.status = 'published' and p.scheduled_at >= date_trunc('month', now())
                               and p.scheduled_at < date_trunc('month', now()) + interval '1 month'),
         count(p.id) filter (where p.scheduled_at >= date_trunc('month', now())
                               and p.scheduled_at < date_trunc('month', now()) + interval '1 month'),
         count(p.id) filter (where p.scheduled_at < now() and p.status <> 'published'),
         count(p.id) filter (where p.status = 'awaiting_approval'),
         count(p.id) filter (where p.status = 'changes_requested'),
         case
           when exists (select 1 from public.client_charges ch
                         where ch.client_id = c.id and ch.paid_at is null and ch.due_date < current_date) then 'overdue'
           when exists (select 1 from public.client_charges ch where ch.client_id = c.id and ch.paid_at is null) then 'open'
           when exists (select 1 from public.client_charges ch where ch.client_id = c.id) then 'paid'
           else 'none'
         end
    from public.clients c
    left join public.posts p on p.client_id = c.id
   where c.active
   group by c.id
$$;

do $$
declare fn record;
begin
  for fn in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prorettype <> 'trigger'::regtype
  loop
    execute format('revoke execute on function %s from public, anon', fn.sig);
    execute format('grant execute on function %s to authenticated', fn.sig);
  end loop;
end $$;
revoke execute on all functions in schema private from public;
grant execute on function private.path_visible(text) to authenticated;
