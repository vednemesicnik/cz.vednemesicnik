ALTER TABLE job_runs DROP COLUMN summary;
DROP TABLE proofreaders;
ALTER TABLE articles DROP COLUMN handover_announced_at;
ALTER TABLE articles DROP COLUMN handover_cancelled_at;
ALTER TABLE articles DROP COLUMN handed_over_by_name;
ALTER TABLE articles DROP COLUMN handed_over_by_email;
ALTER TABLE articles DROP COLUMN handed_over_at;
