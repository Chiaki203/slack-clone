# my-next-slack6

A small Slack-like chat app built with Next.js (Pages Router) + Supabase (Auth + Postgres + Realtime).

## Features

- Email/password signup + login (Supabase Auth)
- Display name on signup (stored in Auth metadata as `display_name`)
- Channels + messages stored in Postgres
- Realtime updates via Supabase Realtime subscriptions
- Role-based UI controls (`admin`, `moderator`) for deletions
- Editable display name (`public.users.username`) separate from auth email (email is only shown to the current user)

## Tech stack

- Next.js 12 + React 18 + TypeScript
- `@supabase/supabase-js` v1
- Tailwind (via `src/styles/styles.scss`) + Sass

## Project structure

- `src/pages/index.tsx`: login/signup screen
- `src/pages/channels/[id].tsx`: channel UI (sidebar + messages + input)
- `src/pages/_app.tsx`: auth/session + profile context provider
- `src/lib/Store.ts`: Supabase client, data fetches, realtime subscriptions
- `src/components/Layout.tsx`: sidebar (new channel, logout, edit username)

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=YOUR_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Get these from Supabase Dashboard → Settings → API.

## Supabase setup

This app expects these public tables:

- `public.users` (profile table, keyed by `auth.users.id`)
- `public.channels`
- `public.messages`
- `public.user_roles`

### Schema + trigger (example)

Run this in Supabase SQL editor (adjust as needed):

```sql
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
  role text not null check (role in ('admin','moderator')),
  unique(user_id, role)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  display_name text;
begin
  display_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    'user-' || substring(new.id::text, 1, 8)
  );

  insert into public.users (id, username, status)
  values (new.id, display_name, 'ONLINE')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
```

Important: the messages query uses `author:users(*)`, so `public.messages.user_id` must reference `public.users.id`.

### Migrating existing email-based usernames (optional)

If your existing `public.users.username` values are emails, you can migrate them to non-email display names.
This does not delete users; it just updates the `username` column.

```sql
update public.users
set username = 'user-' || substring(id::text, 1, 8)
where username like '%@%';
```

### RLS policies (minimum)

This project calls Supabase directly from the browser (anon key), so you must use RLS.
Example minimum policies:

```sql
alter table public.users enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
alter table public.user_roles enable row level security;

-- reads
create policy "users read" on public.users
for select to authenticated
using (true);

create policy "channels read" on public.channels
for select to authenticated
using (true);

create policy "messages read" on public.messages
for select to authenticated
using (true);

-- profile updates (edit username)
create policy "users update own" on public.users
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- writes
create policy "channels insert own" on public.channels
for insert to authenticated
with check (created_by = auth.uid());

create policy "messages insert own" on public.messages
for insert to authenticated
with check (user_id = auth.uid());

-- roles: keep readable only for the current user (the UI checks roles client-side)
create policy "user_roles read own" on public.user_roles
for select to authenticated
using (user_id = auth.uid());

-- deletes (optional: implement your own rules)
create policy "channels delete own/admin" on public.channels
for delete to authenticated
using (
  id <> 1 and (
    created_by = auth.uid()
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  )
);

create policy "messages delete own/mod/admin" on public.messages
for delete to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role in ('admin','moderator')
  )
);
```

### Realtime (required for live updates)

The app subscribes to changes on `public.users`, `public.channels`, `public.messages`.
Enable Realtime replication for those tables in the dashboard, or via SQL:

```sql
alter publication supabase_realtime add table public.users;
alter publication supabase_realtime add table public.channels;
alter publication supabase_realtime add table public.messages;
```

Optional (more complete `payload.old` values on DELETE events):

```sql
alter table public.users replica identity full;
alter table public.channels replica identity full;
alter table public.messages replica identity full;
```

## Seeding the default channel (id = 1)

The UI uses `/channels/1` as the fallback route and protects channel `id = 1` from deletion.
Create it once (replace `<USER_UUID>` with a real `auth.users.id` / `public.users.id`):

```sql
insert into public.channels (id, slug, created_by)
values (1, 'general', '<USER_UUID>')
on conflict (id) do nothing;
```

## Setting roles

To make someone an admin/moderator, insert rows into `public.user_roles` (do this in SQL editor or a trusted server context):

```sql
insert into public.user_roles (user_id, role)
values ('<USER_UUID>', 'admin'); -- or 'moderator'
```

## Troubleshooting

- If refresh redirects you to `/channels/1`, it’s because the router param (`id`) isn’t ready on first render and channels load asynchronously; the redirect must wait until both are loaded.
- If Realtime doesn’t work, confirm you see a WebSocket connection to `.../realtime/v1/websocket` in DevTools → Network → WS, and that replication is enabled for the tables above.
- If other users appear to have email-like usernames, update the signup trigger to use `raw_user_meta_data.display_name` and/or run the migration query above.
