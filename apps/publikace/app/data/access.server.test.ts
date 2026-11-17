import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { now } from '../domain/time.ts'
import { createTestApp } from '../test-app.server.ts'

describe('access directory', () => {
  it('seeds the first administrator only while there is no named account', async () => {
    let app = await createTestApp()
    try {
      assert.equal(await app.directory.seedInitialAdmin('marie@priklad.cz', now()), true)
      assert.equal(await app.directory.seedInitialAdmin('jakub@priklad.cz', now()), false)

      let accounts = await app.directory.listAccounts()
      assert.deepEqual(
        accounts.map((account) => [account.email, account.isAdmin]),
        [['marie@priklad.cz', true]],
      )
    } finally {
      await app.close()
    }
  })

  it('lets only an administrator change the list, and refuses a duplicate', async () => {
    let app = await createTestApp()
    try {
      await app.directory.seedInitialAdmin('marie@priklad.cz', now())

      assert.deepEqual(
        await app.directory.addAccount('marie@priklad.cz', 'eva@priklad.cz', now()),
        { ok: true },
      )
      assert.deepEqual(
        await app.directory.addAccount('marie@priklad.cz', 'eva@priklad.cz', now()),
        {
          ok: false,
          reason: 'duplicate',
        },
      )
      assert.deepEqual(await app.directory.addAccount('eva@priklad.cz', 'jan@priklad.cz', now()), {
        ok: false,
        reason: 'not-admin',
      })
      assert.deepEqual(await app.directory.addGroup('eva@priklad.cz', 'vybor@priklad.cz', now()), {
        ok: false,
        reason: 'not-admin',
      })
    } finally {
      await app.close()
    }
  })

  it('keeps the last administrator and never lets anybody act on themselves', async () => {
    let app = await createTestApp()
    try {
      await app.directory.seedInitialAdmin('marie@priklad.cz', now())
      await app.directory.addAccount('marie@priklad.cz', 'jakub@priklad.cz', now())
      let [marie, jakub] = await app.directory.listAccounts()
      assert.ok(marie !== undefined && jakub !== undefined)

      assert.deepEqual(await app.directory.removeAccount('marie@priklad.cz', marie.id), {
        ok: false,
        reason: 'self',
      })
      assert.deepEqual(await app.directory.setAdmin('marie@priklad.cz', marie.id, false), {
        ok: false,
        reason: 'self',
      })

      assert.deepEqual(await app.directory.setAdmin('marie@priklad.cz', jakub.id, true), {
        ok: true,
      })
      // Jakub, now an administrator, takes Marie's role; Marie is then the one who is not.
      assert.deepEqual(await app.directory.setAdmin('jakub@priklad.cz', marie.id, false), {
        ok: true,
      })
      assert.deepEqual(await app.directory.setAdmin('marie@priklad.cz', jakub.id, false), {
        ok: false,
        reason: 'not-admin',
      })
      assert.deepEqual(await app.directory.removeAccount('jakub@priklad.cz', 999), {
        ok: false,
        reason: 'not-found',
      })
    } finally {
      await app.close()
    }
  })

  it('ends every session of a removed account in the same transaction', async () => {
    let app = await createTestApp()
    try {
      await app.directory.seedInitialAdmin('marie@priklad.cz', now())
      await app.directory.addAccount('marie@priklad.cz', 'eva@priklad.cz', now())
      await app.browser().signInAs('eva@priklad.cz')
      await app.browser().signInAs('eva@priklad.cz')
      await app.browser().signInAs('marie@priklad.cz')

      let eva = (await app.directory.listAccounts()).find(
        (account) => account.email === 'eva@priklad.cz',
      )
      assert.deepEqual(await app.directory.removeAccount('marie@priklad.cz', eva?.id ?? 0), {
        ok: true,
      })

      let left = await app.database.exec(sql`SELECT email FROM sessions ORDER BY email`)
      assert.deepEqual(left.rows, [{ email: 'marie@priklad.cz' }])
    } finally {
      await app.close()
    }
  })

  it('records a sign-in of a named account and ignores a group member', async () => {
    let app = await createTestApp()
    try {
      await app.directory.seedInitialAdmin('marie@priklad.cz', now())
      await app.directory.recordSignIn('marie@priklad.cz', 'Marie Horáková', now())
      await app.directory.recordSignIn('jan@priklad.cz', 'Jan Novák', now())

      let accounts = await app.directory.listAccounts()
      assert.equal(accounts.length, 1)
      assert.equal(accounts[0]?.displayName, 'Marie Horáková')
      assert.notEqual(accounts[0]?.lastSignedInAt, null)
    } finally {
      await app.close()
    }
  })
})
