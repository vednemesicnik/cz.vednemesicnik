-- data-table/transaction: none
--
-- An issue can be removed (#151, `12w`): its folder goes to the shared drive's bin and its row
-- stays with `removed_at`, so its links answer as gone and the record forgets it. Its name is free
-- again, so `name_key` is unique only among the issues not removed: a partial unique index, which
-- SQLite cannot put in place of a column's `UNIQUE`. `issues` is therefore rebuilt as
-- `20261203120000_artwork_groups` rebuilds `links`: a new table, every row copied, the old one
-- dropped, the new one renamed, its triggers made again. The runner's transaction is off because
-- `PRAGMA foreign_keys` changes nothing inside one, and the script keeps its own.
--
-- Times are UTC instants as ISO 8601 text with milliseconds, as everywhere in the schema.

PRAGMA foreign_keys = OFF;

BEGIN;

CREATE TABLE issues_new (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  name_key TEXT NOT NULL,
  started_at TEXT NOT NULL,
  started_by_email TEXT NOT NULL,
  started_by_name TEXT NOT NULL,
  folder_id TEXT,
  articles_folder_id TEXT,
  print_folder_id TEXT,
  completed_at TEXT,
  closed_at TEXT,
  evidence_spreadsheet_id TEXT,
  groups_folder_id TEXT,
  folder_missing_at TEXT,
  articles_folder_missing_at TEXT,
  -- When an editor-in-chief removed the issue. Set only while it has no article and no group.
  removed_at TEXT,
  CHECK (
    completed_at IS NULL
    OR (folder_id IS NOT NULL AND articles_folder_id IS NOT NULL AND print_folder_id IS NOT NULL)
  ),
  CHECK (name <> '' AND name_key <> ''),
  CHECK (closed_at IS NULL OR completed_at IS NOT NULL)
) STRICT;

INSERT INTO issues_new (id, name, name_key, started_at, started_by_email, started_by_name,
  folder_id, articles_folder_id, print_folder_id, completed_at, closed_at,
  evidence_spreadsheet_id, groups_folder_id, folder_missing_at, articles_folder_missing_at)
SELECT id, name, name_key, started_at, started_by_email, started_by_name,
  folder_id, articles_folder_id, print_folder_id, completed_at, closed_at,
  evidence_spreadsheet_id, groups_folder_id, folder_missing_at, articles_folder_missing_at
FROM issues;

DROP TABLE issues;
ALTER TABLE issues_new RENAME TO issues;

-- Two issues may not share a name, whatever its case, while neither is removed (`11d`).
CREATE UNIQUE INDEX issues_by_name_key ON issues (name_key) WHERE removed_at IS NULL;

CREATE TRIGGER record_issue_evidence
AFTER UPDATE OF completed_at ON issues
WHEN NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL
BEGIN
  INSERT INTO record_marks (kind, issue_id) VALUES ('evidence', NEW.id)
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

-- A removed issue leaves the Registr on the queue's next pass, not with the nightly rewrite.
CREATE TRIGGER record_issue_registry
AFTER UPDATE OF name, folder_id, completed_at, closed_at, evidence_spreadsheet_id, started_at,
  removed_at
ON issues
WHEN NEW.completed_at IS NOT NULL AND
  (OLD.name IS NOT NEW.name OR OLD.folder_id IS NOT NEW.folder_id OR
   OLD.completed_at IS NOT NEW.completed_at OR OLD.closed_at IS NOT NEW.closed_at OR
   OLD.evidence_spreadsheet_id IS NOT NEW.evidence_spreadsheet_id OR
   OLD.started_at IS NOT NEW.started_at OR OLD.removed_at IS NOT NEW.removed_at)
BEGIN
  INSERT INTO record_marks (kind, issue_id) VALUES ('registry', 0)
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

COMMIT;

PRAGMA foreign_keys = ON;
