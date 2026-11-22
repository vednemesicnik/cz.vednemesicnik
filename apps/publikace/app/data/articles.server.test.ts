import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { articleState, waitsOnEditors } from '../domain/article.ts'
import { createTestApp, seedArticle, seedIssue, type TestApp } from '../test-app.server.ts'
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
      assert.equal((await articles.waitingCountsByIssue()).get(issueId), 1)

      await articles.clearMissing(attempt.id, ['artworks', 'licences'])
      assert.deepEqual((await articles.findById(attempt.id))?.missing, {
        article: null,
        artworks: null,
        licences: null,
      })
      assert.equal((await articles.waitingCountsByIssue()).get(issueId), undefined)
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

describe('the handover to proofreading', () => {
  const MARIE = { email: 'marie@vednemesicnik.test', name: 'Marie Horáková' }
  const JANA = { email: 'jana.vesela@vednemesicnik.test', name: 'Jana Veselá' }
  const JAKUB = { email: 'jakub.novak@vednemesicnik.test', name: 'Jakub Novák' }
  const LATER = AT.add({ hours: 1 })

  it('records the first handover and refuses a second one, with the first in the answer', async () => {
    let app = await createTestApp()
    try {
      let articles = createArticleStore(app.database)
      let { articleId } = await seedArticle(app, await seedIssue(app))

      assert.deepEqual(await articles.handOver(articleId, MARIE, AT), { at: AT, kind: 'done' })
      assert.deepEqual(await articles.handOver(articleId, JANA, LATER), {
        kind: 'handed-over',
        step: { at: AT, ...MARIE },
      })
      assert.deepEqual((await articles.findById(articleId))?.handover, { at: AT, ...MARIE })
    } finally {
      await app.close()
    }
  })

  it('refuses to hand over or cancel an article a proofreader took meanwhile', async () => {
    let app = await createTestApp()
    try {
      let articles = createArticleStore(app.database)
      let { articleId } = await seedArticle(app, await seedIssue(app))
      await articles.handOver(articleId, MARIE, AT)
      await articles.takeProofreading(articleId, JAKUB, LATER, 'writing')

      let taken = { kind: 'proofreading', step: { at: LATER, ...JAKUB } }
      assert.deepEqual(await articles.cancelHandover(articleId, LATER), taken)

      let other = await seedArticle(app, (await articles.findById(articleId))?.issueId ?? 0, 'B')
      await articles.takeProofreading(other.articleId, JAKUB, LATER, 'writing')
      assert.deepEqual(await articles.handOver(other.articleId, MARIE, LATER), taken)
    } finally {
      await app.close()
    }
  })

  it('cancels once, and Vrátit brings the very handover back with its own time', async () => {
    let app = await createTestApp()
    try {
      let articles = createArticleStore(app.database)
      let { articleId } = await seedArticle(app, await seedIssue(app))
      await articles.handOver(articleId, MARIE, AT)

      assert.deepEqual(await articles.cancelHandover(articleId, LATER), { at: LATER, kind: 'done' })
      assert.deepEqual(await articles.cancelHandover(articleId, LATER), {
        kind: 'not-handed-over',
      })
      let cancelled = await articles.findById(articleId)
      assert.equal(cancelled?.handover, null)
      assert.deepEqual(cancelled?.cancelledHandover, { at: AT, cancelledAt: LATER })

      assert.deepEqual(await articles.restoreHandover(articleId, AT), { kind: 'not-handed-over' })
      assert.deepEqual(await articles.restoreHandover(articleId, LATER), { at: AT, kind: 'done' })
      assert.deepEqual((await articles.findById(articleId))?.handover, { at: AT, ...MARIE })
    } finally {
      await app.close()
    }
  })

  it('takes back only the handover Vrátit was offered for', async () => {
    let app = await createTestApp()
    try {
      let articles = createArticleStore(app.database)
      let { articleId } = await seedArticle(app, await seedIssue(app))
      await articles.handOver(articleId, MARIE, AT)

      assert.deepEqual(await articles.cancelHandover(articleId, LATER, LATER), {
        kind: 'handed-over',
        step: { at: AT, ...MARIE },
      })
      assert.deepEqual(await articles.cancelHandover(articleId, LATER, AT), {
        at: LATER,
        kind: 'done',
      })
    } finally {
      await app.close()
    }
  })

  it('lists for the digest the open issues’ handovers, and the cancelled ones a digest told of', async () => {
    let app = await createTestApp()
    try {
      let articles = createArticleStore(app.database)
      let issueId = await seedIssue(app)
      let told = await seedArticle(app, issueId, 'Oznámený')
      let quiet = await seedArticle(app, issueId, 'Zrušený bez oznámení')
      let taken = await seedArticle(app, issueId, 'V korektuře')
      let closedIssue = await seedIssue(app, 'VDM_2026_5')
      let closed = await seedArticle(app, closedIssue, 'V uzavřeném')
      for (let article of [told, quiet, taken, closed]) {
        await articles.handOver(article.articleId, MARIE, AT)
      }
      await articles.takeProofreading(taken.articleId, JAKUB, LATER, 'writing')
      /* Nothing in the app closes an issue yet; the column says what one would. */
      await app.database.exec(
        sql`UPDATE issues SET closed_at = ${LATER.toString()} WHERE id = ${closedIssue}`,
      )
      await articles.markAnnounced(
        { cancelled: [], handedOver: [{ handedOverAt: AT, id: told.articleId }] },
        LATER,
      )
      await articles.cancelHandover(told.articleId, LATER)
      await articles.cancelHandover(quiet.articleId, LATER)

      let listed = await articles.listForDigest()
      assert.deepEqual(
        listed.map((each) => [each.name, each.issueName, each.announcedAt, each.cancelledAt]),
        [['Oznámený', 'VDM_2026_6', LATER, LATER]],
      )
      assert.deepEqual(listed[0]?.authors, ['Tereza Vlková'])
    } finally {
      await app.close()
    }
  })

  it('still tells a cancellation or a restore made while the digest was being sent', async () => {
    let app = await createTestApp()
    try {
      let articles = createArticleStore(app.database)
      let issueId = await seedIssue(app)
      let cancelled = await seedArticle(app, issueId, 'Zrušený během odeslání')
      let restored = await seedArticle(app, issueId, 'Vrácený během odeslání')
      await articles.handOver(cancelled.articleId, MARIE, AT)
      await articles.handOver(restored.articleId, MARIE, AT)
      await articles.markAnnounced(
        { cancelled: [], handedOver: [{ handedOverAt: AT, id: restored.articleId }] },
        AT,
      )
      let cancelledAt = AT.add({ minutes: 1 })
      await articles.cancelHandover(restored.articleId, cancelledAt)

      /* The digest says the first is new and the second cancelled; meanwhile each changes. */
      await articles.cancelHandover(cancelled.articleId, LATER)
      await articles.restoreHandover(restored.articleId, cancelledAt)
      await articles.markAnnounced(
        {
          cancelled: [{ handedOverAt: AT, id: restored.articleId }],
          handedOver: [{ handedOverAt: AT, id: cancelled.articleId }],
        },
        LATER,
      )

      let listed = await articles.listForDigest()
      assert.deepEqual(
        listed.map((each) => [each.name, each.announcedAt, each.cancelledAt]),
        [
          ['Zrušený během odeslání', LATER, LATER],
          ['Vrácený během odeslání', null, null],
        ],
      )
    } finally {
      await app.close()
    }
  })

  it('marks as told only what did not change since the digest was made', async () => {
    let app = await createTestApp()
    try {
      let articles = createArticleStore(app.database)
      let issueId = await seedIssue(app)
      let kept = await seedArticle(app, issueId, 'A')
      let renewed = await seedArticle(app, issueId, 'B')
      await articles.handOver(kept.articleId, MARIE, AT)
      await articles.handOver(renewed.articleId, MARIE, AT)
      /* Cancelled and handed over again while the digest was on its way. */
      await articles.cancelHandover(renewed.articleId, AT.add({ minutes: 1 }))
      await articles.handOver(renewed.articleId, JANA, AT.add({ minutes: 2 }))

      await articles.markAnnounced(
        {
          cancelled: [],
          handedOver: [
            { handedOverAt: AT, id: kept.articleId },
            { handedOverAt: AT, id: renewed.articleId },
          ],
        },
        LATER,
      )
      let listed = await articles.listForDigest()
      assert.deepEqual(
        listed.map((each) => [each.name, each.announcedAt]),
        [
          ['A', LATER],
          ['B', null],
        ],
      )
    } finally {
      await app.close()
    }
  })
})

