create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

alter table public.studies
  add column if not exists duplicate_fingerprint text,
  add column if not exists duplicate_status text not null default 'clear',
  add column if not exists superseded_by uuid references public.studies(id) on delete set null,
  add column if not exists superseded_at timestamp with time zone,
  add column if not exists last_duplicate_check_at timestamp with time zone;

alter table public.studies
  drop constraint if exists studies_duplicate_status_check;

alter table public.studies
  add constraint studies_duplicate_status_check
  check (
    duplicate_status in (
      'clear',
      'possible_duplicate',
      'probable_duplicate',
      'confirmed_duplicate',
      'intentionally_kept',
      'superseded'
    )
  );

create index if not exists studies_duplicate_fingerprint_idx
  on public.studies(duplicate_fingerprint);

create index if not exists studies_duplicate_status_idx
  on public.studies(duplicate_status);

create index if not exists studies_superseded_by_idx
  on public.studies(superseded_by);

create index if not exists studies_title_trgm_idx
  on public.studies using gin (lower(study_title) gin_trgm_ops);

create table if not exists public.duplicate_audit_log (
  id uuid primary key default gen_random_uuid(),
  candidate_entry_id uuid references public.studies(id) on delete set null,
  matched_entry_id uuid references public.studies(id) on delete set null,
  detected_at timestamp with time zone not null default now(),
  resolved_at timestamp with time zone,
  detection_type text not null,
  similarity_score numeric not null default 0,
  field_comparison jsonb not null default '{}'::jsonb,
  resolution text not null default 'pending',
  winning_entry_id uuid references public.studies(id) on delete set null,
  losing_entry_id uuid references public.studies(id) on delete set null,
  resolution_note text not null default '',
  created_by text not null default 'admin',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint duplicate_audit_detection_type_check
    check (detection_type in ('exact', 'probable', 'possible')),
  constraint duplicate_audit_resolution_check
    check (
      resolution in (
        'pending',
        'replaced_existing',
        'kept_new',
        'kept_both',
        'cancelled',
        'false_positive'
      )
    )
);

create index if not exists duplicate_audit_candidate_idx
  on public.duplicate_audit_log(candidate_entry_id);

create index if not exists duplicate_audit_matched_idx
  on public.duplicate_audit_log(matched_entry_id);

create index if not exists duplicate_audit_resolution_idx
  on public.duplicate_audit_log(resolution);

drop trigger if exists duplicate_audit_log_set_updated_at on public.duplicate_audit_log;
create trigger duplicate_audit_log_set_updated_at
before update on public.duplicate_audit_log
for each row execute function public.set_updated_at();

create table if not exists public.maintenance_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null,
  status text not null default 'running',
  started_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone,
  overall_status text not null default 'healthy',
  summary jsonb not null default '{}'::jsonb,
  issue_count integer not null default 0,
  critical_count integer not null default 0,
  warning_count integer not null default 0,
  info_count integer not null default 0,
  initiated_by text not null default 'system',
  error_message text,
  idempotency_key text,
  created_at timestamp with time zone not null default now(),
  constraint maintenance_runs_run_type_check
    check (run_type in ('manual', 'weekly', 'monthly_design_review', 'scheduled_dispatch')),
  constraint maintenance_runs_status_check
    check (status in ('running', 'completed', 'partially_failed', 'failed')),
  constraint maintenance_runs_overall_status_check
    check (overall_status in ('healthy', 'attention', 'critical'))
);

create unique index if not exists maintenance_runs_idempotency_key_idx
  on public.maintenance_runs(idempotency_key)
  where idempotency_key is not null;

create index if not exists maintenance_runs_created_at_idx
  on public.maintenance_runs(created_at desc);

create table if not exists public.maintenance_issues (
  id uuid primary key default gen_random_uuid(),
  maintenance_run_id uuid references public.maintenance_runs(id) on delete set null,
  check_key text not null,
  category text not null,
  severity text not null,
  title text not null,
  human_summary text not null,
  technical_details jsonb not null default '{}'::jsonb,
  affected_record_type text,
  affected_record_id text,
  suggested_action text not null default '',
  codex_repair_prompt text not null default '',
  status text not null default 'open',
  fingerprint text not null,
  first_detected_at timestamp with time zone not null default now(),
  last_detected_at timestamp with time zone not null default now(),
  resolved_at timestamp with time zone,
  resolution_note text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint maintenance_issues_severity_check
    check (severity in ('critical', 'warning', 'info')),
  constraint maintenance_issues_status_check
    check (status in ('open', 'acknowledged', 'resolved', 'ignored'))
);

