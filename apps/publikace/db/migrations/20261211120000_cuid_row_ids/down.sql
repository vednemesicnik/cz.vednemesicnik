-- data-table/transaction: none
--
-- Undoes `up.sql`: every table is rebuilt with counted integers again, numbered in the order its
-- rows were written. Same frame as `up.sql`, for the same reason.

PRAGMA foreign_keys = OFF;

BEGIN;

-- Every trigger goes first and comes back last, so no rename below reads one that names a
-- table dropped and not yet renamed.
DROP TRIGGER record_author_inserted;
DROP TRIGGER record_author_changed;
DROP TRIGGER record_final_version_inserted;
DROP TRIGGER record_final_version_changed;
DROP TRIGGER record_clause_inserted;
DROP TRIGGER record_clause_changed;
DROP TRIGGER record_clause_answered;
DROP TRIGGER record_link_inserted;
DROP TRIGGER record_link_revoked;
DROP TRIGGER record_batch;
DROP TRIGGER record_batch_answered;
DROP TRIGGER record_artwork;
DROP TRIGGER record_issue_evidence;
DROP TRIGGER record_issue_registry;
DROP TRIGGER record_author_deleted;
DROP TRIGGER record_article;
DROP TRIGGER record_group;

-- Each table's integers again, in the order the rows were written, by their CUIDs.
CREATE TEMP TABLE ids_access_accounts (new TEXT PRIMARY KEY, old INTEGER NOT NULL UNIQUE);
INSERT INTO ids_access_accounts (new, old)
SELECT id, row_number() OVER (ORDER BY rowid) FROM access_accounts;
CREATE TEMP TABLE ids_access_groups (new TEXT PRIMARY KEY, old INTEGER NOT NULL UNIQUE);
INSERT INTO ids_access_groups (new, old)
SELECT id, row_number() OVER (ORDER BY rowid) FROM access_groups;
CREATE TEMP TABLE ids_articles (new TEXT PRIMARY KEY, old INTEGER NOT NULL UNIQUE);
INSERT INTO ids_articles (new, old)
SELECT id, row_number() OVER (ORDER BY rowid) FROM articles;
CREATE TEMP TABLE ids_public_mail_log (new TEXT PRIMARY KEY, old INTEGER NOT NULL UNIQUE);
INSERT INTO ids_public_mail_log (new, old)
SELECT id, row_number() OVER (ORDER BY rowid) FROM public_mail_log;
CREATE TEMP TABLE ids_job_runs (new TEXT PRIMARY KEY, old INTEGER NOT NULL UNIQUE);
INSERT INTO ids_job_runs (new, old)
SELECT id, row_number() OVER (ORDER BY rowid) FROM job_runs;
CREATE TEMP TABLE ids_final_versions (new TEXT PRIMARY KEY, old INTEGER NOT NULL UNIQUE);
INSERT INTO ids_final_versions (new, old)
SELECT id, row_number() OVER (ORDER BY rowid) FROM final_versions;
CREATE TEMP TABLE ids_article_clauses (new TEXT PRIMARY KEY, old INTEGER NOT NULL UNIQUE);
INSERT INTO ids_article_clauses (new, old)
SELECT id, row_number() OVER (ORDER BY rowid) FROM article_clauses;
CREATE TEMP TABLE ids_consent_answers (new TEXT PRIMARY KEY, old INTEGER NOT NULL UNIQUE);
INSERT INTO ids_consent_answers (new, old)
SELECT id, row_number() OVER (ORDER BY rowid) FROM consent_answers;
CREATE TEMP TABLE ids_artwork_groups (new TEXT PRIMARY KEY, old INTEGER NOT NULL UNIQUE);
INSERT INTO ids_artwork_groups (new, old)
SELECT id, row_number() OVER (ORDER BY rowid) FROM artwork_groups;
CREATE TEMP TABLE ids_links (new TEXT PRIMARY KEY, old INTEGER NOT NULL UNIQUE);
INSERT INTO ids_links (new, old)
SELECT id, row_number() OVER (ORDER BY rowid) FROM links;
CREATE TEMP TABLE ids_artwork_batches (new TEXT PRIMARY KEY, old INTEGER NOT NULL UNIQUE);
INSERT INTO ids_artwork_batches (new, old)
SELECT id, row_number() OVER (ORDER BY rowid) FROM artwork_batches;
CREATE TEMP TABLE ids_artworks (new TEXT PRIMARY KEY, old INTEGER NOT NULL UNIQUE);
INSERT INTO ids_artworks (new, old)
SELECT id, row_number() OVER (ORDER BY rowid) FROM artworks;
CREATE TEMP TABLE ids_issues (new TEXT PRIMARY KEY, old INTEGER NOT NULL UNIQUE);
INSERT INTO ids_issues (new, old)
SELECT id, row_number() OVER (ORDER BY rowid) FROM issues;
CREATE TEMP TABLE ids_job_starts (new TEXT PRIMARY KEY, old INTEGER NOT NULL UNIQUE);
INSERT INTO ids_job_starts (new, old)
SELECT id, row_number() OVER (ORDER BY rowid) FROM job_starts;

-- access_accounts
CREATE TABLE access_accounts_old (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  is_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1)),
  added_at TEXT NOT NULL,
  last_signed_in_at TEXT
) STRICT;

INSERT INTO access_accounts_old (id, email, display_name, is_admin, added_at, last_signed_in_at)
SELECT
  (SELECT old FROM ids_access_accounts WHERE new = t.id),
  t.email,
  t.display_name,
  t.is_admin,
  t.added_at,
  t.last_signed_in_at
FROM access_accounts AS t
ORDER BY t.rowid;
DROP TABLE access_accounts;
ALTER TABLE access_accounts_old RENAME TO access_accounts;

-- access_groups
CREATE TABLE access_groups_old (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  added_at TEXT NOT NULL,
  name TEXT
) STRICT;

INSERT INTO access_groups_old (id, email, added_at, name)
SELECT
  (SELECT old FROM ids_access_groups WHERE new = t.id),
  t.email,
  t.added_at,
  t.name
FROM access_groups AS t
ORDER BY t.rowid;
DROP TABLE access_groups;
ALTER TABLE access_groups_old RENAME TO access_groups;

