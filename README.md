# Shivansh Dhakad: portfolio (milestone 1)

React + Vite + TypeScript, Supabase for data, Vercel for hosting.

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env` and fill in your Supabase URL and anon key (public values only).
3. `npm run dev`. Without a `.env` the site shows the built-in resume-based content.

## Supabase setup
1. Create a project. In SQL Editor run `supabase/schema.sql`, then optionally `supabase/seed.sql`.
2. Follow the "FIRST ADMIN" notes at the bottom of `schema.sql` (create your user, turn off public signups, add yourself to `admins`).
3. If this project already has the schema installed, run `supabase/migration_beyond_code.sql` once to enable hobby management in Admin > Beyond the code.

## Deploy to Vercel
Import the GitHub repo, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables, deploy.
Never add the service-role key anywhere in this project.
