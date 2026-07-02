create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.studies (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'unknown',
  study_title text not null default 'unknown',
  visible_topic text not null default 'unknown',
  estimated_duration text not null default 'unknown',
  reward text not null default 'unknown',
  study_type text not null default 'unknown',
  approval_status text not null default 'unknown',
  what_i_did text not null default 'unknown',
  confidentiality_risk text not null default 'unknown',
  portfolio_classification text not null default 'Record only',
  recommended_section text not null default 'Research Participation Log',
  portfolio_score integer not null default 0 check (portfolio_score >= 0 and portfolio_score <= 100),
  safe_public_title text not null default 'Untitled research experience',
  safe_public_description text not null default '',
  case_study_summary text not null default '',
  skills_demonstrated text[] not null default '{}',
  linkedin_featured_title text not null default '',
  linkedin_featured_description text not null default '',
  source_type text not null default 'manual',
  status text not null default 'pending',
  screenshot_urls text[] not null default '{}',
  ai_confidence integer not null default 0 check (ai_confidence >= 0 and ai_confidence <= 100),
  missing_questions text[] not null default '{}',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  published_at timestamp with time zone
);

drop trigger if exists studies_set_updated_at on public.studies;
create trigger studies_set_updated_at
before update on public.studies
for each row execute function public.set_updated_at();

create index if not exists studies_status_idx on public.studies(status);
create index if not exists studies_published_at_idx on public.studies(published_at desc);
create index if not exists studies_recommended_section_idx on public.studies(recommended_section);

create or replace view public.approved_portfolio_entries as
select
  id,
  platform,
  estimated_duration,
  study_type,
  portfolio_classification,
  recommended_section,
  portfolio_score,
  safe_public_title,
  safe_public_description,
  case_study_summary,
  skills_demonstrated,
  linkedin_featured_title,
  linkedin_featured_description,
  created_at,
  published_at
from public.studies
where status = 'approved';

create table if not exists public.design_reviews (
  id uuid primary key default gen_random_uuid(),
  review_month text not null,
  overall_score integer not null check (overall_score >= 0 and overall_score <= 100),
  recommendation_type text not null,
  recommendations jsonb not null default '[]'::jsonb,
  preview_changes jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamp with time zone not null default now(),
  approved_at timestamp with time zone
);

create index if not exists design_reviews_month_idx on public.design_reviews(review_month);

create table if not exists public.maintenance_reports (
  id uuid primary key default gen_random_uuid(),
  report_month text not null,
  broken_links jsonb not null default '[]'::jsonb,
  duplicate_entries jsonb not null default '[]'::jsonb,
  confidentiality_flags jsonb not null default '[]'::jsonb,
  pdf_status text not null default '',
  seo_status text not null default '',
  mobile_status text not null default '',
  recommendations jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone not null default now()
);

create index if not exists maintenance_reports_month_idx on public.maintenance_reports(report_month);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  type text not null,
  read boolean not null default false,
  related_study_id uuid references public.studies(id) on delete set null,
  created_at timestamp with time zone not null default now()
);

create index if not exists notifications_created_at_idx on public.notifications(created_at desc);
create index if not exists notifications_read_idx on public.notifications(read);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone not null default now()
);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

alter table public.studies enable row level security;
alter table public.design_reviews enable row level security;
alter table public.maintenance_reports enable row level security;
alter table public.notifications enable row level security;
alter table public.site_settings enable row level security;

revoke all on public.studies from anon, authenticated;
revoke all on public.design_reviews from anon, authenticated;
revoke all on public.maintenance_reports from anon, authenticated;
revoke all on public.notifications from anon, authenticated;
revoke all on public.site_settings from anon, authenticated;

grant select on public.approved_portfolio_entries to anon, authenticated;
grant all on public.studies to service_role;
grant all on public.design_reviews to service_role;
grant all on public.maintenance_reports to service_role;
grant all on public.notifications to service_role;
grant all on public.site_settings to service_role;

