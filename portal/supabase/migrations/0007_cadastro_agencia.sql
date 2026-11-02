-- Etapa 5 do SaaS: cadastro aberto de agência, limite de clientes por plano e onboarding.

-- ============================================================
-- Plano em vigor: teste vencido vale como Starter até o pagamento ser ligado.
-- ============================================================

create function public.effective_plan(a public.agencies) returns public.agency_plan
language sql stable as $$
  select case when a.status = 'trial' and a.trial_ends_at is not null and a.trial_ends_at < now()
              then 'starter'::public.agency_plan else a.plan end
$$;

create function private.slugify(p_text text) returns text
language sql immutable as $$
  select trim(both '-' from regexp_replace(
    lower(translate(p_text, 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
                            'aaaaaeeeeiiiiooooouuuucnaaaaaeeeeiiiiooooouuuucn')),
    '[^a-z0-9]+', '-', 'g'))
$$;

-- ============================================================
-- Cadastro: convite continua valendo; sem convite, só cria conta quem vem da página
-- de cadastro (nome da agência nos metadados). Essa pessoa vira admin de uma agência nova.
-- ============================================================

create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  inv public.invitations;
  v_name text := trim(coalesce(new.raw_user_meta_data ->> 'signup_agency_name', ''));
  v_slug text;
  ag public.agencies;
begin
  select * into inv from public.invitations where email = lower(new.email);
  if found then
    insert into public.profiles (id, agency_id, client_id, role, full_name, email)
    values (new.id, inv.agency_id, inv.client_id, inv.role, inv.full_name, lower(new.email));
    insert into public.client_assignments (client_id, profile_id, agency_id)
    select c.id, new.id, inv.agency_id from public.clients c
     where c.id = any (inv.assigned_client_ids) and c.agency_id = inv.agency_id;
    update public.invitations set accepted_at = now() where id = inv.id;
    return new;
  end if;

  if v_name = '' then
    raise exception 'Cadastro só por convite da agência.';
  end if;
  if length(v_name) < 2 or length(v_name) > 80 then
    raise exception 'Nome da agência inválido.';
  end if;

  v_slug := coalesce(nullif(private.slugify(v_name), ''), 'agencia');
  if exists (select 1 from public.agencies where slug = v_slug) then
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  end if;
  insert into public.agencies (name, slug, plan, status, trial_ends_at)
  values (v_name, v_slug, 'pro', 'trial', now() + interval '14 days')
  returning * into ag;
  insert into public.profiles (id, agency_id, client_id, role, full_name, email)
  values (new.id, ag.id, null, 'agency_admin', v_name, lower(new.email));
  return new;
end $$;

-- ============================================================
-- Limite de clientes ativos por plano
-- ============================================================

create function private.assert_can_add_client(p_agency uuid) returns void
language plpgsql stable security definer set search_path = public as $$
declare ag public.agencies; v_plan public.agency_plan; v_limit integer; v_count integer;
begin
  select * into ag from public.agencies where id = p_agency;
  if ag.status in ('suspended', 'canceled') then
    raise exception 'A conta da agência está %. Fale com o suporte para reativar.',
      case ag.status when 'suspended' then 'suspensa' else 'cancelada' end;
  end if;
  v_plan := public.effective_plan(ag);
  v_limit := public.plan_client_limit(v_plan);
  if v_limit is null then return; end if;
  select count(*) into v_count from public.clients where agency_id = p_agency and active;
  if v_count >= v_limit then
    raise exception 'Seu plano % permite até % clientes ativos. Mude de plano para cadastrar mais.',
      case v_plan when 'starter' then 'Starter' when 'pro' then 'Pro' else 'Agência' end, v_limit;
  end if;
end $$;

create or replace function public.create_client(p_name text, p_specialty text, p_contact_email text)
returns public.clients
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_admin(); c public.clients; n integer;
begin
  if length(trim(coalesce(p_name, ''))) < 2 then raise exception 'Informe o nome da clínica.'; end if;
  perform private.assert_can_add_client(p.agency_id);
  select count(*) into n from public.clients where agency_id = p.agency_id;
  insert into public.clients (agency_id, name, specialty, contact_email, color)
  values (p.agency_id, trim(p_name), nullif(trim(p_specialty), ''), nullif(trim(p_contact_email), ''),
          private.client_palette(n))
  returning * into c;
  return c;
end $$;

/** Onboarding concluído (ou pulado). */
create function public.complete_onboarding() returns void
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_admin();
begin
  update public.agencies set onboarding_done_at = coalesce(onboarding_done_at, now()) where id = p.agency_id;
end $$;

-- Painel da plataforma passa a mostrar o limite do plano em vigor.
create or replace function public.platform_agencies() returns table (
  id uuid, created_at timestamptz, name text, slug text, plan public.agency_plan, status public.agency_status,
  trial_ends_at timestamptz, client_limit integer, clients_count bigint, users_count bigint, posts_month bigint,
  admin_email text
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'Só o dono da plataforma pode ver isso.'; end if;
  return query
  select a.id, a.created_at, a.name, a.slug, a.plan, a.status, a.trial_ends_at,
         public.plan_client_limit(public.effective_plan(a)),
         (select count(*) from public.clients c where c.agency_id = a.id and c.active),
         (select count(*) from public.profiles u where u.agency_id = a.id),
         (select count(*) from public.posts po where po.agency_id = a.id
             and po.created_at >= date_trunc('month', now())),
         (select u.email from public.profiles u where u.agency_id = a.id and u.role = 'agency_admin'
           order by u.created_at limit 1)
    from public.agencies a
   order by a.created_at desc;
end $$;

do $$
declare fn record;
begin
  for fn in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prorettype <> 'trigger'::regtype
       and p.proname <> 'send_approval_reminders'
  loop
    execute format('revoke execute on function %s from public, anon', fn.sig);
    execute format('grant execute on function %s to authenticated', fn.sig);
  end loop;
end $$;
revoke execute on all functions in schema private from public;
grant execute on function private.path_visible(text) to authenticated;