-- articles
CREATE TABLE articles_old (
  id INTEGER PRIMARY KEY,
  issue_id INTEGER NOT NULL REFERENCES issues (id),
  link_id INTEGER NOT NULL REFERENCES links (id),
  form_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL CHECK (name <> ''),
  started_at TEXT NOT NULL,
  folder_id TEXT,
  doc_id TEXT,
  meta_file_id TEXT,
  created_at TEXT,
  cleanup_at TEXT,
  artworks_folder_id TEXT,
  licences_folder_id TEXT,
  folder_missing_at TEXT,
  artworks_folder_missing_at TEXT,
  licences_folder_missing_at TEXT,
  proofread_at TEXT,
  proofread_by_email TEXT CHECK ((proofread_at IS NULL) = (proofread_by_email IS NULL)),
  proofread_by_name TEXT CHECK (proofread_by_name IS NULL OR proofread_by_email IS NOT NULL),
  handed_over_at TEXT,
  handed_over_by_email TEXT CHECK ((handed_over_at IS NULL) = (handed_over_by_email IS NULL)),
  handed_over_by_name TEXT CHECK (handed_over_by_name IS NULL OR handed_over_by_email IS NOT NULL),
  handover_cancelled_at TEXT CHECK (handover_cancelled_at IS NULL OR handed_over_at IS NOT NULL),
  handover_announced_at TEXT,
  proofreading_cancelled_at TEXT
    CHECK (proofreading_cancelled_at IS NULL OR proofread_at IS NOT NULL),
  removed_at TEXT,
  CHECK (
    created_at IS NULL
    OR (folder_id IS NOT NULL AND doc_id IS NOT NULL AND meta_file_id IS NOT NULL)
  ),
  CHECK (created_at IS NULL OR cleanup_at IS NULL)
) STRICT;

INSERT INTO articles_old (id, issue_id, link_id, form_key, name, started_at, folder_id, doc_id,
  meta_file_id, created_at, cleanup_at, artworks_folder_id, licences_folder_id,
  folder_missing_at, artworks_folder_missing_at, licences_folder_missing_at, proofread_at,
  proofread_by_email, proofread_by_name, handed_over_at, handed_over_by_email,
  handed_over_by_name, handover_cancelled_at, handover_announced_at, proofreading_cancelled_at,
  removed_at)
SELECT
  (SELECT old FROM ids_articles WHERE new = t.id),
  (SELECT old FROM ids_issues WHERE new = t.issue_id),
  (SELECT old FROM ids_links WHERE new = t.link_id),
  t.form_key,
  t.name,
  t.started_at,
  t.folder_id,
  t.doc_id,
  t.meta_file_id,
  t.created_at,
  t.cleanup_at,
  t.artworks_folder_id,
  t.licences_folder_id,
  t.folder_missing_at,
  t.artworks_folder_missing_at,
  t.licences_folder_missing_at,
  t.proofread_at,
  t.proofread_by_email,
  t.proofread_by_name,
  t.handed_over_at,
  t.handed_over_by_email,
  t.handed_over_by_name,
  t.handover_cancelled_at,
  t.handover_announced_at,
  t.proofreading_cancelled_at,
  t.removed_at
FROM articles AS t
ORDER BY t.rowid;
DROP TABLE articles;
ALTER TABLE articles_old RENAME TO articles;
CREATE INDEX articles_by_link ON articles (link_id, started_at);
CREATE INDEX articles_by_issue ON articles (issue_id, created_at);

-- article_authors
CREATE TABLE article_authors_old (
  article_id INTEGER NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 1),
  name TEXT NOT NULL CHECK (name <> ''),
  email TEXT NOT NULL CHECK (email <> ''),
  welcome_sent_at TEXT,
  welcome_failed_at TEXT,
  PRIMARY KEY (article_id, position)
) STRICT;

INSERT INTO article_authors_old (article_id, position, name, email, welcome_sent_at,
  welcome_failed_at)
SELECT
  (SELECT old FROM ids_articles WHERE new = t.article_id),
  t.position,
  t.name,
  t.email,
  t.welcome_sent_at,
  t.welcome_failed_at
FROM article_authors AS t
ORDER BY t.rowid;
DROP TABLE article_authors;
ALTER TABLE article_authors_old RENAME TO article_authors;

-- public_mail_log
CREATE TABLE public_mail_log_old (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('welcome', 'consent')),
  sent_at TEXT NOT NULL
) STRICT;

INSERT INTO public_mail_log_old (id, kind, sent_at)
SELECT
  (SELECT old FROM ids_public_mail_log WHERE new = t.id),
  t.kind,
  t.sent_at
FROM public_mail_log AS t
ORDER BY t.rowid;
DROP TABLE public_mail_log;
ALTER TABLE public_mail_log_old RENAME TO public_mail_log;
CREATE INDEX public_mail_log_by_time ON public_mail_log (sent_at);

-- job_runs
CREATE TABLE job_runs_old (
  id INTEGER PRIMARY KEY,
  job TEXT NOT NULL CHECK (job <> ''),
  run_key TEXT NOT NULL UNIQUE,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  interval_minutes INTEGER NOT NULL CHECK (interval_minutes > 0),
  outcome TEXT CHECK (outcome IS NULL OR outcome IN ('ok', 'failed')),
  error_text TEXT,
  summary TEXT,
  CHECK ((finished_at IS NULL) = (outcome IS NULL))
) STRICT;

INSERT INTO job_runs_old (id, job, run_key, started_at, finished_at, interval_minutes, outcome,
  error_text, summary)
SELECT
  (SELECT old FROM ids_job_runs WHERE new = t.id),
  t.job,
  t.run_key,
  t.started_at,
  t.finished_at,
  t.interval_minutes,
  t.outcome,
  t.error_text,
  t.summary
FROM job_runs AS t
ORDER BY t.rowid;
DROP TABLE job_runs;
ALTER TABLE job_runs_old RENAME TO job_runs;
CREATE INDEX job_runs_by_job ON job_runs (job, started_at);

-- final_versions
CREATE TABLE final_versions_old (
  id INTEGER PRIMARY KEY,
  article_id INTEGER NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
  marked_at TEXT NOT NULL,
  marked_by_email TEXT NOT NULL,
  marked_by_name TEXT,
  pdf_file_id TEXT NOT NULL,
  pdf_hash TEXT NOT NULL,
  attempt_key TEXT NOT NULL UNIQUE,
  cancelled_at TEXT,
  replaced_at TEXT CHECK (replaced_at IS NULL OR cancelled_at IS NULL),
  replaces_version_id INTEGER REFERENCES final_versions (id),
  doc_modified_at TEXT,
  doc_checked_at TEXT,
  doc_revised_at TEXT
) STRICT;

