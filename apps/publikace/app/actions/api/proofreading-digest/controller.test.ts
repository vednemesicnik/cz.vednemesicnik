import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { appOrigin } from '../../../auth/environment.server.ts'
import { createArticleStore } from '../../../data/articles.server.ts'
import { createJobRunStore } from '../../../data/job-runs.server.ts'
import { createProofreadersStore } from '../../../data/proofreaders.server.ts'
import { readDigestRun } from '../../../domain/proofreading-digest.ts'
import {
  createTestApp,
  fakeIdentityToken,
  JOB_TOKEN,
  seedArticle,
  seedIssue,
  type TestApp,
  UNREACHABLE_IDENTITY_TOKEN,
} from '../../../test-app.server.ts'

const RUN = '/api/v1/proofreading-digest/run'
const MARIE = { email: 'marie@vednemesicnik.test', name: 'Marie Horáková' }
const PROOFREADERS = 'korektori@vednemesicnik.test'

function call(app: TestApp, body: unknown, token: string | null = JOB_TOKEN): Promise<Response> {
  let headers = new Headers({ 'Content-Type': 'application/json' })
  if (token !== null) headers.set('Authorization', `Bearer ${token}`)
  return app.fetch(
    new Request(new URL(RUN, appOrigin()), { body: JSON.stringify(body), headers, method: 'POST' }),
  )
}

async function run(app: TestApp): Promise<string> {
  let response = await call(app, { intervalMinutes: 1440 })
  assert.equal(response.status, 200)
  assert.equal(response.headers.getSetCookie().length, 0)
  return ((await response.json()) as { state: string }).state
}

/** An issue with one article handed over, and the proofreaders' address unless asked not to. */
async function setup(app: TestApp, options: { hasAddress?: boolean } = {}) {
  let issueId = await seedIssue(app)
  let article = await seedArticle(app, issueId, 'Kavárna v knihovně: rok poté')
  let articles = createArticleStore(app.database)
  await articles.handOver(article.articleId, MARIE, Temporal.Now.instant())
  if (options.hasAddress !== false) {
    await createProofreadersStore(app.database).save(
      PROOFREADERS,
      MARIE.email,
      Temporal.Now.instant(),
    )
  }
  return { article, articles, issueId }
}

async function latestSummary(app: TestApp) {
  let latest = await createJobRunStore(app.database).latest('proofreading-digest')
  return { latest, run: readDigestRun(latest?.summary ?? null) }
}

describe('the proofreading digest API', () => {
  it('lets in only the job account’s token, and sends nothing for the others', async () => {
    let app = await createTestApp()
    try {
      await setup(app)
      assert.equal((await call(app, { intervalMinutes: 1440 }, null)).status, 401)
      let stranger = fakeIdentityToken({ email: 'eva@vednemesicnik.test', name: null })
      assert.equal((await call(app, { intervalMinutes: 1440 }, stranger)).status, 401)
      assert.equal(
        (await call(app, { intervalMinutes: 1440 }, UNREACHABLE_IDENTITY_TOKEN)).status,
        503,
      )
      assert.equal((await call(app, { intervalMinutes: 0 })).status, 400)
      assert.equal(app.mail.length, 0)
      assert.equal((await latestSummary(app)).latest, null)
    } finally {
      await app.close()
    }
  })

  it('sends the digest once, records it, and sends nothing the next morning', async () => {
    let app = await createTestApp()
    try {
      await setup(app)
      assert.equal(await run(app), 'sent')
      assert.equal(app.mail.length, 1)
      assert.equal(app.mail[0]?.to, PROOFREADERS)
      assert.match(app.mail[0]?.subject ?? '', /^Ke korektuře – \d+\. \d+\. \d{4}$/)
      assert.ok(app.mail[0]?.htmlBody.includes('Kavárna v knihovně: rok poté'))
      let { latest, run: summary } = await latestSummary(app)
      assert.equal(latest?.outcome, 'ok')
      assert.deepEqual(summary, { cancelled: 0, handedOver: 1, kind: 'sent', waiting: 0 })

      assert.equal(await run(app), 'nothing')
      assert.equal(app.mail.length, 1)
    } finally {
      await app.close()
    }
  })

  it('tells of a cancelled handover the proofreaders had heard of, beside what waits', async () => {
    let app = await createTestApp()
    try {
      let { article, articles, issueId } = await setup(app)
      let other = await seedArticle(app, issueId, 'Zahrada na střeše tělocvičny')
      await articles.handOver(other.articleId, MARIE, Temporal.Now.instant())
      await run(app)
      await articles.cancelHandover(article.articleId, Temporal.Now.instant())

      assert.equal(await run(app), 'sent')
      let body = app.mail[1]?.htmlBody ?? ''
      assert.ok(body.includes('Zrušená předání'))
      assert.ok(body.includes('Stále čekají na korekturu'))
      assert.ok(!body.includes('Nově předané'))
      assert.deepEqual((await latestSummary(app)).run, {
        cancelled: 1,
        handedOver: 0,
        kind: 'sent',
        waiting: 1,
      })
      assert.equal(await run(app), 'nothing')
    } finally {
      await app.close()
    }
  })

  it('marks nothing told when the Mailer does not confirm, and retries under the same key', async () => {
    let app = await createTestApp()
    try {
      await setup(app)
      app.failMail(true)
      assert.equal(await run(app), 'unconfirmed')
      let { latest, run: summary } = await latestSummary(app)
      assert.equal(latest?.outcome, 'failed')
      assert.equal(latest?.error, 'the fake Mailer is failing')
      assert.deepEqual(summary, { kind: 'unconfirmed' })

      app.failMail(false)
      assert.equal(await run(app), 'sent')
      assert.equal(app.mail.length, 2)
      assert.equal(app.mail[0]?.idempotencyKey, app.mail[1]?.idempotencyKey)
    } finally {
      await app.close()
    }
  })

  it('sends nothing without an address, records why, and the handover stands', async () => {
    let app = await createTestApp()
    try {
      let { article, articles } = await setup(app, { hasAddress: false })
      assert.equal(await run(app), 'no-address')
      assert.equal(app.mail.length, 0)
      assert.equal((await latestSummary(app)).latest?.outcome, 'failed')
      assert.notEqual((await articles.findById(article.articleId))?.handover, null)
    } finally {
      await app.close()
    }
  })

  it('is fine without an address when there is nothing to send', async () => {
    let app = await createTestApp()
    try {
      assert.equal(await run(app), 'nothing')
      assert.equal((await latestSummary(app)).latest?.outcome, 'ok')
    } finally {
      await app.close()
    }
  })
})