drop policy if exists "service_role_manage_studies" on public.studies;
create policy "service_role_manage_studies"
on public.studies
for all
to service_role
using (true)
with check (true);

drop policy if exists "service_role_manage_design_reviews" on public.design_reviews;
create policy "service_role_manage_design_reviews"
on public.design_reviews
for all
to service_role
using (true)
with check (true);

drop policy if exists "service_role_manage_maintenance_reports" on public.maintenance_reports;
create policy "service_role_manage_maintenance_reports"
on public.maintenance_reports
for all
to service_role
using (true)
with check (true);

drop policy if exists "service_role_manage_notifications" on public.notifications;
create policy "service_role_manage_notifications"
on public.notifications
for all
to service_role
using (true)
with check (true);

drop policy if exists "service_role_manage_site_settings" on public.site_settings;
create policy "service_role_manage_site_settings"
on public.site_settings
for all
to service_role
using (true)
with check (true);

insert into public.site_settings (key, value)
values
  (
    'identity',
    '{
      "brandLine": "Pranav Likhi — AI UX Research, Human-AI Interaction & Multilingual Product Evaluation Portfolio",
      "homepageTitle": "Pranav Likhi — AI UX Research & Human-AI Interaction Portfolio",
      "homepageSubtitle": "A living portfolio of AI evaluation, UX research participation, fintech UX, voice and conversational AI, and multilingual product feedback experience.",
      "intro": "I am building toward a career in AI UX Research and Human-AI Interaction, combining customer experience, product feedback, multilingual communication, and hands-on participation in AI and usability research studies.",
      "confidentialityNote": "Some experiences are summarized at a high level to protect participant confidentiality, researcher privacy, and unreleased product details."
    }'::jsonb
  ),
  (
    'portfolio_categories',
    '[
      "Major AI UX Projects",
      "AI Evaluation Experience",
      "Fintech & Banking UX",
      "Voice & Conversational AI",
      "Multilingual Product Evaluation",
      "Usability Testing & Product Feedback",
      "Research Participation Log",
      "AI Workflow Projects",
      "Learning & Career Development"
    ]'::jsonb
  ),
  (
    'privacy_rules',
    '{
      "neverReveal": [
        "company names unless already public and safe",
        "researcher names",
        "study IDs",
        "completion codes",
        "private prototype details",
        "unreleased product details",
        "screenshots publicly"
      ]
    }'::jsonb
  ),
  (
    'ai_rules',
    '{
      "unknownFieldsMustRemainUnknown": true,
      "approvalRequiredBeforePublishing": true,
      "structuredOutputValidation": "zod"
    }'::jsonb
  ),
  (
    'notification_settings',
    '{
      "inAppNotifications": true,
      "emailNotifications": false
    }'::jsonb
  ),
  (
    'pdf',
    '{
      "title": "Living AI UX Portfolio — Pranav Likhi",
      "staticUrl": "/documents/pranav-likhi-ai-ux-portfolio.pdf",
      "latestUrl": "",
      "lastGeneratedAt": ""
    }'::jsonb
  )
on conflict (key) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'study-screenshots',
    'study-screenshots',
    false,
    10485760,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  ),
  (
    'portfolio-exports',
    'portfolio-exports',
    true,
    10485760,
    array['application/pdf']
  )
on conflict (id) do nothing;

drop policy if exists "service_role_manage_study_screenshots" on storage.objects;
create policy "service_role_manage_study_screenshots"
on storage.objects
for all
to service_role
using (bucket_id = 'study-screenshots')
with check (bucket_id = 'study-screenshots');

drop policy if exists "service_role_manage_portfolio_exports" on storage.objects;
create policy "service_role_manage_portfolio_exports"
on storage.objects
for all
to service_role
using (bucket_id = 'portfolio-exports')
with check (bucket_id = 'portfolio-exports');

drop policy if exists "public_read_portfolio_exports" on storage.objects;
create policy "public_read_portfolio_exports"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'portfolio-exports');
