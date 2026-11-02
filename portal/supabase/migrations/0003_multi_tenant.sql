-- Etapa 1 do SaaS: agência com plano e status, dono da plataforma, equipe por cliente,
-- equipe da clínica só visualiza (e comenta), white label básico.

-- ============================================================
-- Agência: plano, status e marca
-- ============================================================

create type public.agency_plan as enum ('starter', 'pro', 'agencia');
create type public.agency_status as enum ('trial', 'active', 'suspended', 'canceled');

alter table public.agencies
  add column plan public.agency_plan not null default 'pro',
  add column status public.agency_status not null default 'trial',
  add column trial_ends_at timestamptz default now() + interval '14 days',
  add column onboarding_done_at timestamptz;

-- Agências que já existiam antes do SaaS ficam ativas, sem limite e sem onboarding.
update public.agencies set plan = 'agencia', status = 'active', trial_ends_at = null, onboarding_done_at = now();

/** Limite de clientes ativos por plano (nulo = ilimitado). */
create function public.plan_client_limit(p_plan public.agency_plan) returns integer
language sql immutable as $$
  select case p_plan when 'starter' then 5 when 'pro' then 20 else null end
$$;

-- ============================================================
-- Dono da plataforma
-- ============================================================

create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
create policy platform_admins_select on public.platform_admins for select to authenticated
  using (user_id = auth.uid());

create function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid())
$$;

insert into public.platform_admins (user_id)
select id from auth.users where email = 'nuby.marketing@gmail.com'
on conflict do nothing;

-- ============================================================
-- Equipe da agência por cliente
-- ============================================================