describe('taking proofreading', () => {
  const MARIE = { email: 'marie@vednemesicnik.test', name: 'Marie Horáková' }
  const JAKUB = { email: 'jakub.novak@vednemesicnik.test', name: 'Jakub Novák' }
  const LENKA = { email: 'lenka.svobodova@vednemesicnik.test', name: 'Lenka Svobodová' }
  const LATER = AT.add({ hours: 1 })
  const LAST = AT.add({ hours: 2 })

  it('takes once, from either state, and names who has it to the second taker', async () => {
    let app = await createTestApp()
    try {
      let articles = createArticleStore(app.database)
      let issueId = await seedIssue(app)
      let { articleId } = await seedArticle(app, issueId)

      assert.deepEqual(await articles.takeProofreading(articleId, JAKUB, AT, 'writing'), {
        at: AT,
        isHandedOver: false,
        kind: 'done',
      })
      assert.deepEqual(await articles.takeProofreading(articleId, LENKA, LATER, 'writing'), {
        kind: 'proofreading',
        step: { at: AT, ...JAKUB },
      })
      assert.deepEqual((await articles.findById(articleId))?.proofreading, { at: AT, ...JAKUB })
    } finally {
      await app.close()
    }
  })

  it('refuses a take from Dopsáno whose handover was cancelled, and lets one from Píše se through a handover', async () => {
    let app = await createTestApp()
    try {
      let articles = createArticleStore(app.database)
      let issueId = await seedIssue(app)
      let { articleId } = await seedArticle(app, issueId)
      await articles.handOver(articleId, MARIE, AT)
      await articles.cancelHandover(articleId, LATER)

      assert.deepEqual(await articles.takeProofreading(articleId, JAKUB, LAST, 'handedOver'), {
        isHandedOver: false,
        kind: 'not-proofreading',
      })

      let other = await seedArticle(app, issueId, 'B')
      await articles.handOver(other.articleId, MARIE, AT)
      assert.deepEqual(await articles.takeProofreading(other.articleId, JAKUB, LATER, 'writing'), {
        at: LATER,
        isHandedOver: true,
        kind: 'done',
      })
    } finally {
      await app.close()
    }
  })

  it('cancels only the take it was shown and only an owner’s, and the article returns where it was', async () => {
    let app = await createTestApp()
    try {
      let articles = createArticleStore(app.database)
      let issueId = await seedIssue(app)
      let { articleId } = await seedArticle(app, issueId)
      await articles.handOver(articleId, MARIE, AT)
      await articles.takeProofreading(articleId, JAKUB, LATER, 'handedOver')

      let taken = { kind: 'proofreading', step: { at: LATER, ...JAKUB } }
      assert.deepEqual(
        await articles.cancelProofreading(articleId, LAST, { owner: LENKA.email }),
        taken,
      )
      assert.deepEqual(
        await articles.cancelProofreading(articleId, LAST, { proofreadAt: AT }),
        taken,
      )
      assert.deepEqual(
        await articles.cancelProofreading(articleId, LAST, {
          owner: JAKUB.email,
          proofreadAt: LATER,
        }),
        { at: LAST, isHandedOver: true, kind: 'done' },
      )
      let row = await articles.findById(articleId)
      assert.equal(row?.proofreading, null)
      assert.deepEqual(row?.cancelledProofreading, { at: LATER, cancelledAt: LAST, ...JAKUB })
      assert.deepEqual(await articles.cancelProofreading(articleId, LAST), {
        isHandedOver: true,
        kind: 'not-proofreading',
      })
    } finally {
      await app.close()
    }
  })

  it('gives a cancelled take back whole, unless somebody took the article since', async () => {
    let app = await createTestApp()
    try {
      let articles = createArticleStore(app.database)
      let issueId = await seedIssue(app)
      let { articleId } = await seedArticle(app, issueId)
      await articles.takeProofreading(articleId, JAKUB, AT, 'writing')
      await articles.cancelProofreading(articleId, LATER)

      assert.deepEqual(await articles.restoreProofreading(articleId, LATER), {
        at: AT,
        isHandedOver: false,
        kind: 'done',
      })
      assert.deepEqual((await articles.findById(articleId))?.proofreading, { at: AT, ...JAKUB })

      await articles.cancelProofreading(articleId, LATER)
      await articles.takeProofreading(articleId, LENKA, LAST, 'writing')
      assert.deepEqual(await articles.restoreProofreading(articleId, LATER), {
        kind: 'proofreading',
        step: { at: LAST, ...LENKA },
      })
    } finally {
      await app.close()
    }
  })

  it('opens the handover and the digest to the article again once its take is cancelled', async () => {
    let app = await createTestApp()
    try {
      let articles = createArticleStore(app.database)
      let issueId = await seedIssue(app)
      let { articleId } = await seedArticle(app, issueId)
      await articles.handOver(articleId, MARIE, AT)
      await articles.takeProofreading(articleId, JAKUB, LATER, 'handedOver')
      assert.deepEqual(await articles.listForDigest(), [])
      assert.equal(await articles.queueCount(), 0)

      await articles.cancelProofreading(articleId, LAST)
      assert.deepEqual(
        (await articles.listForDigest()).map((each) => each.id),
        [articleId],
      )
      assert.equal(await articles.queueCount(), 1)
      assert.equal((await articles.cancelHandover(articleId, LAST)).kind, 'done')
    } finally {
      await app.close()
    }
  })

  it('refuses every step in a closed issue, and lists only open issues', async () => {
    let app = await createTestApp()
    try {
      let articles = createArticleStore(app.database)
      let issueId = await seedIssue(app)
      let { articleId } = await seedArticle(app, issueId)
      await articles.handOver(articleId, MARIE, AT)
      await articles.takeProofreading(articleId, JAKUB, AT, 'writing')
      await app.database.exec(
        sql`UPDATE issues SET closed_at = ${LATER.toString()} WHERE id = ${issueId}`,
      )

      let closed = { issueName: 'VDM_2026_6', kind: 'closed' }
      assert.deepEqual(await articles.cancelProofreading(articleId, LAST), closed)
      assert.deepEqual(await articles.takeProofreading(articleId, LENKA, LAST, 'writing'), closed)
      assert.deepEqual(await articles.listForQueue(), [])
      assert.deepEqual(await articles.findForQueue(articleId), {
        hasFinalVersion: false,
        isIssueClosed: true,
        issueName: 'VDM_2026_6',
        name: 'Školní jídelna po roce',
      })
    } finally {
      await app.close()
    }
  })
})

