import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { PrismaClient } from '@generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const MIGRATIONS_DIRECTORY = join(process.cwd(), 'prisma', 'migrations')

// A migration is SQL statements, each ending a line with `;`, and comments.
const readStatements = (migration: string) =>
  readFileSync(join(MIGRATIONS_DIRECTORY, migration, 'migration.sql'), 'utf8')
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n')
    .split(/;\s*$/m)
    .map((statement) => statement.trim())
    .filter((statement) => statement !== '')

/**
 * A throwaway SQLite database with every migration applied, for a test that
 * must run a write the way the app's adapter runs it (a `where` comparing
 * dates, for one). Each call gets its own file in the system's temp directory.
 *
 * @returns The Prisma client and `cleanup`, which disconnects and deletes the
 *   file.
 */
export const createTestDatabase = async () => {
  const directory = mkdtempSync(join(tmpdir(), 'vdm-test-database-'))
  const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url: `file:${join(directory, 'test.db')}`,
    }),
  })

  const migrations = readdirSync(MIGRATIONS_DIRECTORY, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  for (const migration of migrations) {
    for (const statement of readStatements(migration)) {
      // A pragma may answer with a row, which an execute refuses.
      if (/^PRAGMA/i.test(statement)) {
        await prisma.$queryRawUnsafe(statement)
      } else {
        await prisma.$executeRawUnsafe(statement)
      }
    }
  }

  const cleanup = async () => {
    await prisma.$disconnect()
    rmSync(directory, { force: true, recursive: true })
  }

  return { cleanup, prisma }
}
