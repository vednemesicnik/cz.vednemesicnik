import type { Database } from 'remix/data-table'
import { sql } from 'remix/data-table'

import { parseStamp, stamp } from '../domain/time.ts'

/**
 * The access list: named accounts and Google groups, in the app's database.
 *
 * The rules that keep the list usable hold **here**, not only in the screen that hides the
 * buttons: only an administrator changes the list, nobody removes or demotes themselves, and
 * the last administrator stays. Each write checks the one asking first, inside the same
 * transaction as the change, so a role taken away a moment earlier is already seen.
 */

export type AccessAccount = {
  addedAt: Temporal.Instant
  displayName: string | null
  email: string
  id: number
  isAdmin: boolean
  lastSignedInAt: Temporal.Instant | null
}

export type AccessGroup = {
  addedAt: Temporal.Instant
  email: string
  id: number
  /** The group's name in Google Workspace, as the membership service last gave it. */
  name: string | null
}

/** Why a change was not made. `not-admin` is the one the screen explains (`14b`). */
export type RefusedChange = 'duplicate' | 'last-admin' | 'not-admin' | 'not-found' | 'self'

export type ChangeResult = { ok: false; reason: RefusedChange } | { ok: true }

export type AccessDirectory = {
  addAccount(actor: string, email: string, when: Temporal.Instant): Promise<ChangeResult>
  addGroup(
    actor: string,
    email: string,
    name: string | null,
    when: Temporal.Instant,
  ): Promise<ChangeResult>
  findAccount(email: string): Promise<AccessAccount | null>
  listAccounts(): Promise<AccessAccount[]>
  listGroups(): Promise<AccessGroup[]>
  /**
   * Keeps a listed group's name up to date with the membership service. Only a name replaces
   * a name: an answer without one never erases it, and a group not in the list is left alone.
   */
  recordGroupName(email: string, name: string): Promise<void>
  /** Records a sign-in of a named account; does nothing for a member of a group. */
  recordSignIn(email: string, displayName: string, when: Temporal.Instant): Promise<void>
  /** Ends every session of the account in the same transaction. */
  removeAccount(actor: string, id: number): Promise<ChangeResult>
  removeGroup(actor: string, id: number): Promise<ChangeResult>
  /** Adds the first administrator when the list has no named account. Answers whether it did. */
  seedInitialAdmin(email: string, when: Temporal.Instant): Promise<boolean>
  setAdmin(actor: string, id: number, isAdmin: boolean): Promise<ChangeResult>
}

type Row = Record<string, unknown>

function toAccount(row: Row): AccessAccount {
  return {
    addedAt: parseStamp(row['added_at']) ?? Temporal.Instant.fromEpochMilliseconds(0),
    displayName: typeof row['display_name'] === 'string' ? row['display_name'] : null,
    email: String(row['email']),
    id: Number(row['id']),
    isAdmin: Number(row['is_admin']) === 1,
    lastSignedInAt: parseStamp(row['last_signed_in_at']),
  }
}

function toGroup(row: Row): AccessGroup {
  return {
    addedAt: parseStamp(row['added_at']) ?? Temporal.Instant.fromEpochMilliseconds(0),
    email: String(row['email']),
    id: Number(row['id']),
    name: typeof row['name'] === 'string' ? row['name'] : null,
  }
}

const REFUSED = (reason: RefusedChange): ChangeResult => ({ ok: false, reason })
const DONE: ChangeResult = { ok: true }

