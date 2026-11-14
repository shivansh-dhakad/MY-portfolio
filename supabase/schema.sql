-- Run once in Supabase: SQL Editor > New query > paste > Run.

create table public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admins enable row level security; -- no policies: never readable through the API

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

create table public.profile (
  id int primary key default 1 check (id = 1),
  full_name text not null, headline text, intro text, bio text,
  photo_path text, resume_path text, email text, updated_at timestamptz default now()
);
create table public.social_links (
  id uuid primary key default gen_random_uuid(), label text not null, url text not null,
  sort_order int default 0, visible boolean default true
);
create table public.education (
  id uuid primary key default gen_random_uuid(), institute text not null, degree text,
  start_year int, end_year int, sort_order int default 0, visible boolean default true
);
create table public.beyond_code_items (
  id uuid primary key default gen_random_uuid(),
  title text not null, category text not null, description text not null,
  placeholder_type text not null default 'audio' check (placeholder_type in ('audio','photo')),
  sort_order int default 0, visible boolean default true
);
insert into public.beyond_code_items (id, title, category, description, placeholder_type, sort_order, visible) values
  ('33333333-3333-3333-3333-333333333301', 'Flute Playing (Bansuri)', 'Acoustic Arts & Discipline',
   'Playing the Indian bamboo flute (Bansuri) is my primary creative discipline outside of machine learning.',
   'audio', 1, true),
  ('33333333-3333-3333-3333-333333333302', 'Long-Distance Bike Riding', 'Endurance & Exploration',
   'Cycling across long stretches and scenic routes around Madhya Pradesh provides an essential mental reset.',
   'photo', 2, true);
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('certification','achievement','experience')),
  title text not null, issuer text, description text, date_label text, url text,
  sort_order int default 0, visible boolean default true
);
create table public.skill_categories (
  id uuid primary key default gen_random_uuid(), name text not null, sort_order int default 0
);
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.skill_categories(id) on delete set null,
  name text not null unique, sort_order int default 0
);
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, title text not null, tagline text,
  overview text, problem text, solution text, architecture text, challenges text, changelog_md text,
  features jsonb not null default '[]', metrics jsonb not null default '[]',
  status text not null default 'completed' check (status in ('live','completed','researching')),
  state text not null default 'draft' check (state in ('draft','published','archived')),
  featured boolean not null default false, sort_order int default 0,
  repo_url text, demo_url text, docs_url text, cover_path text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table public.project_skills (
  project_id uuid references public.projects(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  primary key (project_id, skill_id)
);
create table public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  path text not null, alt text not null default '', sort_order int default 0
);
create table public.sections (
  id uuid primary key default gen_random_uuid(), key text not null unique, title text not null,
  body jsonb not null default '{}', sort_order int default 0, visible boolean default true
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 200 and email like '%_@_%'),
  message text not null check (char_length(message) between 1 and 4000),
  created_at timestamptz default now(), is_read boolean default false
);

create or replace function public.touch_updated_at() returns trigger language plpgsql as
$$ begin new.updated_at = now(); return new; end $$;
create trigger projects_touch before update on public.projects for each row execute function public.touch_updated_at();
create trigger profile_touch before update on public.profile for each row execute function public.touch_updated_at();

-- Row-level security: on for every table.
do $$ declare t text; begin
  foreach t in array array['profile','social_links','education','beyond_code_items','entries','skill_categories','skills',
    'projects','project_skills','project_media','sections','messages'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
  -- the admin can do everything
  foreach t in array array['profile','social_links','education','beyond_code_items','entries','skill_categories','skills',
    'projects','project_skills','project_media','sections','messages'] loop
    execute format('create policy "admin all" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Visitors: read published or visible content only.
create policy "public read" on public.profile for select to anon, authenticated using (true);
create policy "public read" on public.skill_categories for select to anon, authenticated using (true);
create policy "public read" on public.skills for select to anon, authenticated using (true);
create policy "public read" on public.social_links for select to anon, authenticated using (visible);
create policy "public read" on public.education for select to anon, authenticated using (visible);
create policy "public read" on public.beyond_code_items for select to anon, authenticated using (visible);
create policy "public read" on public.entries for select to anon, authenticated using (visible);
create policy "public read" on public.sections for select to anon, authenticated using (visible);
create policy "public read" on public.projects for select to anon, authenticated using (state = 'published');
create policy "public read" on public.project_skills for select to anon, authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.state = 'published'));
create policy "public read" on public.project_media for select to anon, authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.state = 'published'));
-- Visitors may send a message but never read one.
create policy "visitors send messages" on public.messages for insert to anon, authenticated with check (true);

-- File storage: public buckets, size and type limits, admin-only writes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('media',  'media',  true, 5242880, array['image/webp','image/jpeg','image/png','image/avif']),
  ('resume', 'resume', true, 5242880, array['application/pdf'])
on conflict (id) do nothing;
create policy "admin writes files" on storage.objects for all to authenticated
  using (bucket_id in ('media','resume') and public.is_admin())
  with check (bucket_id in ('media','resume') and public.is_admin());

-- FIRST ADMIN (do this after the steps above):
-- 1. Authentication > Users > Add user (your email and a strong password).
-- 2. Authentication > Sign In / Providers: turn OFF "Allow new users to sign up".
-- 3. Run:  insert into public.admins (user_id) values ('PASTE-YOUR-USER-UUID-HERE');
