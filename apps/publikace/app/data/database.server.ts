import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import type { Database } from 'remix/data-table'
import { loadMigrations } from 'remix/data-table/migrations/node'
import { createSqliteDatabase } from 'remix/data-table/sqlite'

/**
 * The same default `remix.json` gives `remix db`, so `pnpm db:status` and the running app
 * open one file unless `DATABASE_PATH` says otherwise. On Fly.io it is a path on the volume.
 */
export const DEFAULT_DATABASE_PATH = './db/publikace.sqlite'

export const MIGRATIONS_DIRECTORY = fileURLToPath(new URL('../../db/migrations', import.meta.url))

/** A database and the connection under it, which the app owns and closes. */
export type OpenDatabase = {
  close(): Promise<void>
  database: Database
}

/**
 * Opens the app's SQLite database.
 *
 * The connection is opened here rather than handed to `createSqliteDatabase` as a filename,
 * because its config sets `foreign_keys` but not the journal mode, and WAL is what lets the
 * background jobs' writes and the pages' reads overlap. A supplied connection gets none of the
 * config's settings, so all three are said here:
 *   - `foreign_keys`, because SQLite leaves it off and every reference in the schema is meant
 *     to hold,
 *   - `busy_timeout`, because `node:sqlite` defaults to 0 and a write that meets a lock would
 *     fail at once instead of waiting; 5 s is the value the config-backed database uses.
 */
export function openDatabase(path: string = databasePath()): OpenDatabase {
  let connection = new DatabaseSync(path)
  connection.exec('PRAGMA journal_mode = WAL')
  connection.exec('PRAGMA foreign_keys = ON')
  connection.exec('PRAGMA busy_timeout = 5000')

  let database = createSqliteDatabase(connection)

  return {
    async close() {
      // Closing the data-table database leaves a supplied connection open by design.
      await database.close()
      connection.close()
    },
    database,
  }
}

/**
 * Applies every pending migration in `db/migrations`, in id order, in one batch.
 *
 * Called by `server.ts` before it listens, so no request meets an old schema. The run also
 * creates the journal, which is what `remix db status` reads.
 */
export async function migrateDatabase(database: Database): Promise<void> {
  let migrations = await loadMigrations(MIGRATIONS_DIRECTORY)
  await database.migrate(migrations)
}

let shared: OpenDatabase | null = null

/**
 * The one database the process runs on, opened on first use.
 *
 * Memoised rather than module-level, so that importing this file — which a test may do only
 * to reach a function — does not open the database as a side effect.
 */
export function defaultDatabase(): OpenDatabase {
  shared ??= openDatabase()
  return shared
}

function databasePath(): string {
  let configured = process.env.DATABASE_PATH
  return configured === undefined || configured === '' ? DEFAULT_DATABASE_PATH : configured
}
