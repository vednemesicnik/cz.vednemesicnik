-- The record of an issue made in the app (#111, `03` row 11): its row in the Registr and its
-- Evidence, written by the app and read by nobody. The database is written first; the sheet
-- follows from the marks below, rewritten whole each time, so a sheet that does not answer only
-- delays the record.
--
-- Times are UTC instants as ISO 8601 text with milliseconds, as everywhere in the schema.

-- The issue's Evidence, created by the queue in the issue folder and found again by the key on
-- the file, never by its name. NULL until it exists.
ALTER TABLE issues ADD COLUMN evidence_spreadsheet_id TEXT;

-- One record that is out of date: `registry`, the app's list in the Registr (`issue_id` 0), or
-- `evidence`, one issue's Evidence. Every change the record shows bumps `generation` in the same
-- transaction as the change, through the triggers below, so no action can forget to mark and a
-- rolled-back action marks nothing. A write removes the mark only while `generation` is the one
-- it read: a change made during the write is written on the next pass.
CREATE TABLE record_marks (
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

-- When every record was last marked for the daily rewrite (`03` row 11). NULL marks them all on
-- the first pass, which is how the issues made before this migration get their record.
CREATE TABLE record_rewrites (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_full_at TEXT
) STRICT;

INSERT INTO record_rewrites (id, last_full_at) VALUES (1, NULL);

-- The triggers fire on the columns a record shows and on nothing else, so a job that touches a
-- row on every run (`claim_key`, `checked_at`) does not rewrite a sheet. SQLite fires `UPDATE OF`
-- for a column that was only set again to the same value, as the reply checks do with a reply on
-- every run, so each trigger also asks that one of its columns changed. A column the record
-- starts to show needs its trigger changed in a new migration.

-- The Registr row: the issue's name, folders, Evidence and state. A complete issue only.
CREATE TRIGGER record_issue_registry
AFTER UPDATE OF name, folder_id, completed_at, closed_at, evidence_spreadsheet_id, started_at
ON issues
WHEN NEW.completed_at IS NOT NULL AND
  (OLD.name IS NOT NEW.name OR OLD.folder_id IS NOT NEW.folder_id OR
   OLD.completed_at IS NOT NEW.completed_at OR OLD.closed_at IS NOT NEW.closed_at OR
   OLD.evidence_spreadsheet_id IS NOT NEW.evidence_spreadsheet_id OR
   OLD.started_at IS NOT NEW.started_at)
BEGIN
  INSERT INTO record_marks (kind, issue_id) VALUES ('registry', 0)
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

-- The Evidence comes into being once the issue is complete.
CREATE TRIGGER record_issue_evidence
AFTER UPDATE OF completed_at ON issues
WHEN NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL
BEGIN
  INSERT INTO record_marks (kind, issue_id) VALUES ('evidence', NEW.id)
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

-- The Registr's URL – Vytvořit článek: a new link or a revoked one.
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

-- Články: a created article, its name, files, handover and proofreading.
CREATE TRIGGER record_article
AFTER UPDATE OF name, created_at, doc_id, folder_id, licences_folder_id, handed_over_at,
  handover_cancelled_at, proofread_at, proofread_by_email, proofread_by_name,
  proofreading_cancelled_at
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
   OLD.proofreading_cancelled_at IS NOT NEW.proofreading_cancelled_at)
BEGIN
  INSERT INTO record_marks (kind, issue_id) VALUES ('evidence', NEW.issue_id)
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

-- Autoři, and the author of each clause.
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

-- K finalizaci – kdy, and the clauses of a marking: made, cancelled or replaced.
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

-- Redakční doložky: one clause, its sending, its reply and its archive.
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

-- Obrazová díla: a committed batch, its request, its reply and its archive, or its discarding.
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

-- An artwork's Autor, Zdroj and Dílo, once it is in a batch.
CREATE TRIGGER record_artwork
AFTER UPDATE OF batch_id, position, author, source, stored_name, removed_at ON artworks
WHEN NEW.batch_id IS NOT NULL AND
  (OLD.batch_id IS NOT NEW.batch_id OR OLD.position IS NOT NEW.position OR
   OLD.author IS NOT NEW.author OR OLD.source IS NOT NEW.source OR
   OLD.stored_name IS NOT NEW.stored_name OR OLD.removed_at IS NOT NEW.removed_at)
BEGIN
  INSERT INTO record_marks (kind, issue_id)
  VALUES ('evidence', (SELECT issue_id FROM articles WHERE id = NEW.article_id))
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;
