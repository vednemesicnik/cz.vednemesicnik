import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { appOrigin } from '../../../auth/environment.server.ts'
import { createArtworkStore } from '../../../data/artworks.server.ts'
import { batchState } from '../../../domain/artwork.ts'
import {
  createTestApp,
  fakeIdentityToken,
  JOB_TOKEN,
  seedArticle,
  seedBatch,
  seedIssue,
  TEST_ENVIRONMENT,
  type TestApp,
  UNREACHABLE_IDENTITY_TOKEN,
} from '../../../test-app.server.ts'

const CLAIM = '/api/v1/artwork-replies/claim'
const REPORT = '/api/v1/artwork-replies/report'

type Claimed = {
  batches: {
    batchId: number
    canArchiveExactReply: boolean
    isVerified: boolean
    licencesFolderId: string | null
    sender: string
    subjectContains: string[]
    subjectPrefix: string
    subjectTag: string
  }[]
  runKey: string
}

function call(
  app: TestApp,
  path: string,
  body: unknown,
  token: string | null = JOB_TOKEN,
): Promise<Response> {
  let headers = new Headers({ 'Content-Type': 'application/json' })
  if (token !== null) headers.set('Authorization', `Bearer ${token}`)
  return app.fetch(
    new Request(new URL(path, appOrigin(TEST_ENVIRONMENT)), {
      body: JSON.stringify(body),
      headers,
      method: 'POST',
    }),
  )
}

async function claim(app: TestApp): Promise<Claimed> {
  let response = await call(app, CLAIM, { intervalMinutes: 30 })
  assert.equal(response.status, 200)
  assert.equal(response.headers.getSetCookie().length, 0)
  return (await response.json()) as Claimed
}

async function report(app: TestApp, runKey: string, results: unknown[]) {
  let response = await call(app, REPORT, { outcome: 'ok', results, runKey })
  return { body: (await response.json()) as { results?: unknown[] }, status: response.status }
}

function reply(text: string, messageId = 'm-1') {
  return { messageId, receivedAt: '2026-11-19T06:12:00.000Z', text, threadId: 't-1' }
}

async function setup() {
  let app = await createTestApp()
  let issueId = await seedIssue(app, 'VDM_2026_5')
  let article = await seedArticle(app, issueId, 'Ilustrace k tématu Volby')
  let batch = await seedBatch(app, article, issueId)
  return { app, article, batch, issueId, store: createArtworkStore(app.database) }
}

