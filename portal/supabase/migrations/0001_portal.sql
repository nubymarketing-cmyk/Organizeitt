-- Portal do Cliente Nuby: banco, regras de acesso (RLS), RPCs e buckets.
-- Rodar uma vez no SQL Editor do Supabase (ou `supabase db push`).
--
-- Regras gerais:
-- - Toda linha tem agency_id e client_id. Equipe da agência vê tudo da própria agência;
--   cliente vê só o próprio client_id, nunca post em criação nem relatório não publicado.
-- - O front só LÊ tabelas direto. Toda escrita passa por funções (RPC) com as mesmas
--   regras e mensagens de erro do modo demonstração.
-- - Cadastro só por convite: o gatilho em auth.users recusa e-mail sem convite.

-- ============================================================
-- Tipos
-- ============================================================

create type public.user_role as enum ('agency_admin', 'agency_member', 'client_owner', 'client_member');
create type public.post_status as enum ('in_creation', 'awaiting_approval', 'changes_requested', 'approved', 'published');
create type public.network as enum ('instagram', 'facebook', 'tiktok', 'linkedin', 'youtube', 'outro');
create type public.post_format as enum ('imagem', 'carrossel', 'video', 'story', 'reels');
create type public.comment_kind as enum ('comment', 'approval', 'change_request');
create type public.file_folder as enum ('marca', 'artes_finais', 'fotos_videos', 'documentos');

-- ============================================================
-- Tabelas
-- ============================================================

create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  slug text not null unique,
  logo_url text,
  primary_color text
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  name text not null,
  specialty text,
  contact_email text,
  active boolean not null default true
);
create index clients_agency_idx on public.clients (agency_id);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  client_id uuid references public.clients (id) on delete cascade,
  role public.user_role not null,
  full_name text not null,
  email text not null unique,
  constraint profiles_client_matches_role
    check ((role in ('client_owner', 'client_member')) = (client_id is not null))
);
create index profiles_client_idx on public.profiles (client_id);

-- Convites pendentes. Viram profile no primeiro login.
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  client_id uuid references public.clients (id) on delete cascade,
  role public.user_role not null,
  full_name text not null,
  email text not null unique,
  invited_by uuid references public.profiles (id) on delete set null,
  accepted_at timestamptz,
  constraint invitations_client_matches_role
    check ((role in ('client_owner', 'client_member')) = (client_id is not null))
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  title text not null,
  caption text,
  network public.network not null,
  format public.post_format not null,
  scheduled_at timestamptz,
  status public.post_status not null default 'in_creation',
  current_version integer not null default 1,
  created_by uuid not null references public.profiles (id)
);
create index posts_client_scheduled_idx on public.posts (client_id, scheduled_at);

create table public.post_versions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  post_id uuid not null references public.posts (id) on delete cascade,
  agency_id uuid not null references public.agencies (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  version_number integer not null,
  caption text,
  media text[] not null default '{}',
  created_by uuid not null references public.profiles (id),
  unique (post_id, version_number)
);

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  post_id uuid not null references public.posts (id) on delete cascade,
  agency_id uuid not null references public.agencies (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  body text not null,
  kind public.comment_kind not null default 'comment'
);
create index post_comments_post_idx on public.post_comments (post_id, created_at);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  reach integer,
  new_followers integer,
  contacts integer,
  appointments integer,
  ad_spend numeric(12, 2),
  cost_per_lead numeric(12, 2),
  notes text,
  pdf_path text,
  published boolean not null default false,
  unique (client_id, month)
);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  folder public.file_folder not null,
  name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid not null references public.profiles (id)
);
create index files_client_idx on public.files (client_id, created_at desc);

-- ============================================================
-- Quem é o usuário logado
-- ============================================================

create function public.my_agency_id() returns uuid
language sql stable security definer set search_path = public as $$
  select agency_id from public.profiles where id = auth.uid()
$$;

create function public.my_client_id() returns uuid
language sql stable security definer set search_path = public as $$
  select client_id from public.profiles where id = auth.uid()
$$;

create function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role in ('agency_admin', 'agency_member') from public.profiles where id = auth.uid()),
    false)
$$;

