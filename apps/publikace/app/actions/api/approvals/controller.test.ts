import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { appOrigin } from '../../../auth/environment.server.ts'
import { createArticleStore } from '../../../data/articles.server.ts'
import {
  createTestApp,
  fakeIdentityToken,
  JOB_TOKEN,
  seedArticle,
  seedIssue,
  type TestApp,
} from '../../../test-app.server.ts'

const CLAIM = '/api/v1/approvals/claim'
const REPORT = '/api/v1/approvals/report'
const LENKA = { email: 'lenka.svobodova@vednemesicnik.test', name: 'Lenka Svobodová' }
const AT = Temporal.Instant.from('2026-11-21T08:00:00Z')

type Claimed = {
  clauses: { authorEmail: string; clauseKey: string; pdfFileId: string; signature: string }[]
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
    new Request(new URL(path, appOrigin()), {
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

/** An article taken and marked, as the page Korektura leaves it. */
async function marked(app: TestApp, issueName = 'VDM_2026_6'): Promise<number> {
  let issueId = await seedIssue(app, issueName)
  let { articleId } = await seedArticle(app, issueId)
  let articles = createArticleStore(app.database)
  await articles.takeProofreading(articleId, LENKA, AT, 'writing')
  let outcome = await articles.markFinalVersion({
    at: AT.add({ hours: 1 }),
    by: LENKA,
    id: articleId,
    pdf: { attemptKey: `a-${articleId}`, fileId: `pdf-${articleId}`, hash: 'h' },
    takenAt: AT,
  })
  assert.equal(outcome.kind, 'done')
  return articleId
}

describe('the API of Approval_Send', () => {
  it('lets in only the job account', async () => {
    let app = await createTestApp()
    try {
      assert.equal((await call(app, CLAIM, { intervalMinutes: 30 }, null)).status, 401)
      let other = fakeIdentityToken({ email: 'marie@vednemesicnik.test', name: null })
      assert.equal((await call(app, CLAIM, { intervalMinutes: 30 }, other)).status, 401)
      assert.equal((await call(app, CLAIM, { intervalMinutes: 0 })).status, 400)
    } finally {
      await app.close()
    }
  })

  it('hands each clause to one run, and ends the marking’s way back', async () => {
    let app = await createTestApp()
    try {
      let articleId = await marked(app)
      let first = await claim(app)
      assert.deepEqual(
        first.clauses.map((clause) => [clause.signature, clause.authorEmail, clause.pdfFileId]),
        [['Tereza Vlková', 'tereza.vlkova@external.test', `pdf-${articleId}`]],
      )
      assert.deepEqual((await claim(app)).clauses, [])
      let article = await createArticleStore(app.database).findById(articleId)
      assert.equal(article?.finalVersion?.isCancellable, false)
      assert.deepEqual(
        await createArticleStore(app.database).cancelFinalVersion(
          articleId,
          AT.add({ hours: 2 }),
          AT.add({ hours: 1 }),
        ),
        { kind: 'too-late' },
      )
    } finally {
      await app.close()
    }
  })

  it('records sent and failed clauses, and refuses a run it does not know', async () => {
    let app = await createTestApp()
    try {
      let sentId = await marked(app, 'VDM_2026_6')
      let failedId = await marked(app, 'VDM_2026_7')
      let { clauses, runKey } = await claim(app)
      let [sent, failed] = clauses
      assert.ok(sent !== undefined && failed !== undefined)

      let unknown = await call(app, REPORT, { outcome: 'ok', results: [], runKey: 'nope' })
      assert.equal(unknown.status, 409)
      let response = await call(app, REPORT, {
        outcome: 'ok',
        results: [
          { clauseKey: sent.clauseKey, outcome: 'sent' },
          { clauseKey: failed.clauseKey, error: 'Mailer: 550', outcome: 'failed' },
          { clauseKey: 'clause_0_0_0', outcome: 'sent' },
        ],
        runKey,
      })
      assert.equal(response.status, 200)
      assert.deepEqual(
        ((await response.json()) as { results: { answer: string }[] }).results.map((r) => r.answer),
        ['done', 'done', 'unknown'],
      )

      let articles = createArticleStore(app.database)
      assert.deepEqual((await articles.findById(sentId))?.finalVersion?.clauses, {
        failed: 0,
        pending: 0,
        sent: 1,
        total: 1,
      })
      assert.equal((await articles.findById(failedId))?.finalVersion?.clauses.failed, 1)
      let error = await app.database.exec(
        sql`SELECT error FROM article_clauses WHERE clause_key = ${failed.clauseKey}`,
      )
      assert.equal(error.rows?.[0]?.['error'], 'Mailer: 550')
    } finally {
      await app.close()
    }
  })

  it('leaves out the clauses of closed issues and cancelled markings', async () => {
    let app = await createTestApp()
    try {
      let articleId = await marked(app)
      let articles = createArticleStore(app.database)
      let cancelled = await articles.cancelFinalVersion(
        articleId,
        AT.add({ hours: 2 }),
        AT.add({ hours: 1 }),
      )
      assert.deepEqual(cancelled, { kind: 'done', pdfFileId: `pdf-${articleId}` })
      assert.equal((await articles.findById(articleId))?.proofreading?.email, LENKA.email)
      assert.deepEqual((await claim(app)).clauses, [])

      let closedId = await marked(app, 'VDM_2026_7')
      let closed = await articles.findById(closedId)
      await app.database.exec(
        sql`UPDATE issues SET closed_at = ${AT.toString()} WHERE id = ${closed?.issueId ?? 0}`,
      )
      assert.deepEqual((await claim(app)).clauses, [])
    } finally {
      await app.close()
    }
  })

  it('refuses Zrušit korekturu once the final version stands', async () => {
    let app = await createTestApp()
    try {
      let articleId = await marked(app)
      let outcome = await createArticleStore(app.database).cancelProofreading(
        articleId,
        AT.add({ hours: 2 }),
      )
      assert.equal(outcome.kind, 'final-version')
    } finally {
      await app.close()
    }
  })
})
