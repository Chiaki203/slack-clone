create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  status text not null default 'ONLINE'
);
create table if not exists public.channels (
  id bigserial primary key,
  slug text not null unique,
  created_by uuid references public.users(id),
  inserted_at timestamptz not null default now()
);
create table if not exists public.messages (
  id bigserial primary key,
  message text not null,
  channel_id bigint not null references public.channels(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  inserted_at timestamptz not null default now()
);
create table if not exists public.user_roles (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('admin', 'moderator')),
  unique(user_id, role)
);
create or replace function public.handle_new_user() returns trigger language plpgsql security definer as $$ begin
insert into public.users (id, username, status)
values (
    new.id,
    coalesce(new.email, new.id::text),
    'ONLINE'
  ) on conflict (id) do nothing;
return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after
insert on auth.users for each row execute procedure public.handle_new_user();
create policy "user_roles read own" on public.user_roles for
select to authenticated using (user_id = auth.uid());
create or replace function public.handle_new_user() returns trigger language plpgsql security definer as $$
declare display_name text;
begin display_name := coalesce(
  new.raw_user_meta_data->>'display_name',
  split_part(new.email, '@', 1),
  'user-' || substring(new.id::text, 1, 8)
);
insert into public.users (id, username, status)
values (new.id, display_name, 'ONLINE') on conflict (id) do
update
set username = excluded.username;
return new;
end;
$$;