/** Linha visível para o usuário? (mesma regra do canSeeRow do modo demonstração) */
create function public.can_see(p_agency uuid, p_client uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select p_agency = public.my_agency_id()
     and (public.is_staff() or p_client = public.my_client_id())
$$;

-- ============================================================
-- RLS: leitura
-- ============================================================

alter table public.agencies enable row level security;
alter table public.clients enable row level security;
alter table public.profiles enable row level security;
alter table public.invitations enable row level security;
alter table public.posts enable row level security;
alter table public.post_versions enable row level security;
alter table public.post_comments enable row level security;
alter table public.reports enable row level security;
alter table public.files enable row level security;

create policy agencies_select on public.agencies for select to authenticated
  using (id = public.my_agency_id());

create policy clients_select on public.clients for select to authenticated
  using (public.can_see(agency_id, id));

-- Cliente vê a equipe da agência (nome nos comentários) e as pessoas da própria clínica.
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or (agency_id = public.my_agency_id()
        and (public.is_staff() or client_id is null or client_id = public.my_client_id()))
  );

create policy invitations_select on public.invitations for select to authenticated
  using (agency_id = public.my_agency_id() and public.is_staff());

create policy posts_select on public.posts for select to authenticated
  using (public.can_see(agency_id, client_id) and (public.is_staff() or status <> 'in_creation'));

create policy post_versions_select on public.post_versions for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));

create policy post_comments_select on public.post_comments for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));

create policy reports_select on public.reports for select to authenticated
  using (public.can_see(agency_id, client_id) and (public.is_staff() or published));

create policy files_select on public.files for select to authenticated
  using (public.can_see(agency_id, client_id));

-- Escrita só pelas funções abaixo.
revoke insert, update, delete, truncate on all tables in schema public from anon, authenticated;
revoke all on all tables in schema public from anon;

-- ============================================================
-- Funções de apoio das RPCs (não expostas)
-- ============================================================

create schema if not exists private;

create function private.require_profile() returns public.profiles
language plpgsql stable security definer set search_path = public as $$
declare p public.profiles;
begin
  select * into p from public.profiles where id = auth.uid();
  if not found then raise exception 'Sua sessão expirou. Entre novamente.'; end if;
  return p;
end $$;

create function private.require_staff() returns public.profiles
language plpgsql stable security definer set search_path = public as $$
declare p public.profiles := private.require_profile();
begin
  if p.role not in ('agency_admin', 'agency_member') then
    raise exception 'Só a equipe da agência pode fazer isso.';
  end if;
  return p;
end $$;

create function private.require_client_user() returns public.profiles
language plpgsql stable security definer set search_path = public as $$
declare p public.profiles := private.require_profile();
begin
  if p.role in ('agency_admin', 'agency_member') or p.client_id is null then
    raise exception 'Só o cliente pode fazer isso.';
  end if;
  return p;
end $$;

create function private.client_for(p public.profiles, p_client uuid) returns public.clients
language plpgsql stable security definer set search_path = public as $$
declare c public.clients;
begin
  select * into c from public.clients where id = p_client;
  if not found or c.agency_id <> p.agency_id
     or (p.role not in ('agency_admin', 'agency_member') and c.id is distinct from p.client_id) then
    raise exception 'Cliente não encontrado.';
  end if;
  return c;
end $$;

/** Post visível e travado para alteração. */
create function private.post_for(p public.profiles, p_post uuid) returns public.posts
language plpgsql security definer set search_path = public as $$
declare post public.posts;
begin
  select * into post from public.posts where id = p_post for update;
  if not found or post.agency_id <> p.agency_id
     or (p.role not in ('agency_admin', 'agency_member')
         and (post.client_id is distinct from p.client_id or post.status = 'in_creation')) then
    raise exception 'Post não encontrado.';
  end if;
  return post;
end $$;

revoke all on schema private from public, anon, authenticated;

-- ============================================================
-- RPCs: clientes e convites
-- ============================================================

create function public.create_client(p_name text, p_specialty text, p_contact_email text)
returns public.clients
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_staff(); c public.clients;
begin
  if length(trim(coalesce(p_name, ''))) < 2 then raise exception 'Informe o nome da clínica.'; end if;
  insert into public.clients (agency_id, name, specialty, contact_email)
  values (p.agency_id, trim(p_name), nullif(trim(p_specialty), ''), nullif(trim(p_contact_email), ''))
  returning * into c;
  return c;