INSERT INTO final_versions_old (id, article_id, marked_at, marked_by_email, marked_by_name,
  pdf_file_id, pdf_hash, attempt_key, cancelled_at, replaced_at, replaces_version_id,
  doc_modified_at, doc_checked_at, doc_revised_at)
SELECT
  (SELECT old FROM ids_final_versions WHERE new = t.id),
  (SELECT old FROM ids_articles WHERE new = t.article_id),
  t.marked_at,
  t.marked_by_email,
  t.marked_by_name,
  t.pdf_file_id,
  t.pdf_hash,
  t.attempt_key,
  t.cancelled_at,
  t.replaced_at,
  (SELECT old FROM ids_final_versions WHERE new = t.replaces_version_id),
  t.doc_modified_at,
  t.doc_checked_at,
  t.doc_revised_at
FROM final_versions AS t
ORDER BY t.rowid;
DROP TABLE final_versions;
ALTER TABLE final_versions_old RENAME TO final_versions;
CREATE UNIQUE INDEX final_versions_standing ON final_versions (article_id)
  WHERE cancelled_at IS NULL AND replaced_at IS NULL;

-- article_clauses
CREATE TABLE article_clauses_old (
  id INTEGER PRIMARY KEY,
  final_version_id INTEGER NOT NULL REFERENCES final_versions (id) ON DELETE CASCADE,
  article_id INTEGER NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  signature TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'sent', 'failed')),
  clause_key TEXT NOT NULL UNIQUE,
  claim_key TEXT,
  claimed_at TEXT CHECK (claimed_at IS NULL OR claim_key IS NOT NULL),
  first_claimed_at TEXT CHECK (first_claimed_at IS NULL OR claim_key IS NOT NULL),
  sent_at TEXT CHECK (sent_at IS NULL OR state = 'sent'),
  error TEXT CHECK (error IS NULL OR state = 'failed'),
  reply_thread_id TEXT,
  reply_message_id TEXT,
  reply_received_at TEXT,
  reply_text TEXT,
  is_exact_consent INTEGER NOT NULL DEFAULT 0 CHECK (is_exact_consent IN (0, 1)),
  checked_at TEXT,
  consent_verified_at TEXT,
  consent_verified_by_email TEXT
    CHECK ((consent_verified_at IS NULL) = (consent_verified_by_email IS NULL)),
  consent_verified_by_name TEXT,
  approved_at TEXT,
  consent_file_id TEXT CHECK ((approved_at IS NULL) = (consent_file_id IS NULL)),
  archive_failed_at TEXT,
  archive_error TEXT,
  send_attempt INTEGER NOT NULL DEFAULT 1 CHECK (send_attempt >= 1),
  replaces_clause_id INTEGER REFERENCES article_clauses (id),
  answered_message_id TEXT CHECK (answered_message_id <> ''),
  answered_at TEXT CHECK ((answered_message_id IS NULL) = (answered_at IS NULL)),
  UNIQUE (final_version_id, position)
) STRICT;

INSERT INTO article_clauses_old (id, final_version_id, article_id, position, author_name,
  author_email, signature, state, clause_key, claim_key, claimed_at, first_claimed_at, sent_at,
  error, reply_thread_id, reply_message_id, reply_received_at, reply_text, is_exact_consent,
  checked_at, consent_verified_at, consent_verified_by_email, consent_verified_by_name,
  approved_at, consent_file_id, archive_failed_at, archive_error, send_attempt,
  replaces_clause_id, answered_message_id, answered_at)
SELECT
  (SELECT old FROM ids_article_clauses WHERE new = t.id),
  (SELECT old FROM ids_final_versions WHERE new = t.final_version_id),
  (SELECT old FROM ids_articles WHERE new = t.article_id),
  t.position,
  t.author_name,
  t.author_email,
  t.signature,
  t.state,
  t.clause_key,
  t.claim_key,
  t.claimed_at,
  t.first_claimed_at,
  t.sent_at,
  t.error,
  t.reply_thread_id,
  t.reply_message_id,
  t.reply_received_at,
  t.reply_text,
  t.is_exact_consent,
  t.checked_at,
  t.consent_verified_at,
  t.consent_verified_by_email,
  t.consent_verified_by_name,
  t.approved_at,
  t.consent_file_id,
  t.archive_failed_at,
  t.archive_error,
  t.send_attempt,
  (SELECT old FROM ids_article_clauses WHERE new = t.replaces_clause_id),
  t.answered_message_id,
  t.answered_at
FROM article_clauses AS t
ORDER BY t.rowid;
DROP TABLE article_clauses;
ALTER TABLE article_clauses_old RENAME TO article_clauses;
CREATE INDEX article_clauses_by_article ON article_clauses (article_id);
CREATE INDEX article_clauses_by_claim ON article_clauses (claim_key);

-- record_marks
CREATE TABLE record_marks_old (
  kind TEXT NOT NULL CHECK (kind IN ('registry', 'evidence')),
  issue_id INTEGER NOT NULL DEFAULT 0,
  generation INTEGER NOT NULL DEFAULT 1,
  -- The failed writes since the last change, and when the next one may be tried.
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  retry_at TEXT,
  last_error TEXT,
  PRIMARY KEY (kind, issue_id),
  CHECK ((kind = 'registry') = (issue_id = 0))
) STRICT;

INSERT INTO record_marks_old (kind, issue_id, generation, attempts, retry_at, last_error)
SELECT
  t.kind,
  CASE t.kind WHEN 'registry' THEN 0 ELSE (SELECT old FROM ids_issues WHERE new = t.issue_id) END,
  t.generation,
  t.attempts,
  t.retry_at,
  t.last_error
FROM record_marks AS t
ORDER BY t.rowid;
DROP TABLE record_marks;
ALTER TABLE record_marks_old RENAME TO record_marks;

-- print_handoffs
CREATE TABLE print_handoffs_old (
  issue_id INTEGER PRIMARY KEY REFERENCES issues (id),
  sheet_id TEXT,
  claim_key TEXT,
  claimed_at TEXT CHECK (claimed_at IS NULL OR claim_key IS NOT NULL),
  filled_at TEXT
) STRICT;

INSERT INTO print_handoffs_old (issue_id, sheet_id, claim_key, claimed_at, filled_at)
SELECT
  (SELECT old FROM ids_issues WHERE new = t.issue_id),
  t.sheet_id,
  t.claim_key,
  t.claimed_at,
  t.filled_at
