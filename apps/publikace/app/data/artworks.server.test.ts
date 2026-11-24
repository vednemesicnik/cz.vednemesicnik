import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { createTestApp, seedArticle, seedIssue, type TestApp } from '../test-app.server.ts'
import { createArtworkStore, type NewUpload } from './artworks.server.ts'
import { createPublicMailLog } from './public-mail.server.ts'

const AT = Temporal.Instant.from('2026-11-18T12:45:00Z')
const ONDREJ = { email: 'ondrej.benes@external.test', name: 'Ondřej Beneš' }

async function setup(app: TestApp) {
  let issueId = await seedIssue(app)
  let article = await seedArticle(app, issueId)
  let artworks = createArtworkStore(app.database)
  let count = 0
  async function upload(
    formKey: string,
    extra: Partial<Omit<NewUpload, 'articleId' | 'groupId'>> = {},
  ) {
    count += 1
    return artworks.addUpload({
      articleId: article.articleId,
      groupId: null,
      at: AT,
      driveFileId: `img-${count}`,
      formKey,
      isReadable: true,
      linkId: article.link.id,
      mimeType: 'image/jpeg',
      originalName: `jidelna-${count}.jpg`,
      size: 1000,
      storedName: `${'a'.repeat(63)}${count}.jpg`,
      uploadKey: `upload-${count}`,
      ...extra,
    })
  }
  function batch(formKey: string, ids: number[], at = AT) {
    return artworks.startBatch({
      articleId: article.articleId,
      artworks: ids.map((id) => ({ author: id === ids[0] ? 'Ondřej Beneš' : '', id, source: '' })),
      at,
      formKey,
      issueId,
      linkId: article.link.id,
      provider: ONDREJ,
    })
  }
  return { article, artworks, batch, issueId, upload }
}

