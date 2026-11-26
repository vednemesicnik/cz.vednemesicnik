-- The account the app acts as on Drive, publikace.app@ (#18).
--
-- At most one row. No row: the account was never connected. `disconnected_at` set: Google stopped
-- accepting the token, and it stays so until somebody connects the account again.
-- `refresh_token` is AES-256-GCM ciphertext under `DRIVE_TOKEN_KEY`, never the token itself, so a
-- copy of the database does not carry a live credential to the shared drive. `connected_by` is the
-- address of the editor-in-chief who connected it.
CREATE TABLE drive_account (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  email TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  connected_at TEXT NOT NULL,
  connected_by TEXT NOT NULL,
  disconnected_at TEXT
) STRICT;