end $$;

/** Excluir = desativar. */
create function public.deactivate_client(p_client uuid) returns void
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_staff();
begin
  perform private.client_for(p, p_client);
  update public.clients set active = false where id = p_client;
end $$;

/**
 * Registra o convite. O e-mail com o link é disparado pelo front logo depois
 * (signInWithOtp); no primeiro login o gatilho transforma o convite em profile.
 */
create function public.invite_user(p_email text, p_full_name text, p_role public.user_role, p_client uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  p public.profiles := private.require_staff();
  v_email text := lower(trim(coalesce(p_email, '')));
  client_role boolean := p_role in ('client_owner', 'client_member');
begin
  if p.role <> 'agency_admin' then raise exception 'Só o admin da agência pode convidar usuários.'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'E-mail inválido.'; end if;
  if trim(coalesce(p_full_name, '')) = '' then raise exception 'Informe o nome da pessoa.'; end if;
  if client_role and p_client is null then raise exception 'Escolha a clínica deste usuário.'; end if;
  if not client_role and p_client is not null then
    raise exception 'Equipe da agência não fica ligada a uma clínica.';
  end if;
  if p_client is not null then perform private.client_for(p, p_client); end if;
  if exists (select 1 from public.profiles where email = v_email) then
    raise exception 'Já existe um usuário com este e-mail.';
  end if;
  -- Convidar de novo um e-mail pendente só atualiza os dados do convite.
  insert into public.invitations (agency_id, client_id, role, full_name, email, invited_by)
  values (p.agency_id, p_client, p_role, trim(p_full_name), v_email, p.id)
  on conflict (email) do update
    set client_id = excluded.client_id, role = excluded.role, full_name = excluded.full_name,
        invited_by = excluded.invited_by, created_at = now()
    where invitations.agency_id = excluded.agency_id;
  if not found then raise exception 'Já existe um usuário com este e-mail.'; end if;
end $$;

-- ============================================================
-- RPCs: posts
-- ============================================================

create function public.create_post(
  p_client uuid, p_title text, p_caption text, p_network public.network,
  p_format public.post_format, p_scheduled_at timestamptz, p_media text[]
) returns public.posts
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_staff(); c public.clients; post public.posts;
begin
  c := private.client_for(p, p_client);
  if trim(coalesce(p_title, '')) = '' then raise exception 'Dê um título ao post.'; end if;
  insert into public.posts (agency_id, client_id, title, caption, network, format, scheduled_at, created_by)
  values (c.agency_id, c.id, trim(p_title), p_caption, p_network, p_format, p_scheduled_at, p.id)
  returning * into post;
  insert into public.post_versions (post_id, agency_id, client_id, version_number, caption, media, created_by)
  values (post.id, post.agency_id, post.client_id, 1, p_caption, coalesce(p_media, '{}'), p.id);
  return post;
end $$;

/** Edita dados do post. Legenda e mídia só mudam direto enquanto está em criação. */
create function public.update_post(
  p_post uuid, p_title text, p_caption text, p_network public.network,
  p_format public.post_format, p_scheduled_at timestamptz, p_media text[]
) returns public.posts
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_staff(); post public.posts;
begin
  post := private.post_for(p, p_post);
  if trim(coalesce(p_title, '')) = '' then raise exception 'Dê um título ao post.'; end if;
  update public.posts
     set title = trim(p_title), network = p_network, format = p_format, scheduled_at = p_scheduled_at,
         caption = case when status = 'in_creation' then p_caption else caption end,
         updated_at = now()
   where id = p_post
  returning * into post;
  if post.status = 'in_creation' then
    update public.post_versions set caption = p_caption, media = coalesce(p_media, '{}')
     where post_id = p_post and version_number = post.current_version;
  end if;
  return post;
end $$;

create function public.submit_post_for_approval(p_post uuid) returns public.posts
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_staff(); post public.posts;
begin
  post := private.post_for(p, p_post);
  if post.status <> 'in_creation' then
    raise exception 'Só posts em criação podem ser enviados para aprovação.';
  end if;
  update public.posts set status = 'awaiting_approval', updated_at = now() where id = p_post returning * into post;
  return post;
end $$;

create function public.approve_post(p_post uuid) returns public.posts
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_client_user(); post public.posts;
begin
  post := private.post_for(p, p_post);
  if post.status <> 'awaiting_approval' then raise exception 'Este post não está aguardando aprovação.'; end if;
  update public.posts set status = 'approved', updated_at = now() where id = p_post returning * into post;
  insert into public.post_comments (post_id, agency_id, client_id, author_id, body, kind)
  values (post.id, post.agency_id, post.client_id, p.id, 'Aprovado.', 'approval');
  return post;
end $$;

create function public.request_post_changes(p_post uuid, p_comment text) returns public.posts
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_client_user(); post public.posts;
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

create function public.create_post_version(p_post uuid, p_caption text, p_media text[]) returns public.posts
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_staff(); post public.posts;
begin
  post := private.post_for(p, p_post);
  if post.status <> 'changes_requested' then
    raise exception 'Nova versão só pode ser enviada quando o cliente pediu ajuste.';
  end if;
  update public.posts
     set current_version = current_version + 1, caption = p_caption,
         status = 'awaiting_approval', updated_at = now()
   where id = p_post
  returning * into post;
  insert into public.post_versions (post_id, agency_id, client_id, version_number, caption, media, created_by)
  values (post.id, post.agency_id, post.client_id, post.current_version, p_caption, coalesce(p_media, '{}'), p.id);
  return post;
end $$;

create function public.mark_post_published(p_post uuid) returns public.posts
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_staff(); post public.posts;
begin
  post := private.post_for(p, p_post);
  if post.status <> 'approved' then raise exception 'Só posts aprovados podem ser marcados como publicados.'; end if;
  update public.posts set status = 'published', updated_at = now() where id = p_post returning * into post;
  return post;
end $$;

/** Qualquer status -> em criação (retrabalho). Só agência. */
create function public.return_post_to_creation(p_post uuid) returns public.posts
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_staff(); post public.posts;
begin
  post := private.post_for(p, p_post);
  if post.status = 'in_creation' then raise exception 'O post já está em criação.'; end if;
  update public.posts set status = 'in_creation', updated_at = now() where id = p_post returning * into post;
  return post;
end $$;

create function public.add_post_comment(p_post uuid, p_body text) returns void
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_profile(); post public.posts;
begin
  post := private.post_for(p, p_post);
  if trim(coalesce(p_body, '')) = '' then raise exception 'Escreva um comentário.'; end if;
  insert into public.post_comments (post_id, agency_id, client_id, author_id, body, kind)
  values (post.id, post.agency_id, post.client_id, p.id, trim(p_body), 'comment');
end $$;

-- ============================================================
-- RPCs: relatórios e arquivos
-- ============================================================

/**
 * Cria (p_report nulo) ou atualiza o relatório do mês.
 * p_pdf_path nulo mantém o PDF atual. p_publish false não despublica.
 */
create function public.save_report(
  p_report uuid, p_client uuid, p_month date,
  p_reach integer, p_new_followers integer, p_contacts integer, p_appointments integer,
  p_ad_spend numeric, p_cost_per_lead numeric, p_notes text,
  p_pdf_path text, p_publish boolean
) returns public.reports
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_staff(); c public.clients; r public.reports;
begin
  c := private.client_for(p, p_client);
  if p_month is null or extract(day from p_month) <> 1 then raise exception 'Escolha o mês do relatório.'; end if;
  if p_report is not null then
    select * into r from public.reports where id = p_report and client_id = c.id for update;
    if not found then raise exception 'Relatório não encontrado.'; end if;
  end if;
  if exists (select 1 from public.reports
              where client_id = c.id and month = p_month and id is distinct from p_report) then
    raise exception 'Este mês já tem relatório. Volte e use Editar nele.';
  end if;
  if p_pdf_path is not null and split_part(p_pdf_path, '/', 2) <> c.id::text then
    raise exception 'PDF inválido para este cliente.';
  end if;

  if p_report is null then
    insert into public.reports (agency_id, client_id, month, reach, new_followers, contacts, appointments,
                                ad_spend, cost_per_lead, notes, pdf_path, published)
    values (c.agency_id, c.id, p_month, p_reach, p_new_followers, p_contacts, p_appointments,
            p_ad_spend, p_cost_per_lead, p_notes, p_pdf_path, coalesce(p_publish, false))
    returning * into r;
  else
    update public.reports
       set month = p_month, reach = p_reach, new_followers = p_new_followers, contacts = p_contacts,
           appointments = p_appointments, ad_spend = p_ad_spend, cost_per_lead = p_cost_per_lead,
           notes = p_notes, pdf_path = coalesce(p_pdf_path, pdf_path),
           published = published or coalesce(p_publish, false), updated_at = now()
     where id = p_report
    returning * into r;
  end if;
  return r;
end $$;

create function public.unpublish_report(p_report uuid) returns void
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_staff();
begin
  update public.reports set published = false, updated_at = now()
   where id = p_report and agency_id = p.agency_id;
  if not found then raise exception 'Relatório não encontrado.'; end if;
end $$;

/** Registra um arquivo já enviado ao bucket client-files. */
create function public.register_file(
  p_client uuid, p_folder public.file_folder, p_name text, p_storage_path text,
  p_mime_type text, p_size_bytes bigint
) returns public.files
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_profile(); c public.clients; f public.files;
begin
  c := private.client_for(p, p_client);
  if p_storage_path not like c.agency_id || '/' || c.id || '/%' then
    raise exception 'Caminho de arquivo inválido.';
  end if;
  insert into public.files (agency_id, client_id, folder, name, storage_path, mime_type, size_bytes, uploaded_by)
  values (c.agency_id, c.id, p_folder, p_name, p_storage_path, p_mime_type, p_size_bytes, p.id)
  returning * into f;
  return f;
end $$;

-- RPCs só para quem está logado.
do $$
declare fn record;
begin
  for fn in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
  loop
    execute format('revoke execute on function %s from public, anon', fn.sig);
    execute format('grant execute on function %s to authenticated', fn.sig);
  end loop;
end $$;

-- ============================================================
-- Cadastro só por convite
-- ============================================================

create function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare inv public.invitations;
begin
  select * into inv from public.invitations where email = lower(new.email);
  if not found then
    raise exception 'Cadastro só por convite da agência.';
  end if;
  insert into public.profiles (id, agency_id, client_id, role, full_name, email)
  values (new.id, inv.agency_id, inv.client_id, inv.role, inv.full_name, lower(new.email));
  update public.invitations set accepted_at = now() where id = inv.id;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ============================================================
-- Storage: buckets privados, caminho {agency_id}/{client_id}/{arquivo}
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('post-media', 'post-media', false, 104857600, array['image/*', 'video/*']),
  ('client-files', 'client-files', false, 104857600, null),
  ('report-pdfs', 'report-pdfs', false, 20971520, array['application/pdf'])
on conflict (id) do nothing;

create function private.path_visible(p_name text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare uuid_re constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if split_part(p_name, '/', 1) !~ uuid_re or split_part(p_name, '/', 2) !~ uuid_re then
    return false;
  end if;
  return public.can_see(split_part(p_name, '/', 1)::uuid, split_part(p_name, '/', 2)::uuid);
end $$;

revoke execute on all functions in schema private from public;
grant usage on schema private to authenticated;
grant execute on function private.path_visible(text) to authenticated;

-- Agência lê tudo da agência. Cliente lê mídia e arquivos da própria clínica
-- e só os PDFs de relatórios publicados.
create policy portal_read on storage.objects for select to authenticated
  using (
    bucket_id in ('post-media', 'client-files', 'report-pdfs')
    and private.path_visible(name)
    and (
      bucket_id <> 'report-pdfs'
      or public.is_staff()
      or exists (select 1 from public.reports r where r.pdf_path = name and r.published)
    )
  );

-- Mídia de post e PDF de relatório: só agência. Arquivos da marca: agência e cliente.
create policy portal_upload on storage.objects for insert to authenticated
  with check (
    bucket_id in ('post-media', 'client-files', 'report-pdfs')
    and private.path_visible(name)
    and (bucket_id = 'client-files' or public.is_staff())
  );
