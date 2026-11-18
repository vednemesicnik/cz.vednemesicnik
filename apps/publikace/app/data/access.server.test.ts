import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { now } from '../domain/time.ts'
import { createTestApp } from '../test-app.server.ts'

describe('access directory', () => {
  it('seeds the first administrator only while there is no named account', async () => {
    let app = await createTestApp()
    try {
      assert.equal(await app.directory.seedInitialAdmin('marie@vednemesicnik.test', now()), true)
      assert.equal(await app.directory.seedInitialAdmin('jakub@vednemesicnik.test', now()), false)

      let accounts = await app.directory.listAccounts()
      assert.deepEqual(
        accounts.map((account) => [account.email, account.isAdmin]),
        [['marie@vednemesicnik.test', true]],
      )
    } finally {
      await app.close()
    }
  })

  it('lets only an administrator change the list, and refuses a duplicate', async () => {
    let app = await createTestApp()
    try {
      await app.directory.seedInitialAdmin('marie@vednemesicnik.test', now())

      assert.deepEqual(
        await app.directory.addAccount('marie@vednemesicnik.test', 'eva@vednemesicnik.test', now()),
        { ok: true },
      )
      assert.deepEqual(
        await app.directory.addAccount('marie@vednemesicnik.test', 'eva@vednemesicnik.test', now()),
        {
          ok: false,
          reason: 'duplicate',
        },
      )
      assert.deepEqual(
        await app.directory.addAccount('eva@vednemesicnik.test', 'jan@vednemesicnik.test', now()),
        {
          ok: false,
          reason: 'not-admin',
        },
      )
      assert.deepEqual(
        await app.directory.addGroup('eva@vednemesicnik.test', 'vybor@vednemesicnik.test', now()),
        {
          ok: false,
          reason: 'not-admin',
        },
      )
    } finally {
      await app.close()
    }
  })

  it('keeps the last administrator and never lets anybody act on themselves', async () => {
    let app = await createTestApp()
    try {
      await app.directory.seedInitialAdmin('marie@vednemesicnik.test', now())
      await app.directory.addAccount('marie@vednemesicnik.test', 'jakub@vednemesicnik.test', now())
      let [marie, jakub] = await app.directory.listAccounts()
      assert.ok(marie !== undefined && jakub !== undefined)

      assert.deepEqual(await app.directory.removeAccount('marie@vednemesicnik.test', marie.id), {
        ok: false,
        reason: 'self',
      })
      assert.deepEqual(await app.directory.setAdmin('marie@vednemesicnik.test', marie.id, false), {
        ok: false,
        reason: 'self',
      })

      assert.deepEqual(await app.directory.setAdmin('marie@vednemesicnik.test', jakub.id, true), {
        ok: true,
      })
      // Jakub, now an administrator, takes Marie's role; Marie is then the one who is not.
      assert.deepEqual(await app.directory.setAdmin('jakub@vednemesicnik.test', marie.id, false), {
        ok: true,
      })
      assert.deepEqual(await app.directory.setAdmin('marie@vednemesicnik.test', jakub.id, false), {
        ok: false,
        reason: 'not-admin',
      })
      assert.deepEqual(await app.directory.removeAccount('jakub@vednemesicnik.test', 999), {
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
      await app.directory.seedInitialAdmin('marie@vednemesicnik.test', now())
      await app.directory.addAccount('marie@vednemesicnik.test', 'eva@vednemesicnik.test', now())
      await app.browser().signInAs('eva@vednemesicnik.test')
      await app.browser().signInAs('eva@vednemesicnik.test')
      await app.browser().signInAs('marie@vednemesicnik.test')

      let eva = (await app.directory.listAccounts()).find(
        (account) => account.email === 'eva@vednemesicnik.test',
      )
      assert.deepEqual(
        await app.directory.removeAccount('marie@vednemesicnik.test', eva?.id ?? 0),
        {
          ok: true,
        },
      )

      let left = await app.database.exec(sql`SELECT email FROM sessions ORDER BY email`)
      assert.deepEqual(left.rows, [{ email: 'marie@vednemesicnik.test' }])
    } finally {
      await app.close()
    }
  })

  it('records a sign-in of a named account and ignores a group member', async () => {
    let app = await createTestApp()
    try {
      await app.directory.seedInitialAdmin('marie@vednemesicnik.test', now())
      await app.directory.recordSignIn('marie@vednemesicnik.test', 'Marie Horáková', now())
      await app.directory.recordSignIn('jan@vednemesicnik.test', 'Jan Novák', now())

      let accounts = await app.directory.listAccounts()
      assert.equal(accounts.length, 1)
      assert.equal(accounts[0]?.displayName, 'Marie Horáková')
      assert.notEqual(accounts[0]?.lastSignedInAt, null)
    } finally {
      await app.close()
    }
  })
})
