-- Agência escolhe o status do post direto no editor e pode excluir posts.

/** Qualquer status -> qualquer status. Só agência. */
create function public.set_post_status(p_post uuid, p_status public.post_status) returns public.posts
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_staff(); post public.posts;
begin
  post := private.post_for(p, p_post);
  if post.status = p_status then return post; end if;
  update public.posts set status = p_status, updated_at = now() where id = p_post returning * into post;
  return post;
end $$;

/** Exclui o post com versões e comentários. Devolve os caminhos das mídias para limpar o Storage. */
create function public.delete_post(p_post uuid) returns text[]
language plpgsql security definer set search_path = public as $$
declare p public.profiles := private.require_staff(); paths text[];
begin
  perform private.post_for(p, p_post);
  select coalesce(array_agg(distinct m), '{}') into paths
    from public.post_versions v, unnest(v.media) m
   where v.post_id = p_post;
  delete from public.posts where id = p_post;
  return paths;
end $$;

revoke execute on function public.set_post_status(uuid, public.post_status) from public, anon;
revoke execute on function public.delete_post(uuid) from public, anon;
grant execute on function public.set_post_status(uuid, public.post_status) to authenticated;
grant execute on function public.delete_post(uuid) to authenticated;

-- Agência apaga mídia de post da própria agência.
create policy portal_delete_post_media on storage.objects for delete to authenticated
  using (bucket_id = 'post-media' and private.path_visible(name) and public.is_staff());
