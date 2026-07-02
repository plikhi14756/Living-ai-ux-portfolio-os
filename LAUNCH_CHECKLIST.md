# Launch Checklist

Use this checklist before making the Vercel deployment public.

## Local Verification

Run:

```bash
npm run typecheck
npm run build
```

Expected result: both commands pass.

## Production Environment

Confirm these are set in Vercel Project Settings > Environment Variables:

- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `CRON_SECRET`
- `ADMIN_ACCESS_TOKEN`

No real values should appear in code, commits, screenshots, or docs.

## Supabase

Confirm these migrations ran in order:

- `0001_initial.sql`
- `0002_scoring_consistency_fields.sql`
- `0003_launch_privacy_hardening.sql`

Confirm storage buckets:

- `study-screenshots`: private
- `portfolio-exports`: public

Confirm `approved_portfolio_entries` exists and excludes record-only, do-not-add, and sub-30 score entries.

## Public Pages

Visit:

- `/`
- `/portfolio`
- `/projects`
- `/experience-log`
- `/about`
- `/documents`

Expected result:

- Pages load successfully.
- Only approved portfolio-worthy entries appear.
- Record-only entries do not appear.
- Do-not-add entries do not appear.
- Studies below `30/100` do not appear.
- Screenshot URLs or images do not appear.

## Admin Protection

Logged out or incognito:

- Visit `/admin`.
- Expected result: redirect to `/admin-login?next=/admin`.

Admin login:

- Visit `/admin-login`.
- Paste the production `ADMIN_ACCESS_TOKEN`.
- Expected result: redirect to `/admin`.

## Screenshot Protection

Logged out or incognito:

- Open `/api/storage/screenshot/local/nonexistent.png`.
- Expected result: `401` JSON.

Logged out or incognito, if any old local upload URL exists:

- Open `/uploads/studies/ANY_FILE_NAME.png`.
- Expected result: redirect to `/admin-login`.

Public-page scan:

- View source for `/portfolio`, `/projects`, and `/experience-log`.
- Search for `/api/storage/screenshot`, `/uploads/studies`, and `screenshot_urls`.
- Expected result: no matches.

## Study Publishing Rules

Low-score test:

- Open a pending study with `portfolio_score < 30`.
- Expected result: **Approve and publish** is not the main action.
- Expected result: **Save as record only** is the primary action.

High-score test:

- Create or edit a study with `portfolio_score >= 30` and a public-worthy classification.
- Approve it.
- Expected result: it appears on `/portfolio`.
- Expected result: the living PDF export refreshes.

## AI And Cron

OpenAI:

- Upload a screenshot from `/admin/upload`.
- Expected result: analysis runs if `OPENAI_API_KEY` has active billing/quota.
- If the key is missing, the admin UI shows a clear error.
- If quota is insufficient, the screenshot is saved pending and the UI asks you to re-analyze after billing is fixed.

Cron:

- Visit `/api/cron/monthly-review?secret=YOUR_CRON_SECRET`.
- Expected result: monthly design review and maintenance report are created.
- Without the secret in production, expected result: `401`.
