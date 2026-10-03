-- Retrieval for Ask your notes: what match_items() returns, whose items it can see,
-- and when an item needs embedding again.
begin;
select plan(11);

-- a second user with an item that must never surface for the demo user
insert into auth.users (instance_id, id, aud, role, email)
values ('00000000-0000-0000-0000-000000000000', 'eeeeeeee-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'other@example.com');
insert into public.inbox_items (id, user_id, content) values
  ('eeeeeeee-0000-4000-8000-0000000000a1', 'eeeeeeee-0000-4000-8000-000000000001', 'Kemi owes me the venue deposit');

-- unit vectors along one axis each, so the nearest neighbour is known by construction
create function pg_temp.axis(n integer) returns extensions.vector language sql as $$
  select array_agg(case when g = n then 1 else 0 end order by g)::extensions.vector(384)
  from generate_series(1, 384) g
$$;

insert into public.item_embeddings (item_id, user_id, embedding)
select id, user_id, pg_temp.axis(1) from public.inbox_items where content = 'Buy gas before Sunday';
insert into public.item_embeddings (item_id, user_id, embedding)
select id, user_id, pg_temp.axis(2) from public.inbox_items where content = 'Pay the electricity bill';
insert into public.item_embeddings (item_id, user_id, embedding)
values ('eeeeeeee-0000-4000-8000-0000000000a1', 'eeeeeeee-0000-4000-8000-000000000001', pg_temp.axis(1));

set local role authenticated;
set local request.jwt.claims = '{"sub":"0d3e5f6a-1b2c-4d5e-8f90-a1b2c3d4e5f6","role":"authenticated"}';

-- keyword half --------------------------------------------------------------
select ok(
  (select count(*) from public.match_items('What did Kemi want changed in the deck?')) >= 2,
  'a question finds items that share any of its words'
);
select is(
  (select content from public.match_items('customer quote up front') limit 1),
  'notes from the call with Kemi: pricing slide before team, add one customer quote up front',
  'the item sharing the most words ranks first'
);
select is(
  (select count(*) from public.match_items('zebra crossing')), 0::bigint,
  'no shared words and no embedding finds nothing'
);
select ok(
  not exists (select 1 from public.match_items('Kemi venue deposit') where content like '%owes me%'),
  'keyword search never returns another user''s item'
);

-- semantic half -------------------------------------------------------------
select is(
  (select content from public.match_items('', pg_temp.axis(1)) limit 1),
  'Buy gas before Sunday',
  'with no usable words the nearest embedding ranks first'
);
select is(
  (select similarity from public.match_items('', pg_temp.axis(1)) limit 1), 1::real,
  'similarity is the cosine similarity of the match'
);
select is(
  (select count(*) from public.match_items('', pg_temp.axis(1))), 2::bigint,
  'semantic search only reads the caller''s embeddings'
);

-- fused ---------------------------------------------------------------------
select is(
  (select content from public.match_items('electricity', pg_temp.axis(2)) limit 1),
  'Pay the electricity bill',
  'an item found by both halves outranks one found by either alone'
);

-- what needs embedding ------------------------------------------------------
select ok(
  exists (select 1 from public.items_to_embed(100) where body = E'Project: Pitch prep\nFinish the pitch deck'),
  'the text to embed carries the project name as a header'
);
select ok(
  not exists (select 1 from public.items_to_embed(100) where body like '%Buy gas before Sunday'),
  'an item with an embedding is not listed again'
);
update public.inbox_items set content = 'Buy cooking gas before Sunday' where content = 'Buy gas before Sunday';
select ok(
  exists (select 1 from public.items_to_embed(100) where body like '%Buy cooking gas before Sunday'),
  'editing an item puts it back in the list to embed'
);

select * from finish();
rollback;
