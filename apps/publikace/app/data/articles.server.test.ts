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
})
