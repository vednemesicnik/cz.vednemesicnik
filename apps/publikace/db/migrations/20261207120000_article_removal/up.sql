-- An article created by mistake can be removed (#153, `12z`): its folder goes to the shared
-- drive's bin and its row stays with `removed_at`, so its artworks link answers as gone and every
-- list, count, queue, digest and record leaves it out. An unsent upload of it carries the same
-- time in `artworks.removed_at`, so the sweep of unsent uploads leaves it alone.
--
-- Times are UTC instants as ISO 8601 text with milliseconds, as everywhere in the schema.

-- When an editor-in-chief removed the article. Set only on _Píše se_ or _Dopsáno_ with no batch
-- that is not discarded.
ALTER TABLE articles ADD COLUMN removed_at TEXT;

-- Články: a removed article leaves the Evidence on the queue's next pass, not with the nightly
-- rewrite.
DROP TRIGGER record_article;

CREATE TRIGGER record_article
AFTER UPDATE OF name, created_at, doc_id, folder_id, licences_folder_id, handed_over_at,
  handover_cancelled_at, proofread_at, proofread_by_email, proofread_by_name,
  proofreading_cancelled_at, removed_at
ON articles
WHEN NEW.created_at IS NOT NULL AND
  (OLD.name IS NOT NEW.name OR OLD.created_at IS NOT NEW.created_at OR
   OLD.doc_id IS NOT NEW.doc_id OR OLD.folder_id IS NOT NEW.folder_id OR
   OLD.licences_folder_id IS NOT NEW.licences_folder_id OR
   OLD.handed_over_at IS NOT NEW.handed_over_at OR
   OLD.handover_cancelled_at IS NOT NEW.handover_cancelled_at OR
   OLD.proofread_at IS NOT NEW.proofread_at OR
   OLD.proofread_by_email IS NOT NEW.proofread_by_email OR
   OLD.proofread_by_name IS NOT NEW.proofread_by_name OR
   OLD.proofreading_cancelled_at IS NOT NEW.proofreading_cancelled_at OR
   OLD.removed_at IS NOT NEW.removed_at)
BEGIN
  INSERT INTO record_marks (kind, issue_id) VALUES ('evidence', NEW.issue_id)
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;
