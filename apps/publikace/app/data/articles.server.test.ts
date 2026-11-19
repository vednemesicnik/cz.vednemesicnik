import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { createTestApp, seedIssue, type TestApp } from '../test-app.server.ts'
import { createArticleStore } from './articles.server.ts'
import { createLinkStore } from './links.server.ts'

const AT = Temporal.Instant.from('2026-11-18T09:00:00Z')
const TEREZA = { email: 'tereza.vlkova@external.test', name: 'Tereza Vlková' }
const ONDREJ = { email: 'ondrej.benes@external.test', name: 'Ondřej Beneš' }

async function setup(app: TestApp) {
  let issueId = await seedIssue(app)
  let link = await createLinkStore(app.database).articleLinkOf(issueId)
  if (link === null) throw new Error('No link.')
  return { articles: createArticleStore(app.database), issueId, link }
}

describe('the article store', () => {
  it('returns the same attempt for the same form key', async () => {
    let app = await createTestApp()
    try {
      let { articles, issueId, link } = await setup(app)
      let attempt = { at: AT, authors: [TEREZA, ONDREJ], formKey: 'k', issueId, linkId: link.id }

      let first = await articles.startAttempt({ ...attempt, name: 'Školní jídelna po roce' })
      let second = await articles.startAttempt({ ...attempt, name: 'Jiný název' })

      assert.equal(first.isNew, true)
      assert.equal(second.isNew, false)
      assert.equal(second.attempt.id, first.attempt.id)
      assert.deepEqual(
        first.attempt.authors.map((author) => author.name),
        ['Tereza Vlková', 'Ondřej Beneš'],
      )
    } finally {
      await app.close()
    }
  })

  it('shows and counts an article only once it is committed, with its link for artworks', async () => {
    let app = await createTestApp()
    try {
      let { articles, issueId, link } = await setup(app)
      let { attempt } = await articles.startAttempt({
        at: AT,
        authors: [TEREZA],
        formKey: 'k',
        issueId,
        linkId: link.id,
        name: 'Školní jídelna po roce',
      })
      assert.deepEqual(await articles.listCreated(issueId), [])
      assert.equal((await articles.countsByIssue()).get(issueId), undefined)

      await articles.setDriveId(attempt.id, 'folder', 'f-a')
      await articles.setDriveId(attempt.id, 'artworks-folder', 'f-a-artworks')
      await articles.setDriveId(attempt.id, 'licences-folder', 'f-a-licences')
      await articles.setDriveId(attempt.id, 'doc', 'd-a')
      await articles.setDriveId(attempt.id, 'meta', 'm-a')
      await articles.commit(attempt.id, AT)

      let [article] = await articles.listCreated(issueId)
      assert.equal(article?.docId, 'd-a')
      assert.equal((await articles.countsByIssue()).get(issueId), 1)
      let artworks = await createLinkStore(app.database).artworksLinksOf(issueId)
      assert.equal(artworks.get(attempt.id)?.kind, 'artworks')
    } finally {
      await app.close()
    }
  })

  it('refuses to commit an attempt that lacks a file', async () => {
    let app = await createTestApp()
    try {
      let { articles, issueId, link } = await setup(app)
      let { attempt } = await articles.startAttempt({
        at: AT,
        authors: [TEREZA],
        formKey: 'k',
        issueId,
        linkId: link.id,
        name: 'Článek',
      })
      await articles.setDriveId(attempt.id, 'folder', 'f-a')
      await articles.setDriveId(attempt.id, 'artworks-folder', 'f-a-artworks')
      await articles.setDriveId(attempt.id, 'licences-folder', 'f-a-licences')

      await assert.rejects(() => articles.commit(attempt.id, AT))
    } finally {
      await app.close()
    }
  })

  it('discards an attempt with its authors, and never a committed article', async () => {
    let app = await createTestApp()
    try {
      let { articles, issueId, link } = await setup(app)
      let { attempt } = await articles.startAttempt({
        at: AT,
        authors: [TEREZA],
        formKey: 'k',
        issueId,
        linkId: link.id,
        name: 'Článek',
      })
      await articles.markForCleanup(attempt.id, AT)
      assert.equal((await articles.pendingCleanups()).length, 1)

      await articles.discard(attempt.id)

      assert.equal(await articles.findByFormKey('k'), null)
      let authors = await app.database.exec(sql`SELECT count(*) AS count FROM article_authors`)
      assert.equal(Number(authors.rows?.[0]?.['count']), 0)
    } finally {
      await app.close()
    }
  })

  it('counts every attempt through a link since a moment, for the limit', async () => {
    let app = await createTestApp()
    try {
      let { articles, issueId, link } = await setup(app)
      for (let minute of [0, 30, 59]) {
        await articles.startAttempt({
          at: AT.add({ minutes: minute }),
          authors: [TEREZA],
          formKey: `k${minute}`,
          issueId,
          linkId: link.id,
          name: 'Článek',
        })
      }

      assert.equal(await articles.recentAttempts(link.id, AT.add({ minutes: 1 })), 2)
    } finally {
      await app.close()
    }
  })

  it('refuses to commit an article without its two folders', async () => {
    let app = await createTestApp()
    try {
      let { articles, issueId, link } = await setup(app)
      let { attempt } = await articles.startAttempt({
        at: AT,
        authors: [TEREZA],
        formKey: 'k',
        issueId,
        linkId: link.id,
        name: 'Článek',
      })
      await articles.setDriveId(attempt.id, 'folder', 'f-a')
      await articles.setDriveId(attempt.id, 'doc', 'd-a')
      await articles.setDriveId(attempt.id, 'meta', 'm-a')

      await assert.rejects(() => articles.commit(attempt.id, AT))
      assert.equal((await articles.findById(attempt.id))?.createdAt, null)
    } finally {
      await app.close()
    }
  })

  it('records a missing folder once, keeps the time it was found, and counts the article once', async () => {
    let app = await createTestApp()
    try {
      let { articles, issueId, link } = await setup(app)
      let { attempt } = await articles.startAttempt({
        at: AT,
        authors: [TEREZA],
        formKey: 'k',
        issueId,
        linkId: link.id,
        name: 'Článek',
      })
      for (let [kind, id] of [
        ['folder', 'f-a'],
        ['artworks-folder', 'f-a-artworks'],
        ['licences-folder', 'f-a-licences'],
        ['doc', 'd-a'],
        ['meta', 'm-a'],
      ] as const) {
        await articles.setDriveId(attempt.id, kind, id)
      }
      await articles.commit(attempt.id, AT)

      let later = AT.add({ hours: 1 })
      await articles.markMissing(attempt.id, ['licences'], AT)
      await articles.markMissing(attempt.id, ['artworks', 'licences'], later)
      assert.deepEqual((await articles.findById(attempt.id))?.missing, {
        article: null,
        artworks: later,
        licences: AT,
      })
      assert.equal((await articles.missingCountsByIssue()).get(issueId), 1)

      await articles.clearMissing(attempt.id, ['artworks', 'licences'])
      assert.deepEqual((await articles.findById(attempt.id))?.missing, {
        article: null,
        artworks: null,
        licences: null,
      })
      assert.equal((await articles.missingCountsByIssue()).get(issueId), undefined)
    } finally {
      await app.close()
    }
  })

  it('records proofreading once, finds the article by its Doc, and keeps the first record', async () => {
    let app = await createTestApp()
    try {
      let { articles, issueId, link } = await setup(app)
      let { attempt } = await articles.startAttempt({
        at: AT,
        authors: [TEREZA],
        formKey: 'k',
        issueId,
        linkId: link.id,
        name: 'Článek',
      })
      assert.equal(
        await articles.markProofread(
          attempt.id,
          { email: 'jakub@vednemesicnik.test', name: null },
          AT,
        ),
        false,
      )
      await articles.setDriveId(attempt.id, 'folder', 'f-a')
      await articles.setDriveId(attempt.id, 'artworks-folder', 'f-a-artworks')
      await articles.setDriveId(attempt.id, 'licences-folder', 'f-a-licences')
      await articles.setDriveId(attempt.id, 'doc', 'd-a')
      await articles.setDriveId(attempt.id, 'meta', 'm-a')
      await articles.commit(attempt.id, AT)
      assert.equal((await articles.findCreatedByDocId('d-a'))?.proofreading, null)

      let later = AT.add({ hours: 1 })
      let jakub = { email: 'jakub.novak@vednemesicnik.test', name: 'Jakub Novák' }
      assert.equal(await articles.markProofread(attempt.id, jakub, AT), true)
      assert.equal(
        await articles.markProofread(
          attempt.id,
          { email: 'eva@vednemesicnik.test', name: null },
          later,
        ),
        false,
      )

      let article = await articles.findCreatedByDocId('d-a')
      assert.deepEqual(article?.proofreading, { at: AT, ...jakub })
      assert.equal(await articles.findCreatedByDocId('d-unknown'), null)
    } finally {
      await app.close()
    }
  })

  it('refuses a proofreading time without the address that marked it', async () => {
    let app = await createTestApp()
    try {
      let { issueId, link } = await setup(app)
      await assert.rejects(() =>
        app.database.exec(
          sql`INSERT INTO articles (issue_id, link_id, form_key, name, started_at, proofread_at)
              VALUES (${issueId}, ${link.id}, 'k', 'Článek', '2026-11-18T09:00:00.000Z',
                      '2026-11-18T09:00:00.000Z')`,
        ),
      )
    } finally {
      await app.close()
    }
  })
})
