# Vercel Environment Setup

This guide lists every production environment variable required for Living AI UX Portfolio OS.

Do not commit real secrets to this repo. Keep real values only in Vercel Project Settings and the relevant provider dashboards.

## Where To Paste Secrets In Vercel

1. Open Vercel Dashboard.
2. Select the Living AI UX Portfolio OS project.
3. Go to `Settings`.
4. Go to `Environment Variables`.
5. Add each variable below.
6. Select the `Production` environment for launch.
7. Also add the same values to `Preview` if you want preview deployments to use production-like services.
8. Redeploy after saving environment variables.

## Required Variables

```env
OPENAI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
CRON_SECRET=
ADMIN_ACCESS_TOKEN=
```

## Variable Details

### `OPENAI_API_KEY`

- Source: OpenAI Platform.
- Paste in Vercel only.
- Used by screenshot analysis, manual analysis, structured extraction, writing, classification, and design review.
- If missing, screenshot analysis shows a clear admin error instead of creating fake generic AI output.

### `NEXT_PUBLIC_SUPABASE_URL`

- Source: Supabase Dashboard > Project Settings > API > Project URL.
- Example shape: `https://PROJECT_REF.supabase.co`
- Required in production.

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- Source: Supabase Dashboard > Project Settings > API > anon public key.
- Required in production even though private writes use the service-role key.
- Safe to expose to the browser, but this app does not rely on it for private admin writes.

### `SUPABASE_SERVICE_ROLE_KEY`

- Source: Supabase Dashboard > Project Settings > API > service_role key.
- Server-only secret.
- Required for database writes, screenshot storage, PDF export storage, notifications, and admin workflows.
- Never expose this in client code or public docs.

### `NEXT_PUBLIC_SITE_URL`

- Source: your production Vercel URL or custom domain.
- Use the full public origin.
- Example: `https://your-domain.com`
- Do not use `http://localhost:3000` in production.

### `CRON_SECRET`

- Create a long random value in your password manager.
- Used to protect `/api/cron/monthly-review`.
- Vercel Cron can call the route automatically; manual calls should include:

```text
Authorization: Bearer YOUR_CRON_SECRET
```

or:

```text
/api/cron/monthly-review?secret=YOUR_CRON_SECRET
```

In production, the cron route returns `401` if `CRON_SECRET` is missing or incorrect.

### `ADMIN_ACCESS_TOKEN`

- Create a long random value in your password manager.
- This is the simple admin password/token for private admin access.
- Protects:
  - `/admin`
  - `/admin/upload`
  - `/admin/manual`
  - `/admin/review/[id]`
  - `/admin/edit/[id]`
  - `/admin/design-review`
  - `/admin/settings`
  - admin mutation APIs
  - screenshot evidence routes
  - legacy `/uploads/studies/...` paths

In production, admin access fails safely if this variable is missing.

## Build Settings

Vercel should detect Next.js automatically.

Use:

```text
Build Command: npm run build
Output Directory: leave blank / Vercel default
Install Command: npm install
Framework Preset: Next.js
```

The repo also sets `buildCommand` in `vercel.json`.

## Production Test Links

Replace `https://YOUR_DOMAIN` with your Vercel production URL.

Public pages:

```text
https://YOUR_DOMAIN/
https://YOUR_DOMAIN/portfolio
https://YOUR_DOMAIN/projects
https://YOUR_DOMAIN/experience-log
https://YOUR_DOMAIN/about
https://YOUR_DOMAIN/documents
```

Admin protection:

```text
https://YOUR_DOMAIN/admin
```

Expected logged-out result: redirect to `/admin-login?next=/admin`.

Screenshot evidence protection:

```text
https://YOUR_DOMAIN/api/storage/screenshot/local/nonexistent.png
```

Expected logged-out result: `401` JSON or login redirect for non-API legacy upload URLs.

Admin login:

```text
https://YOUR_DOMAIN/admin-login
```

Paste your `ADMIN_ACCESS_TOKEN` in the login form.

Monthly cron manual test:

```text
https://YOUR_DOMAIN/api/cron/monthly-review?secret=YOUR_CRON_SECRET
```

Expected result: JSON with a design review and maintenance report, or a clear error if another production dependency is missing.

Manual Living PDF regeneration after admin login:

```text
https://YOUR_DOMAIN/api/admin/regenerate-pdf
```

Expected result for an authenticated admin POST request: JSON with the latest PDF URL and included public-entry count.
