import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { appOrigin } from '../../../auth/environment.server.ts'
import { createJobRunStore } from '../../../data/job-runs.server.ts'
import { ARTICLE_COMMENTS_JOB, readCommentDigestRun } from '../../../domain/article-comments.ts'
import {
  createTestApp,
  fakeIdentityToken,
  JOB_TOKEN,
  seedArticle,
  seedIssue,
  TEST_ENVIRONMENT,
  type TestApp,
  UNREACHABLE_IDENTITY_TOKEN,
} from '../../../test-app.server.ts'

const CLAIM = '/api/v1/article-comments/claim'
const REPORT = '/api/v1/article-comments/report'

type Claimed = {
  articles: {
    articleId: number
    authorEmails: string[]
    docId: string
    issueName: string
    name: string
    reportedUntil: string
    suggestionHashes: string[]
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
  let response = await call(app, CLAIM, { intervalMinutes: 180 })
  assert.equal(response.status, 200)
  assert.equal(response.headers.getSetCookie().length, 0)
  return (await response.json()) as Claimed
}

function report(app: TestApp, runKey: string, fields: Record<string, unknown> = {}) {
  return call(app, REPORT, {
    articles: [],
    outcome: 'ok',
    runKey,
    sent: 0,
    unconfirmed: [],
    ...fields,
  })
}

async function digestOf(app: TestApp, articleId: number) {
  let result = await app.database.exec(
    sql`SELECT * FROM comment_digests WHERE article_id = ${articleId}`,
  )
  return result.rows?.[0]
}

describe('the API of Article_Comments', () => {
  it('lets in only the job account and refuses what it cannot read', async () => {
    let app = await createTestApp()
    try {
      assert.equal((await call(app, CLAIM, { intervalMinutes: 180 }, null)).status, 401)
      let other = fakeIdentityToken({ email: 'marie@vednemesicnik.test', name: null })
      assert.equal((await call(app, CLAIM, { intervalMinutes: 180 }, other)).status, 401)
      assert.equal(
        (await call(app, CLAIM, { intervalMinutes: 180 }, UNREACHABLE_IDENTITY_TOKEN)).status,
        503,
      )
      assert.equal((await call(app, CLAIM, { intervalMinutes: 0 })).status, 400)

      let { runKey } = await claim(app)
      let malformed: Record<string, unknown>[] = [
        { runKey: '' },
        { outcome: 'done' },
        { sent: -1 },
        { sent: 1.5 },
        { articles: [{ articleId: 0, suggestionHashes: [] }] },
        { articles: [{ articleId: 1, suggestionHashes: [''] }] },
        { articles: [{ articleId: 1, suggestionHashes: ['x'.repeat(65)] }] },
        { articles: [{ articleId: 1 }] },
        { unconfirmed: [{ articleId: 1, email: '' }] },
        {
          articles: [
            { articleId: 1, suggestionHashes: [] },
            { articleId: 1, suggestionHashes: [] },
          ],
        },
        {
          articles: [{ articleId: 1, suggestionHashes: [] }],
          unconfirmed: [{ articleId: 1, email: 'tereza.vlkova@external.test' }],
        },
      ]
      for (let fields of malformed) {
        assert.equal((await report(app, runKey, fields)).status, 400, JSON.stringify(fields))
      }
      assert.equal((await report(app, 'nope')).status, 409)
    } finally {
      await app.close()
    }
  })

  it('claims the articles of open issues only, with their authors and where they stand', async () => {
    let app = await createTestApp()
    try {
      let open = await seedIssue(app, 'VDM_2003_1')
      let article = await seedArticle(app, open)
      let removed = await seedArticle(app, open, 'Odebraný článek')
      await app.database.exec(
        sql`UPDATE articles SET removed_at = '2026-11-20T10:00:00.000Z'
            WHERE id = ${removed.articleId}`,
      )
      await app.database.exec(
        sql`INSERT INTO article_authors (article_id, position, name, email)
            VALUES (${article.articleId}, 2, 'Jan Novotný', 'j.novotny@external.test')`,
      )
      let closed = await seedIssue(app, 'VDM_2003_2')
      await seedArticle(app, closed)
      await app.database.exec(
        sql`UPDATE issues SET closed_at = '2026-11-20T10:00:00.000Z' WHERE id = ${closed}`,
      )
      let binned = await seedIssue(app, 'VDM_2003_3')
      await seedArticle(app, binned)
      await app.database.exec(
        sql`UPDATE issues SET removed_at = '2026-11-20T10:00:00.000Z' WHERE id = ${binned}`,
      )

      let claimed = await claim(app)
      assert.deepEqual(claimed.articles, [
        {
          articleId: article.articleId,
          authorEmails: ['tereza.vlkova@external.test', 'j.novotny@external.test'],
          docId: article.docId,
          issueName: 'VDM_2003_1',
          name: 'Školní jídelna po roce',
          reportedUntil: '2026-11-18T09:00:00Z',
          suggestionHashes: [],
        },
      ])

      /* The lease holds the article from another run for ten minutes, then lets it go. */
      assert.deepEqual((await claim(app)).articles, [])
      await app.database.exec(
        sql`UPDATE comment_digests SET claimed_at = '2026-11-18T09:00:00.000Z'`,
      )
      assert.equal((await claim(app)).articles.length, 1)
    } finally {
      await app.close()
    }
  })

  it('moves a told article to the claim and keeps an unconfirmed one where it was', async () => {
    let app = await createTestApp()
    try {
      let issueId = await seedIssue(app, 'VDM_2003_1')
      let told = await seedArticle(app, issueId, 'Rozhovor s varhaníkem z Kostelce')
      let unconfirmed = await seedArticle(app, issueId, 'Proč nechodíme volit')
      let omitted = await seedArticle(app, issueId, 'Noční autobusy')

      let { runKey } = await claim(app)
      let claimedAt = (await digestOf(app, told.articleId))?.['claimed_at']
      let response = await report(app, runKey, {
        articles: [
          { articleId: told.articleId, suggestionHashes: ['a1', 'b2'] },
          { articleId: 9999, suggestionHashes: [] },
        ],
        sent: 2,
        unconfirmed: [
          { articleId: unconfirmed.articleId, email: 'l.kralova@external.test' },
          { articleId: 9998, email: 'cizi@external.test' },
        ],
      })
      assert.equal(response.status, 200)
      assert.deepEqual(await response.json(), {
        articles: [
          { answer: 'recorded', articleId: told.articleId },
          { answer: 'unknown', articleId: 9999 },
        ],
      })

      let row = await digestOf(app, told.articleId)
      assert.equal(row?.['reported_until'], claimedAt)
      assert.equal(row?.['suggestion_hashes'], '["a1","b2"]')
      assert.equal(row?.['claim_key'], null)
      for (let kept of [unconfirmed, omitted]) {
        let keptRow = await digestOf(app, kept.articleId)
        assert.equal(keptRow?.['reported_until'], null)
        assert.equal(keptRow?.['claim_key'], null)
      }

      let latest = await createJobRunStore(app.database).latest(ARTICLE_COMMENTS_JOB)
      assert.equal(latest?.outcome, 'failed')
      assert.equal(latest?.intervalMinutes, 180)
      assert.deepEqual(readCommentDigestRun(latest?.summary ?? null), {
        hasFailed: false,
        sent: 2,
        unconfirmed: [{ articleName: 'Proč nechodíme volit', email: 'l.kralova@external.test' }],
      })
      assert.equal((await report(app, runKey)).status, 409)

      /* The next claim hands out first what was told of longest ago, the told one last. */
      let next = await claim(app)
      assert.equal(next.articles.at(-1)?.articleId, told.articleId)
      assert.deepEqual(next.articles.at(-1)?.suggestionHashes, ['a1', 'b2'])
    } finally {
      await app.close()
    }
  })

  it('ends a run in order when every e-mail was confirmed', async () => {
    let app = await createTestApp()
    try {
      let issueId = await seedIssue(app, 'VDM_2003_1')
      let article = await seedArticle(app, issueId)
      let { runKey } = await claim(app)
      let response = await report(app, runKey, {
        articles: [{ articleId: article.articleId, suggestionHashes: [] }],
        error: '',
        sent: 1,
      })
      assert.equal(response.status, 200)
      let latest = await createJobRunStore(app.database).latest(ARTICLE_COMMENTS_JOB)
      assert.equal(latest?.outcome, 'ok')
      assert.equal(latest?.error, null)
    } finally {
      await app.close()
    }
  })
})
