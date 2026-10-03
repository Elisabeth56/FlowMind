-- Ask your notes: retrieval over a user's own items (docs/decisions/005).
--
-- Each item is one chunk. Its embedding lives in its own table, so the 384 numbers are
-- not carried by every `select *` on inbox_items or by realtime. Keyword search uses an
-- expression index on the item's content; no extra column.

create extension if not exists vector with schema extensions;

create table public.item_embeddings (
  item_id uuid primary key references public.inbox_items (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  embedding extensions.vector(384) not null,
  created_at timestamptz not null default now()
);
create index item_embeddings_user_idx on public.item_embeddings (user_id);
create index item_embeddings_embedding_idx on public.item_embeddings
  using hnsw (embedding extensions.vector_cosine_ops);
create index inbox_items_content_fts_idx on public.inbox_items
  using gin (to_tsvector('english', content));

alter table public.item_embeddings enable row level security;
revoke all on public.item_embeddings from anon, authenticated;
grant select, insert, update, delete on public.item_embeddings to authenticated;

create policy "Users can view own embeddings" on public.item_embeddings
  for select to authenticated using ((select auth.uid()) = user_id);
-- An embedding can only be attached to an item its owner owns
create policy "Users can add embeddings for own items" on public.item_embeddings
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.inbox_items i where i.id = item_id and i.user_id = (select auth.uid()))
  );
create policy "Users can update own embeddings" on public.item_embeddings
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own embeddings" on public.item_embeddings
  for delete to authenticated using ((select auth.uid()) = user_id);

-- An edited item no longer matches its embedding. Dropping the row puts the item back
-- in items_to_embed(), which is the only list of work the embed function reads.
create function public.drop_stale_embedding()
returns trigger language plpgsql set search_path = '' as $$
begin
  delete from public.item_embeddings where item_id = new.id;
  return new;
end;
$$;
revoke execute on function public.drop_stale_embedding() from public, anon, authenticated;

create trigger drop_stale_embedding
  after update of content, project_id on public.inbox_items
  for each row
  when (old.content is distinct from new.content or old.project_id is distinct from new.project_id)
  execute function public.drop_stale_embedding();

-- The caller's items that have no embedding yet, with the text to embed: the project
-- name as a header, then the content. Oldest first, so a backfill makes steady progress.
create function public.items_to_embed(p_limit integer default 25)
returns table (id uuid, body text)
language sql stable set search_path = '' as $$
  select i.id,
    case when p.name is null then i.content else 'Project: ' || p.name || E'\n' || i.content end
  from public.inbox_items i
  left join public.projects p on p.id = i.project_id
  where i.user_id = (select auth.uid())
    and not exists (select 1 from public.item_embeddings e where e.item_id = i.id)
  order by i.created_at
  limit least(greatest(p_limit, 1), 100)
$$;
revoke execute on function public.items_to_embed(integer) from public, anon;
grant execute on function public.items_to_embed(integer) to authenticated;

-- Hybrid search over the caller's items: nearest embeddings and best keyword matches,
-- merged by reciprocal rank fusion. Either half works alone: without an embedding it is
-- keyword search, and a question with no usable words is semantic search.
--
-- `similarity` (cosine, 0 to 1) and `keyword_rank` are returned beside the fused score
-- because the score only orders results; it cannot say whether the best one is any good.
create function public.match_items(
  p_query text,
  p_embedding extensions.vector(384) default null,
  p_limit integer default 8
)
returns table (
  id uuid,
  content text,
  item_type text,
  status text,
  project_name text,
  created_at timestamptz,
  similarity real,
  keyword_rank real,
  score real
)
language sql stable set search_path = '' as $$
  with question as (
    -- any of the question's words, not all of them: questions are full of words the note lacks
    select case when btrim(coalesce(p_query, '')) = '' then null
      else replace(plainto_tsquery('english', p_query)::text, '&', '|')::tsquery end as terms
  ),
  semantic as (
    select e.item_id,
      (1 - (e.embedding operator(extensions.<=>) p_embedding))::real as similarity,
      row_number() over (order by e.embedding operator(extensions.<=>) p_embedding) as rank
    from public.item_embeddings e
    where p_embedding is not null and e.user_id = (select auth.uid())
    order by e.embedding operator(extensions.<=>) p_embedding
    limit 30
  ),
  keyword as (
    select i.id as item_id,
      ts_rank(to_tsvector('english', i.content), q.terms) as keyword_rank,
      row_number() over (order by ts_rank(to_tsvector('english', i.content), q.terms) desc, i.created_at desc) as rank
    from public.inbox_items i, question q
    where i.user_id = (select auth.uid()) and to_tsvector('english', i.content) @@ q.terms
    order by 2 desc
    limit 30
  )
  select i.id, i.content, i.item_type, i.status, p.name, i.created_at,
    s.similarity,
    k.keyword_rank,
    (coalesce(1.0 / (60 + s.rank), 0) + coalesce(1.0 / (60 + k.rank), 0))::real as score
  from semantic s
  full join keyword k using (item_id)
  join public.inbox_items i on i.id = coalesce(s.item_id, k.item_id)
  left join public.projects p on p.id = i.project_id
  order by score desc, i.created_at desc
  limit least(greatest(p_limit, 1), 30)
$$;
revoke execute on function public.match_items(text, extensions.vector, integer) from public, anon;
grant execute on function public.match_items(text, extensions.vector, integer) to authenticated;
