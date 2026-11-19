import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { isLinkKey } from '../domain/link.ts'
import { createTestApp, seedIssue } from '../test-app.server.ts'
import { createArticleStore } from './articles.server.ts'
import { createIssueStore } from './issues.server.ts'
import { createLinkStore, newLinkKey } from './links.server.ts'

const AT = Temporal.Instant.from('2026-11-18T09:00:00Z')

describe('newLinkKey', () => {
  it('draws twelve characters of the alphabet, a different key each time', () => {
    let keys = new Set(Array.from({ length: 200 }, () => newLinkKey()))
    assert.equal(keys.size, 200)
    for (let key of keys) assert.ok(isLinkKey(key), key)
  })
})

describe('the link store', () => {
  it('gives an issue its link for new articles when it is completed, and only then', async () => {
    let app = await createTestApp()
    try {
      let links = createLinkStore(app.database)
      let unfinished = await seedIssue(app, 'VDM_2026_5', { isComplete: false })
      let complete = await seedIssue(app, 'VDM_2026_6')

      assert.equal(await links.articleLinkOf(unfinished), null)
      let link = await links.articleLinkOf(complete)
      assert.ok(link !== null)
      assert.equal(link.kind, 'article')
      assert.ok(isLinkKey(link.key))
    } finally {
      await app.close()
    }
  })

  it('keeps the one link when the issue is completed again', async () => {
    let app = await createTestApp()
    try {
      let links = createLinkStore(app.database)
      let id = await seedIssue(app)
      let first = await links.articleLinkOf(id)
      await createIssueStore(app.database).complete(id, AT.add({ hours: 1 }))

      assert.equal((await links.articleLinkOf(id))?.key, first?.key)
    } finally {
      await app.close()
    }
  })

  it('replaces the link on renewal: the old one is revoked, the new one starts from nothing', async () => {
    let app = await createTestApp()
    try {
      let links = createLinkStore(app.database)
      let articles = createArticleStore(app.database)
      let id = await seedIssue(app)
      let old = await links.articleLinkOf(id)
      assert.ok(old !== null)
      let { attempt } = await articles.startAttempt({
        at: AT,
        authors: [{ email: 'tereza.vlkova@external.test', name: 'Tereza Vlková' }],
        formKey: 'form-1',
        issueId: id,
        linkId: old.id,
        name: 'Školní jídelna po roce',
      })
      await articles.setDriveId(attempt.id, 'folder', 'f-a')
      await articles.setDriveId(attempt.id, 'artworks-folder', 'f-a-artworks')
      await articles.setDriveId(attempt.id, 'licences-folder', 'f-a-licences')
      await articles.setDriveId(attempt.id, 'doc', 'd-a')
      await articles.setDriveId(attempt.id, 'meta', 'm-a')
      await articles.commit(attempt.id, AT)

      let renewed = await links.renew(id, AT.add({ hours: 2 }))

      assert.notEqual(renewed.key, old.key)
      assert.ok((await links.findByKey(old.key))?.revokedAt !== null)
      assert.equal((await links.articleLinkOf(id))?.key, renewed.key)
      assert.deepEqual(await links.usage(renewed.id), { count: 0, lastAt: null })
      assert.equal((await links.usage(old.id)).count, 1)
    } finally {
      await app.close()
    }
  })
})
