-- An artwork group created by mistake can be removed (#154, `12f`): its folder goes to the shared
-- drive's bin and its row stays with `removed_at`, so its link answers as gone and every list,
-- count, claim and record leaves it out. An unsent upload of it carries the same time in
-- `artworks.removed_at`, so the sweep of unsent uploads leaves it alone.
--
-- Times are UTC instants as ISO 8601 text with milliseconds, as everywhere in the schema.

-- When an editor-in-chief removed the group. Set only on a group with no batch that is not
-- discarded.
ALTER TABLE artwork_groups ADD COLUMN removed_at TEXT;

-- A removed group's name is free again within its issue, as a removed issue's name is.
DROP INDEX artwork_groups_one_name_per_issue;
CREATE UNIQUE INDEX artwork_groups_one_name_per_issue ON artwork_groups (issue_id, name_key)
WHERE removed_at IS NULL;

-- Obrazová díla: a removed group leaves the Evidence on the queue's next pass, not with the
-- nightly rewrite.
DROP TRIGGER record_group;

CREATE TRIGGER record_group
AFTER UPDATE OF created_at, name, folder_id, licences_folder_id, removed_at ON artwork_groups
WHEN NEW.created_at IS NOT NULL AND
  (OLD.created_at IS NOT NEW.created_at OR OLD.name IS NOT NEW.name OR
   OLD.folder_id IS NOT NEW.folder_id OR OLD.licences_folder_id IS NOT NEW.licences_folder_id OR
   OLD.removed_at IS NOT NEW.removed_at)
BEGIN
  INSERT INTO record_marks (kind, issue_id) VALUES ('evidence', NEW.issue_id)
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;
