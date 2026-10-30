-- Login com e-mail e senha para todos, sem depender de e-mail chegando.
-- O convite gera um código de acesso (6 caracteres) que a agência manda para a pessoa
-- (WhatsApp, por exemplo). Com e-mail + código, a pessoa cria a própria senha em
-- "Primeiro acesso". O mesmo código serve para o admin redefinir o acesso de quem esqueceu.
--
-- Exige no Supabase: Authentication > Email > "Confirm email" desligado (mailer_autoconfirm).

alter table public.invitations
  add column access_code text,
  add column code_expires_at timestamptz,
  add column failed_attempts integer not null default 0;

/** 6 caracteres sem os que se confundem (0/O, 1/I/L). */
create function private.new_access_code() returns text
language sql volatile as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1), '')
    from generate_series(1, 6)
$$;

/** Código válido para o convite? */
create function private.code_ok(inv public.invitations, p_code text) returns boolean
language sql stable as $$
  select inv.access_code is not null
     and inv.failed_attempts < 10
     and (inv.code_expires_at is null or inv.code_expires_at > now())
     and upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g')) = inv.access_code
$$;

-- ============================================================
-- Convite devolve o código de acesso
-- ============================================================

drop function public.invite_user(text, text, public.user_role, uuid, uuid[]);
create function public.invite_user(
  p_email text, p_full_name text, p_role public.user_role, p_client uuid, p_assigned uuid[] default '{}'
) returns text
language plpgsql security definer set search_path = public as $$
declare
  p public.profiles := private.require_admin();
  v_email text := lower(trim(coalesce(p_email, '')));
  client_role boolean := p_role in ('client_owner', 'client_member');
  v_assigned uuid[] := case when p_role = 'agency_member' then coalesce(p_assigned, '{}') else '{}' end;
  v_code text := private.new_access_code();
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
    raise exception 'Já existe um usuário com este e-mail. Para trocar a senha dele, gere um novo código de acesso.';
  end if;
  insert into public.invitations (agency_id, client_id, role, full_name, email, invited_by, assigned_client_ids,
                                  access_code, code_expires_at, failed_attempts)
  values (p.agency_id, p_client, p_role, trim(p_full_name), v_email, p.id, v_assigned,
          v_code, now() + interval '14 days', 0)
  on conflict (email) do update
    set client_id = excluded.client_id, role = excluded.role, full_name = excluded.full_name,
        invited_by = excluded.invited_by, assigned_client_ids = excluded.assigned_client_ids, created_at = now(),
        access_code = excluded.access_code, code_expires_at = excluded.code_expires_at, failed_attempts = 0,
        accepted_at = null
    where invitations.agency_id = excluded.agency_id;
  if not found then raise exception 'Já existe um usuário com este e-mail.'; end if;
  return v_code;
end $$;

/** Novo código para alguém que já tem conta (esqueceu a senha ou nunca criou). Só o admin. */
create function public.reset_user_access(p_profile uuid) returns text
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_admin(); u public.profiles; v_code text := private.new_access_code();
begin
  select * into u from public.profiles where id = p_profile and agency_id = p.agency_id;
  if not found then raise exception 'Usuário não encontrado.'; end if;
  insert into public.invitations (agency_id, client_id, role, full_name, email, invited_by, access_code, code_expires_at,
                                  failed_attempts, accepted_at)
  values (u.agency_id, u.client_id, u.role, u.full_name, u.email, p.id, v_code, now() + interval '14 days', 0, null)
  on conflict (email) do update
    set access_code = excluded.access_code, code_expires_at = excluded.code_expires_at, failed_attempts = 0,
        accepted_at = null, invited_by = excluded.invited_by
    where invitations.agency_id = excluded.agency_id;
  if not found then raise exception 'Usuário não encontrado.'; end if;
  return v_code;
end $$;

-- ============================================================
-- Primeiro acesso: e-mail + código + senha
-- ============================================================

/**
 * Cria a senha de quem já tem usuário no Auth (ex.: entrou antes por link) ou avisa que
 * ainda não tem ("no_user"), e aí o front cria o usuário com signUp levando o código.
 * Resposta: 'ok' | 'no_user' | 'invalid'. Não lança erro no código errado para que a
 * contagem de tentativas fique gravada (10 erros travam o código).
 */
create function public.claim_access(p_email text, p_code text, p_password text) returns text
language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  inv public.invitations;
  uid uuid;
begin
  if length(coalesce(p_password, '')) < 8 then raise exception 'A senha precisa ter pelo menos 8 caracteres.'; end if;
  select * into inv from public.invitations where email = v_email for update;
  if not found then return 'invalid'; end if;
  if not private.code_ok(inv, p_code) then
    update public.invitations set failed_attempts = failed_attempts + 1 where id = inv.id;
    return 'invalid';
  end if;

  select id into uid from auth.users where lower(email) = v_email;
  if uid is null then return 'no_user'; end if;

  update auth.users
     set encrypted_password = crypt(p_password, gen_salt('bf')),
         email_confirmed_at = coalesce(email_confirmed_at, now()),
         updated_at = now()
   where id = uid;
  -- Usuário antigo sem profile (não deveria acontecer): cria a partir do convite.
  insert into public.profiles (id, agency_id, client_id, role, full_name, email)
  values (uid, inv.agency_id, inv.client_id, inv.role, inv.full_name, v_email)
  on conflict (id) do nothing;
  update public.invitations set accepted_at = now(), access_code = null, failed_attempts = 0 where id = inv.id;
  return 'ok';
end $$;

-- ============================================================
-- Gatilho de cadastro: quem cria senha com convite precisa do código
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
    -- Com senha (signUp do "Primeiro acesso"): exige o código. Sem senha (link no e-mail): dono do e-mail.
    if coalesce(new.encrypted_password, '') <> '' and not private.code_ok(inv, new.raw_user_meta_data ->> 'invite_code') then
      raise exception 'Código de acesso inválido ou vencido.';
    end if;
    insert into public.profiles (id, agency_id, client_id, role, full_name, email)
    values (new.id, inv.agency_id, inv.client_id, inv.role, inv.full_name, lower(new.email));
    insert into public.client_assignments (client_id, profile_id, agency_id)
    select c.id, new.id, inv.agency_id from public.clients c
     where c.id = any (inv.assigned_client_ids) and c.agency_id = inv.agency_id;
    update public.invitations set accepted_at = now(), access_code = null, failed_attempts = 0 where id = inv.id;
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

revoke execute on all functions in schema private from public;
grant execute on function private.path_visible(text) to authenticated;

revoke execute on function public.invite_user(text, text, public.user_role, uuid, uuid[]) from public, anon;
grant execute on function public.invite_user(text, text, public.user_role, uuid, uuid[]) to authenticated;
revoke execute on function public.reset_user_access(uuid) from public, anon;
grant execute on function public.reset_user_access(uuid) to authenticated;
-- Primeiro acesso acontece antes do login.
revoke execute on function public.claim_access(text, text, text) from public;
grant execute on function public.claim_access(text, text, text) to anon, authenticated;
