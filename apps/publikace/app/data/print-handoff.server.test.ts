import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { stamp } from '../domain/time.ts'
import {
  createTestApp,
  seedArticle,
  seedBatch,
  seedIssue,
  type TestApp,
} from '../test-app.server.ts'
import { createIssueStore } from './issues.server.ts'
import { type ClaimedIssue, createPrintHandoffStore } from './print-handoff.server.ts'

const AT = Temporal.Instant.from('2026-11-23T05:00:00Z')
const MARKED_AT = Temporal.Instant.from('2026-11-20T09:00:00Z')

let versions = 0

/**
 * A final version of the article with one clause, approved or not; `replacedAt` for one a newer
 * marking replaced. Written straight into the tables, as the flows that make one are tested
 * elsewhere.
 */
async function seedVersion(
  app: TestApp,
  articleId: number,
  options: { isApproved: boolean; markedAt?: Temporal.Instant; replacedAt?: Temporal.Instant },
): Promise<number> {
  versions += 1
  let markedAt = stamp(options.markedAt ?? MARKED_AT)
  let inserted = await app.database.exec(
    sql`INSERT INTO final_versions (article_id, marked_at, marked_by_email, pdf_file_id, pdf_hash,
          attempt_key, replaced_at)
        VALUES (${articleId}, ${markedAt}, 'lenka.svobodova@vednemesicnik.test',
          ${`pdf-${versions}`}, ${`h-${versions}`}, ${`a-${versions}`},
          ${options.replacedAt === undefined ? null : stamp(options.replacedAt)})
        RETURNING id`,
  )
  let versionId = Number(inserted.rows?.[0]?.['id'])
  let approvedAt = options.isApproved ? stamp(MARKED_AT.add({ hours: 2 })) : null
  await app.database.exec(
    sql`INSERT INTO article_clauses (final_version_id, article_id, position, author_name,
          author_email, signature, state, clause_key, claim_key, first_claimed_at, sent_at,
          reply_message_id, reply_received_at, reply_text, is_exact_consent, approved_at,
          consent_file_id)
        VALUES (${versionId}, ${articleId}, 1, 'Tereza Vlková', 'tereza.vlkova@external.test',
          'Tereza Vlková', 'sent', ${`clause-${versions}`}, 'run-0', ${approvedAt}, ${approvedAt},
          ${`m-${versions}`}, ${approvedAt}, 'Souhlasím', 1, ${approvedAt},
          ${approvedAt === null ? null : `c-${versions}`})`,
  )
  return versionId
}

async function approveBatch(app: TestApp, batchId: number): Promise<void> {
  await app.database.exec(
    sql`UPDATE artwork_batches SET approved_at = ${stamp(MARKED_AT)}, consent_file_id = 'c-batch'
        WHERE id = ${batchId}`,
  )
}

function only(issues: ClaimedIssue[], issueId: number): ClaimedIssue {
  let issue = issues.find((claimed) => claimed.issueId === issueId)
  if (issue === undefined) throw new Error('The issue was not claimed.')
  return issue
}

