-- Run once in Supabase SQL Editor to enable explicit skill-to-skill links.
-- Links are undirected and stored once in sorted UUID order.

create table public.skill_links (
  skill_a_id uuid not null references public.skills(id) on delete cascade,
  skill_b_id uuid not null references public.skills(id) on delete cascade,
  primary key (skill_a_id, skill_b_id),
  check (skill_a_id < skill_b_id)
);

alter table public.skill_links enable row level security;

create policy "admin all" on public.skill_links for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "public read" on public.skill_links for select to anon, authenticated using (true);