export function createAccessDirectory(database: Database): AccessDirectory {
  async function isAdmin(db: Database, email: string): Promise<boolean> {
    let result = await db.exec(sql`SELECT is_admin FROM access_accounts WHERE email = ${email}`)
    return Number(result.rows?.[0]?.['is_admin']) === 1
  }

  async function adminCount(db: Database): Promise<number> {
    let result = await db.exec(sql`SELECT COUNT(*) AS n FROM access_accounts WHERE is_admin = 1`)
    return Number(result.rows?.[0]?.['n'] ?? 0)
  }

  async function accountById(db: Database, id: number): Promise<AccessAccount | null> {
    let result = await db.exec(sql`SELECT * FROM access_accounts WHERE id = ${id}`)
    let row = result.rows?.[0]
    return row === undefined ? null : toAccount(row)
  }

  return {
    async addAccount(actor, email, when) {
      return database.transaction(async (db) => {
        if (!(await isAdmin(db, actor))) return REFUSED('not-admin')

        let existing = await db.exec(sql`SELECT 1 FROM access_accounts WHERE email = ${email}`)
        if ((existing.rows?.length ?? 0) > 0) return REFUSED('duplicate')

        await db.exec(
          sql`INSERT INTO access_accounts (email, added_at) VALUES (${email}, ${stamp(when)})`,
        )
        return DONE
      })
    },

    async addGroup(actor, email, name, when) {
      return database.transaction(async (db) => {
        if (!(await isAdmin(db, actor))) return REFUSED('not-admin')

        let existing = await db.exec(sql`SELECT 1 FROM access_groups WHERE email = ${email}`)
        if ((existing.rows?.length ?? 0) > 0) return REFUSED('duplicate')

        await db.exec(
          sql`INSERT INTO access_groups (email, name, added_at) VALUES (${email}, ${name}, ${stamp(when)})`,
        )
        return DONE
      })
    },

    async findAccount(email) {
      let result = await database.exec(sql`SELECT * FROM access_accounts WHERE email = ${email}`)
      let row = result.rows?.[0]
      return row === undefined ? null : toAccount(row)
    },

    async listAccounts() {
      let result = await database.exec(sql`SELECT * FROM access_accounts ORDER BY added_at, id`)
      return (result.rows ?? []).map(toAccount)
    },

    async listGroups() {
      let result = await database.exec(sql`SELECT * FROM access_groups ORDER BY added_at, id`)
      return (result.rows ?? []).map(toGroup)
    },

    async recordGroupName(email, name) {
      // `IS NOT` writes nothing when the name is unchanged, which is nearly every answer.
      await database.exec(
        sql`UPDATE access_groups SET name = ${name} WHERE email = ${email} AND name IS NOT ${name}`,
      )
    },

    async recordSignIn(email, displayName, when) {
      await database.exec(
        sql`UPDATE access_accounts SET display_name = ${displayName}, last_signed_in_at = ${stamp(when)} WHERE email = ${email}`,
      )
    },

    async removeAccount(actor, id) {
      return database.transaction(async (db) => {
        if (!(await isAdmin(db, actor))) return REFUSED('not-admin')

        let target = await accountById(db, id)
        if (target === null) return REFUSED('not-found')
        if (target.email === actor) return REFUSED('self')
        if (target.isAdmin && (await adminCount(db)) <= 1) return REFUSED('last-admin')

        await db.exec(sql`DELETE FROM access_accounts WHERE id = ${id}`)
        // `14b` promises the account is signed out of every device at once.
        await db.exec(sql`DELETE FROM sessions WHERE email = ${target.email}`)
        return DONE
      })
    },

    async removeGroup(actor, id) {
      return database.transaction(async (db) => {
        if (!(await isAdmin(db, actor))) return REFUSED('not-admin')

        let result = await db.exec(sql`DELETE FROM access_groups WHERE id = ${id}`)
        return (result.affectedRows ?? 0) > 0 ? DONE : REFUSED('not-found')
      })
    },

    async seedInitialAdmin(email, when) {
      return database.transaction(async (db) => {
        let result = await db.exec(sql`SELECT COUNT(*) AS n FROM access_accounts`)
        if (Number(result.rows?.[0]?.['n'] ?? 0) > 0) return false

        await db.exec(
          sql`INSERT INTO access_accounts (email, is_admin, added_at) VALUES (${email}, 1, ${stamp(when)})`,
        )
        return true
      })
    },

    async setAdmin(actor, id, makeAdmin) {
      return database.transaction(async (db) => {
        if (!(await isAdmin(db, actor))) return REFUSED('not-admin')

        let target = await accountById(db, id)
        if (target === null) return REFUSED('not-found')
        if (target.email === actor) return REFUSED('self')
        if (!makeAdmin && target.isAdmin && (await adminCount(db)) <= 1) {
          return REFUSED('last-admin')
        }

        await db.exec(
          sql`UPDATE access_accounts SET is_admin = ${makeAdmin ? 1 : 0} WHERE id = ${id}`,
        )
        return DONE
      })
    },
  }
}
