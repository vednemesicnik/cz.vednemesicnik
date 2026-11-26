-- Who may sign in, and the sign-ins themselves (#8).
--
-- Times are UTC instants as ISO 8601 text with milliseconds (`2026-11-17T08:12:00.000Z`), always
-- the same length, so comparing them as text orders them in time.

-- Named accounts. The address is stored lower-cased; the name comes from Google at the first
-- sign-in, so an account added by an administrator has none until then. An administrator is
-- always a named account: a group never carries the flag.
CREATE TABLE access_accounts (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  is_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1)),
  added_at TEXT NOT NULL,
  last_signed_in_at TEXT
) STRICT;

-- Google groups whose members may sign in. Shown by their address: the membership service
-- answers about members and never names a group.
CREATE TABLE access_groups (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  added_at TEXT NOT NULL
) STRICT;

-- One row per browser session. `email` is the signed-in person's address rather than a key of
-- `access_accounts`, because a member of a group has no row there; it is empty for the session
-- the sign-in page holds before anybody signs in. `expires_at` is set once, when the row is
-- written: a sign-in lasts seven days from the moment it happened, whatever happens after.
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  email TEXT,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
) STRICT;

CREATE INDEX sessions_email ON sessions (email);
CREATE INDEX sessions_expires_at ON sessions (expires_at);
