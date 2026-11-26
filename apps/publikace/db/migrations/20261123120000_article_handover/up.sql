-- _Dopsáno_: the editors-in-chief hand an article over to proofreading in the issue detail, and
-- one digest a morning tells the proofreaders what is theirs to take (#14).
--
-- Times are UTC instants as ISO 8601 text with milliseconds, as everywhere in the schema.

-- The latest handover: when, and the editor-in-chief who clicked, by the address of their
-- sign-in and the name Google gave it. The time and the address are set together. A cancelled
-- handover keeps them, so that _Vrátit_ brings back the very handover it was, the original time
-- included (`12l`); `handover_cancelled_at` is what makes it cancelled.
ALTER TABLE articles ADD COLUMN handed_over_at TEXT;
ALTER TABLE articles ADD COLUMN handed_over_by_email TEXT
  CHECK ((handed_over_at IS NULL) = (handed_over_by_email IS NULL));
ALTER TABLE articles ADD COLUMN handed_over_by_name TEXT
  CHECK (handed_over_by_name IS NULL OR handed_over_by_email IS NOT NULL);
ALTER TABLE articles ADD COLUMN handover_cancelled_at TEXT
  CHECK (handover_cancelled_at IS NULL OR handed_over_at IS NOT NULL);

-- When the digest the Mailer confirmed last told the proofreaders of a handover of this article.
-- Older than `handed_over_at`, the current handover is new to them; set beside a cancellation,
-- they still believe the article is theirs and the next digest says it is not. Cleared once a
-- confirmed digest has said so (`12n`).
ALTER TABLE articles ADD COLUMN handover_announced_at TEXT;

-- The proofreaders' address (`14a`, `14f`): one row, set once and then only changed, by an
-- administrator. The morning digest goes to it.
CREATE TABLE proofreaders (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  email TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  changed_by_email TEXT NOT NULL
) STRICT;

-- What a run reported beyond its outcome, as JSON in the job's own shape: the digest's counts,
-- or why it did not go (`14e`). `NULL` for a job that reports nothing more.
ALTER TABLE job_runs ADD COLUMN summary TEXT;
