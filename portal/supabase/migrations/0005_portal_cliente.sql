-- Etapa 3 do SaaS: portal do cliente. O tour do primeiro acesso fica marcado no profile,
-- para não reaparecer em outro aparelho.

create function public.mark_tour_done() returns void
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_profile();
begin
  update public.profiles set tour_done_at = coalesce(tour_done_at, now()) where id = p.id;
end $$;

revoke execute on function public.mark_tour_done() from public, anon;
grant execute on function public.mark_tour_done() to authenticated;
