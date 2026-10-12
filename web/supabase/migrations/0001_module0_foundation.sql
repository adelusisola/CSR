-- Jikota — Module 0 migration: schema (Section 6), enums, geography, RLS (Section 5/6).
-- Money is integer kobo everywhere. created_at/updated_at everywhere on core tables.
-- Soft delete via deleted_at on projects and project_updates only.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- enums -----
create type user_role as enum ('ngo', 'company', 'admin', 'super_admin');
create type org_type as enum ('ngo', 'company');
create type verification_status as enum ('draft', 'submitted', 'in_review', 'verified', 'rejected');
create type project_status as enum ('draft', 'pending_approval', 'live', 'funded', 'in_progress', 'closed', 'rejected', 'paused');
create type milestone_status as enum ('planned', 'update_posted', 'approved', 'disputed', 'released');
create type funding_style as enum ('full', 'cofund', 'either');
create type interest_type as enum ('full', 'partial');
create type interest_status as enum ('sent', 'confirmed', 'declined', 'payment_expired');
create type payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');
create type payout_status as enum ('created', 'sent', 'confirmed', 'failed');
create type membership_status as enum ('active', 'renewal_due', 'deferred', 'd14', 'd30', 'd60', 'listings_paused');
create type order_kind as enum ('site_visit', 'dossier', 'brief');
create type order_status as enum ('placed', 'in_progress', 'delivered', 'cancelled');
create type playbook_kind as enum ('year_plan', 'insight_offer');
create type playbook_status as enum ('open', 'done', 'snoozed_until');
create type dispute_status as enum ('open', 'reviewing', 'resolved');
create type media_kind as enum ('photo', 'receipt');

