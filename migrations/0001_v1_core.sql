PRAGMA foreign_keys = ON;

CREATE TABLE account (
  id TEXT PRIMARY KEY,
  email_normalized TEXT COLLATE NOCASE,
  firebase_uid TEXT,
  role TEXT NOT NULL DEFAULT 'alumni'
    CHECK (role IN ('alumni', 'admin')),
  status TEXT NOT NULL DEFAULT 'eligible'
    CHECK (status IN ('eligible', 'active', 'suspended', 'deletion_pending', 'deleted')),
  activated_at TEXT,
  suspended_at TEXT,
  deletion_requested_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

CREATE UNIQUE INDEX account_email_unique
  ON account(email_normalized)
  WHERE email_normalized IS NOT NULL;
CREATE UNIQUE INDEX account_firebase_uid_unique
  ON account(firebase_uid)
  WHERE firebase_uid IS NOT NULL;
CREATE INDEX account_status_idx ON account(status);

CREATE TABLE user_session (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  account_id TEXT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  device_label TEXT,
  user_agent_summary TEXT,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  revoke_reason TEXT
) STRICT;

CREATE INDEX user_session_account_idx
  ON user_session(account_id, revoked_at, expires_at);
CREATE INDEX user_session_expiry_idx ON user_session(expires_at);

CREATE TABLE verification_challenge (
  id TEXT PRIMARY KEY,
  account_id TEXT REFERENCES account(id) ON DELETE CASCADE,
  target_email_normalized TEXT NOT NULL COLLATE NOCASE,
  purpose TEXT NOT NULL
    CHECK (purpose IN ('activation', 'password_reset', 'email_change')),
  code_hash TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 5 CHECK (max_attempts > 0),
  requested_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  invalidated_at TEXT
) STRICT;

CREATE INDEX verification_lookup_idx
  ON verification_challenge(target_email_normalized, purpose, expires_at);

CREATE TABLE alumni_profile (
  account_id TEXT PRIMARY KEY REFERENCES account(id) ON DELETE CASCADE,
  display_name TEXT,
  graduation_year INTEGER CHECK (graduation_year BETWEEN 1950 AND 2200),
  specialty TEXT,
  additional_degrees TEXT,
  available_for_recruiting INTEGER NOT NULL DEFAULT 0 CHECK (available_for_recruiting IN (0, 1)),
  available_for_mentoring INTEGER NOT NULL DEFAULT 0 CHECK (available_for_mentoring IN (0, 1)),
  reminders_enabled INTEGER NOT NULL DEFAULT 1 CHECK (reminders_enabled IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE directory_consent (
  account_id TEXT PRIMARY KEY REFERENCES account(id) ON DELETE CASCADE,
  directory_enabled INTEGER NOT NULL DEFAULT 0 CHECK (directory_enabled IN (0, 1)),
  show_name INTEGER NOT NULL DEFAULT 0 CHECK (show_name IN (0, 1)),
  show_job_title INTEGER NOT NULL DEFAULT 0 CHECK (show_job_title IN (0, 1)),
  show_employer INTEGER NOT NULL DEFAULT 0 CHECK (show_employer IN (0, 1)),
  show_city INTEGER NOT NULL DEFAULT 0 CHECK (show_city IN (0, 1)),
  show_contact_availability INTEGER NOT NULL DEFAULT 0
    CHECK (show_contact_availability IN (0, 1)),
  consented_at TEXT,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE taxonomy_category (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL
    CHECK (kind IN ('domain', 'occupation', 'sector', 'benefit')),
  parent_id TEXT REFERENCES taxonomy_category(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  value_type TEXT
    CHECK (value_type IS NULL OR value_type IN ('boolean', 'count', 'amount', 'percent', 'text')),
  default_unit TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (kind, code)
) STRICT;

CREATE INDEX taxonomy_parent_idx
  ON taxonomy_category(kind, parent_id, active, sort_order);

CREATE TABLE taxonomy_alias (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES taxonomy_category(id) ON DELETE CASCADE,
  kind TEXT NOT NULL
    CHECK (kind IN ('domain', 'occupation', 'sector', 'benefit')),
  normalized_value TEXT NOT NULL,
  match_mode TEXT NOT NULL DEFAULT 'exact'
    CHECK (match_mode IN ('exact', 'suggestion')),
  created_at TEXT NOT NULL,
  UNIQUE (kind, normalized_value)
) STRICT;

CREATE TABLE taxonomy_proposal (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL
    CHECK (kind IN ('domain', 'occupation', 'sector', 'benefit')),
  submitted_by_account_id TEXT REFERENCES account(id) ON DELETE SET NULL,
  raw_value TEXT NOT NULL,
  normalized_value TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'mapped', 'created', 'non_statistical', 'dismissed')),
  mapped_category_id TEXT REFERENCES taxonomy_category(id) ON DELETE SET NULL,
  reviewed_by_account_id TEXT REFERENCES account(id) ON DELETE SET NULL,
  submitted_at TEXT NOT NULL,
  reviewed_at TEXT,
  review_note TEXT
) STRICT;

CREATE INDEX taxonomy_proposal_queue_idx
  ON taxonomy_proposal(status, kind, submitted_at);

CREATE TABLE taxonomy_change_log (
  id TEXT PRIMARY KEY,
  proposal_id TEXT REFERENCES taxonomy_proposal(id) ON DELETE SET NULL,
  actor_account_id TEXT REFERENCES account(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  previous_category_id TEXT REFERENCES taxonomy_category(id) ON DELETE SET NULL,
  new_category_id TEXT REFERENCES taxonomy_category(id) ON DELETE SET NULL,
  reason TEXT,
  occurred_at TEXT NOT NULL
) STRICT;

CREATE INDEX taxonomy_change_entity_idx
  ON taxonomy_change_log(entity_type, entity_id, occurred_at);

CREATE TABLE professional_activity (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  occupation_category_id TEXT NOT NULL REFERENCES taxonomy_category(id) ON DELETE RESTRICT,
  employer_name TEXT,
  started_on TEXT,
  ended_on TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (ended_on IS NULL OR started_on IS NULL OR ended_on >= started_on)
) STRICT;

CREATE UNIQUE INDEX one_open_primary_activity_per_account
  ON professional_activity(account_id)
  WHERE is_primary = 1 AND ended_on IS NULL;
CREATE INDEX professional_activity_account_idx
  ON professional_activity(account_id, ended_on, started_on);
CREATE INDEX professional_activity_occupation_idx
  ON professional_activity(occupation_category_id, ended_on);

CREATE TABLE situation_snapshot (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL REFERENCES professional_activity(id) ON DELETE CASCADE,
  observed_on TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  job_title TEXT NOT NULL,
  employment_relation TEXT NOT NULL
    CHECK (employment_relation IN (
      'permanent', 'fixed_term', 'civil_servant', 'public_contract',
      'independent', 'apprenticeship', 'internship', 'volunteer', 'other'
    )),
  seniority TEXT
    CHECK (seniority IS NULL OR seniority IN ('beginner', 'confirmed', 'senior', 'expert')),
  responsibility TEXT
    CHECK (responsibility IS NULL OR responsibility IN ('individual', 'lead', 'manager', 'director')),
  team_size_band TEXT,
  total_experience_months INTEGER CHECK (total_experience_months IS NULL OR total_experience_months >= 0),
  occupation_experience_months INTEGER
    CHECK (occupation_experience_months IS NULL OR occupation_experience_months >= 0),
  organization_nature TEXT
    CHECK (organization_nature IS NULL OR organization_nature IN (
      'private', 'public', 'association', 'cooperative', 'independent'
    )),
  organization_headcount_band TEXT
    CHECK (organization_headcount_band IS NULL OR organization_headcount_band IN (
      '1', '2_9', '10_49', '50_249', '250_999', '1000_4999', '5000_plus'
    )),
  organization_stage TEXT
    CHECK (organization_stage IS NULL OR organization_stage IN ('startup', 'scaleup', 'established')),
  sector_category_id TEXT NOT NULL REFERENCES taxonomy_category(id) ON DELETE RESTRICT,
  employment_country_code TEXT NOT NULL,
  work_region_code TEXT,
  work_city TEXT,
  fixed_compensation_minor INTEGER
    CHECK (fixed_compensation_minor IS NULL OR fixed_compensation_minor >= 0),
  variable_compensation_minor INTEGER
    CHECK (variable_compensation_minor IS NULL OR variable_compensation_minor >= 0),
  compensation_currency TEXT,
  fixed_compensation_eur_minor INTEGER
    CHECK (fixed_compensation_eur_minor IS NULL OR fixed_compensation_eur_minor >= 0),
  variable_compensation_eur_minor INTEGER
    CHECK (variable_compensation_eur_minor IS NULL OR variable_compensation_eur_minor >= 0),
  total_compensation_fte_eur_minor INTEGER
    CHECK (total_compensation_fte_eur_minor IS NULL OR total_compensation_fte_eur_minor >= 0),
  exchange_rate_millionths INTEGER
    CHECK (exchange_rate_millionths IS NULL OR exchange_rate_millionths > 0),
  exchange_rate_date TEXT,
  exchange_rate_source TEXT,
  work_ratio_basis_points INTEGER NOT NULL DEFAULT 10000
    CHECK (work_ratio_basis_points BETWEEN 1 AND 10000),
  weekly_minutes INTEGER CHECK (weekly_minutes IS NULL OR weekly_minutes BETWEEN 1 AND 10080),
  work_mode TEXT
    CHECK (work_mode IS NULL OR work_mode IN ('onsite', 'hybrid', 'full_remote')),
  remote_days_per_week_scaled INTEGER
    CHECK (remote_days_per_week_scaled IS NULL OR remote_days_per_week_scaled BETWEEN 0 AND 50),
  source TEXT NOT NULL DEFAULT 'alumni'
    CHECK (source IN ('alumni', 'admin_import')),
  updated_at TEXT NOT NULL
) STRICT;

CREATE INDEX snapshot_activity_date_idx
  ON situation_snapshot(activity_id, observed_on DESC);
CREATE INDEX snapshot_current_stats_idx
  ON situation_snapshot(observed_on, sector_category_id, employment_country_code);

CREATE TABLE activity_confirmation (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL REFERENCES professional_activity(id) ON DELETE CASCADE,
  confirmed_on TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  account_id TEXT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  UNIQUE (activity_id, confirmed_on)
) STRICT;

CREATE INDEX confirmation_activity_idx
  ON activity_confirmation(activity_id, confirmed_on DESC);

CREATE TABLE snapshot_benefit (
  id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL REFERENCES situation_snapshot(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES taxonomy_category(id) ON DELETE RESTRICT,
  raw_label TEXT,
  numeric_value_scaled INTEGER,
  scale INTEGER CHECK (scale IS NULL OR scale > 0),
  unit TEXT,
  amount_minor INTEGER CHECK (amount_minor IS NULL OR amount_minor >= 0),
  currency TEXT,
  text_value TEXT,
  employer_share_basis_points INTEGER
    CHECK (employer_share_basis_points IS NULL OR employer_share_basis_points BETWEEN 0 AND 10000),
  created_at TEXT NOT NULL
) STRICT;

CREATE INDEX snapshot_benefit_snapshot_idx ON snapshot_benefit(snapshot_id);
CREATE INDEX snapshot_benefit_category_idx ON snapshot_benefit(category_id);

CREATE TABLE import_batch (
  id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_sha256 TEXT NOT NULL UNIQUE,
  survey_observed_on TEXT,
  status TEXT NOT NULL
    CHECK (status IN ('prepared', 'importing', 'validated', 'rejected')),
  source_row_count INTEGER NOT NULL DEFAULT 0 CHECK (source_row_count >= 0),
  imported_row_count INTEGER NOT NULL DEFAULT 0 CHECK (imported_row_count >= 0),
  ignored_row_count INTEGER NOT NULL DEFAULT 0 CHECK (ignored_row_count >= 0),
  invalid_row_count INTEGER NOT NULL DEFAULT 0 CHECK (invalid_row_count >= 0),
  report_json TEXT,
  created_at TEXT NOT NULL,
  validated_at TEXT
) STRICT;

CREATE TABLE legacy_survey_response (
  id TEXT PRIMARY KEY,
  import_batch_id TEXT NOT NULL REFERENCES import_batch(id) ON DELETE RESTRICT,
  source_row_number INTEGER NOT NULL,
  observed_on TEXT NOT NULL,
  graduation_year INTEGER,
  raw_gender TEXT,
  raw_location TEXT,
  raw_sector TEXT,
  raw_organization_type TEXT,
  raw_job TEXT,
  raw_experience TEXT,
  raw_salary_band TEXT,
  salary_representative_eur_minor INTEGER,
  raw_variable_band TEXT,
  variable_representative_eur_minor INTEGER,
  raw_benefits TEXT,
  raw_advice TEXT,
  domain_category_id TEXT REFERENCES taxonomy_category(id) ON DELETE SET NULL,
  occupation_category_id TEXT REFERENCES taxonomy_category(id) ON DELETE SET NULL,
  sector_category_id TEXT REFERENCES taxonomy_category(id) ON DELETE SET NULL,
  normalized_json TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (import_batch_id, source_row_number)
) STRICT;

CREATE INDEX legacy_stats_idx
  ON legacy_survey_response(observed_on, domain_category_id, sector_category_id);

CREATE TABLE anonymous_contribution (
  id TEXT PRIMARY KEY,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('account_deletion')),
  observation_month TEXT NOT NULL,
  graduation_year_band TEXT,
  domain_category_id TEXT REFERENCES taxonomy_category(id) ON DELETE SET NULL,
  occupation_category_id TEXT REFERENCES taxonomy_category(id) ON DELETE SET NULL,
  sector_category_id TEXT REFERENCES taxonomy_category(id) ON DELETE SET NULL,
  country_code TEXT,
  region_group TEXT,
  organization_headcount_band TEXT,
  fixed_compensation_band_eur TEXT,
  total_compensation_band_eur TEXT,
  work_ratio_band TEXT,
  created_at TEXT NOT NULL
) STRICT;

CREATE INDEX anonymous_stats_idx
  ON anonymous_contribution(observation_month, domain_category_id, sector_category_id);

CREATE TABLE email_configuration (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  reminders_paused INTEGER NOT NULL DEFAULT 1 CHECK (reminders_paused IN (0, 1)),
  invitations_paused INTEGER NOT NULL DEFAULT 1 CHECK (invitations_paused IN (0, 1)),
  reminder_after_months INTEGER NOT NULL DEFAULT 12 CHECK (reminder_after_months > 0),
  reminder_repeat_months INTEGER NOT NULL DEFAULT 12 CHECK (reminder_repeat_months > 0),
  reminder_daily_limit INTEGER NOT NULL DEFAULT 25 CHECK (reminder_daily_limit >= 0),
  invitation_daily_limit INTEGER NOT NULL DEFAULT 25 CHECK (invitation_daily_limit >= 0),
  transactional_daily_reserve INTEGER NOT NULL DEFAULT 20 CHECK (transactional_daily_reserve >= 0),
  provider_daily_limit INTEGER NOT NULL DEFAULT 100 CHECK (provider_daily_limit > 0),
  updated_by_account_id TEXT REFERENCES account(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL
) STRICT;

INSERT INTO email_configuration (id, updated_at)
VALUES (1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

CREATE TABLE email_job (
  id TEXT PRIMARY KEY,
  account_id TEXT REFERENCES account(id) ON DELETE CASCADE,
  type TEXT NOT NULL
    CHECK (type IN ('activation_code', 'password_reset', 'email_change', 'invitation', 'invitation_reminder', 'profile_reminder')),
  recipient_email_normalized TEXT NOT NULL COLLATE NOCASE,
  template_data_json TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  priority INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent', 'retry', 'failed', 'cancelled')),
  scheduled_at TEXT NOT NULL,
  reserved_at TEXT,
  sent_at TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at TEXT,
  last_error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE INDEX email_job_dispatch_idx
  ON email_job(status, scheduled_at, next_attempt_at, priority);

CREATE TABLE email_delivery_log (
  id TEXT PRIMARY KEY,
  email_job_id TEXT NOT NULL REFERENCES email_job(id) ON DELETE CASCADE,
  provider_message_id TEXT,
  attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
  outcome TEXT NOT NULL CHECK (outcome IN ('sent', 'rejected', 'temporary_failure', 'permanent_failure')),
  provider_status TEXT,
  error_code TEXT,
  occurred_at TEXT NOT NULL,
  UNIQUE (email_job_id, attempt_number)
) STRICT;

CREATE TABLE deletion_request (
  id TEXT PRIMARY KEY,
  account_id TEXT REFERENCES account(id) ON DELETE SET NULL,
  requested_at TEXT NOT NULL,
  due_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'failed')),
  processed_by_account_id TEXT REFERENCES account(id) ON DELETE SET NULL,
  processed_at TEXT,
  anonymized_contribution_count INTEGER NOT NULL DEFAULT 0,
  deleted_contribution_count INTEGER NOT NULL DEFAULT 0,
  note TEXT
) STRICT;

CREATE INDEX deletion_request_queue_idx ON deletion_request(status, due_at);

CREATE TABLE idea (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  author_account_id TEXT REFERENCES account(id) ON DELETE SET NULL,
  is_public INTEGER NOT NULL DEFAULT 1 CHECK (is_public IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  upvote_count INTEGER NOT NULL DEFAULT 0 CHECK (upvote_count >= 0)
) STRICT;

CREATE INDEX idea_sort_idx ON idea(upvote_count DESC, created_at DESC);

CREATE TABLE idea_vote (
  idea_id TEXT NOT NULL REFERENCES idea(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (idea_id, account_id)
) WITHOUT ROWID, STRICT;

CREATE INDEX idea_vote_account_idx ON idea_vote(account_id);

CREATE TABLE admin_audit_log (
  id TEXT PRIMARY KEY,
  actor_account_id TEXT REFERENCES account(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  metadata_json TEXT,
  occurred_at TEXT NOT NULL
) STRICT;

CREATE INDEX admin_audit_time_idx ON admin_audit_log(occurred_at DESC);
CREATE INDEX admin_audit_target_idx
  ON admin_audit_log(target_type, target_id, occurred_at DESC);
