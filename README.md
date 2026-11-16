# Shivansh Dhakad: portfolio 

React + Vite + TypeScript, Supabase for data, Netlify for hosting.

## Deployed portfoilo
Check out my profile - https://portfolio-shivansh-dhakad.netlify.app/

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env` and fill in your Supabase URL and anon key (public values only).
3. `npm run dev`. Without a `.env` the site shows built-in resume content, but the skills catalog is loaded only from Supabase.

## Supabase setup
1. Create a project. In SQL Editor run `supabase/schema.sql`, then optionally `supabase/seed.sql`.
2. Follow the "FIRST ADMIN" notes at the bottom of `schema.sql` (create your user, turn off public signups, add yourself to `admins`).
3. If the project already has the schema installed, run `supabase/migration_beyond_code.sql` once to add hobby management.
4. On an existing project, run `supabase/migration_skill_domain_cascade.sql` once so deleting a domain deletes its skills too.

## Managing hobbies
Sign in at `/admin` and open **Beyond the code** to add, edit, reorder, hide, or delete hobby cards. The card displays its title, category, icon, and the first sentence of its description. New Supabase setups receive the flute and cycling starter cards from `schema.sql`.

## Managing skills
In `/admin`, open **Skills** to add and reorder domains, then add, edit, remove, or reorder skills within each domain. Use **Save all skills** once to submit all skill changes. Deleting a domain permanently deletes all skills assigned to it.
