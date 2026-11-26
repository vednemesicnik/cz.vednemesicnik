-- data-table/transaction: none
--
-- Undoes `up.sql`: the groups and everything that belongs to them go, then the three tables are
-- rebuilt as they were, with `article_id NOT NULL`. Same frame as `up.sql`, for the same reason.

PRAGMA foreign_keys = OFF;

BEGIN;

DELETE FROM print_group_artworks;
DELETE FROM print_groups;
DELETE FROM consent_answers
WHERE batch_id IN (SELECT id FROM artwork_batches WHERE group_id IS NOT NULL);
DELETE FROM artworks WHERE group_id IS NOT NULL;
DELETE FROM artwork_batches WHERE group_id IS NOT NULL;
DELETE FROM links WHERE group_id IS NOT NULL;

DROP TABLE print_group_artworks;
DROP TABLE print_groups;
DROP TRIGGER record_group;

CREATE TABLE artworks_old (
  id INTEGER PRIMARY KEY,
  link_id INTEGER NOT NULL REFERENCES links (id),
  article_id INTEGER NOT NULL REFERENCES articles (id),
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
  CHECK ((batch_id IS NULL) = (position IS NULL))
) STRICT;

INSERT INTO artworks_old (
  id, link_id, article_id, form_key, upload_key, drive_file_id, original_name, stored_name,
  mime_type, size, is_readable, uploaded_at, removed_at, batch_id, position, author, source,
  licence_doc_id, licence_file_id, licence_hash
)
SELECT
  id, link_id, article_id, form_key, upload_key, drive_file_id, original_name, stored_name,
  mime_type, size, is_readable, uploaded_at, removed_at, batch_id, position, author, source,
  licence_doc_id, licence_file_id, licence_hash
FROM artworks;

DROP TABLE artworks;
ALTER TABLE artworks_old RENAME TO artworks;

CREATE INDEX artworks_by_link ON artworks (link_id, uploaded_at);
CREATE INDEX artworks_by_form ON artworks (form_key);
CREATE INDEX artworks_by_batch ON artworks (batch_id, position);

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

CREATE TABLE artwork_batches_old (
  id INTEGER PRIMARY KEY,
  issue_id INTEGER NOT NULL REFERENCES issues (id),
  article_id INTEGER NOT NULL REFERENCES articles (id),
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
  CHECK (created_at IS NULL OR cleanup_at IS NULL),
  CHECK (discarded_at IS NULL OR created_at IS NOT NULL)
) STRICT;

INSERT INTO artwork_batches_old (
  id, issue_id, article_id, link_id, form_key, provider_name, provider_email, tag, started_at,
  created_at, cleanup_at, mail_sent_at, mail_failed_at, mail_refused_at, discarded_at,
  reply_thread_id, reply_message_id, reply_received_at, reply_text, is_exact_consent, checked_at,
  claim_key, claimed_at, consent_verified_at, consent_verified_by_email, consent_verified_by_name,
  approved_at, consent_file_id, archive_failed_at, archive_error, answered_message_id, answered_at
)
SELECT
  id, issue_id, article_id, link_id, form_key, provider_name, provider_email, tag, started_at,
  created_at, cleanup_at, mail_sent_at, mail_failed_at, mail_refused_at, discarded_at,
  reply_thread_id, reply_message_id, reply_received_at, reply_text, is_exact_consent, checked_at,
  claim_key, claimed_at, consent_verified_at, consent_verified_by_email, consent_verified_by_name,
  approved_at, consent_file_id, archive_failed_at, archive_error, answered_message_id, answered_at
FROM artwork_batches;

DROP TABLE artwork_batches;
ALTER TABLE artwork_batches_old RENAME TO artwork_batches;

CREATE UNIQUE INDEX artwork_batches_one_tag_per_article ON artwork_batches (article_id, tag);
CREATE INDEX artwork_batches_by_link ON artwork_batches (link_id, started_at);
CREATE INDEX artwork_batches_by_issue ON artwork_batches (issue_id, created_at);
CREATE INDEX artwork_batches_by_claim ON artwork_batches (claim_key);

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

CREATE TABLE links_old (
  id INTEGER PRIMARY KEY,
  key TEXT NOT NULL UNIQUE CHECK (length(key) = 12),
  kind TEXT NOT NULL CHECK (kind IN ('article', 'artworks')),
  issue_id INTEGER NOT NULL REFERENCES issues (id),
  article_id INTEGER REFERENCES articles (id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  revoked_at TEXT,
  CHECK ((kind = 'article') = (article_id IS NULL))
) STRICT;

INSERT INTO links_old (id, key, kind, issue_id, article_id, created_at, revoked_at)
SELECT id, key, kind, issue_id, article_id, created_at, revoked_at FROM links;

DROP TABLE links;
ALTER TABLE links_old RENAME TO links;

CREATE UNIQUE INDEX links_one_valid_article_link ON links (issue_id)
WHERE kind = 'article' AND revoked_at IS NULL;

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

DROP TABLE artwork_groups;
ALTER TABLE issues DROP COLUMN groups_folder_id;

COMMIT;

PRAGMA foreign_keys = ON;
