import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import type { Environment } from './auth/environment.server.ts'
import { createPublikace } from './publikace.server.ts'

/** Every variable production requires, fictional, and none of the optional ones. */
function productionEnvironment(databasePath: string): Record<string, string> {
  return {
    APP_ORIGIN: 'https://publikace.vednemesicnik.test',
    ARTICLE_TEMPLATE_DOCUMENT_ID: 'fake-article-template',
    AUTHORIZED_DOMAIN: 'vednemesicnik.test',
    DATABASE_PATH: databasePath,
    DRIVE_ACCOUNT_EMAIL: 'publikace.app@vednemesicnik.test',
    DRIVE_TOKEN_KEY: Buffer.alloc(32, 5).toString('base64'),
    GAS_GROUP_MEMBERSHIP_SECRET: 'fake-membership-secret',
    GAS_GROUP_MEMBERSHIP_URL: 'https://membership.vednemesicnik.test/exec',
    GOOGLE_CLIENT_ID: 'fake-client',
    GOOGLE_CLIENT_SECRET: 'fake-secret',
    ISSUES_FOLDER_ID: 'fake-issues-folder',
    MAIL_SEND_SECRET: 'fake-mail-secret',
    MAIL_SEND_URL: 'https://mailer.vednemesicnik.test/exec',
    NODE_ENV: 'production',
    SCRIPT_JOB_ACCOUNT: 'publikace.app@vednemesicnik.test',
    SCRIPT_TOKEN_AUDIENCE: 'fake-audience',
    SESSION_SECRET: 'fake-session-secret',
  }
}

async function inTemporaryDirectory(run: (directory: string) => Promise<void>): Promise<void> {
  let directory = await mkdtemp(join(tmpdir(), 'publikace-'))
  try {
    await run(directory)
  } finally {
    await rm(directory, { force: true, recursive: true })
  }
}

describe('createPublikace', () => {
  it('refuses a production variable that is missing before it opens the database', async () => {
    await inTemporaryDirectory(async (directory) => {
      let path = join(directory, 'publikace.sqlite')
      let { AUTHORIZED_DOMAIN: _missing, ...environment } = productionEnvironment(path)

      await assert.rejects(createPublikace(environment), {
        message: 'Chybí povinná proměnná prostředí AUTHORIZED_DOMAIN.',
      })
      assert.equal(existsSync(path), false)
    })
  })

  it('refuses an access list nobody could change, and closes the database it opened', async () => {
    await inTemporaryDirectory(async (directory) => {
      let path = join(directory, 'publikace.sqlite')

      await assert.rejects(createPublikace(productionEnvironment(path)), {
        message: 'Přístup nemá žádný jmenovaný účet a chybí INITIAL_ADMIN_EMAIL.',
      })
      // SQLite removes the write-ahead log when the last connection to the file closes.
      assert.equal(existsSync(path), true)
      assert.equal(existsSync(`${path}-wal`), false)
    })
  })

  it('answers with no variables but its database, and leaves nothing running once closed', async (t) => {
    /* The record queue's interval is unref'd, so the process would not say it is still there. */
    let intervals = new Set<ReturnType<typeof setInterval>>()
    let realSetInterval = globalThis.setInterval
    let realClearInterval = globalThis.clearInterval
    t.mock.method(globalThis, 'setInterval', ((...args: Parameters<typeof setInterval>) => {
      let interval = realSetInterval(...args)
      intervals.add(interval)
      return interval
    }) as typeof setInterval)
    t.mock.method(globalThis, 'clearInterval', ((interval: ReturnType<typeof setInterval>) => {
      intervals.delete(interval)
      realClearInterval(interval)
    }) as typeof clearInterval)

    await inTemporaryDirectory(async (directory) => {
      let path = join(directory, 'publikace.sqlite')
      let environment: Environment = { DATABASE_PATH: path, NODE_ENV: 'test' }

      let publikace = await createPublikace(environment)
      assert.ok(intervals.size > 0)
      try {
        let response = await publikace.fetch(new Request('http://localhost:44100/sign-in'))
        assert.equal(response.status, 200)
        assert.equal(existsSync(`${path}-wal`), true)
      } finally {
        await publikace.close()
      }

      assert.equal(existsSync(`${path}-wal`), false)
      assert.equal(intervals.size, 0)
      await publikace.close()
    })
  })
})