describe('the print folder’s claim', () => {
  it('lists an article by its approved text, by its artworks with consent, or by both', async () => {
    let app = await createTestApp()
    try {
      let issueId = await seedIssue(app)
      let byText = await seedArticle(app, issueId, 'Kavárna v knihovně')
      let byArtworks = await seedArticle(app, issueId, 'Školní jídelna po roce')
      let byBoth = await seedArticle(app, issueId, 'Proč nechodíme volit')
      let waiting = await seedArticle(app, issueId, 'Rozhovor s ředitelkou')
      let versionId = await seedVersion(app, byText.articleId, { isApproved: true })
      await seedVersion(app, byBoth.articleId, { isApproved: true })
      await seedVersion(app, waiting.articleId, { isApproved: false })
      let batch = await seedBatch(app, byArtworks, issueId, { count: 2 })
      await approveBatch(app, batch.id)
      let both = await seedBatch(app, byBoth, issueId, { count: 1 })
      await approveBatch(app, both.id)
      await seedBatch(app, waiting, issueId, { count: 1 })

      let issue = only(await createPrintHandoffStore(app.database).claim('run-1', AT), issueId)
      assert.equal(issue.printFolderId, 'f-VDM_2026_6-print')
      assert.deepEqual(
        issue.articles.map((article) => [
          article.name,
          article.text !== null,
          article.artworks.length,
        ]),
        [
          ['Kavárna v knihovně', true, 0],
          ['Školní jídelna po roce', false, 2],
          ['Proč nechodíme volit', true, 1],
        ],
      )
      let text = issue.articles[0]?.text
      assert.equal(text?.finalVersionId, versionId)
      assert.equal(text?.isStanding, true)
      assert.equal(text?.copyTag, `text_${byText.articleId}_${versionId}`)
      assert.equal(issue.articles[1]?.artworks[0]?.copyTag.startsWith('artwork_'), true)
    } finally {
      await app.close()
    }
  })

  it('keeps the last approved version while a newer one waits, marked as not standing', async () => {
    let app = await createTestApp()
    try {
      let issueId = await seedIssue(app)
      let { articleId } = await seedArticle(app, issueId)
      let older = await seedVersion(app, articleId, {
        isApproved: true,
        replacedAt: MARKED_AT.add({ hours: 24 }),
      })
      await seedVersion(app, articleId, {
        isApproved: false,
        markedAt: MARKED_AT.add({ hours: 24 }),
      })

      let issue = only(await createPrintHandoffStore(app.database).claim('run-1', AT), issueId)
      assert.equal(issue.articles[0]?.text?.finalVersionId, older)
      assert.equal(issue.articles[0]?.text?.isStanding, false)
    } finally {
      await app.close()
    }
  })

  it('hands back a copy whose artwork no longer qualifies, so the job bins it', async () => {
    let app = await createTestApp()
    try {
      let issueId = await seedIssue(app)
      let article = await seedArticle(app, issueId)
      let batch = await seedBatch(app, article, issueId, { count: 1 })
      await approveBatch(app, batch.id)
      let store = createPrintHandoffStore(app.database)
      let artworkId = batch.artworks[0]?.id ?? 0
      await store.claim('run-1', AT)
      await store.record('run-1', {
        articles: [
          {
            articleId: article.articleId,
            copy: {
              artworks: [{ artworkId, fileId: 'copy-1', name: 'obr-01.jpg' }],
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
      })
      await app.database.exec(
        sql`UPDATE artwork_batches SET approved_at = NULL, consent_file_id = NULL`,
      )

      let issue = only(await store.claim('run-2', AT.add({ hours: 6 })), issueId)
      assert.equal(issue.sheetId, 'sheet-1')
      assert.deepEqual(issue.articles[0]?.artworks, [])
      assert.deepEqual(issue.articles[0]?.copy?.artworks, [
        { artworkId, fileId: 'copy-1', name: 'obr-01.jpg' },
      ])
    } finally {
      await app.close()
    }
  })

  it('skips a closed issue and brings it back with its copies once it is reopened', async () => {
    let app = await createTestApp()
    try {
      let issueId = await seedIssue(app)
      let article = await seedArticle(app, issueId)
      await seedVersion(app, article.articleId, { isApproved: true })
      let store = createPrintHandoffStore(app.database)
      await store.claim('run-1', AT)
      await store.record('run-1', {
        articles: [
          {
            articleId: article.articleId,
            copy: {
              artworks: [],
              folderId: 'print-article',
              isTextChanged: false,
              lastImageNumber: 0,
              textFileId: 'text-copy',
              textFinalVersionId: null,
            },
          },
        ],
        isComplete: true,
        issueId,
        sheetId: null,
      })
      let issues = createIssueStore(app.database)
      await issues.close(issueId, AT)
      assert.deepEqual(await store.claim('run-2', AT.add({ hours: 6 })), [])

      await issues.reopen(issueId)
      let issue = only(await store.claim('run-3', AT.add({ hours: 12 })), issueId)
      assert.equal(issue.articles[0]?.copy?.textFileId, 'text-copy')
    } finally {
      await app.close()
    }
  })

  it('does not hand an issue another run holds, until its lease runs out', async () => {
    let app = await createTestApp()
    try {
      let issueId = await seedIssue(app)
      let unfinished = await seedIssue(app, 'VDM_2026_7', { isComplete: false })
      let store = createPrintHandoffStore(app.database)

      let first = await store.claim('run-1', AT)
      assert.deepEqual(
        first.map((issue) => issue.issueId),
        [issueId],
        'an unfinished issue is never claimed',
      )
      assert.notEqual(unfinished, issueId)
      assert.deepEqual(await store.claim('run-2', AT.add({ minutes: 5 })), [])
      assert.equal((await store.claim('run-3', AT.add({ minutes: 11 }))).length, 1)
      assert.equal(
        await store.record('run-1', { articles: [], isComplete: true, issueId, sheetId: null }),
        'unknown',
      )
    } finally {
      await app.close()
    }
  })
})

describe('the print folder’s report', () => {
  it('moves the last full run to the run’s start only after a complete pass', async () => {
    let app = await createTestApp()
    try {
      let issueId = await seedIssue(app)
      let store = createPrintHandoffStore(app.database)
      assert.equal(await store.summaryOf(issueId), null)

      await store.claim('run-1', AT)
      let answer = await store.record('run-1', {
        articles: [],
        isComplete: false,
        issueId,
        sheetId: 'sheet-1',
      })
      assert.equal(answer, 'accepted')
      assert.equal(await store.summaryOf(issueId), null, 'a pass cut short shows no count')

      await store.claim('run-2', AT.add({ hours: 6 }))
      await store.record('run-2', { articles: [], isComplete: true, issueId, sheetId: null })
      let summary = await store.summaryOf(issueId)
      assert.equal(summary?.filledAt.toString(), AT.add({ hours: 6 }).toString())
      assert.equal(summary?.texts, 0)
    } finally {
      await app.close()
    }
  })

  it('counts the texts and artworks copied, drops what is gone, and ignores another issue’s', async () => {
    let app = await createTestApp()
    try {
      let issueId = await seedIssue(app)
      let otherIssue = await seedIssue(app, 'VDM_2026_7')
      let article = await seedArticle(app, issueId)
      let other = await seedArticle(app, otherIssue, 'Jinde')
      let versionId = await seedVersion(app, article.articleId, { isApproved: true })
      let batch = await seedBatch(app, article, issueId, { count: 2 })
      let [first, second] = batch.artworks.map((artwork) => artwork.id)
      let store = createPrintHandoffStore(app.database)
      await store.claim('run-1', AT)
      let copy = {
        artworks: [
          { artworkId: first ?? 0, fileId: 'copy-1', name: 'obr-01.jpg' },
          { artworkId: second ?? 0, fileId: 'copy-2', name: 'obr-02.jpg' },
        ],
        folderId: 'print-article',
        isTextChanged: false,
        lastImageNumber: 2,
        textFileId: 'text-copy',
        textFinalVersionId: versionId,
      }
      await store.record('run-1', {
        articles: [
          { articleId: article.articleId, copy },
          { articleId: other.articleId, copy: { ...copy, artworks: [], folderId: 'elsewhere' } },
        ],
        isComplete: true,
        issueId,
        sheetId: null,
      })
      assert.deepEqual(
        { ...(await store.summaryOf(issueId)), filledAt: undefined },
        { artworks: 2, filledAt: undefined, texts: 1 },
      )
      let others = await app.database.exec(
        sql`SELECT count(*) AS count FROM print_articles WHERE article_id = ${other.articleId}`,
      )
      assert.equal(Number(others.rows?.[0]?.['count']), 0)

      await store.claim('run-2', AT.add({ hours: 6 }))
      await store.record('run-2', {
        articles: [
          { articleId: article.articleId, copy: { ...copy, artworks: copy.artworks.slice(0, 1) } },
        ],
        isComplete: true,
        issueId,
        sheetId: null,
      })
      assert.equal((await store.summaryOf(issueId))?.artworks, 1)

      await store.claim('run-3', AT.add({ hours: 12 }))
      await store.record('run-3', {
        articles: [{ articleId: article.articleId, copy: null }],
        isComplete: true,
        issueId,
        sheetId: null,
      })
      assert.deepEqual(
        { ...(await store.summaryOf(issueId)), filledAt: undefined },
        { artworks: 0, filledAt: undefined, texts: 0 },
      )
    } finally {
      await app.close()
    }
  })

  it('records only the article’s own artworks, the first of a duplicate', async () => {
    let app = await createTestApp()
    try {
      let issueId = await seedIssue(app)
      let article = await seedArticle(app, issueId)
      let neighbour = await seedArticle(app, issueId, 'Vedle')
      let own = await seedBatch(app, article, issueId, { count: 2 })
      let foreign = await seedBatch(app, neighbour, issueId, { count: 1 })
      let [first, second] = own.artworks.map((artwork) => artwork.id)
      let store = createPrintHandoffStore(app.database)
      await store.claim('run-1', AT)
      await store.record('run-1', {
        articles: [
          {
            articleId: article.articleId,
            copy: {
              artworks: [
                { artworkId: first ?? 0, fileId: 'copy-1', name: 'obr-01.jpg' },
                { artworkId: foreign.artworks[0]?.id ?? 0, fileId: 'copy-x', name: 'obr-02.jpg' },
                { artworkId: second ?? 0, fileId: 'copy-3', name: 'obr-03.jpg' },
                { artworkId: first ?? 0, fileId: 'copy-4', name: 'obr-04.jpg' },
              ],
              folderId: 'print-article',
              isTextChanged: false,
              lastImageNumber: 4,
              textFileId: null,
              textFinalVersionId: null,
            },
          },
        ],
        isComplete: true,
        issueId,
        sheetId: null,
      })
      let rows = await app.database.exec(
        sql`SELECT artwork_id, article_id, copy_file_id, name FROM print_artworks
            ORDER BY artwork_id`,
      )
      assert.deepEqual(
        (rows.rows ?? []).map((row) => ({ ...row })),
        [
          {
            article_id: article.articleId,
            artwork_id: first,
            copy_file_id: 'copy-1',
            name: 'obr-01.jpg',
          },
          {
            article_id: article.articleId,
            artwork_id: second,
            copy_file_id: 'copy-3',
            name: 'obr-03.jpg',
          },
        ],
      )
    } finally {
      await app.close()
    }
  })
})
