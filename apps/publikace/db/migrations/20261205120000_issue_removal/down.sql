-- data-table/transaction: none
--
-- Puts `issues` back with `name_key` unique among every issue and without `removed_at`. It fails
-- on a database where a removed issue and a live one share a name, which is right: the old
-- schema cannot hold both.

PRAGMA foreign_keys = OFF;

BEGIN;

CREATE TABLE issues_old (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  name_key TEXT NOT NULL UNIQUE,
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
  CHECK (
    completed_at IS NULL
    OR (folder_id IS NOT NULL AND articles_folder_id IS NOT NULL AND print_folder_id IS NOT NULL)
  ),
  CHECK (name <> '' AND name_key <> ''),
  CHECK (closed_at IS NULL OR completed_at IS NOT NULL)
) STRICT;

INSERT INTO issues_old (id, name, name_key, started_at, started_by_email, started_by_name,
  folder_id, articles_folder_id, print_folder_id, completed_at, closed_at,
  evidence_spreadsheet_id, groups_folder_id, folder_missing_at, articles_folder_missing_at)
SELECT id, name, name_key, started_at, started_by_email, started_by_name,
  folder_id, articles_folder_id, print_folder_id, completed_at, closed_at,
  evidence_spreadsheet_id, groups_folder_id, folder_missing_at, articles_folder_missing_at
FROM issues;

DROP TABLE issues;
ALTER TABLE issues_old RENAME TO issues;

CREATE TRIGGER record_issue_evidence
AFTER UPDATE OF completed_at ON issues
WHEN NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL
BEGIN
  INSERT INTO record_marks (kind, issue_id) VALUES ('evidence', NEW.id)
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

CREATE TRIGGER record_issue_registry
AFTER UPDATE OF name, folder_id, completed_at, closed_at, evidence_spreadsheet_id, started_at
ON issues
WHEN NEW.completed_at IS NOT NULL AND
  (OLD.name IS NOT NEW.name OR OLD.folder_id IS NOT NEW.folder_id OR
   OLD.completed_at IS NOT NEW.completed_at OR OLD.closed_at IS NOT NEW.closed_at OR
   OLD.evidence_spreadsheet_id IS NOT NEW.evidence_spreadsheet_id OR
   OLD.started_at IS NOT NEW.started_at)
BEGIN
  INSERT INTO record_marks (kind, issue_id) VALUES ('registry', 0)
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

COMMIT;

PRAGMA foreign_keys = ON;
