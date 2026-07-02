# GitHub Deployment Steps

Use this guide to put Living AI UX Portfolio OS on GitHub so Vercel can import it when the dashboard is available again.

Do not commit real secrets. Keep `.env.local`, `.local-data`, generated screenshots, generated PDFs, `.next`, and `node_modules` out of Git.

## 1. Confirm The Local Repo

From the project root:

```bash
pwd
git status --short
git branch --show-current
git remote -v
```

Expected before the first GitHub push:

- Branch is `main`.
- Many files may be untracked if this is the first commit.
- `git remote -v` may be empty until you add the GitHub remote.

## 2. Confirm Ignored Private/Generated Files

Run:

```bash
git check-ignore -v .env.local .local-data/db.json .next tsconfig.tsbuildinfo public/exports/living-ai-ux-portfolio-latest.pdf
```

Expected result: each file should be ignored by `.gitignore`.

Uploaded screenshots under `public/uploads/studies/` should also be ignored. Only `public/uploads/studies/.gitkeep` should be committed.

## 3. Run Final Local Checks

Run:

```bash
npm run typecheck
npm run build
```

Both must pass before the first push.

## 4. Create The GitHub Repository

In GitHub:

1. Click `New repository`.
2. Repository name: `living-ai-ux-portfolio-os`.
3. Visibility: private is recommended until launch.
4. Do not initialize with a README, `.gitignore`, or license if you are pushing this existing local repo.
5. Create the repository.

GitHub will show a remote URL such as:

```text
https://github.com/YOUR_USERNAME/living-ai-ux-portfolio-os.git
```

or:

```text
git@github.com:YOUR_USERNAME/living-ai-ux-portfolio-os.git
```

## 5. Commit The Project

From the project root:

```bash
git add .env.example .gitignore README.md GITHUB_DEPLOYMENT_STEPS.md PRODUCTION_SETUP.md VERCEL_ENV_SETUP.md LAUNCH_CHECKLIST.md app components lib middleware.ts next-env.d.ts next.config.mjs package-lock.json package.json postcss.config.mjs public/documents public/exports/.gitkeep public/uploads/studies/.gitkeep supabase tailwind.config.ts tsconfig.json vercel.json
git status --short
git commit -m "Prepare Living AI UX Portfolio OS for production launch"
```

Before committing, confirm `git status --short` does not include:

- `.env.local`
- `.local-data`
- `.next`
- `node_modules`
- `tsconfig.tsbuildinfo`
- generated screenshots under `public/uploads/studies/`
- generated PDFs under `public/exports/`

## 6. Push To GitHub

Add the remote:

```bash
git remote add origin https://github.com/YOUR_USERNAME/living-ai-ux-portfolio-os.git
```

Push:

```bash
git push -u origin main
```

If the remote already exists, check it with:

```bash
git remote -v
```

If needed, update it:

```bash
git remote set-url origin https://github.com/YOUR_USERNAME/living-ai-ux-portfolio-os.git
```

## 7. Import Into Vercel When The Dashboard Loads

In Vercel:

1. Click `Add New...`.
2. Choose `Project`.
3. Import the GitHub repository `living-ai-ux-portfolio-os`.
4. Framework Preset: `Next.js`.
5. Build Command: `npm run build`.
6. Output Directory: leave blank / Vercel default.
7. Install Command: `npm install`.
8. Add all environment variables listed in `VERCEL_ENV_SETUP.md`.
9. Deploy.

## 8. Required Production Environment Variables

Paste these in Vercel Project Settings > Environment Variables:

```env
OPENAI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
CRON_SECRET=
ADMIN_ACCESS_TOKEN=
```

Use real values only inside Vercel. Do not paste real values into this repo.

## 9. Supabase Must Be Ready First

Before relying on the deployed app:

1. Run `supabase/migrations/0001_initial.sql`.
2. Run `supabase/migrations/0002_scoring_consistency_fields.sql`.
3. Run `supabase/migrations/0003_launch_privacy_hardening.sql`.
4. Run `supabase/migrations/0004_pdf_and_recommendation_consistency.sql`.
5. Run `supabase/migrations/0005_branded_pdf_style_settings.sql`.
6. Confirm `study-screenshots` is private.
7. Confirm `portfolio-exports` is public.

See `PRODUCTION_SETUP.md` for details.

## 10. Post-Deploy Smoke Tests

Replace `https://YOUR_DOMAIN` with the Vercel URL:

```text
https://YOUR_DOMAIN/
https://YOUR_DOMAIN/portfolio
https://YOUR_DOMAIN/projects
https://YOUR_DOMAIN/experience-log
https://YOUR_DOMAIN/about
https://YOUR_DOMAIN/documents
https://YOUR_DOMAIN/admin
https://YOUR_DOMAIN/api/storage/screenshot/local/nonexistent.png
```

Expected:

- Public pages load.
- `/admin` redirects to `/admin-login` when logged out.
- screenshot API returns `401` when logged out.
- public pages do not show screenshot URLs.
- record-only, do-not-add, and sub-30 entries stay private.
