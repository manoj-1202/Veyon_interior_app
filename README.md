# Veyon Interiors Business Manager

Separate application copy for Veyon Interiors. This folder has its own Git repository and should use a separate Supabase project from the original app.

## Run locally

1. Create a Supabase project for Veyon Interiors.
2. Copy `.env.example` to `.env` and fill in that project's URL and publishable key. Keep `.env` private.
3. Install the Supabase CLI for this project with `npm install supabase --save-dev`, then sign in with `npx supabase login`.
4. Link the Veyon Supabase project with `npx supabase link --project-ref lpharotfsjvbzzduveic` and apply migrations with `npx supabase db push --remote`.
5. Install app dependencies with `npm install`, then start with `npm run dev`.
6. Create the Veyon Interiors user's account and set the company details, logo, bank details, and business terms in Settings.

Do not copy the original app's `.env` file or Supabase credentials into this project.

The latest migration adds project stages, installation-site scheduling, and structured item specifications. Apply it to the Veyon Supabase project before creating or editing projects with the upgraded forms.