FROM print_handoffs AS t
ORDER BY t.rowid;
DROP TABLE print_handoffs;
ALTER TABLE print_handoffs_old RENAME TO print_handoffs;

-- print_articles
CREATE TABLE print_articles_old (
  article_id INTEGER PRIMARY KEY REFERENCES articles (id) ON DELETE CASCADE,
  issue_id INTEGER NOT NULL REFERENCES issues (id),
  folder_id TEXT NOT NULL,
  text_file_id TEXT,
  text_final_version_id INTEGER REFERENCES final_versions (id) ON DELETE SET NULL,
  is_text_changed INTEGER NOT NULL DEFAULT 0 CHECK (is_text_changed IN (0, 1)),
  last_image_number INTEGER NOT NULL DEFAULT 0 CHECK (last_image_number >= 0)
) STRICT;

INSERT INTO print_articles_old (article_id, issue_id, folder_id, text_file_id,
  text_final_version_id, is_text_changed, last_image_number)
SELECT
  (SELECT old FROM ids_articles WHERE new = t.article_id),
  (SELECT old FROM ids_issues WHERE new = t.issue_id),
  t.folder_id,
  t.text_file_id,
  (SELECT old FROM ids_final_versions WHERE new = t.text_final_version_id),
  t.is_text_changed,
  t.last_image_number
FROM print_articles AS t
ORDER BY t.rowid;
DROP TABLE print_articles;
ALTER TABLE print_articles_old RENAME TO print_articles;
CREATE INDEX print_articles_by_issue ON print_articles (issue_id);

-- print_artworks
CREATE TABLE print_artworks_old (
  artwork_id INTEGER PRIMARY KEY REFERENCES artworks (id) ON DELETE CASCADE,
  article_id INTEGER NOT NULL REFERENCES print_articles (article_id) ON DELETE CASCADE,
  copy_file_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK (name <> '')
) STRICT;

INSERT INTO print_artworks_old (artwork_id, article_id, copy_file_id, name)
SELECT
  (SELECT old FROM ids_artworks WHERE new = t.artwork_id),
  (SELECT old FROM ids_articles WHERE new = t.article_id),
  t.copy_file_id,
  t.name
FROM print_artworks AS t
ORDER BY t.rowid;
DROP TABLE print_artworks;
ALTER TABLE print_artworks_old RENAME TO print_artworks;
CREATE INDEX print_artworks_by_article ON print_artworks (article_id);

-- consent_answers
CREATE TABLE consent_answers_old (
  id INTEGER PRIMARY KEY,
  batch_id INTEGER REFERENCES artwork_batches (id),
  clause_id INTEGER REFERENCES article_clauses (id),
  in_reply_to_message_id TEXT NOT NULL CHECK (in_reply_to_message_id <> ''),
  reply_received_at TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  text TEXT NOT NULL CHECK (length(text) BETWEEN 1 AND 5000),
  signature_name TEXT,
  editor_email TEXT NOT NULL,
  editor_name TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  started_at TEXT NOT NULL,
  sent_at TEXT,
  failed_at TEXT,
  refused_at TEXT,
  CHECK ((batch_id IS NULL) <> (clause_id IS NULL)),
  CHECK ((sent_at IS NOT NULL) + (failed_at IS NOT NULL) + (refused_at IS NOT NULL) <= 1)
) STRICT;

INSERT INTO consent_answers_old (id, batch_id, clause_id, in_reply_to_message_id,
  reply_received_at, reply_text, text, signature_name, editor_email, editor_name,
  idempotency_key, started_at, sent_at, failed_at, refused_at)
SELECT
  (SELECT old FROM ids_consent_answers WHERE new = t.id),
  (SELECT old FROM ids_artwork_batches WHERE new = t.batch_id),
  (SELECT old FROM ids_article_clauses WHERE new = t.clause_id),
  t.in_reply_to_message_id,
  t.reply_received_at,
  t.reply_text,
  t.text,
  t.signature_name,
  t.editor_email,
  t.editor_name,
  t.idempotency_key,
  t.started_at,
  t.sent_at,
  t.failed_at,
  t.refused_at
FROM consent_answers AS t
ORDER BY t.rowid;
DROP TABLE consent_answers;
ALTER TABLE consent_answers_old RENAME TO consent_answers;
CREATE UNIQUE INDEX consent_answers_one_per_batch_reply
  ON consent_answers (batch_id, in_reply_to_message_id) WHERE batch_id IS NOT NULL;
CREATE UNIQUE INDEX consent_answers_one_per_clause_reply
  ON consent_answers (clause_id, in_reply_to_message_id) WHERE clause_id IS NOT NULL;

-- artwork_groups
CREATE TABLE artwork_groups_old (
  id INTEGER PRIMARY KEY,
  issue_id INTEGER NOT NULL REFERENCES issues (id),
  form_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL CHECK (name <> '' AND length(name) <= 200),
  name_key TEXT NOT NULL CHECK (name_key <> ''),
  note TEXT NOT NULL DEFAULT '' CHECK (length(note) <= 500),
  started_at TEXT NOT NULL,
  started_by_email TEXT NOT NULL,
  started_by_name TEXT NOT NULL,
  folder_id TEXT,
  artworks_folder_id TEXT,
  licences_folder_id TEXT,
  meta_file_id TEXT,
  created_at TEXT,
  cleanup_at TEXT,
  folder_missing_at TEXT,
  artworks_folder_missing_at TEXT,
  licences_folder_missing_at TEXT,
  removed_at TEXT,
  CHECK (
    created_at IS NULL
    OR (folder_id IS NOT NULL AND artworks_folder_id IS NOT NULL
      AND licences_folder_id IS NOT NULL AND meta_file_id IS NOT NULL)
  ),
  CHECK (created_at IS NULL OR cleanup_at IS NULL)
) STRICT;

INSERT INTO artwork_groups_old (id, issue_id, form_key, name, name_key, note, started_at,
  started_by_email, started_by_name, folder_id, artworks_folder_id, licences_folder_id,
  meta_file_id, created_at, cleanup_at, folder_missing_at, artworks_folder_missing_at,
  licences_folder_missing_at, removed_at)
SELECT
  (SELECT old FROM ids_artwork_groups WHERE new = t.id),
  (SELECT old FROM ids_issues WHERE new = t.issue_id),
  t.form_key,
  t.name,
  t.name_key,
  t.note,
  t.started_at,
  t.started_by_email,
  t.started_by_name,
  t.folder_id,
  t.artworks_folder_id,
  t.licences_folder_id,
  t.meta_file_id,
  t.created_at,
  t.cleanup_at,
  t.folder_missing_at,
  t.artworks_folder_missing_at,
  t.licences_folder_missing_at,
  t.removed_at
