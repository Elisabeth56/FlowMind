-- A new profile takes the timezone the browser reported at sign-up, when it is a real
-- one. Profiles used to start in UTC, which made "today" wrong for everyone until
-- they found the setting.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, timezone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce(
      (select n.name from pg_catalog.pg_timezone_names n where n.name = new.raw_user_meta_data ->> 'timezone'),
      'UTC'
    )
  );
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
