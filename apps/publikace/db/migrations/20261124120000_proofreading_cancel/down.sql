CREATE INDEX articles_by_doc ON articles (doc_id);
ALTER TABLE articles DROP COLUMN proofreading_cancelled_at;