FROM artwork_groups AS t
ORDER BY t.rowid;
DROP TABLE artwork_groups;
ALTER TABLE artwork_groups_old RENAME TO artwork_groups;
CREATE INDEX artwork_groups_by_issue ON artwork_groups (issue_id, created_at);
CREATE UNIQUE INDEX artwork_groups_one_name_per_issue ON artwork_groups (issue_id, name_key)
WHERE removed_at IS NULL;

-- links
CREATE TABLE links_old (
  id INTEGER PRIMARY KEY,
  key TEXT NOT NULL UNIQUE CHECK (length(key) = 12),
  kind TEXT NOT NULL CHECK (kind IN ('article', 'artworks')),
  issue_id INTEGER NOT NULL REFERENCES issues (id),
  article_id INTEGER REFERENCES articles (id) ON DELETE CASCADE,
  group_id INTEGER REFERENCES artwork_groups (id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  revoked_at TEXT,
  CHECK (
    (kind = 'article' AND article_id IS NULL AND group_id IS NULL)
    OR (kind = 'artworks' AND (article_id IS NULL) <> (group_id IS NULL))
  )
) STRICT;

INSERT INTO links_old (id, key, kind, issue_id, article_id, group_id, created_at, revoked_at)
SELECT
  (SELECT old FROM ids_links WHERE new = t.id),
  t.key,
  t.kind,
  (SELECT old FROM ids_issues WHERE new = t.issue_id),
  (SELECT old FROM ids_articles WHERE new = t.article_id),
  (SELECT old FROM ids_artwork_groups WHERE new = t.group_id),
  t.created_at,
  t.revoked_at
FROM links AS t
ORDER BY t.rowid;
DROP TABLE links;
ALTER TABLE links_old RENAME TO links;
CREATE UNIQUE INDEX links_one_valid_article_link ON links (issue_id)
WHERE kind = 'article' AND revoked_at IS NULL;
CREATE UNIQUE INDEX links_one_valid_group_link ON links (group_id)
WHERE group_id IS NOT NULL AND revoked_at IS NULL;

-- artwork_batches
CREATE TABLE artwork_batches_old (
  id INTEGER PRIMARY KEY,
  issue_id INTEGER NOT NULL REFERENCES issues (id),
  article_id INTEGER REFERENCES articles (id),
  group_id INTEGER REFERENCES artwork_groups (id),
  link_id INTEGER NOT NULL REFERENCES links (id),
  form_key TEXT NOT NULL UNIQUE,
  provider_name TEXT NOT NULL CHECK (provider_name <> ''),
  provider_email TEXT NOT NULL CHECK (provider_email <> ''),
  tag TEXT NOT NULL CHECK (length(tag) = 15),
  started_at TEXT NOT NULL,
  created_at TEXT,
  cleanup_at TEXT,
  mail_sent_at TEXT,
  mail_failed_at TEXT,
  mail_refused_at TEXT,
  discarded_at TEXT,
  reply_thread_id TEXT,
  reply_message_id TEXT,
  reply_received_at TEXT,
  reply_text TEXT,
  is_exact_consent INTEGER NOT NULL DEFAULT 0 CHECK (is_exact_consent IN (0, 1)),
  checked_at TEXT,
  claim_key TEXT,
  claimed_at TEXT,
  consent_verified_at TEXT,
  consent_verified_by_email TEXT
    CHECK ((consent_verified_at IS NULL) = (consent_verified_by_email IS NULL)),
  consent_verified_by_name TEXT,
  approved_at TEXT,
  consent_file_id TEXT CHECK ((approved_at IS NULL) = (consent_file_id IS NULL)),
  archive_failed_at TEXT,
  archive_error TEXT,
  answered_message_id TEXT CHECK (answered_message_id <> ''),
  answered_at TEXT CHECK ((answered_message_id IS NULL) = (answered_at IS NULL)),
  sent_holder_name TEXT,
  CHECK ((article_id IS NULL) <> (group_id IS NULL)),
  CHECK (created_at IS NULL OR cleanup_at IS NULL),
  CHECK (discarded_at IS NULL OR created_at IS NOT NULL)
) STRICT;

INSERT INTO artwork_batches_old (id, issue_id, article_id, group_id, link_id, form_key,
  provider_name, provider_email, tag, started_at, created_at, cleanup_at, mail_sent_at,
  mail_failed_at, mail_refused_at, discarded_at, reply_thread_id, reply_message_id,
  reply_received_at, reply_text, is_exact_consent, checked_at, claim_key, claimed_at,
  consent_verified_at, consent_verified_by_email, consent_verified_by_name, approved_at,
  consent_file_id, archive_failed_at, archive_error, answered_message_id, answered_at,
  sent_holder_name)
SELECT
  (SELECT old FROM ids_artwork_batches WHERE new = t.id),
  (SELECT old FROM ids_issues WHERE new = t.issue_id),
  (SELECT old FROM ids_articles WHERE new = t.article_id),
  (SELECT old FROM ids_artwork_groups WHERE new = t.group_id),
  (SELECT old FROM ids_links WHERE new = t.link_id),
  t.form_key,
  t.provider_name,
  t.provider_email,
  t.tag,
  t.started_at,
  t.created_at,
  t.cleanup_at,
  t.mail_sent_at,
  t.mail_failed_at,
  t.mail_refused_at,
  t.discarded_at,
  t.reply_thread_id,
  t.reply_message_id,
  t.reply_received_at,
  t.reply_text,
  t.is_exact_consent,
  t.checked_at,
  t.claim_key,
  t.claimed_at,
  t.consent_verified_at,
  t.consent_verified_by_email,
  t.consent_verified_by_name,
  t.approved_at,
  t.consent_file_id,
  t.archive_failed_at,
  t.archive_error,
  t.answered_message_id,
  t.answered_at,
  t.sent_holder_name
FROM artwork_batches AS t
ORDER BY t.rowid;
DROP TABLE artwork_batches;
ALTER TABLE artwork_batches_old RENAME TO artwork_batches;
CREATE UNIQUE INDEX artwork_batches_one_tag_per_article ON artwork_batches (article_id, tag)
WHERE article_id IS NOT NULL;
CREATE UNIQUE INDEX artwork_batches_one_tag_per_group ON artwork_batches (group_id, tag)
WHERE group_id IS NOT NULL;
CREATE INDEX artwork_batches_by_link ON artwork_batches (link_id, started_at);
CREATE INDEX artwork_batches_by_issue ON artwork_batches (issue_id, created_at);
CREATE INDEX artwork_batches_by_claim ON artwork_batches (claim_key);

-- artworks
CREATE TABLE artworks_old (
  id INTEGER PRIMARY KEY,
  link_id INTEGER NOT NULL REFERENCES links (id),
  article_id INTEGER REFERENCES articles (id),
  group_id INTEGER REFERENCES artwork_groups (id),
  form_key TEXT NOT NULL,
  upload_key TEXT NOT NULL UNIQUE,
  drive_file_id TEXT NOT NULL,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL CHECK (size > 0),
  is_readable INTEGER NOT NULL CHECK (is_readable IN (0, 1)),
  uploaded_at TEXT NOT NULL,
  removed_at TEXT,
  batch_id INTEGER REFERENCES artwork_batches (id),
  position INTEGER CHECK (position IS NULL OR position >= 1),
  author TEXT,
  source TEXT,
  licence_doc_id TEXT,
  licence_file_id TEXT,
  licence_hash TEXT,
  CHECK ((article_id IS NULL) <> (group_id IS NULL)),
  CHECK ((batch_id IS NULL) = (position IS NULL))
) STRICT;

INSERT INTO artworks_old (id, link_id, article_id, group_id, form_key, upload_key,
  drive_file_id, original_name, stored_name, mime_type, size, is_readable, uploaded_at,
  removed_at, batch_id, position, author, source, licence_doc_id, licence_file_id, licence_hash)
SELECT
  (SELECT old FROM ids_artworks WHERE new = t.id),
  (SELECT old FROM ids_links WHERE new = t.link_id),
  (SELECT old FROM ids_articles WHERE new = t.article_id),
  (SELECT old FROM ids_artwork_groups WHERE new = t.group_id),
  t.form_key,
  t.upload_key,
  t.drive_file_id,
  t.original_name,
  t.stored_name,
  t.mime_type,
  t.size,
  t.is_readable,
  t.uploaded_at,
  t.removed_at,
  (SELECT old FROM ids_artwork_batches WHERE new = t.batch_id),
  t.position,
  t.author,
  t.source,
  t.licence_doc_id,
  t.licence_file_id,
  t.licence_hash
FROM artworks AS t
ORDER BY t.rowid;
DROP TABLE artworks;
ALTER TABLE artworks_old RENAME TO artworks;
CREATE INDEX artworks_by_link ON artworks (link_id, uploaded_at);
CREATE INDEX artworks_by_form ON artworks (form_key);
CREATE INDEX artworks_by_batch ON artworks (batch_id, position);

-- print_groups
CREATE TABLE print_groups_old (
  group_id INTEGER PRIMARY KEY REFERENCES artwork_groups (id) ON DELETE CASCADE,
  issue_id INTEGER NOT NULL REFERENCES issues (id),
  folder_id TEXT NOT NULL,
  last_image_number INTEGER NOT NULL DEFAULT 0 CHECK (last_image_number >= 0)
) STRICT;

INSERT INTO print_groups_old (group_id, issue_id, folder_id, last_image_number)
SELECT
  (SELECT old FROM ids_artwork_groups WHERE new = t.group_id),
  (SELECT old FROM ids_issues WHERE new = t.issue_id),
  t.folder_id,
  t.last_image_number
FROM print_groups AS t
ORDER BY t.rowid;
DROP TABLE print_groups;
ALTER TABLE print_groups_old RENAME TO print_groups;
CREATE INDEX print_groups_by_issue ON print_groups (issue_id);

-- print_group_artworks
CREATE TABLE print_group_artworks_old (
  artwork_id INTEGER PRIMARY KEY REFERENCES artworks (id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES print_groups (group_id) ON DELETE CASCADE,
  copy_file_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK (name <> '')
) STRICT;

INSERT INTO print_group_artworks_old (artwork_id, group_id, copy_file_id, name)
SELECT
  (SELECT old FROM ids_artworks WHERE new = t.artwork_id),
  (SELECT old FROM ids_artwork_groups WHERE new = t.group_id),
  t.copy_file_id,
  t.name
FROM print_group_artworks AS t
ORDER BY t.rowid;
DROP TABLE print_group_artworks;
ALTER TABLE print_group_artworks_old RENAME TO print_group_artworks;
CREATE INDEX print_group_artworks_by_group ON print_group_artworks (group_id);

-- issues
CREATE TABLE issues_old (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  name_key TEXT NOT NULL,
  started_at TEXT NOT NULL,
  started_by_email TEXT NOT NULL,
  started_by_name TEXT NOT NULL,
  folder_id TEXT,
  articles_folder_id TEXT,
  print_folder_id TEXT,
  completed_at TEXT,
  closed_at TEXT,
  evidence_spreadsheet_id TEXT,
  groups_folder_id TEXT,
  folder_missing_at TEXT,
  articles_folder_missing_at TEXT,
  -- When an editor-in-chief removed the issue. Set only while it has no article and no group.
  removed_at TEXT,
  CHECK (
    completed_at IS NULL
    OR (folder_id IS NOT NULL AND articles_folder_id IS NOT NULL AND print_folder_id IS NOT NULL)
  ),
  CHECK (name <> '' AND name_key <> ''),
  CHECK (closed_at IS NULL OR completed_at IS NOT NULL)
) STRICT;

INSERT INTO issues_old (id, name, name_key, started_at, started_by_email, started_by_name,
  folder_id, articles_folder_id, print_folder_id, completed_at, closed_at,
  evidence_spreadsheet_id, groups_folder_id, folder_missing_at, articles_folder_missing_at,
  removed_at)
SELECT
  (SELECT old FROM ids_issues WHERE new = t.id),
  t.name,
  t.name_key,
  t.started_at,
  t.started_by_email,
  t.started_by_name,
  t.folder_id,
  t.articles_folder_id,
  t.print_folder_id,
  t.completed_at,
  t.closed_at,
  t.evidence_spreadsheet_id,
  t.groups_folder_id,
  t.folder_missing_at,
  t.articles_folder_missing_at,
  t.removed_at
FROM issues AS t
ORDER BY t.rowid;
DROP TABLE issues;
ALTER TABLE issues_old RENAME TO issues;
CREATE UNIQUE INDEX issues_by_name_key ON issues (name_key) WHERE removed_at IS NULL;

-- comment_digests
CREATE TABLE comment_digests_old (
  article_id INTEGER PRIMARY KEY REFERENCES articles (id) ON DELETE CASCADE,
  reported_until TEXT,
  suggestion_hashes TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(suggestion_hashes)),
  claim_key TEXT,
  claimed_at TEXT CHECK (claimed_at IS NULL OR claim_key IS NOT NULL)
) STRICT;

INSERT INTO comment_digests_old (article_id, reported_until, suggestion_hashes, claim_key,
  claimed_at)
SELECT
  (SELECT old FROM ids_articles WHERE new = t.article_id),
  t.reported_until,
  t.suggestion_hashes,
  t.claim_key,
  t.claimed_at
FROM comment_digests AS t
ORDER BY t.rowid;
DROP TABLE comment_digests;
ALTER TABLE comment_digests_old RENAME TO comment_digests;

-- job_starts
CREATE TABLE job_starts_old (
  id INTEGER PRIMARY KEY,
  job TEXT NOT NULL CHECK (job <> ''),
  start_key TEXT NOT NULL UNIQUE,
  requested_by_email TEXT NOT NULL,
  requested_by_name TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  failed_at TEXT,
  run_key TEXT UNIQUE
) STRICT;

INSERT INTO job_starts_old (id, job, start_key, requested_by_email, requested_by_name,
  requested_at, failed_at, run_key)
SELECT
  (SELECT old FROM ids_job_starts WHERE new = t.id),
  t.job,
  t.start_key,
  t.requested_by_email,
  t.requested_by_name,
  t.requested_at,
  t.failed_at,
  t.run_key
FROM job_starts AS t
ORDER BY t.rowid;
DROP TABLE job_starts;
ALTER TABLE job_starts_old RENAME TO job_starts;
CREATE INDEX job_starts_by_job ON job_starts (job, requested_at);

DROP TABLE ids_access_accounts;
DROP TABLE ids_access_groups;
DROP TABLE ids_articles;
DROP TABLE ids_public_mail_log;
DROP TABLE ids_job_runs;
DROP TABLE ids_final_versions;
DROP TABLE ids_article_clauses;
DROP TABLE ids_consent_answers;
DROP TABLE ids_artwork_groups;
DROP TABLE ids_links;
DROP TABLE ids_artwork_batches;
DROP TABLE ids_artworks;
DROP TABLE ids_issues;
DROP TABLE ids_job_starts;

CREATE TRIGGER record_author_inserted
AFTER INSERT ON article_authors
WHEN (SELECT created_at FROM articles WHERE id = NEW.article_id) IS NOT NULL
BEGIN
  INSERT INTO record_marks (kind, issue_id)
  VALUES ('evidence', (SELECT issue_id FROM articles WHERE id = NEW.article_id))
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

CREATE TRIGGER record_author_changed
AFTER UPDATE OF name, email, position ON article_authors
WHEN (SELECT created_at FROM articles WHERE id = NEW.article_id) IS NOT NULL
  AND (OLD.name IS NOT NEW.name OR OLD.email IS NOT NEW.email OR OLD.position IS NOT NEW.position)
BEGIN
  INSERT INTO record_marks (kind, issue_id)
  VALUES ('evidence', (SELECT issue_id FROM articles WHERE id = NEW.article_id))
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

CREATE TRIGGER record_final_version_inserted
AFTER INSERT ON final_versions
BEGIN
  INSERT INTO record_marks (kind, issue_id)
  VALUES ('evidence', (SELECT issue_id FROM articles WHERE id = NEW.article_id))
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

CREATE TRIGGER record_final_version_changed
AFTER UPDATE OF cancelled_at, replaced_at, pdf_file_id, pdf_hash, marked_at ON final_versions
WHEN
  (OLD.cancelled_at IS NOT NEW.cancelled_at OR OLD.replaced_at IS NOT NEW.replaced_at OR
   OLD.pdf_file_id IS NOT NEW.pdf_file_id OR OLD.pdf_hash IS NOT NEW.pdf_hash OR
   OLD.marked_at IS NOT NEW.marked_at)
BEGIN
  INSERT INTO record_marks (kind, issue_id)
  VALUES ('evidence', (SELECT issue_id FROM articles WHERE id = NEW.article_id))
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

CREATE TRIGGER record_clause_inserted
AFTER INSERT ON article_clauses
BEGIN
  INSERT INTO record_marks (kind, issue_id)
  VALUES ('evidence', (SELECT issue_id FROM articles WHERE id = NEW.article_id))
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

CREATE TRIGGER record_clause_changed
AFTER UPDATE OF author_name, author_email, state, clause_key, sent_at, error, reply_thread_id,
  reply_message_id, reply_received_at, is_exact_consent, consent_verified_at, approved_at,
  archive_failed_at, archive_error
ON article_clauses
WHEN
  (OLD.author_name IS NOT NEW.author_name OR OLD.author_email IS NOT NEW.author_email OR
   OLD.state IS NOT NEW.state OR OLD.clause_key IS NOT NEW.clause_key OR
   OLD.sent_at IS NOT NEW.sent_at OR OLD.error IS NOT NEW.error OR
   OLD.reply_thread_id IS NOT NEW.reply_thread_id OR
   OLD.reply_message_id IS NOT NEW.reply_message_id OR
   OLD.reply_received_at IS NOT NEW.reply_received_at OR
   OLD.is_exact_consent IS NOT NEW.is_exact_consent OR
   OLD.consent_verified_at IS NOT NEW.consent_verified_at OR
   OLD.approved_at IS NOT NEW.approved_at OR
   OLD.archive_failed_at IS NOT NEW.archive_failed_at OR
   OLD.archive_error IS NOT NEW.archive_error)
BEGIN
  INSERT INTO record_marks (kind, issue_id)
  VALUES ('evidence', (SELECT issue_id FROM articles WHERE id = NEW.article_id))
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

CREATE TRIGGER record_clause_answered
AFTER UPDATE OF answered_message_id, answered_at ON article_clauses
WHEN
  (OLD.answered_message_id IS NOT NEW.answered_message_id OR
   OLD.answered_at IS NOT NEW.answered_at)
BEGIN
  INSERT INTO record_marks (kind, issue_id)
  VALUES ('evidence', (SELECT issue_id FROM articles WHERE id = NEW.article_id))
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

CREATE TRIGGER record_link_inserted
AFTER INSERT ON links
WHEN NEW.kind = 'article'
BEGIN
  INSERT INTO record_marks (kind, issue_id) VALUES ('registry', 0)
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

CREATE TRIGGER record_link_revoked
AFTER UPDATE OF revoked_at ON links
WHEN NEW.kind = 'article'
  AND (OLD.revoked_at IS NOT NEW.revoked_at)
BEGIN
  INSERT INTO record_marks (kind, issue_id) VALUES ('registry', 0)
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

CREATE TRIGGER record_batch
AFTER UPDATE OF created_at, discarded_at, provider_name, provider_email, mail_sent_at,
  mail_failed_at, mail_refused_at, reply_thread_id, reply_message_id, reply_received_at,
  is_exact_consent, consent_verified_at, approved_at, archive_failed_at, archive_error
ON artwork_batches
WHEN NEW.created_at IS NOT NULL AND
  (OLD.created_at IS NOT NEW.created_at OR OLD.discarded_at IS NOT NEW.discarded_at OR
   OLD.provider_name IS NOT NEW.provider_name OR OLD.provider_email IS NOT NEW.provider_email OR
   OLD.mail_sent_at IS NOT NEW.mail_sent_at OR OLD.mail_failed_at IS NOT NEW.mail_failed_at OR
   OLD.mail_refused_at IS NOT NEW.mail_refused_at OR
   OLD.reply_thread_id IS NOT NEW.reply_thread_id OR
   OLD.reply_message_id IS NOT NEW.reply_message_id OR
   OLD.reply_received_at IS NOT NEW.reply_received_at OR
   OLD.is_exact_consent IS NOT NEW.is_exact_consent OR
   OLD.consent_verified_at IS NOT NEW.consent_verified_at OR
   OLD.approved_at IS NOT NEW.approved_at OR
   OLD.archive_failed_at IS NOT NEW.archive_failed_at OR
   OLD.archive_error IS NOT NEW.archive_error)
BEGIN
  INSERT INTO record_marks (kind, issue_id) VALUES ('evidence', NEW.issue_id)
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

CREATE TRIGGER record_batch_answered
AFTER UPDATE OF answered_message_id, answered_at ON artwork_batches
WHEN NEW.created_at IS NOT NULL AND
  (OLD.answered_message_id IS NOT NEW.answered_message_id OR
   OLD.answered_at IS NOT NEW.answered_at)
BEGIN
  INSERT INTO record_marks (kind, issue_id) VALUES ('evidence', NEW.issue_id)
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

CREATE TRIGGER record_artwork
AFTER UPDATE OF batch_id, position, author, source, stored_name, removed_at ON artworks
WHEN NEW.batch_id IS NOT NULL AND
  (OLD.batch_id IS NOT NEW.batch_id OR OLD.position IS NOT NEW.position OR
   OLD.author IS NOT NEW.author OR OLD.source IS NOT NEW.source OR
   OLD.stored_name IS NOT NEW.stored_name OR OLD.removed_at IS NOT NEW.removed_at)
BEGIN
  INSERT INTO record_marks (kind, issue_id)
  VALUES ('evidence', (SELECT issue_id FROM links WHERE id = NEW.link_id))
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

CREATE TRIGGER record_issue_evidence
AFTER UPDATE OF completed_at ON issues
WHEN NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL
BEGIN
  INSERT INTO record_marks (kind, issue_id) VALUES ('evidence', NEW.id)
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

CREATE TRIGGER record_issue_registry
AFTER UPDATE OF name, folder_id, completed_at, closed_at, evidence_spreadsheet_id, started_at,
  removed_at
ON issues
WHEN NEW.completed_at IS NOT NULL AND
  (OLD.name IS NOT NEW.name OR OLD.folder_id IS NOT NEW.folder_id OR
   OLD.completed_at IS NOT NEW.completed_at OR OLD.closed_at IS NOT NEW.closed_at OR
   OLD.evidence_spreadsheet_id IS NOT NEW.evidence_spreadsheet_id OR
   OLD.started_at IS NOT NEW.started_at OR OLD.removed_at IS NOT NEW.removed_at)
BEGIN
  INSERT INTO record_marks (kind, issue_id) VALUES ('registry', 0)
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

CREATE TRIGGER record_author_deleted
AFTER DELETE ON article_authors
WHEN (SELECT created_at FROM articles WHERE id = OLD.article_id) IS NOT NULL
BEGIN
  INSERT INTO record_marks (kind, issue_id)
  VALUES ('evidence', (SELECT issue_id FROM articles WHERE id = OLD.article_id))
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

CREATE TRIGGER record_article
AFTER UPDATE OF name, created_at, doc_id, folder_id, licences_folder_id, handed_over_at,
  handover_cancelled_at, proofread_at, proofread_by_email, proofread_by_name,
  proofreading_cancelled_at, removed_at
ON articles
WHEN NEW.created_at IS NOT NULL AND
  (OLD.name IS NOT NEW.name OR OLD.created_at IS NOT NEW.created_at OR
   OLD.doc_id IS NOT NEW.doc_id OR OLD.folder_id IS NOT NEW.folder_id OR
   OLD.licences_folder_id IS NOT NEW.licences_folder_id OR
   OLD.handed_over_at IS NOT NEW.handed_over_at OR
   OLD.handover_cancelled_at IS NOT NEW.handover_cancelled_at OR
   OLD.proofread_at IS NOT NEW.proofread_at OR
   OLD.proofread_by_email IS NOT NEW.proofread_by_email OR
   OLD.proofread_by_name IS NOT NEW.proofread_by_name OR
   OLD.proofreading_cancelled_at IS NOT NEW.proofreading_cancelled_at OR
   OLD.removed_at IS NOT NEW.removed_at)
BEGIN
  INSERT INTO record_marks (kind, issue_id) VALUES ('evidence', NEW.issue_id)
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

CREATE TRIGGER record_group
AFTER UPDATE OF created_at, name, folder_id, licences_folder_id, removed_at ON artwork_groups
WHEN NEW.created_at IS NOT NULL AND
  (OLD.created_at IS NOT NEW.created_at OR OLD.name IS NOT NEW.name OR
   OLD.folder_id IS NOT NEW.folder_id OR OLD.licences_folder_id IS NOT NEW.licences_folder_id OR
   OLD.removed_at IS NOT NEW.removed_at)
BEGIN
  INSERT INTO record_marks (kind, issue_id) VALUES ('evidence', NEW.issue_id)
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

COMMIT;

PRAGMA foreign_keys = ON;
