-- Run once in Supabase SQL Editor to enable choosing a skill's graph anchor domain.

alter table public.skills
  add column if not exists primary_domain_id uuid
  references public.skill_categories(id) on delete set null;

update public.skills s
set primary_domain_id = (
  select sd.category_id
  from public.skill_domains sd
  join public.skill_categories c on c.id = sd.category_id
  where sd.skill_id = s.id
  order by c.sort_order, c.name, c.id
  limit 1
)
where s.primary_domain_id is null;