-- ------------------------------------------------------------- updated_at ---
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- --------------------------------------------------------------- users ------
-- Auth identity lives in auth.users; this mirrors app-visible fields.
create table users (
  id uuid primary key,
  email text unique not null,
  role user_role not null,
  org_id uuid,
  email_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_users_updated before update on users
for each row execute function set_updated_at();

-- --------------------------------------------------------- organizations --
create table organizations (
  id uuid primary key default gen_random_uuid(),
  type org_type not null,
  legal_name text not null,
  display_name text not null,
  cac_number text,
  year_founded int,
  mission text check (mission is null or char_length(mission) <= 300),
  sectors text[] not null default '{}',
  hq_state text,
  website text,
  contact_person text,
  contact_phone text,
  verification_status verification_status not null default 'draft',
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_orgs_updated before update on organizations
for each row execute function set_updated_at();

alter table users add constraint users_org_fk foreign key (org_id) references organizations(id);

-- ----------------------------------------------------- verification_records -
create table verification_records (
  org_id uuid primary key references organizations(id),
  cac_doc_path text,
  past_project_title text,
  past_project_year int,
  past_project_summary text check (past_project_summary is null or char_length(past_project_summary) <= 2000),
  ref1_name text, ref1_org text, ref1_email text, ref1_phone text, ref1_call_outcome text,
  ref2_name text, ref2_org text, ref2_email text, ref2_phone text, ref2_call_outcome text,
  checklist jsonb not null default '{}'::jsonb,
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_verrec_updated before update on verification_records
for each row execute function set_updated_at();

-- ------------------------------------------------------------ team_members -
create table team_members (
  org_id uuid not null references organizations(id),
  user_id uuid not null references users(id),
  can_post_updates boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- -------------------------------------------------------------- geography --
-- 36 states + FCT with their 774 LGAs (seeded in supabase/seeds/geo.sql).
create table states (
  code text primary key,
  name text not null,
  is_fct boolean not null default false
);
create table lgas (
  id int generated always as identity primary key,
  state_code text not null references states(code),
  name text not null,
  unique (state_code, name)
);
-- reference_geo convenience view (Section 6): state; lga
create view reference_geo as
  select s.name as state, l.name as lga
  from states s join lgas l on l.state_code = s.code;

-- -------------------------------------------------------- match_adjacency ---
create table match_adjacency (
  sector_a text not null,
  sector_b text not null,
  primary key (sector_a, sector_b)
);

-- --------------------------------------------------------------- projects ---
create table projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  title text not null check (char_length(title) <= 120),
  summary text check (summary is null or char_length(summary) <= 1000),
  sector text,
  sdg_primary text,
  sdg_secondary text[],
  state text,
  lga text,
  total_budget bigint not null check (total_budget >= 0),          -- kobo
  funding_gap bigint not null default 0 check (funding_gap >= 0),  -- computed, stored on change
  fee_pool_total bigint not null default 0 check (fee_pool_total >= 0),
  fee_founding boolean not null default false,
  fee_computed_at timestamptz,
  start_date date,
  end_date date,
  beneficiary_count int,
  beneficiary_desc text,
  expected_outcomes text,
  status project_status not null default 'draft',
  admin_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger trg_projects_updated before update on projects
for each row execute function set_updated_at();
create index projects_status_idx on projects (status) where deleted_at is null;
create index projects_org_idx on projects (org_id) where deleted_at is null;

-- ----------------------------------------------------------- budget_lines ---
create table budget_lines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  description text not null,
  amount bigint not null check (amount >= 0), -- kobo
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_budget_updated before update on budget_lines
for each row execute function set_updated_at();

-- ------------------------------------------------------------- milestones ---
create table milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  title text not null,
  description text,
  due_date date,
  amount bigint not null check (amount >= 0), -- kobo
  status milestone_status not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_milestones_updated before update on milestones
for each row execute function set_updated_at();

-- ---------------------------------------------------------- project_photos --
create table project_photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  storage_path text not null,
  alt_text text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------ company_preferences -
create table company_preferences (
  org_id uuid primary key references organizations(id),
  annual_budget_range text,
  per_project_min bigint check (per_project_min is null or per_project_min >= 0),
  per_project_max bigint check (per_project_max is null or per_project_max >= 0),
  sectors text[] not null default '{}',
  states text[] not null default '{}',
  sdgs text[] not null default '{}',
  funding_style funding_style not null default 'either',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_prefs_updated before update on company_preferences
for each row execute function set_updated_at();

-- ------------------------------------------------------------ match_scores --
create table match_scores (
  company_org_id uuid not null references organizations(id),
  project_id uuid not null references projects(id),
  score int not null check (score between 0 and 100),
  computed_at timestamptz not null default now(),
  primary key (company_org_id, project_id)
);

-- -------------------------------------------------------------- interests --
create table interests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  company_org_id uuid not null references organizations(id),
  type interest_type not null,
  amount bigint not null check (amount >= 0), -- kobo
  note text,
  status interest_status not null default 'sent',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_interests_updated before update on interests
for each row execute function set_updated_at();

-- --------------------------------------------------------------- payments ---
create table payments (
  id uuid primary key default gen_random_uuid(),
  funder_org_id uuid not null references organizations(id),
  project_id uuid not null references projects(id),
  paystack_reference text unique not null,
  program_amount bigint not null check (program_amount >= 0),    -- kobo
  protection_amount bigint not null check (protection_amount >= 0), -- kobo
  status payment_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_payments_updated before update on payments
for each row execute function set_updated_at();

-- ----------------------------------------------------------------- escrow ---
create table escrow (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  funder_org_id uuid not null references organizations(id),
  program_held bigint not null default 0 check (program_held >= 0),
  program_released bigint not null default 0 check (program_released >= 0),
  program_refunded bigint not null default 0 check (program_refunded >= 0),
  fee_held bigint not null default 0 check (fee_held >= 0),
  fee_released bigint not null default 0 check (fee_released >= 0),
  fee_refunded bigint not null default 0 check (fee_refunded >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, funder_org_id)
);
create trigger trg_escrow_updated before update on escrow
for each row execute function set_updated_at();

-- --------------------------------------------------------------- payouts ----
create table payouts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  milestone_id uuid not null references milestones(id),
  amount bigint not null check (amount >= 0), -- full milestone amount, kobo
  paystack_transfer_ref text,
  status payout_status not null default 'created',
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_payouts_updated before update on payouts
for each row execute function set_updated_at();

-- -------------------------------------------------------- payout_accounts ---
create table payout_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  bank_name text not null,
  account_number text not null, -- encrypted at rest (app layer / pgcrypto)
  account_name text not null,
  paystack_recipient_code text,
  verified_by uuid,
  verified_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_payoutacct_updated before update on payout_accounts
for each row execute function set_updated_at();

-- -------------------------------------------------------- project_updates ---
create table project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  milestone_id uuid references milestones(id),
  note text check (note is null or char_length(note) <= 1500),
  author uuid not null references users(id),
  update_index int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger trg_updates_updated before update on project_updates
for each row execute function set_updated_at();

-- ------------------------------------------------------------ update_media --
create table update_media (
  id uuid primary key default gen_random_uuid(),
  update_id uuid not null references project_updates(id),
  storage_path text not null,
  kind media_kind not null,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------- impact_reports ----
create table impact_reports (
  project_id uuid primary key references projects(id),
  beneficiaries_reached int,
  spend_confirmation jsonb,
  final_outcomes text,
  pdf_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_reports_updated before update on impact_reports
for each row execute function set_updated_at();

-- ------------------------------------------------------------- memberships --
-- ISOLATION LAW: no join path from membership tables into any escrow query.
-- (memberships.org_id -> organizations only; never references projects/payments/escrow.)
create table memberships (
  org_id uuid primary key references organizations(id),
  status membership_status not null default 'active',
  anniversary_date date,
  deferred_until timestamptz,
  first_completed_project_id uuid, -- plain uuid, deliberately NOT a foreign key
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_membership_updated before update on memberships
for each row execute function set_updated_at();

create table membership_payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  amount bigint not null default 10000000 check (amount = 10000000), -- fixed ₦100,000 = 10,000,000 kobo
  reference text,
  paid_at timestamptz,
  recorded_by uuid,
  created_at timestamptz not null default now()
);
-- NOTE: ₦100,000 = 100000 * 100 = 10_000_000 kobo. The spec writes "fixed 100000_00"
-- i.e. 10,000,000 kobo. Constraint above enforces the fixed fee.

-- ----------------------------------------------------------------- orders ---
create table orders (
  id uuid primary key default gen_random_uuid(),
  kind order_kind not null,
  funder_org_id uuid not null references organizations(id),
  target_org_id uuid not null references organizations(id),
  price bigint not null check (price >= 0), -- kobo
  status order_status not null default 'placed',
  deliverable_path text,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- --------------------------------------------------------- playbook_tasks ---
create table playbook_tasks (
  id uuid primary key default gen_random_uuid(),
  funder_org_id uuid not null references organizations(id),
  closed_project_id uuid references projects(id),
  kind playbook_kind not null,
  status playbook_status not null default 'open',
  snoozed_until timestamptz,
  shortlist_project_ids uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------- notifications ---
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  sent_channels text[],
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- disputes --
create table disputes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  milestone_id uuid references milestones(id),
  raised_by uuid not null references users(id),
  reason text not null,
  status dispute_status not null default 'open',
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_disputes_updated before update on disputes
for each row execute function set_updated_at();

-- ------------------------------------------------------------- audit_log ----
-- APPEND-ONLY: no update/delete grants exist for ANY role (REVOKE below + no triggers).
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
revoke update, delete, truncate on audit_log from public, authenticated, anon;
revoke all on audit_log from anon;
grant insert, select on audit_log to authenticated;

-- --------------------------------------------------- reconciliation_runs ----
create table reconciliation_runs (
  id uuid primary key default gen_random_uuid(),
  run_date date not null unique,
  paystack_balance bigint,   -- kobo
  escrow_ledger_total bigint, -- kobo
  variance bigint,            -- kobo; nonzero = alert
  created_at timestamptz not null default now()
);

-- ===================================================== helper: current user ==
create or replace function current_user_org() returns uuid
language sql stable security definer set search_path = public as $$
  select org_id from users where id = auth.uid()
$$;

create or replace function current_user_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from users where id = auth.uid()
$$;

-- ======================================================== RLS POLICIES ======
-- Section 6 RLS laws:
--  NGO users read/write only their org's rows
--  Company users read live projects and their own interests/payments/escrow/orders
--  Admin reads all queues
--  audit_log insert-only for admins
--  membership tables have no join path into any escrow query (schema-level isolation)

alter table users enable row level security;
alter table organizations enable row level security;
alter table verification_records enable row level security;
alter table team_members enable row level security;
alter table states enable row level security;
alter table lgas enable row level security;
alter table match_adjacency enable row level security;
alter table projects enable row level security;
alter table budget_lines enable row level security;
alter table milestones enable row level security;
alter table project_photos enable row level security;
alter table company_preferences enable row level security;
alter table match_scores enable row level security;
alter table interests enable row level security;
alter table payments enable row level security;
alter table escrow enable row level security;
alter table payouts enable row level security;
alter table payout_accounts enable row level security;
alter table project_updates enable row level security;
alter table update_media enable row level security;
alter table impact_reports enable row level security;
alter table memberships enable row level security;
alter table membership_payments enable row level security;
alter table orders enable row level security;
alter table playbook_tasks enable row level security;
alter table notifications enable row level security;
alter table disputes enable row level security;
alter table audit_log enable row level security;
alter table reconciliation_runs enable row level security;

-- Geography: public read (needed by signup/onboarding forms before any org exists).
create policy geo_read on states for select using (true);
create policy lga_read on lgas for select using (true);
create policy adjacency_read on match_adjacency for select using (true);

-- Users: a confirmed user reads their own row; admins read all.
create policy users_self_read on users
  for select using (id = auth.uid() or current_user_role() in ('admin','super_admin'));
create policy users_self_update on users
  for update using (id = auth.uid())
  with check (role = (select u.role from users u where u.id = auth.uid())); -- cannot self-promote roles
-- Insert happens via the confirm-signup edge function (service role), not client.

-- Organizations: owner reads/writes own org; admins all; anyone may read
-- verified orgs' public profile fields (view enforced later modules).
create policy orgs_owner_rw on organizations
  for all using (id = current_user_org() or current_user_role() in ('admin','super_admin'))
  with check (id = current_user_org() or current_user_role() in ('admin','super_admin'));

-- Verification records: owning NGO reads/writes until submitted; admins full.
create policy verrec_owner on verification_records
  for all using (org_id = current_user_org() or current_user_role() in ('admin','super_admin'))
  with check (org_id = current_user_org() or current_user_role() in ('admin','super_admin'));

-- Team members: within-org read; admins manage.
create policy team_read on team_members
  for select using (org_id = current_user_org() or current_user_role() in ('admin','super_admin'));

-- Projects: NGO writes only its own; companies + public read LIVE only; admins all.
create policy projects_ngo_write on projects
  for insert to authenticated with check (org_id = current_user_org());
create policy projects_ngo_update on projects
  for update to authenticated using (org_id = current_user_org());
create policy projects_read on projects
  for select using (
    org_id = current_user_org()
    or status in ('live','funded','in_progress','closed')
    or current_user_role() in ('admin','super_admin')
  );

-- Budget lines / milestones / photos: follow the parent project's org.
create policy budget_owner on budget_lines for all
  using (project_id in (select id from projects where org_id = current_user_org()))
  with check (project_id in (select id from projects where org_id = current_user_org()));
create policy milestones_owner on milestones for all
  using (project_id in (select id from projects where org_id = current_user_org()))
  with check (project_id in (select id from projects where org_id = current_user_org()));
create policy photos_owner on project_photos for all
  using (project_id in (select id from projects where org_id = current_user_org()))
  with check (project_id in (select id from projects where org_id = current_user_org()));
create policy photos_public_read on project_photos for select
  using (project_id in (select id from projects where status in ('live','funded','in_progress','closed')));

-- Milestone status machine is SERVER-ENFORCED (Section 7): clients may edit milestone
-- content but NEVER status; only service-role edge functions transition status.
create function milestone_status_unchanged(milestone_row_id uuid, new_status milestone_status)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from milestones m where m.id = milestone_row_id and m.status = new_status)
$$;
drop policy if exists milestones_owner on milestones;
create policy milestones_owner_ins on milestones for insert
  with check (project_id in (select id from projects where org_id = current_user_org()));
create policy milestones_owner_upd on milestones for update
  using (project_id in (select id from projects where org_id = current_user_org()))
  with check (project_id in (select id from projects where org_id = current_user_org())
              and milestone_status_unchanged(id, status));
create policy milestones_owner_del on milestones for delete
  using (project_id in (select id from projects where org_id = current_user_org()));
create policy milestones_read on milestones for select
  using (project_id in (select id from projects where org_id = current_user_org())
         or project_id in (select id from projects where status in ('live','funded','in_progress','closed')));

-- Company preferences: own org only.
create policy prefs_owner on company_preferences for all
  using (org_id = current_user_org()) with check (org_id = current_user_org());

-- Match scores: company reads its own; admins all.
create policy matches_read on match_scores for select
  using (company_org_id = current_user_org() or current_user_role() in ('admin','super_admin'));

-- Interests: company writes/reads its own; NGO reads interests on its projects; admins all.
create policy interests_company on interests for all
  using (company_org_id = current_user_org())
  with check (company_org_id = current_user_org());
create policy interests_ngo_read on interests for select
  using (project_id in (select id from projects where org_id = current_user_org()));

-- Payments / escrow: funder company reads its own; NGO reads its projects'
-- escrow PROGRAM side only via view (Module 3); admins all.
create policy payments_funder on payments for select
  using (funder_org_id = current_user_org() or current_user_role() in ('admin','super_admin'));
create policy escrow_funder on escrow for select
  using (funder_org_id = current_user_org() or current_user_role() in ('admin','super_admin'));

-- Payouts: NGO reads its projects; admins all. Writes are service-role only.
create policy payouts_ngo_read on payouts for select
  using (project_id in (select id from projects where org_id = current_user_org())
         or current_user_role() in ('admin','super_admin'));

-- Payout accounts: owning org reads/writes (writes create drafts; approval is admin/service).
create policy payoutacct_owner on payout_accounts for all
  using (org_id = current_user_org() or current_user_role() in ('admin','super_admin'))
  with check (org_id = current_user_org() or current_user_role() in ('admin','super_admin'));

-- Project updates: NGO authors on own projects; public reads non-deleted on live+ projects.
create policy updates_ngo_write on project_updates for insert
  with check (project_id in (select id from projects where org_id = current_user_org()));
create policy updates_read on project_updates for select
  using (deleted_at is null and (
    project_id in (select id from projects where org_id = current_user_org())
    or project_id in (select id from projects where status in ('live','funded','in_progress','closed'))
  ));

-- Update media: follows update visibility.
create policy media_read on update_media for select
  using (update_id in (select id from project_updates where deleted_at is null));
create policy media_ngo_write on update_media for insert
  with check (update_id in (
    select id from project_updates pu
    join projects p on p.id = pu.project_id
    where p.org_id = current_user_org()));

-- Impact reports: public read for completed projects; NGO owns; admins all.
create policy reports_read on impact_reports for select
  using (project_id in (select id from projects where status = 'closed')
         or current_user_role() in ('admin','super_admin'));

-- Memberships: owning NGO reads its own; admins manage. NEVER joinable to escrow
-- queries (no FK path); service role records payments.
create policy membership_read on memberships for select
  using (org_id = current_user_org() or current_user_role() in ('admin','super_admin'));
create policy membership_pay_read on membership_payments for select
  using (org_id = current_user_org() or current_user_role() in ('admin','super_admin'));

-- Orders: both funder and target org read their side; writes are funder-side.
create policy orders_read on orders for select
  using (funder_org_id = current_user_org() or target_org_id = current_user_org()
         or current_user_role() in ('admin','super_admin'));
create policy orders_funder_write on orders for insert
  with check (funder_org_id = current_user_org());

-- Playbook tasks: funder reads/manages own.
create policy playbook_owner on playbook_tasks for all
  using (funder_org_id = current_user_org() or current_user_role() in ('admin','super_admin'))
  with check (funder_org_id = current_user_org());

-- Notifications: user reads/updates own.
create policy notif_own on notifications for select using (user_id = auth.uid());
create policy notif_own_read on notifications for update using (user_id = auth.uid());

-- Disputes: involved parties read; raisers insert; admins resolve.
create policy disputes_read on disputes for select
  using (project_id in (select id from projects where org_id = current_user_org())
         or raised_by = auth.uid()
         or current_user_role() in ('admin','super_admin'));
create policy disputes_raise on disputes for insert
  with check (raised_by = auth.uid());

-- Audit log: admins read; admins insert; NO update/delete policies exist and
-- privileges revoked above — append-only enforced twice over.
create policy audit_admin_read on audit_log for select
  using (current_user_role() in ('admin','super_admin'));
create policy audit_admin_insert on audit_log for insert
  with check (current_user_role() in ('admin','super_admin'));

-- Reconciliation: admins only.
create policy recon_admin on reconciliation_runs for all
  using (current_user_role() in ('admin','super_admin'))
  with check (current_user_role() in ('admin','super_admin'));
