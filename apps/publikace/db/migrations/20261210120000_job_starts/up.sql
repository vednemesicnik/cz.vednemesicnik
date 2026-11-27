-- A background job started by hand from `/settings/jobs` (#1083, `14d`, `14e`). The app records
-- who asked and sends the job's `doPost` a one-time `start_key`; the job's own claim carries the
-- key back, and the run it opens is then that start's `run_key`. A request the script did not
-- accept is `failed_at`. A key opens one run at most, and only of its own job.
--
-- Times are UTC instants as ISO 8601 text with milliseconds, as everywhere in the schema.
CREATE TABLE job_starts (
  id INTEGER PRIMARY KEY,
  job TEXT NOT NULL CHECK (job <> ''),
  start_key TEXT NOT NULL UNIQUE,
  requested_by_email TEXT NOT NULL,
  requested_by_name TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  failed_at TEXT,
  run_key TEXT UNIQUE
) STRICT;

CREATE INDEX job_starts_by_job ON job_starts (job, requested_at);
