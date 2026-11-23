# Migrations

The schema of the app's SQLite database is the SQL in `db/migrations`, applied in order by
`remix/data-table`. Nothing else creates or changes a table; the runner adds only its own
journal.

## Where they live

Each migration is a directory `db/migrations/<id>_<name>/` with:

- `up.sql`, required: the change;
- `down.sql`, optional: what undoes it. Without one the migration cannot be rolled back. This
  repository writes one every time, undoing `up.sql` in reverse order.

The id is digits, here the 14 of `YYYYMMDDHHmmss` at the time the migration is written. Every
id in the directory must be unique and the same length, because migrations run in the order
their ids sort. The name is snake_case and says what the migration does:
`20261117120000_access_and_sessions`.

## Who runs them

**The app, before its first request.** `createPublikace` (`app/publikace.server.ts`) calls
`migrateDatabase` (`app/data/database.server.ts`), which loads the directory and applies every
pending migration in id order, as one batch, before it resolves, so no request meets an old
schema. One process on one machine is the whole deployment, which is what makes migrating at
startup safe. SQLite's DDL is transactional and each migration runs in its own transaction, so an
`up.sql` that fails leaves nothing of itself behind and the app does not start.

**`remix db`, by hand.** `remix.json` points it at the same directory and the same file
(`DATABASE_PATH`, `./db/publikace.sqlite` by default):

- `pnpm db:status` lists every migration as `applied`, `pending`, `drifted` (its `up.sql` no
  longer matches the journal) or `missing` (applied, but its directory is gone);
- `pnpm db:migrate` applies the pending ones without starting the app; `--to <id>_<name>` stops
  after that one;
- `pnpm db:rollback` runs `down.sql` of **the newest applied migration only**; `--step <n>`
  reverts more, `--to <id>_<name>` reverts back through that one, `--dry-run` shows what would
  run.

**The suite.** The tests open `:memory:` databases and migrate them the same way, so a
migration that does not run fails `pnpm test`.

## An applied migration is never edited

The journal, the table `data_table_migrations`, records each applied migration with a sha256 of
its `up.sql`. Before every run, both the app and `remix db` compare it with the files and refuse
the database when an applied `up.sql` has changed or an applied migration's directory is gone.
The app then does not start until the files match the journal again.

A change to the schema is therefore a new migration, never an edit of an old one. The one
exception is a migration that has not left its branch: roll it back locally with
`pnpm db:rollback`, edit it, migrate again. Once it is on `dev`, other databases have run it.

## Writing the SQL

- **Plain `CREATE TABLE` / `ALTER TABLE`**, without `IF NOT EXISTS`: the journal decides
  whether a migration has run, and a statement that quietly skips an existing table hides a
  journal that disagrees with the schema.
- **`STRICT` tables**, so a column holds only its declared type (`INTEGER`, `REAL`, `TEXT`,
  `BLOB`, `ANY`).
- **A boolean is `INTEGER NOT NULL` with `CHECK (x IN (0, 1))`**, named as a question
  (`is_admin`).
- **A time is UTC ISO 8601 text with milliseconds** (`2026-11-17T08:12:00.000Z`), always the
  same length, so comparing two as text orders them in time.
- **Foreign keys hold** because the app turns them on for its connection (`openDatabase` sets
  `PRAGMA foreign_keys = ON`) and `remix.json` sets `foreignKeys: true` for `remix db`. SQLite
  leaves them off otherwise, so a `REFERENCES` is enforced only by those two.

`db/migrations/20261117120000_access_and_sessions/up.sql` shows all of it but a foreign key,
with a comment above each table saying what a row is.