describe('the artwork store', () => {
  it('keeps a page’s uploads until a batch takes them, in their order', async () => {
    let app = await createTestApp()
    try {
      let { artworks, batch, upload } = await setup(app)
      let first = await upload('form')
      let second = await upload('form')
      await upload('other')

      assert.deepEqual(
        (await artworks.unsentByForm('form')).map((artwork) => artwork.id),
        [first.id, second.id],
      )
      let { batch: started, isNew } = await batch('form', [second.id, first.id])

      assert.equal(isNew, true)
      assert.equal(started.tag, '20261118T134500')
      assert.deepEqual(
        started.artworks.map((artwork) => [artwork.id, artwork.position, artwork.author]),
        [
          [second.id, 1, 'Ondřej Beneš'],
          [first.id, 2, null],
        ],
      )
      assert.deepEqual(await artworks.unsentByForm('form'), [])
    } finally {
      await app.close()
    }
  })

  it('returns the same batch for the same form key', async () => {
    let app = await createTestApp()
    try {
      let { batch, upload } = await setup(app)
      let artwork = await upload('form')
      let first = await batch('form', [artwork.id])
      let second = await batch('form', [artwork.id])
      assert.equal(second.isNew, false)
      assert.equal(second.batch.id, first.batch.id)
    } finally {
      await app.close()
    }
  })

  it('gives two batches of one article in one second distinct tags', async () => {
    let app = await createTestApp()
    try {
      let { batch, upload } = await setup(app)
      let one = await batch('a', [(await upload('a')).id])
      let two = await batch('b', [(await upload('b')).id])
      assert.equal(one.batch.tag, '20261118T134500')
      assert.equal(two.batch.tag, '20261118T134501')
    } finally {
      await app.close()
    }
  })

  it('refuses a batch whose artwork was removed or is unreadable, and writes nothing', async () => {
    let app = await createTestApp()
    try {
      let { artworks, batch, upload } = await setup(app)
      let removed = await upload('form')
      await artworks.markRemoved(removed.id, AT)
      await assert.rejects(() => batch('form', [removed.id]))
      let unreadable = await upload('form', { isReadable: false })
      await assert.rejects(() => batch('form', [unreadable.id]))
      assert.equal(await artworks.findBatchByFormKey('form'), null)
    } finally {
      await app.close()
    }
  })

  it('gives a failed attempt’s artworks back to their page, bare', async () => {
    let app = await createTestApp()
    try {
      let { artworks, batch, upload } = await setup(app)
      let artwork = await upload('form')
      let { batch: started } = await batch('form', [artwork.id])
      await artworks.setLicenceFile(artwork.id, 'pdf-1', 'hash')
      await artworks.markForCleanup(started.id, AT)
      assert.equal((await artworks.pendingCleanups()).length, 1)

      await artworks.discardAttempt(started.id)

      assert.equal(await artworks.findBatchByFormKey('form'), null)
      let [back] = await artworks.unsentByForm('form')
      assert.equal(back?.author, null)
      assert.equal(back?.licenceFileId, null)
    } finally {
      await app.close()
    }
  })

  it('counts a committed batch for the editors, and stops when they discard it', async () => {
    let app = await createTestApp()
    try {
      let { article, artworks, batch, issueId, upload } = await setup(app)
      let { batch: started } = await batch('form', [
        (await upload('form')).id,
        (await upload('form')).id,
      ])
      assert.deepEqual(await artworks.listByIssue(issueId), [])

      await artworks.commitBatch(started.id, AT)
      assert.deepEqual((await artworks.countsByIssue()).get(issueId), {
        approved: 0,
        total: 2,
        waiting: 2,
      })
      assert.equal((await artworks.countsByArticle(issueId)).get(article.articleId)?.error, 2)

      await artworks.markMail(started.id, 'sent', AT)
      assert.deepEqual((await artworks.countsByIssue()).get(issueId), {
        approved: 0,
        total: 2,
        waiting: 0,
      })

      await app.database.exec(
        sql`UPDATE artwork_batches SET approved_at = ${AT.toString()}, consent_file_id = 'c-1'
            WHERE id = ${started.id}`,
      )
      assert.deepEqual((await artworks.countsByIssue()).get(issueId), {
        approved: 2,
        total: 2,
        waiting: 0,
      })
      let [listed] = await artworks.listByIssue(issueId)
      assert.equal(listed?.holder.name, 'Školní jídelna po roce')
      assert.equal(listed?.holder.kind, 'article')

      await artworks.discardBatch(started.id, AT)
      assert.deepEqual(await artworks.listByIssue(issueId), [])
      assert.equal((await artworks.findBatch(started.id))?.artworks[0]?.removedAt?.equals(AT), true)
    } finally {
      await app.close()
    }
  })

  it('keeps a refusal apart from a failure, and never undoes a sent request', async () => {
    let app = await createTestApp()
    try {
      let { artworks, batch, upload } = await setup(app)
      let { batch: failed } = await batch('other', [(await upload('other')).id])
      await artworks.commitBatch(failed.id, AT)
      await artworks.markMail(failed.id, 'failed', AT)
      let failedRow = await artworks.findBatch(failed.id)
      assert.equal(failedRow?.mailRefusedAt, null)
      assert.equal(failedRow?.mailFailedAt?.equals(AT), true)

      let { batch: started } = await batch('form', [(await upload('form')).id])
      await artworks.commitBatch(started.id, AT)
      await artworks.markMail(started.id, 'refused', AT)
      assert.equal((await artworks.findBatch(started.id))?.mailRefusedAt?.equals(AT), true)

      await artworks.markMail(started.id, 'sent', AT)
      await artworks.markMail(started.id, 'failed', AT.add({ minutes: 1 }))
      let row = await artworks.findBatch(started.id)
      assert.equal(row?.mailSentAt?.equals(AT), true)
    } finally {
      await app.close()
    }
  })

  it('counts what the limits count', async () => {
    let app = await createTestApp()
    try {
      let { article, artworks, batch, upload } = await setup(app)
      let artwork = await upload('a')
      await upload('b', { at: AT.add({ minutes: 30 }) })
      await artworks.markRemoved(artwork.id, AT)
      assert.equal(await artworks.uploadsSince(article.link.id, AT), 2)
      assert.equal(await artworks.uploadsSince(article.link.id, AT.add({ minutes: 1 })), 1)

      let { batch: started } = await batch('c', [(await upload('c')).id])
      assert.equal(await artworks.recentBatches(article.link.id, AT), 1)
      /* A batch still making its licences counts, so sends in parallel cannot pass the limit. */
      assert.deepEqual(await artworks.recipientsSince(article.link.id, AT), [ONDREJ.email])
      await artworks.commitBatch(started.id, AT)
      assert.deepEqual(await artworks.recipientsSince(article.link.id, AT), [ONDREJ.email])
      assert.deepEqual(await artworks.recipientsSince(article.link.id, AT.add({ hours: 1 })), [])

      assert.equal((await artworks.expiredUploads(AT.add({ hours: 24, minutes: 1 }))).length, 1)
    } finally {
      await app.close()
    }
  })
})

describe('the public mail log', () => {
  it('counts the e-mails started since a moment', async () => {
    let app = await createTestApp()
    try {
      let log = createPublicMailLog(app.database)
      await log.record('welcome', 2, AT)
      await log.record('consent', 1, AT.add({ hours: 1 }))
      assert.equal(await log.countSince(AT), 3)
      assert.equal(await log.countSince(AT.add({ minutes: 1 })), 1)
    } finally {
      await app.close()
    }
  })
})
