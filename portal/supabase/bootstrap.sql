-- Primeiro acesso: cria a agência e o convite do primeiro admin.
-- Troque o e-mail e o nome abaixo, rode no SQL Editor e depois entre no portal com esse e-mail.
with nova as (
  insert into public.agencies (name, slug) values ('Nuby Marketing', 'nuby') returning id
)
insert into public.invitations (agency_id, role, full_name, email)
select id, 'agency_admin', 'Seu nome', lower('voce@exemplo.com') from nova;