create table public.client_assignments (
  client_id uuid not null references public.clients (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  agency_id uuid not null references public.agencies (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, profile_id)
);
create index client_assignments_profile_idx on public.client_assignments (profile_id);
alter table public.client_assignments enable row level security;

-- Clientes atribuídos já no convite: viram client_assignments no primeiro login.
alter table public.invitations add column assigned_client_ids uuid[] not null default '{}';

alter table public.clients add column color text;
alter table public.posts add column assignee_id uuid references public.profiles (id) on delete set null;
alter table public.profiles add column tour_done_at timestamptz;

-- ============================================================
-- Quem vê o quê
-- ============================================================

create function public.my_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

/**
 * Admin da agência: tudo da agência. Equipe: só clientes atribuídos.
 * Pessoas da clínica: só a própria clínica.
 */
create or replace function public.can_see(p_agency uuid, p_client uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select p_agency = public.my_agency_id()
     and case public.my_role()
           when 'agency_admin' then true
           when 'agency_member' then exists (
             select 1 from public.client_assignments a where a.client_id = p_client and a.profile_id = auth.uid())
           else p_client = public.my_client_id()
         end
$$;

-- Plataforma vê todas as agências; o resto só a própria.
drop policy agencies_select on public.agencies;
create policy agencies_select on public.agencies for select to authenticated
  using (id = public.my_agency_id() or public.is_platform_admin());

create policy client_assignments_select on public.client_assignments for select to authenticated
  using (agency_id = public.my_agency_id() and public.is_staff());

-- Convites: só o admin da agência.
drop policy invitations_select on public.invitations;
create policy invitations_select on public.invitations for select to authenticated
  using (agency_id = public.my_agency_id() and public.my_role() = 'agency_admin');

revoke insert, update, delete, truncate on public.platform_admins, public.client_assignments from anon, authenticated;
revoke all on public.platform_admins, public.client_assignments from anon;

-- ============================================================
-- Apoio das RPCs com as regras novas
-- ============================================================

create function private.require_admin() returns public.profiles
language plpgsql stable security definer set search_path = public as $$
declare p public.profiles := private.require_profile();
begin
  if p.role <> 'agency_admin' then raise exception 'Só o admin da agência pode fazer isso.'; end if;
  return p;
end $$;

create function private.require_client_owner() returns public.profiles
language plpgsql stable security definer set search_path = public as $$
declare p public.profiles := private.require_client_user();
begin
  if p.role <> 'client_owner' then
    raise exception 'Só o responsável pela clínica pode aprovar ou pedir ajuste.';
  end if;
  return p;
end $$;

create or replace function private.client_for(p public.profiles, p_client uuid) returns public.clients
language plpgsql stable security definer set search_path = public as $$
declare c public.clients;
begin
  select * into c from public.clients where id = p_client;
  if not found or c.agency_id <> p.agency_id or not public.can_see(c.agency_id, c.id) then
    raise exception 'Cliente não encontrado.';
  end if;
  return c;
end $$;

create or replace function private.post_for(p public.profiles, p_post uuid) returns public.posts
language plpgsql security definer set search_path = public as $$
declare post public.posts;
begin
  select * into post from public.posts where id = p_post for update;
  if not found or post.agency_id <> p.agency_id or not public.can_see(post.agency_id, post.client_id)
     or (p.role not in ('agency_admin', 'agency_member') and post.status = 'in_creation') then
    raise exception 'Post não encontrado.';
  end if;
  return post;
end $$;

revoke execute on all functions in schema private from public;
grant execute on function private.path_visible(text) to authenticated;

-- ============================================================
-- RPCs que mudam de regra
-- ============================================================

/** Cadastrar cliente: só o admin (a equipe vê apenas os clientes atribuídos a ela). */
create or replace function public.create_client(p_name text, p_specialty text, p_contact_email text)
returns public.clients
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_admin(); c public.clients;
begin
  if length(trim(coalesce(p_name, ''))) < 2 then raise exception 'Informe o nome da clínica.'; end if;
  insert into public.clients (agency_id, name, specialty, contact_email)
  values (p.agency_id, trim(p_name), nullif(trim(p_specialty), ''), nullif(trim(p_contact_email), ''))
  returning * into c;
  return c;
end $$;

create or replace function public.deactivate_client(p_client uuid) returns void
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_admin();
begin
  perform private.client_for(p, p_client);
  update public.clients set active = false where id = p_client;
end $$;

create or replace function public.approve_post(p_post uuid) returns public.posts
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_client_owner(); post public.posts;
begin
  post := private.post_for(p, p_post);
  if post.status <> 'awaiting_approval' then raise exception 'Este post não está aguardando aprovação.'; end if;
  update public.posts set status = 'approved', updated_at = now() where id = p_post returning * into post;
  insert into public.post_comments (post_id, agency_id, client_id, author_id, body, kind)
  values (post.id, post.agency_id, post.client_id, p.id, 'Aprovado.', 'approval');
  return post;
end $$;

create or replace function public.request_post_changes(p_post uuid, p_comment text) returns public.posts
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_client_owner(); post public.posts;
begin
  post := private.post_for(p, p_post);
  if post.status <> 'awaiting_approval' then raise exception 'Este post não está aguardando aprovação.'; end if;
  if length(trim(coalesce(p_comment, ''))) < 5 then
    raise exception 'Conte o que precisa mudar (pelo menos 5 caracteres).';
  end if;
  update public.posts set status = 'changes_requested', updated_at = now() where id = p_post returning * into post;
  insert into public.post_comments (post_id, agency_id, client_id, author_id, body, kind)
  values (post.id, post.agency_id, post.client_id, p.id, trim(p_comment), 'change_request');
  return post;
end $$;

create or replace function public.unpublish_report(p_report uuid) returns void
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_staff(); r public.reports;
begin
  select * into r from public.reports where id = p_report and agency_id = p.agency_id;
  if not found or not public.can_see(r.agency_id, r.client_id) then raise exception 'Relatório não encontrado.'; end if;
  update public.reports set published = false, updated_at = now() where id = p_report;
end $$;

/** Convite com clientes atribuídos (só para equipe da agência). */
drop function public.invite_user(text, text, public.user_role, uuid);
create function public.invite_user(
  p_email text, p_full_name text, p_role public.user_role, p_client uuid, p_assigned uuid[] default '{}'
) returns void
language plpgsql security definer set search_path = public as $$
declare
  p public.profiles := private.require_admin();
  v_email text := lower(trim(coalesce(p_email, '')));
  client_role boolean := p_role in ('client_owner', 'client_member');
  v_assigned uuid[] := case when p_role = 'agency_member' then coalesce(p_assigned, '{}') else '{}' end;
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'E-mail inválido.'; end if;
  if trim(coalesce(p_full_name, '')) = '' then raise exception 'Informe o nome da pessoa.'; end if;
  if client_role and p_client is null then raise exception 'Escolha a clínica deste usuário.'; end if;
  if not client_role and p_client is not null then
    raise exception 'Equipe da agência não fica ligada a uma clínica.';
  end if;
  if p_client is not null then perform private.client_for(p, p_client); end if;
  if exists (select 1 from unnest(v_assigned) x
              where not exists (select 1 from public.clients c where c.id = x and c.agency_id = p.agency_id)) then
    raise exception 'Cliente não encontrado.';
  end if;
  if exists (select 1 from public.profiles where email = v_email) then
    raise exception 'Já existe um usuário com este e-mail.';
  end if;
  insert into public.invitations (agency_id, client_id, role, full_name, email, invited_by, assigned_client_ids)
  values (p.agency_id, p_client, p_role, trim(p_full_name), v_email, p.id, v_assigned)
  on conflict (email) do update
    set client_id = excluded.client_id, role = excluded.role, full_name = excluded.full_name,
        invited_by = excluded.invited_by, assigned_client_ids = excluded.assigned_client_ids, created_at = now()
    where invitations.agency_id = excluded.agency_id;
  if not found then raise exception 'Já existe um usuário com este e-mail.'; end if;
end $$;

create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare inv public.invitations;
begin
  select * into inv from public.invitations where email = lower(new.email);
  if not found then
    raise exception 'Cadastro só por convite da agência.';
  end if;
  insert into public.profiles (id, agency_id, client_id, role, full_name, email)
  values (new.id, inv.agency_id, inv.client_id, inv.role, inv.full_name, lower(new.email));
  insert into public.client_assignments (client_id, profile_id, agency_id)
  select c.id, new.id, inv.agency_id from public.clients c
   where c.id = any (inv.assigned_client_ids) and c.agency_id = inv.agency_id;
  update public.invitations set accepted_at = now() where id = inv.id;
  return new;
end $$;

-- ============================================================
-- RPCs novas
-- ============================================================

/** Troca os clientes atribuídos a alguém da equipe. */
create function public.set_member_clients(p_profile uuid, p_clients uuid[]) returns void
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_admin(); m public.profiles;
begin
  select * into m from public.profiles where id = p_profile and agency_id = p.agency_id;
  if not found or m.role <> 'agency_member' then raise exception 'Membro da equipe não encontrado.'; end if;
  if exists (select 1 from unnest(coalesce(p_clients, '{}')) x
              where not exists (select 1 from public.clients c where c.id = x and c.agency_id = p.agency_id)) then
    raise exception 'Cliente não encontrado.';
  end if;
  delete from public.client_assignments where profile_id = p_profile;
  insert into public.client_assignments (client_id, profile_id, agency_id)
  select distinct x, p_profile, p.agency_id from unnest(coalesce(p_clients, '{}')) x;
end $$;

/** Responsável pelo post: alguém da equipe que enxerga o cliente (ou ninguém). */
create function public.set_post_assignee(p_post uuid, p_assignee uuid) returns public.posts
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_staff(); post public.posts; a public.profiles;
begin
  post := private.post_for(p, p_post);
  if p_assignee is not null then
    select * into a from public.profiles where id = p_assignee and agency_id = p.agency_id;
    if not found or a.role not in ('agency_admin', 'agency_member')
       or (a.role = 'agency_member' and not exists (
             select 1 from public.client_assignments ca where ca.client_id = post.client_id and ca.profile_id = a.id)) then
      raise exception 'Escolha alguém da equipe que cuida deste cliente.';
    end if;
  end if;
  update public.posts set assignee_id = p_assignee, updated_at = now() where id = p_post returning * into post;
  return post;
end $$;

/** Nome, logo e cor da agência (white label). */
create function public.update_agency_branding(p_name text, p_logo_url text, p_color text) returns public.agencies
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_admin(); ag public.agencies;
begin
  if length(trim(coalesce(p_name, ''))) < 2 then raise exception 'Informe o nome da agência.'; end if;
  if p_color is not null and p_color !~ '^#[0-9a-fA-F]{6}$' then raise exception 'Cor inválida.'; end if;
  update public.agencies
     set name = trim(p_name), logo_url = nullif(trim(p_logo_url), ''), primary_color = p_color
   where id = p.agency_id
  returning * into ag;
  return ag;
end $$;

/** Agências com uso, para o dono da plataforma. */
create function public.platform_agencies() returns table (
  id uuid, created_at timestamptz, name text, slug text, plan public.agency_plan, status public.agency_status,
  trial_ends_at timestamptz, client_limit integer, clients_count bigint, users_count bigint, posts_month bigint,
  admin_email text
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'Só o dono da plataforma pode ver isso.'; end if;
  return query
  select a.id, a.created_at, a.name, a.slug, a.plan, a.status, a.trial_ends_at, public.plan_client_limit(a.plan),
         (select count(*) from public.clients c where c.agency_id = a.id and c.active),
         (select count(*) from public.profiles u where u.agency_id = a.id),
         (select count(*) from public.posts po where po.agency_id = a.id
             and po.created_at >= date_trunc('month', now())),
         (select u.email from public.profiles u where u.agency_id = a.id and u.role = 'agency_admin'
           order by u.created_at limit 1)
    from public.agencies a
   order by a.created_at desc;
end $$;

create function public.platform_update_agency(p_agency uuid, p_plan public.agency_plan, p_status public.agency_status)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'Só o dono da plataforma pode fazer isso.'; end if;
  update public.agencies
     set plan = p_plan, status = p_status,
         trial_ends_at = case when p_status = 'trial' then coalesce(trial_ends_at, now() + interval '14 days') else trial_ends_at end
   where id = p_agency;
  if not found then raise exception 'Agência não encontrada.'; end if;
end $$;

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

-- ============================================================
-- Logos: bucket público, cada admin envia só na pasta da própria agência
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('agency-assets', 'agency-assets', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy agency_assets_upload on storage.objects for insert to authenticated
  with check (
    bucket_id = 'agency-assets'
    and split_part(name, '/', 1) = public.my_agency_id()::text
    and public.my_role() = 'agency_admin'
  );