describe('the reply check’s API', () => {
  it('lets in only the job account, and says when Google cannot be asked', async () => {
    let { app } = await setup()
    try {
      assert.equal((await call(app, CLAIM, { intervalMinutes: 30 }, null)).status, 401)
      let editor = fakeIdentityToken({ email: 'marie@vednemesicnik.test', name: 'Marie' })
      assert.equal((await call(app, CLAIM, { intervalMinutes: 30 }, editor)).status, 401)
      assert.equal(
        (await call(app, CLAIM, { intervalMinutes: 30 }, UNREACHABLE_IDENTITY_TOKEN)).status,
        503,
      )
      assert.equal((await call(app, CLAIM, { intervalMinutes: 0 })).status, 400)
    } finally {
      await app.close()
    }
  })

  it('hands each open batch to one run, with what Reply_Check needs to find its thread', async () => {
    let { app, article, batch, issueId } = await setup()
    try {
      let unsent = await seedBatch(app, article, issueId, { isSent: false })
      let first = await claim(app)
      assert.deepEqual(
        first.batches.map((item) => item.batchId),
        [batch.id, unsent.id],
      )
      let [item] = first.batches
      assert.equal(item?.sender, 'klara.simkova@external.test')
      assert.equal(item?.subjectTag, batch.tag)
      assert.deepEqual(item?.subjectContains, ['Ilustrace k tématu Volby'])
      assert.equal(item?.subjectPrefix, 'Žádost o potvrzení souhlasu s užitím obrazových děl')
      assert.equal(item?.licencesFolderId, article.licencesFolderId)
      assert.equal(item?.isVerified, false)
      assert.equal(item?.canArchiveExactReply, true)

      assert.deepEqual((await claim(app)).batches, [])
    } finally {
      await app.close()
    }
  })

  it('puts another reply in Ke kontrole, with its own text', async () => {
    let { app, batch, store } = await setup()
    try {
      let { runKey } = await claim(app)
      let result = await report(app, runKey, [
        { batchId: batch.id, reply: reply('ok, souhlas'), state: 'other_reply' },
      ])
      assert.deepEqual(result.body.results, [{ answer: 'accepted', batchId: batch.id }])
      let stored = await store.findBatch(batch.id)
      assert.equal(stored === null ? null : batchState(stored), 'review')
      assert.equal(stored?.replyText, 'ok, souhlas')
      assert.equal(await store.reviewCount(), 1)
    } finally {
      await app.close()
    }
  })

  it('approves an exact „Souhlasím“ the job archived, and forgets its text', async () => {
    let { app, batch, store } = await setup()
    try {
      let { runKey } = await claim(app)
      await report(app, runKey, [
        {
          archive: { fileId: 'pdf-1' },
          batchId: batch.id,
          reply: reply('Souhlasím'),
          state: 'reply_matches',
        },
      ])
      let stored = await store.findBatch(batch.id)
      assert.equal(stored === null ? null : batchState(stored), 'approved')
      assert.equal(stored?.consentFileId, 'pdf-1')
      assert.equal(stored?.replyText, null)
      assert.deepEqual((await claim(app)).batches, [])
    } finally {
      await app.close()
    }
  })

  it('refuses a run it does not know, and a report for a batch another run holds', async () => {
    let { app, batch } = await setup()
    try {
      assert.equal((await report(app, 'no-such-run', [])).status, 409)
      let { runKey } = await claim(app)
      assert.equal(
        (await report(app, runKey, [{ batchId: batch.id, state: 'nonsense' }])).status,
        400,
      )
      let { body } = await report(app, runKey, [])
      assert.deepEqual(body.results, [])
      assert.equal((await report(app, runKey, [])).status, 409)

      let other = await call(app, CLAIM, { intervalMinutes: 30 })
      let otherKey = ((await other.json()) as Claimed).runKey
      let stale = await report(app, otherKey, [{ batchId: batch.id, state: 'no_reply' }])
      assert.deepEqual(stale.body.results, [{ answer: 'unknown', batchId: batch.id }])
    } finally {
      await app.close()
    }
  })

  it('answers superseded when Je to souhlas was taken back before the archive came', async () => {
    let { app, batch, store } = await setup()
    try {
      let first = await claim(app)
      await report(app, first.runKey, [
        { batchId: batch.id, reply: reply('ok, souhlas'), state: 'other_reply' },
      ])
      await store.verifyConsent(
        batch.id,
        'm-1',
        { displayName: 'Marie Horáková', email: 'marie@vednemesicnik.test' },
        Temporal.Now.instant(),
      )
      /* The first run's lease is over, as it would be ten minutes later. */
      await app.database.exec(
        sql`UPDATE artwork_batches SET claimed_at = NULL WHERE id = ${batch.id}`,
      )
      let second = await claim(app)
      assert.equal(second.batches[0]?.isVerified, true)
      assert.equal(await store.undoVerification(batch.id), true)

      let late = await report(app, second.runKey, [
        {
          archive: { fileId: 'pdf-1' },
          batchId: batch.id,
          reply: reply('ok, souhlas'),
          state: 'other_reply',
        },
      ])
      assert.deepEqual(late.body.results, [{ answer: 'superseded', batchId: batch.id }])
      let stored = await store.findBatch(batch.id)
      assert.equal(stored === null ? null : batchState(stored), 'review')
    } finally {
      await app.close()
    }
  })
})
