import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { appOrigin } from '../../../auth/environment.server.ts'
import { createJobRunStore } from '../../../data/job-runs.server.ts'
import { createPrintHandoffStore } from '../../../data/print-handoff.server.ts'
import { PRINT_HANDOFF_JOB } from '../../../domain/print-handoff.ts'
import {
  createTestApp,
  fakeIdentityToken,
  JOB_TOKEN,
  seedArticle,
  seedBatch,
  seedIssue,
  type TestApp,
  UNREACHABLE_IDENTITY_TOKEN,
} from '../../../test-app.server.ts'

const CLAIM = '/api/v1/print-handoff/claim'
const REPORT = '/api/v1/print-handoff/report'

type Claimed = {
  copyProperty: string
  issues: {
    articles: {
      articleId: number
      artworks: { artworkId: number; copyTag: string; fileId: string }[]
      folderTag: string
      text: null | { revisedAfter: string }
    }[]
    issueId: number
    printFolderId: string
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
    new Request(new URL(path, appOrigin()), {
      body: JSON.stringify(body),
      headers,
      method: 'POST',
    }),
  )
}

async function claim(app: TestApp): Promise<Claimed> {
  let response = await call(app, CLAIM, { intervalMinutes: 360 })
  assert.equal(response.status, 200)
  assert.equal(response.headers.getSetCookie().length, 0)
  return (await response.json()) as Claimed
}

describe('the API of Print_Handoff', () => {
  it('lets in only the job account and refuses what it cannot read', async () => {
    let app = await createTestApp()
    try {
      assert.equal((await call(app, CLAIM, { intervalMinutes: 360 }, null)).status, 401)
      let other = fakeIdentityToken({ email: 'marie@vednemesicnik.test', name: null })
      assert.equal((await call(app, CLAIM, { intervalMinutes: 360 }, other)).status, 401)
      assert.equal(
        (await call(app, CLAIM, { intervalMinutes: 360 }, UNREACHABLE_IDENTITY_TOKEN)).status,
        503,
      )
      assert.equal((await call(app, CLAIM, { intervalMinutes: 0 })).status, 400)
      assert.equal((await call(app, REPORT, { issues: [], outcome: 'ok' })).status, 400)
      let unreadable = await call(app, REPORT, {
        issues: [
          { articles: [{ articleId: 1, copy: { folderId: '' } }], isComplete: true, issueId: 1 },
        ],
        outcome: 'ok',
        runKey: 'run',
      })
      assert.equal(unreadable.status, 400)
      let unknown = await call(app, REPORT, { issues: [], outcome: 'ok', runKey: 'nope' })
      assert.equal(unknown.status, 409)
    } finally {
      await app.close()
    }
  })

  it('claims an issue’s artworks with consent, takes the report and closes the run', async () => {
    let app = await createTestApp()
    try {
      let issueId = await seedIssue(app)
      let article = await seedArticle(app, issueId)
      let batch = await seedBatch(app, article, issueId, { count: 1 })
      await app.database.exec(
        sql`UPDATE artwork_batches SET approved_at = '2026-11-22T10:00:00.000Z',
              consent_file_id = 'c-1' WHERE id = ${batch.id}`,
      )

      let claimed = await claim(app)
      assert.equal(claimed.copyProperty, 'publikaceHandoff')
      let [issue] = claimed.issues
      assert.equal(issue?.printFolderId, 'f-VDM_2026_6-print')
      let [entry] = issue?.articles ?? []
      assert.equal(entry?.folderTag, `article_${article.articleId}`)
      assert.equal(entry?.text, null)
      let artwork = entry?.artworks[0]
      assert.ok(artwork !== undefined)
      assert.equal(artwork.copyTag, `artwork_${artwork.artworkId}`)

      let response = await call(app, REPORT, {
        issues: [
          {
            articles: [
              {
                articleId: article.articleId,
                copy: {
                  artworks: [
                    { artworkId: artwork.artworkId, fileId: 'copy-1', name: 'obr-01.jpg' },
                  ],
                  folderId: 'print-article',
                  isTextChanged: false,
                  lastImageNumber: 1,
                  textFileId: null,
                  textFinalVersionId: null,
                },
              },
            ],
            isComplete: true,
            issueId,
            sheetId: 'sheet-1',
          },
          { articles: [], isComplete: true, issueId: 9999, sheetId: null },
        ],
        outcome: 'ok',
        runKey: claimed.runKey,
      })
      assert.equal(response.status, 200)
      assert.deepEqual(await response.json(), {
        issues: [
          { answer: 'accepted', issueId },
          { answer: 'unknown', issueId: 9999 },
        ],
      })
      let summary = await createPrintHandoffStore(app.database).summaryOf(issueId)
      assert.equal(summary?.artworks, 1)
      let latest = await createJobRunStore(app.database).latest(PRINT_HANDOFF_JOB)
      assert.equal(latest?.outcome, 'ok')
      assert.equal(latest?.intervalMinutes, 360)

      let again = await call(app, REPORT, { issues: [], outcome: 'ok', runKey: claimed.runKey })
      assert.equal(again.status, 409, 'a closed run takes no second report')
    } finally {
      await app.close()
    }
  })

  it('refuses a report over its totals, each issue and article within theirs', async () => {
    let app = await createTestApp()
    try {
      let issueId = await seedIssue(app)
      let claimed = await claim(app)
      let copy = (articleId: number, artworks: number) => ({
        articleId,
        copy: {
          artworks: Array.from({ length: artworks }, (_, index) => ({
            artworkId: articleId * 1000 + index + 1,
            fileId: `copy-${articleId}-${index}`,
            name: `obr-${index + 1}.jpg`,
          })),
          folderId: `print-${articleId}`,
          isTextChanged: false,
          lastImageNumber: artworks,
          textFileId: null,
          textFinalVersionId: null,
        },
      })
      let issue = (articles: unknown[], id = issueId) => ({
        articles,
        isComplete: true,
        issueId: id,
        sheetId: null,
      })

      /* 11 × 455 artworks: 5 005 in all. */
      let artworks = Array.from({ length: 11 }, (_, index) => copy(index + 1, 455))
      let tooManyArtworks = await call(app, REPORT, {
        issues: [issue(artworks)],
        outcome: 'ok',
        runKey: claimed.runKey,
      })
      assert.equal(tooManyArtworks.status, 400)
      assert.deepEqual(await tooManyArtworks.json(), { error: 'invalid_request' })

      /* 251 and 250 articles: 501 in all. */
      let articles = (from: number, count: number) =>
        Array.from({ length: count }, (_, index) => ({ articleId: from + index, copy: null }))
      let tooManyArticles = await call(app, REPORT, {
        issues: [issue(articles(1, 251)), issue(articles(1000, 250), issueId + 1)],
        outcome: 'ok',
        runKey: claimed.runKey,
      })
      assert.equal(tooManyArticles.status, 400)

      let recorded = await app.database.exec(
        sql`SELECT (SELECT count(*) FROM print_articles) + (SELECT count(*) FROM print_artworks)
              AS count`,
      )
      assert.equal(Number(recorded.rows?.[0]?.['count']), 0)
      let accepted = await call(app, REPORT, {
        issues: [issue([])],
        outcome: 'ok',
        runKey: claimed.runKey,
      })
      assert.equal(accepted.status, 200, 'the refused reports left the run open')
    } finally {
      await app.close()
    }
  })
})
