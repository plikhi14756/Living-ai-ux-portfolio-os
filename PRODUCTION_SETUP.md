# Production Setup - Supabase

This guide prepares the production Supabase database and storage for Living AI UX Portfolio OS.

Do not paste OpenAI, Vercel, or admin secrets into SQL migrations. Supabase SQL should only create tables, views, policies, buckets, and starter settings.

## 1. Create The Supabase Project

1. Go to Supabase Dashboard.
2. Create a new production project.
3. Choose a strong database password and save it in your password manager.
4. Wait for the project to finish provisioning.

## 2. Run SQL Migrations In Order

Run the migration files exactly in this order:

1. `supabase/migrations/0001_initial.sql`
2. `supabase/migrations/0002_scoring_consistency_fields.sql`
3. `supabase/migrations/0003_launch_privacy_hardening.sql`
4. `supabase/migrations/0004_pdf_and_recommendation_consistency.sql`
5. `supabase/migrations/0005_branded_pdf_style_settings.sql`

### Option A: Supabase SQL Editor

1. Open Supabase Dashboard.
2. Select your production project.
3. Go to `SQL Editor`.
4. Open `supabase/migrations/0001_initial.sql` in this repo.
5. Paste the full SQL into a new query and click `Run`.
6. Repeat for `0002_scoring_consistency_fields.sql`.
7. Repeat for `0003_launch_privacy_hardening.sql`.
8. Repeat for `0004_pdf_and_recommendation_consistency.sql`.
9. Repeat for `0005_branded_pdf_style_settings.sql`.

### Option B: Supabase CLI

Use this only if you already manage the project with the Supabase CLI:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## 3. Confirm Database Objects

After the migrations run, confirm these tables exist:

- `studies`
- `design_reviews`
- `maintenance_reports`
- `notifications`
- `site_settings`

Confirm this public-safe view exists:

- `approved_portfolio_entries`

The view must filter to:

```sql
status = 'approved'
and portfolio_score >= 30
and portfolio_classification not in ('Record only', 'Do not add')
```

This is the production public-data boundary. Public pages read this view, not private screenshot evidence.

## 4. Storage Buckets

The first migration creates these buckets:

### `study-screenshots`

- Public access: `false`
- Purpose: private screenshot evidence
- Allowed MIME types: PNG, JPEG, WebP, GIF
- File size limit: 10 MB
- Public visitors must never receive direct bucket URLs.
- The app stores screenshots in this bucket and serves them only through the protected admin route `/api/storage/screenshot/...`.

### `portfolio-exports`

- Public access: `true`
- Purpose: public living portfolio PDF exports
- Allowed MIME type: PDF
- File size limit: 10 MB
- The latest PDF can be shared publicly.

## 5. RLS And Privacy Notes

The migrations enable Row Level Security on:

- `studies`
- `design_reviews`
- `maintenance_reports`
- `notifications`
- `site_settings`

The migrations revoke direct `anon` and `authenticated` access to private tables. The app uses the server-only `SUPABASE_SERVICE_ROLE_KEY` for admin operations.

Public visitors can only select from `approved_portfolio_entries`. That view intentionally excludes:

- pending studies
- rejected studies
- record-only studies
- do-not-add studies
- studies with `portfolio_score < 30`
- screenshot URLs
- private notes and raw evidence

Storage privacy:

- `study-screenshots` should stay private.
- Do not add a public read policy for `study-screenshots`.
- `portfolio-exports` may be public because it contains only approved public summaries.

## 6. Copy Supabase Values For Vercel

In Supabase Dashboard:

1. Go to `Project Settings`.
2. Go to `API`.
3. Copy the `Project URL` into Vercel as `NEXT_PUBLIC_SUPABASE_URL`.
4. Copy the `anon public` key into Vercel as `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Copy the `service_role` key into Vercel as `SUPABASE_SERVICE_ROLE_KEY`.

Important: `SUPABASE_SERVICE_ROLE_KEY` is a server secret. Paste it only into Vercel Environment Variables. Do not expose it in code, client components, screenshots, or public docs.

## 7. Production Validation

After Vercel is deployed with Supabase env vars:

1. Visit `/portfolio` and confirm only public-safe approved entries appear.
2. Visit `/experience-log` and confirm record-only/sub-30 entries do not appear.
3. Visit `/admin` while logged out and confirm it redirects to `/admin-login`.
4. Upload a screenshot from `/admin/upload` after logging in.
5. Confirm the review page shows the screenshot only inside admin.
6. Open the screenshot URL in a logged-out/incognito browser and confirm it returns `401` or redirects to login.
