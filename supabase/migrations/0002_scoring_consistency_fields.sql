alter table public.studies
  add column if not exists public_publish_recommendation text not null default 'Do not publish as portfolio highlight',
  add column if not exists analysis_status text not null default 'Manual/fallback extraction only';

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
  public_publish_recommendation,
  created_at,
  published_at
from public.studies
where status = 'approved';

grant select on public.approved_portfolio_entries to anon, authenticated;
