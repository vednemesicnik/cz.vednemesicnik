DROP TRIGGER record_group;

CREATE TRIGGER record_group
AFTER UPDATE OF created_at, name, folder_id, licences_folder_id ON artwork_groups
WHEN NEW.created_at IS NOT NULL AND
  (OLD.created_at IS NOT NEW.created_at OR OLD.name IS NOT NEW.name OR
   OLD.folder_id IS NOT NEW.folder_id OR OLD.licences_folder_id IS NOT NEW.licences_folder_id)
BEGIN
  INSERT INTO record_marks (kind, issue_id) VALUES ('evidence', NEW.issue_id)
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

DROP INDEX artwork_groups_one_name_per_issue;
CREATE UNIQUE INDEX artwork_groups_one_name_per_issue ON artwork_groups (issue_id, name_key);

ALTER TABLE artwork_groups DROP COLUMN removed_at;
