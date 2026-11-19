-- What the reply check reports about a batch's consent request, what the editors-in-chief decide
-- about it in Ke kontrole, and the runs of the background jobs (#31).
--
-- Times are UTC instants as ISO 8601 text with milliseconds, as everywhere in the schema.

-- The provider's latest reply as the reply check last read it: the Gmail thread and message, the
-- moment it arrived, and its own text, cut of the quote and the signature. `is_exact_consent` is 1
-- when that text is exactly „Souhlasím“. The text is kept only while the batch waits on somebody
-- and is cleared once the conversation is archived, because the PDF in the article's `Licence`
-- then holds it (`13a`, r1oqllvb).
ALTER TABLE artwork_batches ADD COLUMN reply_thread_id TEXT;
ALTER TABLE artwork_batches ADD COLUMN reply_message_id TEXT;
ALTER TABLE artwork_batches ADD COLUMN reply_received_at TEXT;
ALTER TABLE artwork_batches ADD COLUMN reply_text TEXT;
ALTER TABLE artwork_batches ADD COLUMN is_exact_consent INTEGER NOT NULL DEFAULT 0
  CHECK (is_exact_consent IN (0, 1));
ALTER TABLE artwork_batches ADD COLUMN checked_at TEXT;

-- The run of the reply check that took the batch, and when. A batch claimed in the last ten
-- minutes is not handed out again, and a report counts only under the key of the run that
-- claimed it.
ALTER TABLE artwork_batches ADD COLUMN claim_key TEXT;
ALTER TABLE artwork_batches ADD COLUMN claimed_at TEXT;

-- _Je to souhlas_ (`13b`): who decided and when. Cleared by _Vrátit_ until the job archives.
ALTER TABLE artwork_batches ADD COLUMN consent_verified_at TEXT;
ALTER TABLE artwork_batches ADD COLUMN consent_verified_by_email TEXT
  CHECK ((consent_verified_at IS NULL) = (consent_verified_by_email IS NULL));
ALTER TABLE artwork_batches ADD COLUMN consent_verified_by_name TEXT;

-- _Schváleno_: the job archived the conversation as a PDF in the article's `Licence`, this file.
ALTER TABLE artwork_batches ADD COLUMN approved_at TEXT;
ALTER TABLE artwork_batches ADD COLUMN consent_file_id TEXT
  CHECK ((approved_at IS NULL) = (consent_file_id IS NULL));

-- The archive failed on the last try (`13c`), with the job's technical text. Cleared by the
-- archive that succeeds.
ALTER TABLE artwork_batches ADD COLUMN archive_failed_at TEXT;
ALTER TABLE artwork_batches ADD COLUMN archive_error TEXT;

CREATE INDEX artwork_batches_by_claim ON artwork_batches (claim_key);

-- One run of a background job, as the job reports it: it opens a run with the interval of its
-- trigger and closes it with the outcome. The app estimates the next run from the last start and
-- that interval, and calls a job that missed two runs _Neběží_ (`14d`, 1jv85zum). `run_key` is
-- what the job's later calls in the same run carry.
CREATE TABLE job_runs (
  id INTEGER PRIMARY KEY,
  job TEXT NOT NULL CHECK (job <> ''),
  run_key TEXT NOT NULL UNIQUE,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  interval_minutes INTEGER NOT NULL CHECK (interval_minutes > 0),
  outcome TEXT CHECK (outcome IS NULL OR outcome IN ('ok', 'failed')),
  error_text TEXT,
  CHECK ((finished_at IS NULL) = (outcome IS NULL))
) STRICT;

CREATE INDEX job_runs_by_job ON job_runs (job, started_at);