describe('what the articles add to Čeká na vás (11a, 01d, 12j)', () => {
  const LENKA = { email: 'lenka.svobodova@vednemesicnik.test', name: 'Lenka Svobodová' }
  const SENT = AT.add({ hours: 2 }).toString()

  /** The clause states of `clauseState`, written straight onto the marking's one clause. */
  const CLAUSES = {
    approved: sql`state = 'sent', sent_at = ${SENT}, reply_message_id = 'm-' || id,
      reply_received_at = ${SENT}, is_exact_consent = 1, approved_at = ${SENT},
      consent_file_id = 'c-' || id`,
    consent: sql`state = 'sent', sent_at = ${SENT}`,
    error: sql`state = 'failed'`,
    review: sql`state = 'sent', sent_at = ${SENT}, reply_message_id = 'm-' || id,
      reply_received_at = ${SENT}, reply_text = 'Souhlasím, ale…'`,
  }

  /** A created article in the issue with a final version marked and its clause as given. */
  async function marked(
    app: TestApp,
    issueId: number,
    clause: keyof typeof CLAUSES,
    options: { isDocRevised?: boolean; isFolderMissing?: boolean } = {},
  ): Promise<number> {
    let articles = createArticleStore(app.database)
    let { articleId } = await seedArticle(app, issueId)
    await articles.takeProofreading(articleId, LENKA, AT, 'writing')
    let outcome = await articles.markFinalVersion({
      at: AT.add({ hours: 1 }),
      by: LENKA,
      id: articleId,
      pdf: {
        attemptKey: `a-${articleId}`,
        docModifiedAt: AT,
        fileId: `pdf-${articleId}`,
        hash: `h-${articleId}`,
      },
      takenAt: AT,
    })
    assert.equal(outcome.kind, 'done')
    await app.database.exec(
      sql`UPDATE article_clauses SET ${CLAUSES[clause]} WHERE article_id = ${articleId}`,
    )
    if (options.isDocRevised === true) {
      await app.database.exec(
        sql`UPDATE final_versions SET doc_revised_at = ${AT.add({ hours: 24 }).toString()}
            WHERE article_id = ${articleId}`,
      )
    }
    if (options.isFolderMissing === true) await articles.markMissing(articleId, ['article'], AT)
    return articleId
  }

  it('counts each waiting tag and each article with a missing folder, as the domain reads them', async () => {
    let app = await createTestApp()
    try {
      let articles = createArticleStore(app.database)
      let issueId = await seedIssue(app)
      let ids = [
        (await seedArticle(app, issueId)).articleId,
        await marked(app, issueId, 'consent'),
        await marked(app, issueId, 'error'),
        await marked(app, issueId, 'review'),
        await marked(app, issueId, 'approved'),
        await marked(app, issueId, 'approved', { isDocRevised: true }),
        await marked(app, issueId, 'approved', { isFolderMissing: true }),
        await marked(app, issueId, 'error', { isFolderMissing: true }),
      ]
      /* A revision recorded against a version whose clauses still wait for a reply is not
         _Upraveno po schválení_: it is _K souhlasu_, which waits on nobody. */
      ids.push(await marked(app, issueId, 'consent', { isDocRevised: true }))

      let expected = 0
      for (let id of ids) {
        let article = await articles.findById(id)
        if (article === null) throw new Error('No article.')
        let isMissing = Object.values(article.missing).some((at) => at !== null)
        expected += (waitsOnEditors(articleState(article)) ? 1 : 0) + (isMissing ? 1 : 0)
      }
      let counts = await articles.waitingCountsByIssue()
      assert.equal(counts.get(issueId), expected)
      assert.equal(counts.get(issueId), 6)
    } finally {
      await app.close()
    }
  })

  it('leaves out a revised version that was cancelled, and an issue with nothing waiting', async () => {
    let app = await createTestApp()
    try {
      let articles = createArticleStore(app.database)
      let issueId = await seedIssue(app)
      let articleId = await marked(app, issueId, 'approved', { isDocRevised: true })
      assert.equal((await articles.waitingCountsByIssue()).get(issueId), 1)

      await app.database.exec(
        sql`UPDATE final_versions SET cancelled_at = ${SENT} WHERE article_id = ${articleId}`,
      )
      assert.equal((await articles.waitingCountsByIssue()).get(issueId), undefined)
    } finally {
      await app.close()
    }
  })
})
