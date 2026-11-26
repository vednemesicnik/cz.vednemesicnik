-- The artworks sent through an article's link and the e-mails the public pages start (#29).
--
-- Times are UTC instants as ISO 8601 text with milliseconds, as everywhere in the schema.

-- One send of the form _Nahrání obrazových děl_ (`21a`): one provider, one consent request.
--
-- The row is written before Drive is asked for the licences, and each licence's IDs the moment
-- Drive returns them, so a failed attempt knows what to put in the bin (`11c`). `created_at` set
-- is the batch; without it the row is an attempt still running, or one whose cleanup failed
-- (`cleanup_at`). `tag` is the `[YYYYMMDDTHHMMSS]` the subject ends with, which the reply check
-- pairs replies by. `mail_sent_at` is the Mailer having accepted the request; without it the batch
-- is _Chyba_ (`01b`), with `mail_refused_at` set when the Mailer refused it for good.
-- `discarded_at` set means the editors-in-chief discarded it: it stays as a record, so a reply the
-- check pairs with it later still has somewhere to land.
CREATE TABLE artwork_batches (
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
  CHECK (created_at IS NULL OR cleanup_at IS NULL),
  CHECK (discarded_at IS NULL OR created_at IS NOT NULL)
) STRICT;

CREATE UNIQUE INDEX artwork_batches_one_tag_per_article ON artwork_batches (article_id, tag);
CREATE INDEX artwork_batches_by_link ON artwork_batches (link_id, started_at);
CREATE INDEX artwork_batches_by_issue ON artwork_batches (issue_id, created_at);

-- One file uploaded through the link, sent or not.
--
-- A file is stored on Drive the moment it is chosen (`21a`), tagged with `upload_key`, and belongs
-- to the page that uploaded it (`form_key`) until a batch takes it. `removed_at` is a file the
-- provider removed or that waited 24 hours unsent: it went to the bin and no longer counts as an
-- upload in waiting. `is_readable` is 0 for a file the server could not recognise as an image of
-- an allowed type (`21b`, _Zpracování selhalo_).
CREATE TABLE artworks (
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

CREATE INDEX artworks_by_link ON artworks (link_id, uploaded_at);
CREATE INDEX artworks_by_form ON artworks (form_key);
CREATE INDEX artworks_by_batch ON artworks (batch_id, position);

-- Every e-mail a public page started or an editor resent, for the daily cap (`02a`, _Ochrana_):
-- the welcome e-mails of a new article and the consent requests. One row per recipient.
CREATE TABLE public_mail_log (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('welcome', 'consent')),
  sent_at TEXT NOT NULL
) STRICT;

CREATE INDEX public_mail_log_by_time ON public_mail_log (sent_at);
