DROP TRIGGER record_article;

CREATE TRIGGER record_article
AFTER UPDATE OF name, created_at, doc_id, folder_id, licences_folder_id, handed_over_at,
  handover_cancelled_at, proofread_at, proofread_by_email, proofread_by_name,
  proofreading_cancelled_at
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
   OLD.proofreading_cancelled_at IS NOT NEW.proofreading_cancelled_at)
BEGIN
  INSERT INTO record_marks (kind, issue_id) VALUES ('evidence', NEW.issue_id)
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

ALTER TABLE articles DROP COLUMN removed_at;