create index if not exists maintenance_issues_run_idx
  on public.maintenance_issues(maintenance_run_id);

create index if not exists maintenance_issues_status_idx
  on public.maintenance_issues(status);

create index if not exists maintenance_issues_severity_idx
  on public.maintenance_issues(severity);

create index if not exists maintenance_issues_fingerprint_idx
  on public.maintenance_issues(fingerprint);

drop trigger if exists maintenance_issues_set_updated_at on public.maintenance_issues;
create trigger maintenance_issues_set_updated_at
before update on public.maintenance_issues
for each row execute function public.set_updated_at();

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  owner_key text not null default 'primary-owner' unique,
  notification_email text,
  timezone text not null default 'America/Halifax',
  weekly_maintenance_enabled boolean not null default true,
  monthly_design_review_enabled boolean not null default true,
  critical_alerts_enabled boolean not null default true,
  weekly_day_of_week integer not null default 1 check (weekly_day_of_week between 0 and 6),
  monthly_day_of_month integer not null default 1 check (monthly_day_of_month between 1 and 28),
  preferred_local_hour integer not null default 10 check (preferred_local_hour between 0 and 23),
  last_weekly_email_at timestamp with time zone,
  last_monthly_email_at timestamp with time zone,
  last_critical_email_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_type text not null,
  maintenance_run_id uuid references public.maintenance_runs(id) on delete set null,
  maintenance_issue_id uuid references public.maintenance_issues(id) on delete set null,
  recipient text,
  provider text not null default 'resend',
  provider_message_id text,
  status text not null default 'queued',
  subject text not null,
  failure_reason text,
  idempotency_key text,
  attempted_at timestamp with time zone not null default now(),
  sent_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint notification_deliveries_status_check
    check (status in ('queued', 'sent', 'failed', 'skipped'))
);

create unique index if not exists notification_deliveries_idempotency_key_idx
  on public.notification_deliveries(idempotency_key)
  where idempotency_key is not null;

create index if not exists notification_deliveries_type_idx
  on public.notification_deliveries(notification_type);

create index if not exists notification_deliveries_status_idx
  on public.notification_deliveries(status);

create table if not exists public.releases (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  title text not null,
  summary text not null,
  change_items jsonb not null default '[]'::jsonb,
  release_type text not null,
  published_at timestamp with time zone not null,
  deployment_reference text,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint releases_release_type_check
    check (release_type in ('major', 'minor', 'patch', 'maintenance'))
);

drop trigger if exists releases_set_updated_at on public.releases;
create trigger releases_set_updated_at
before update on public.releases
for each row execute function public.set_updated_at();

create table if not exists public.release_views (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.releases(id) on delete cascade,
  viewer_key text not null,
  first_viewed_at timestamp with time zone not null default now(),
  last_viewed_at timestamp with time zone not null default now(),
  dismissed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  unique(release_id, viewer_key)
);

create index if not exists release_views_viewer_idx
  on public.release_views(viewer_key);

create table if not exists public.operations_audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id text,
  actor text not null default 'admin',
  before_state jsonb,
  after_state jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

create index if not exists operations_audit_log_created_at_idx
  on public.operations_audit_log(created_at desc);

create index if not exists operations_audit_log_entity_idx
  on public.operations_audit_log(entity_type, entity_id);

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
where
  status = 'approved'
  and portfolio_score >= 30
  and portfolio_classification not in ('Record only', 'Do not add')
  and duplicate_status <> 'superseded'
  and superseded_at is null;

grant select on public.approved_portfolio_entries to anon, authenticated;

alter table public.duplicate_audit_log enable row level security;
alter table public.maintenance_runs enable row level security;
alter table public.maintenance_issues enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.releases enable row level security;
alter table public.release_views enable row level security;
alter table public.operations_audit_log enable row level security;

revoke all on public.duplicate_audit_log from anon, authenticated;
revoke all on public.maintenance_runs from anon, authenticated;
revoke all on public.maintenance_issues from anon, authenticated;
revoke all on public.notification_preferences from anon, authenticated;
revoke all on public.notification_deliveries from anon, authenticated;
revoke all on public.releases from anon, authenticated;
revoke all on public.release_views from anon, authenticated;
revoke all on public.operations_audit_log from anon, authenticated;

grant all on public.duplicate_audit_log to service_role;
grant all on public.maintenance_runs to service_role;
grant all on public.maintenance_issues to service_role;
grant all on public.notification_preferences to service_role;
grant all on public.notification_deliveries to service_role;
grant all on public.releases to service_role;
grant all on public.release_views to service_role;
grant all on public.operations_audit_log to service_role;

