-- What the comment digest of the issues made in the app (#170, `14d`) left between its runs: the
-- job `SCRIPT__Publication__Article_Comments` reads each article's Doc for comments, replies and
-- suggestions and mails the authors what is new, claims the articles through the app's API and
-- reports which ones it told every author of. The app keeps only how far that reached, never a
-- comment's text or who wrote it; the job keeps no state of its own.
--
-- Times are UTC instants as ISO 8601 text with milliseconds, as everywhere in the schema.

-- One article's digest. `reported_until` is the moment of the claim whose report confirmed an
-- e-mail to every author who had something new, so the next run reads what came after it; `NULL`
-- until a first such report, when the article's `created_at` stands in. `suggestion_hashes` is the
-- JSON array of the hashed IDs of the suggestions already told of, which a Doc keeps open with no
-- time of their own. `claim_key` and `claimed_at` are the run that holds the article and when it
-- took it, a lease another run waits out. The record does not show any of it, so no trigger marks
-- the record queue.
CREATE TABLE comment_digests (
  article_id INTEGER PRIMARY KEY REFERENCES articles (id) ON DELETE CASCADE,
  reported_until TEXT,
  suggestion_hashes TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(suggestion_hashes)),
  claim_key TEXT,
  claimed_at TEXT CHECK (claimed_at IS NULL OR claim_key IS NOT NULL)
) STRICT;
