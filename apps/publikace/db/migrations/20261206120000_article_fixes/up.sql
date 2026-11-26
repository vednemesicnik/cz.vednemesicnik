-- An article's name and authors can be corrected (#152, `12x`, `12y`).
--
-- Times are UTC instants as ISO 8601 text with milliseconds, as everywhere in the schema.

-- Autoři: an author removed from an article leaves the Evidence at once, as one added or changed
-- does, rather than at the nightly rewrite.
CREATE TRIGGER record_author_deleted
AFTER DELETE ON article_authors
WHEN (SELECT created_at FROM articles WHERE id = OLD.article_id) IS NOT NULL
BEGIN
  INSERT INTO record_marks (kind, issue_id)
  VALUES ('evidence', (SELECT issue_id FROM articles WHERE id = OLD.article_id))
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

-- The name of the article or group the batch's consent request was last sent under, written
-- before each sending. The reply check looks for it in the subject, so a reply to a request sent
-- before a rename is still found. `NULL` on a batch sent before this column: the holder's name
-- stands for it, as no holder could be renamed then.
ALTER TABLE artwork_batches ADD COLUMN sent_holder_name TEXT;
