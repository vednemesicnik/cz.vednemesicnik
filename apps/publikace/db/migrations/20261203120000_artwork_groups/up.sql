-- data-table/transaction: none
--
-- Artwork groups (#133, `12e`): artworks that belong to no single article, a cover or the
-- illustrations to several texts. A group has a folder with `Obrazová díla`, `Licence` and
-- `_meta.json`, like an article's, and its own link for uploads, but no Doc and no authors.
--
-- An artworks link, a batch and an artwork now belong to exactly one article or one group. SQLite
-- cannot drop a `NOT NULL` or change a `CHECK` in place, so `links`, `artwork_batches` and
-- `artworks` are rebuilt, each by the same steps: a new table, every row copied, the old one
-- dropped, the new one renamed, its indexes and triggers made again. The runner's transaction is
-- off for this file because `PRAGMA foreign_keys` changes nothing inside a transaction, and with
-- foreign keys on, dropping a table that rows refer to would delete or refuse them. The script
-- opens its own transaction instead, so it lands whole or not at all, and turns the keys back on.
-- The tables go one at a time, so no trigger is read again while a table it names is missing.
--
-- Times are UTC instants as ISO 8601 text with milliseconds, as everywhere in the schema.

PRAGMA foreign_keys = OFF;

BEGIN;

-- The issue's `Skupiny obrazových děl`, which holds every group folder. Made with the issue's first
-- group and NULL until then, so an issue without groups has no empty folder.
ALTER TABLE issues ADD COLUMN groups_folder_id TEXT;

-- One attempt at creating a group, and the group once it succeeded, as `articles` keeps an
-- article: the row is written before Drive is asked for anything and each file's ID the moment
-- Drive returns it, so a failed attempt knows what to put in the bin (`11c`). `created_at` set is
-- the group. `name_key` is the name in lower case: two groups of one issue may not share a name,
-- whatever its case (`03` row 7), and an attempt holds its name until it commits or is cleaned.
-- `note` is the note for the designer, empty when none was given. The three `*_missing_at` are
-- what the app found missing on Drive, as on an article (`12j`).
CREATE TABLE artwork_groups (
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
  CHECK (
    created_at IS NULL
    OR (folder_id IS NOT NULL AND artworks_folder_id IS NOT NULL
        AND licences_folder_id IS NOT NULL AND meta_file_id IS NOT NULL)
  ),
  CHECK (created_at IS NULL OR cleanup_at IS NULL)
) STRICT;

CREATE UNIQUE INDEX artwork_groups_one_name_per_issue ON artwork_groups (issue_id, name_key);
CREATE INDEX artwork_groups_by_issue ON artwork_groups (issue_id, created_at);

-- links: an artworks link belongs to one article or one group.
CREATE TABLE links_new (
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

INSERT INTO links_new (id, key, kind, issue_id, article_id, group_id, created_at, revoked_at)
SELECT id, key, kind, issue_id, article_id, NULL, created_at, revoked_at FROM links;

DROP TABLE links;
ALTER TABLE links_new RENAME TO links;

CREATE UNIQUE INDEX links_one_valid_article_link ON links (issue_id)
WHERE kind = 'article' AND revoked_at IS NULL;

CREATE UNIQUE INDEX links_one_valid_group_link ON links (group_id)
WHERE group_id IS NOT NULL AND revoked_at IS NULL;

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

-- artwork_batches: a batch is sent to one article or one group.
CREATE TABLE artwork_batches_new (
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
  CHECK ((article_id IS NULL) <> (group_id IS NULL)),
  CHECK (created_at IS NULL OR cleanup_at IS NULL),
  CHECK (discarded_at IS NULL OR created_at IS NOT NULL)
) STRICT;

INSERT INTO artwork_batches_new (
  id, issue_id, article_id, group_id, link_id, form_key, provider_name, provider_email, tag,
  started_at, created_at, cleanup_at, mail_sent_at, mail_failed_at, mail_refused_at, discarded_at,
  reply_thread_id, reply_message_id, reply_received_at, reply_text, is_exact_consent, checked_at,
  claim_key, claimed_at, consent_verified_at, consent_verified_by_email, consent_verified_by_name,
  approved_at, consent_file_id, archive_failed_at, archive_error, answered_message_id, answered_at
)
SELECT
  id, issue_id, article_id, NULL, link_id, form_key, provider_name, provider_email, tag,
  started_at, created_at, cleanup_at, mail_sent_at, mail_failed_at, mail_refused_at, discarded_at,
  reply_thread_id, reply_message_id, reply_received_at, reply_text, is_exact_consent, checked_at,
  claim_key, claimed_at, consent_verified_at, consent_verified_by_email, consent_verified_by_name,
  approved_at, consent_file_id, archive_failed_at, archive_error, answered_message_id, answered_at
FROM artwork_batches;

DROP TABLE artwork_batches;
ALTER TABLE artwork_batches_new RENAME TO artwork_batches;

CREATE UNIQUE INDEX artwork_batches_one_tag_per_article ON artwork_batches (article_id, tag)
WHERE article_id IS NOT NULL;
CREATE UNIQUE INDEX artwork_batches_one_tag_per_group ON artwork_batches (group_id, tag)
WHERE group_id IS NOT NULL;
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

-- artworks: an upload belongs to the article or the group its link belongs to.
CREATE TABLE artworks_new (
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

INSERT INTO artworks_new (
  id, link_id, article_id, group_id, form_key, upload_key, drive_file_id, original_name,
  stored_name, mime_type, size, is_readable, uploaded_at, removed_at, batch_id, position, author,
  source, licence_doc_id, licence_file_id, licence_hash
)
SELECT
  id, link_id, article_id, NULL, form_key, upload_key, drive_file_id, original_name,
  stored_name, mime_type, size, is_readable, uploaded_at, removed_at, batch_id, position, author,
  source, licence_doc_id, licence_file_id, licence_hash
FROM artworks;

DROP TABLE artworks;
ALTER TABLE artworks_new RENAME TO artworks;

CREATE INDEX artworks_by_link ON artworks (link_id, uploaded_at);
CREATE INDEX artworks_by_form ON artworks (form_key);
CREATE INDEX artworks_by_batch ON artworks (batch_id, position);

-- The issue is found through the link, which every upload has, whatever it belongs to.
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

-- Obrazová díla shows a group's name in _Název článku_, its folder in _ID složky_ and its
-- `Licence` in _Odkaz na licenci_, as the scripts' rows for a group do.
CREATE TRIGGER record_group
AFTER UPDATE OF created_at, name, folder_id, licences_folder_id ON artwork_groups
WHEN NEW.created_at IS NOT NULL AND
  (OLD.created_at IS NOT NEW.created_at OR OLD.name IS NOT NEW.name OR
   OLD.folder_id IS NOT NEW.folder_id OR OLD.licences_folder_id IS NOT NEW.licences_folder_id)
BEGIN
  INSERT INTO record_marks (kind, issue_id) VALUES ('evidence', NEW.issue_id)
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

-- One group's folder inside the print folder, named after the group and made with its first
-- artwork with consent, as an article's is (`print_articles`). `last_image_number` only grows.
CREATE TABLE print_groups (
  group_id INTEGER PRIMARY KEY REFERENCES artwork_groups (id) ON DELETE CASCADE,
  issue_id INTEGER NOT NULL REFERENCES issues (id),
  folder_id TEXT NOT NULL,
  last_image_number INTEGER NOT NULL DEFAULT 0 CHECK (last_image_number >= 0)
) STRICT;

CREATE INDEX print_groups_by_issue ON print_groups (issue_id);

-- One artwork's copy in its group's folder, `obr-NN` with the artwork's extension.
CREATE TABLE print_group_artworks (
  artwork_id INTEGER PRIMARY KEY REFERENCES artworks (id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES print_groups (group_id) ON DELETE CASCADE,
  copy_file_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK (name <> '')
) STRICT;

CREATE INDEX print_group_artworks_by_group ON print_group_artworks (group_id);

COMMIT;

PRAGMA foreign_keys = ON;
