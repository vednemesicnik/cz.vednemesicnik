DROP INDEX articles_by_doc;
ALTER TABLE articles DROP COLUMN proofread_by_name;
ALTER TABLE articles DROP COLUMN proofread_by_email;
ALTER TABLE articles DROP COLUMN proofread_at;
