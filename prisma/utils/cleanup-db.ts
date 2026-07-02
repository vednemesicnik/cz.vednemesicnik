// noinspection SqlResolve

import type { PrismaClient } from '@generated/prisma/client'

export async function cleanupDb(prisma: PrismaClient) {
  // noinspection SqlNoDataSourceInspection
  const tables = await prisma.$queryRaw<
    { name: string }[]
  >`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_migrations';`

  // SQLite ignores `PRAGMA foreign_keys` inside a transaction, so the toggle must
  // happen outside the `$transaction` below — otherwise FK enforcement stays on and
  // deleting tables in an arbitrary order violates relations. It is connection-level
  // and persists across queries on the single better-sqlite3 connection.
  await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = OFF`)
  try {
    await prisma.$transaction(
      // Delete all rows from each table, preserving table structures
      tables.map(({ name }) =>
        prisma.$executeRawUnsafe(`DELETE from "${name}"`),
      ),
    )
  } finally {
    await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = ON`)
  }
}
