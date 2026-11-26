-- Issues (vydání), #21.
--
-- A row is written before anything exists on Drive, and each folder's ID is stored the moment
-- Drive returns it, so an issue that Drive stopped halfway knows what it already has (`1jv85zum`).
-- `completed_at` empty is _Nedokončené_ (`01c`); `closed_at` set is _Uzavřené_. `name` is kept as
-- typed, trimmed, and is also the issue folder's name on Drive; `name_key` is that name
-- lower-cased, the only thing a duplicate is judged by, so the check covers issues in the app and
-- never the ones from before it (`03`, row 24). The editor who started it is kept by address and
-- by the name the detail shows, because a member of a group has no row in `access_accounts`.
CREATE TABLE issues (
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
  CHECK (
    completed_at IS NULL
    OR (folder_id IS NOT NULL AND articles_folder_id IS NOT NULL AND print_folder_id IS NOT NULL)
  ),
  CHECK (name <> '' AND name_key <> ''),
  CHECK (closed_at IS NULL OR completed_at IS NOT NULL)
) STRICT;