drop policy if exists "service_role_manage_duplicate_audit_log" on public.duplicate_audit_log;
create policy "service_role_manage_duplicate_audit_log"
on public.duplicate_audit_log for all to service_role using (true) with check (true);

drop policy if exists "service_role_manage_maintenance_runs" on public.maintenance_runs;
create policy "service_role_manage_maintenance_runs"
on public.maintenance_runs for all to service_role using (true) with check (true);

drop policy if exists "service_role_manage_maintenance_issues" on public.maintenance_issues;
create policy "service_role_manage_maintenance_issues"
on public.maintenance_issues for all to service_role using (true) with check (true);

drop policy if exists "service_role_manage_notification_preferences" on public.notification_preferences;
create policy "service_role_manage_notification_preferences"
on public.notification_preferences for all to service_role using (true) with check (true);

drop policy if exists "service_role_manage_notification_deliveries" on public.notification_deliveries;
create policy "service_role_manage_notification_deliveries"
on public.notification_deliveries for all to service_role using (true) with check (true);

drop policy if exists "service_role_manage_releases" on public.releases;
create policy "service_role_manage_releases"
on public.releases for all to service_role using (true) with check (true);

drop policy if exists "service_role_manage_release_views" on public.release_views;
create policy "service_role_manage_release_views"
on public.release_views for all to service_role using (true) with check (true);

drop policy if exists "service_role_manage_operations_audit_log" on public.operations_audit_log;
create policy "service_role_manage_operations_audit_log"
on public.operations_audit_log for all to service_role using (true) with check (true);

create or replace function public.resolve_duplicate_decision(
  p_audit_id uuid,
  p_resolution text,
  p_note text default ''
)
returns public.duplicate_audit_log
language plpgsql
security definer
set search_path = public
as $$
declare
  v_log public.duplicate_audit_log%rowtype;
  v_resolved_at timestamp with time zone := now();
  v_winning_entry_id uuid := null;
  v_losing_entry_id uuid := null;
begin
  if p_resolution not in (
    'replaced_existing',
    'kept_new',
    'kept_both',
    'cancelled',
    'false_positive'
  ) then
    raise exception 'Invalid duplicate resolution: %', p_resolution;
  end if;

  select *
  into v_log
  from public.duplicate_audit_log
  where id = p_audit_id
  for update;

  if not found then
    raise exception 'Duplicate audit record was not found.';
  end if;

  if p_resolution in ('replaced_existing', 'kept_new') then
    if v_log.candidate_entry_id is null or v_log.matched_entry_id is null then
      raise exception 'Both duplicate records are required.';
    end if;

    v_winning_entry_id := v_log.candidate_entry_id;
    v_losing_entry_id := v_log.matched_entry_id;

    update public.studies
    set
      duplicate_status = 'superseded',
      superseded_by = v_log.candidate_entry_id,
      superseded_at = v_resolved_at,
      status = case when p_resolution = 'replaced_existing' and status = 'approved' then 'record_only' else status end
    where id = v_log.matched_entry_id;

    update public.studies
    set
      duplicate_status = 'clear',
      superseded_by = null,
      superseded_at = null
    where id = v_log.candidate_entry_id;
  elsif p_resolution = 'kept_both' then
    update public.studies
    set duplicate_status = 'intentionally_kept'
    where id in (v_log.candidate_entry_id, v_log.matched_entry_id);
  elsif p_resolution = 'cancelled' then
    v_winning_entry_id := v_log.matched_entry_id;
    v_losing_entry_id := v_log.candidate_entry_id;

    update public.studies
    set status = 'rejected', duplicate_status = 'clear'
    where id = v_log.candidate_entry_id;
  elsif p_resolution = 'false_positive' then
    update public.studies
    set duplicate_status = 'clear'
    where id in (v_log.candidate_entry_id, v_log.matched_entry_id);
  end if;

  update public.duplicate_audit_log
  set
    resolution = p_resolution,
    resolved_at = v_resolved_at,
    winning_entry_id = v_winning_entry_id,
    losing_entry_id = v_losing_entry_id,
    resolution_note = coalesce(p_note, '')
  where id = p_audit_id
  returning * into v_log;

  return v_log;
end;
$$;

revoke all on function public.resolve_duplicate_decision(uuid, text, text) from public;
grant execute on function public.resolve_duplicate_decision(uuid, text, text) to service_role;
