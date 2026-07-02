# Living AI UX Portfolio OS

Private AI workflow app plus public living portfolio website for Pranav Likhi.

Public brand line:

> Pranav Likhi — AI UX Research, Human-AI Interaction & Multilingual Product Evaluation Portfolio

The app turns screenshots, notes, and AI/UX research-study evidence into safe, approved public portfolio entries. It supports screenshot upload, AI extraction, portfolio scoring, confidentiality-safe public writing, review/approval, automatic public website updates, living PDF export, LinkedIn Featured copy, in-app notifications, monthly design review, and monthly maintenance checks.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Postgres and Storage
- OpenAI API
- Zod structured validation
- Vercel deployment and cron
- In-app notification center

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

If Supabase is not configured, the app uses `.local-data/db.json` plus local upload/export folders for local development only. Production deployments must use Supabase database and storage.

## Environment Variables

```env
OPENAI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
CRON_SECRET=
ADMIN_ACCESS_TOKEN=
```

`OPENAI_API_KEY` is required for screenshot analysis. Without it, screenshot upload and re-analysis show a clear admin error instead of creating a generic low-confidence result. Manual note entries can still use conservative local fallback drafting.

`ADMIN_ACCESS_TOKEN` is optional for local development but required for production launch. It protects `/admin`, admin mutation APIs, screenshot evidence routes, and legacy local upload URLs. The app redirects protected admin pages to `/admin-login`.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/migrations/0001_initial.sql`, `supabase/migrations/0002_scoring_consistency_fields.sql`, and `supabase/migrations/0003_launch_privacy_hardening.sql` in the SQL editor or through the Supabase CLI.
3. Add the Supabase URL, anon key, and service-role key to `.env.local`.
4. Keep `study-screenshots` private. Screenshots are only served through the server-side admin proxy route.
5. Keep `portfolio-exports` public so the latest PDF can be shared.

Production launch behavior:

- Supabase database is required. Local `.local-data` fallback is disabled in production deployments.
- Supabase Storage is required for screenshots and PDF exports. Local upload/export fallback is disabled in production deployments.
- The `study-screenshots` bucket must stay private. Public pages never render screenshot URLs.

The migration creates:

- `studies`
- `design_reviews`
- `maintenance_reports`
- `notifications`
- `site_settings`
- `study-screenshots` storage bucket
- `portfolio-exports` storage bucket

## OpenAI Setup

Set `OPENAI_API_KEY`. The analysis route calls OpenAI with screenshot image input and asks for structured JSON output, then validates it with `StudyAnalysisSchema` in `lib/ai/schemas.ts`.

Core AI modules live in `lib/ai`:

- Study Screenshot Extraction Agent: `analyze-study.ts`
- Portfolio Scoring Agent: `scoring.ts`
- Confidentiality Guard Agent: `confidentiality.ts`
- Portfolio Writer Agent: included in `analyze-study.ts`
- Manual Experience Agent: `/api/manual-experience`
- Monthly Design Review Agent: `design-review.ts`
- Maintenance Check Agent: `maintenance.ts`

## Main Workflow

1. Go to `/admin/upload`.
2. Upload one or more screenshots and optional notes.
3. Click **Analyze Study**.
4. Review the extracted result at `/admin/review/[id]`.
5. Choose **Approve and publish**, **Edit before publishing**, **Save as record only**, or **Reject**.

Approving a public-worthy study:

- Sets `status = approved`
- Sets `published_at`
- Makes the entry visible on public pages only when it is not record-only, not do-not-add, and has `portfolio_score >= 30`
- Regenerates the living PDF
- Creates an internal notification

The public website updates automatically because public pages read approved portfolio-worthy entries from the data layer.

## Import Original Portfolio

The original static PDF is included at:

```text
/documents/pranav-likhi-ai-ux-portfolio.pdf
```

The original portfolio entries are also available as structured approved entries. Local fallback data imports them automatically. After connecting Supabase, seed them once with:

```bash
curl -X POST http://localhost:3000/api/import-original-portfolio
```

If `ADMIN_ACCESS_TOKEN` is set, include it with `?admin_token=...` or the `x-admin-token` header.

## Manual Experiences

Use `/admin/manual` for remembered experiences or research participation without screenshots. The manual experience agent uses the same classification, confidentiality, writing, and approval flow as screenshot uploads.

## Public Pages

- `/`
- `/portfolio`
- `/projects`
- `/experience-log`
- `/about`
- `/documents`

Public pages never show screenshots, study IDs, completion codes, researcher names, or private prototype details.

## Admin Pages

- `/admin`
- `/admin/upload`
- `/admin/manual`
- `/admin/review/[id]`
- `/admin/edit/[id]`
- `/admin/design-review`
- `/admin/settings`

## PDF Export

Generate from the admin workflow by approving a study, or call:

```bash
curl -X POST http://localhost:3000/api/export-pdf
```

The latest PDF is available at:

```text
/api/pdf/latest
```

PDF title:

> Living AI UX Portfolio — Pranav Likhi

Confidentiality note:

> This portfolio is updated as new approved AI evaluation, UX research, and product feedback experiences are added. Some entries are summarized at a high level to protect confidentiality and unreleased product details.

## LinkedIn Strategy

The app generates LinkedIn Featured title and description text for each approved entry and includes default Featured copy on `/documents`.

It does not automate logging into LinkedIn or editing LinkedIn directly.

## Monthly Design Review

Use `/admin/design-review` and click **Run design review**.

The agent checks homepage clarity, hierarchy, mobile responsiveness, AI UX/HCI branding, latest strong experiences, crowding, section order, typography, spacing, cards, and animation usefulness.

It creates a pending design proposal only. It never automatically changes public design.

## Maintenance Check

Use `/admin/design-review` and click **Run maintenance check**, or call:

```bash
curl -X POST http://localhost:3000/api/maintenance/run
```

The maintenance check looks for duplicate entries, confidentiality flags, PDF status, SEO status, mobile readiness, and basic quality issues.

## Vercel Deployment

1. Push this repo to GitHub.
2. Import it into Vercel.
3. Add the production environment variables in Vercel Project Settings:

```env
OPENAI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
CRON_SECRET=
ADMIN_ACCESS_TOKEN=
```

`ADMIN_ACCESS_TOKEN` is the simple admin password/token for the private dashboard.

4. Deploy.
5. Ensure `CRON_SECRET` is set. The monthly route returns `401` in production without it.

Detailed production guides:

- `GITHUB_DEPLOYMENT_STEPS.md`
- `PRODUCTION_SETUP.md`
- `VERCEL_ENV_SETUP.md`
- `LAUNCH_CHECKLIST.md`

`vercel.json` runs:

```text
/api/cron/monthly-review
```

on the first day of every month at 14:00 UTC.

## Useful Commands

```bash
npm run dev
npm run typecheck
npm run build
```

## Launch Checklist

- Set all production environment variables in Vercel, including `ADMIN_ACCESS_TOKEN`.
- Run Supabase migrations `0001_initial.sql`, `0002_scoring_consistency_fields.sql`, and `0003_launch_privacy_hardening.sql`.
- Confirm Supabase `study-screenshots` is private and `portfolio-exports` is public.
- Confirm `/admin` redirects to `/admin-login` for logged-out visitors.
- Confirm `/api/storage/screenshot/...` and `/uploads/studies/...` require admin access.
- Confirm public pages read only `approved_portfolio_entries`.
- Keep record-only and sub-30 studies private by using **Save as record only**.
- Confirm studies below `30/100` do not show **Approve and publish** as the primary action.
- Confirm LinkedIn Featured text is only recommended for studies with `portfolio_score >= 30`.
- Run `npm run typecheck` and `npm run build`.
- Visit `/`, `/portfolio`, `/projects`, `/experience-log`, `/about`, and `/documents`.
- Verify public pages contain safe summaries only and never display screenshot evidence.
