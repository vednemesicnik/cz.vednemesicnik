-- The links for the newsroom and the articles created through them (#24).
--
-- Times are UTC instants as ISO 8601 text with milliseconds, as everywhere in the schema.

-- A shared link (`02a`): a key of 12 random characters that names no folder and no issue, and
-- can do one thing in one issue. `article` creates an article in the issue and there is one
-- valid per issue; `artworks` uploads artworks to one article and comes into being with it.
-- `revoked_at` set means _Vydat nový odkaz_ replaced it, and it answers `02e` from then on.
CREATE TABLE links (
  id INTEGER PRIMARY KEY,
  key TEXT NOT NULL UNIQUE CHECK (length(key) = 12),
  kind TEXT NOT NULL CHECK (kind IN ('article', 'artworks')),
  issue_id INTEGER NOT NULL REFERENCES issues (id),
  article_id INTEGER REFERENCES articles (id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  revoked_at TEXT,
  CHECK ((kind = 'article') = (article_id IS NULL))
) STRICT;

CREATE UNIQUE INDEX links_one_valid_article_link ON links (issue_id)
WHERE kind = 'article' AND revoked_at IS NULL;

-- One attempt at creating an article, and the article once it succeeded.
--
-- The row is written before Drive is asked for anything, and each file's ID the moment Drive
-- returns it, so a failed attempt knows exactly what to put in the bin, even after a crash.
-- `created_at` set is the article: the only kind of row a screen shows or counts. Without it the
-- row is an attempt still running, or one whose cleanup failed (`cleanup_at`) and is retried.
-- `form_key` is the one-time key of the form, which turns a double submit into the same answer.
CREATE TABLE articles (
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
  CHECK (
    created_at IS NULL
    OR (folder_id IS NOT NULL AND doc_id IS NOT NULL AND meta_file_id IS NOT NULL)
  ),
  CHECK (created_at IS NULL OR cleanup_at IS NULL)
) STRICT;

CREATE INDEX articles_by_link ON articles (link_id, started_at);
CREATE INDEX articles_by_issue ON articles (issue_id, created_at);

-- The authors of an article, in the order the form gave them. The name is also the signature,
-- as in the script. The welcome e-mail is recorded per author: sent means the Mailer accepted it.
CREATE TABLE article_authors (
  article_id INTEGER NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 1),
  name TEXT NOT NULL CHECK (name <> ''),
  email TEXT NOT NULL CHECK (email <> ''),
  welcome_sent_at TEXT,
  welcome_failed_at TEXT,
  PRIMARY KEY (article_id, position)
) STRICT;

-- Every issue already complete gets its link. The key is drawn here with SQLite's `random()`,
-- which is enough for the development databases this ever runs on; the app draws every later key
-- from `crypto.getRandomValues`.
INSERT INTO links (key, kind, issue_id, created_at)
SELECT
  substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1)
  || substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1)
  || substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1)
  || substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1)
  || substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1)
  || substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1)
  || substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1)
  || substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1)
  || substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1)
  || substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1)
  || substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1)
  || substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1),
  'article',
  id,
  completed_at
FROM issues
WHERE completed_at IS NOT NULL AND closed_at IS NULL;
