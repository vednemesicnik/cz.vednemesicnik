import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { createArticleStore } from '../../data/articles.server.ts'
import { createArtworkStore, HolderRemovedError } from '../../data/artworks.server.ts'
import { createIssueStore } from '../../data/issues.server.ts'
import { createLinkStore } from '../../data/links.server.ts'
import { articleLinkPath, artworksLinkPath, type Link } from '../../domain/link.ts'
import { NBSP } from '../../domain/public/typography.ts'
import { now } from '../../domain/time.ts'
import {
  connectDriveAccount,
  createTestApp,
  JOB_TOKEN,
  seedAdmin,
  seedBatch,
  type TestApp,
  type TestBrowser,
} from '../../test-app.server.ts'

const MARIE = 'marie@vednemesicnik.test'
const LENKA = { email: 'lenka.svobodova@vednemesicnik.test', name: 'Lenka Svobodová' }
const TEREZA = { email: 'tereza.vlkova@external.test', name: 'Tereza Vlková' }
const ISSUE = 'VDM_2026_5'
const DETAIL = `/issues/${ISSUE}`
const NAME = 'Školní jídelna po roce'

function textOf(html: string): string {
  return html
    .replace(/<span class="vdm-sr-only">.*?<\/span>/gs, '')
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('&nbsp;', ' ')
    .replaceAll(NBSP, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ ([.,;?“)])/g, '$1')
    .replace(/„ /g, '„')
}

function statusText(html: string): string {
  let toasts = html.matchAll(/<div class="vdm-toast(?: [^"]*)?"[^>]*>(.*?)<\/div>/gs)
  return [...toasts].map((toast) => textOf(toast[1] ?? '').trim()).join(' | ')
}

/** The dialog's text, from its title to its buttons. */
function dialogOf(html: string): string {
  let start = html.indexOf('class="vdm-dialog"')
  if (start === -1) return ''
  let body = html.slice(html.indexOf('>', start) + 1, html.indexOf('</form>', start))
  return textOf(body).trim()
}

function calloutOf(html: string): string | null {
  let dialog = html.slice(html.indexOf('class="vdm-dialog"'))
  let found = /class="vdm-callout__body">(.*?)<\/div>/s.exec(dialog)
  return found === null ? null : textOf(found[1] ?? '').trim()
}

type Context = {
  app: TestApp
  articleId: number
  artworksLink: Link
  editor: TestBrowser
  issueId: number
}

/** An issue made through the app and one article through its link, its files on the fake Drive. */
async function withArticle(run: (context: Context) => Promise<void>): Promise<void> {
  let app = await createTestApp()
  try {
    await seedAdmin(app, MARIE)
    await connectDriveAccount(app)
    let editor = app.browser()
    await editor.signInAs(MARIE, 'Marie Horáková')
    assert.equal((await editor.post('/issues/new', { name: ISSUE }, '/issues/new')).status, 303)
    let issue = await createIssueStore(app.database).findByName(ISSUE)
    assert.ok(issue !== null)
    let link = await createLinkStore(app.database).articleLinkOf(issue.id)
    assert.ok(link !== null)
    let visitor = app.browser()
    let page = await (await visitor.get(articleLinkPath(link.key))).text()
    let formKey = /name="formKey" type="hidden" value="([^"]+)"/.exec(page)?.[1] ?? ''
    let body = new URLSearchParams({ formKey, intent: 'create', name: NAME })
    body.append('author-name', TEREZA.name)
    body.append('author-email', TEREZA.email)
    assert.equal((await visitor.send(articleLinkPath(link.key), body)).status, 200)
    let [article] = await createArticleStore(app.database).listCreated(issue.id)
    assert.ok(article !== undefined)
    let artworksLink = (await createLinkStore(app.database).artworksLinksOf(issue.id)).get(
      article.id,
    )
    assert.ok(artworksLink !== undefined)
    await run({ app, articleId: article.id, artworksLink, editor, issueId: issue.id })
  } finally {
    await app.close()
  }
}

function removePath(context: Context): string {
  return `${DETAIL}/articles/${context.articleId}/remove`
}

/**
 * The confirm, its CSRF token read from `from`: the dialog, or the detail when the dialog would
 * no longer open, as for a POST from a dialog left open while something changed.
 */
function remove(context: Context, from = removePath(context)): Promise<Response> {
  return context.editor.post(removePath(context), {}, from)
}

async function articleOf(context: Context) {
  let article = await createArticleStore(context.app.database).findById(context.articleId)
  assert.ok(article !== null)
  return article
}

function isTrashed(context: Context, id: string | null): boolean {
  return context.app.drive.files().find((file) => file.id === id)?.isTrashed === true
}

/** The batch the provider sent, then discarded by the editors, its reply waiting or not. */
async function discardedBatch(context: Context, options: { hasReply?: boolean } = {}) {
  let batch = await seedBatch(
    context.app,
    { articleId: context.articleId, link: context.artworksLink },
    context.issueId,
  )
  let reply = options.hasReply === true ? 'Napíšu zítra.' : null
  await context.app.database.exec(
    sql`UPDATE artwork_batches SET discarded_at = ${now().toString()},
          reply_message_id = ${reply === null ? null : 'msg-1'}, reply_text = ${reply},
          reply_received_at = ${reply === null ? null : now().toString()}
        WHERE id = ${batch.id}`,
  )
  return batch
}

function claimReplies(context: Context): Promise<Response> {
  return context.app.fetch(
    new Request('http://localhost/api/v1/artwork-replies/claim', {
      body: JSON.stringify({ intervalMinutes: 30 }),
      headers: { Authorization: `Bearer ${JOB_TOKEN}`, 'Content-Type': 'application/json' },
      method: 'POST',
    }),
  )
}

describe('removing an article (12z)', () => {
  it('stands last in the row’s „⋯“ on Píše se, and asks with every sentence of the drawing', () =>
    withArticle(async (context) => {
      let detail = await (await context.editor.get(DETAIL)).text()
      assert.ok(detail.includes(removePath(context)))
      assert.ok(detail.indexOf('Upravit autory…') < detail.indexOf('Odebrat článek…'))

      let html = await (await context.editor.get(removePath(context))).text()
      assert.equal(
        dialogOf(html),
        'Odebrat článek? Složka článku „Školní jídelna po roce“ se přesune do koše sdíleného disku Publikace i s dokumentem a vším ostatním, co v ní je. Článek zmizí z vydání a z Evidence. Odkaz na nahrání děl k článku přestane platit. Obnovením složky z koše se článek do aplikace nevrátí. Odebráním článku se žádný e-mail nepošle. Zrušit Odebrat článek',
      )
      assert.ok(
        html.includes('class="vdm-btn vdm-btn--danger vdm-btn--sm">Odebrat článek</button>'),
      )
    }))

  it('names Korektura and the morning digest on Dopsáno', () =>
    withArticle(async (context) => {
      let handOver = `${DETAIL}/articles/${context.articleId}/handover`
      assert.equal((await context.editor.post(handOver, {}, DETAIL)).status, 303)
      let html = await (await context.editor.get(removePath(context))).text()
      assert.ok(
        dialogOf(html).includes(
          'Článek zmizí z vydání, z Evidence i ze stránky Korektura. V dalších ranních přehledech už nebude. Odkaz na nahrání děl k článku přestane platit.',
        ),
      )
    }))

  it('is not offered with a batch that is not discarded, nor once proofreading began', () =>
    withArticle(async (context) => {
      await seedBatch(
        context.app,
        { articleId: context.articleId, link: context.artworksLink },
        context.issueId,
      )
      let detail = await (await context.editor.get(DETAIL)).text()
      assert.ok(!detail.includes(removePath(context)))
      let asked = await context.editor.get(removePath(context))
      assert.equal(asked.status, 303)
      assert.equal(asked.headers.get('Location'), DETAIL)
    }))

  it('bins the folder and leaves every list, count, queue, digest and record', () =>
    withArticle(async (context) => {
      let article = await articleOf(context)
      let handOver = `${DETAIL}/articles/${context.articleId}/handover`
      assert.equal((await context.editor.post(handOver, {}, DETAIL)).status, 303)
      let articles = createArticleStore(context.app.database)
      assert.equal((await articles.listForQueue()).length, 1)
      assert.equal(await articles.queueCount(), 1)
      await articles.markAnnounced(
        { cancelled: [], handedOver: [{ handedOverAt: now(), id: context.articleId }] },
        now(),
      )
      await context.app.database.exec(sql`DELETE FROM record_marks`)
      let mailBefore = context.app.mail.length

      let answered = await remove(context)
      assert.equal(answered.status, 303)
      assert.equal(answered.headers.get('Location'), DETAIL)
      assert.ok(isTrashed(context, article.folderId))

      let detail = await (await context.editor.get(DETAIL)).text()
      assert.equal(statusText(detail), 'Složka článku je v koši sdíleného disku Publikace.')
      assert.ok(!detail.includes(NAME))
      assert.deepEqual(await articles.listCreated(context.issueId), [])
      assert.equal((await articles.countsByIssue()).get(context.issueId), undefined)
      assert.deepEqual(await articles.listForQueue(), [])
      assert.equal(await articles.queueCount(), 0)
      /* Not even as a cancelled handover: the digest never speaks of it again. */
      assert.deepEqual(await articles.listForDigest(), [])
      let marks = await context.app.database.exec(sql`SELECT kind, issue_id FROM record_marks`)
      assert.deepEqual(
        (marks.rows ?? []).map((row) => [row['kind'], row['issue_id']]),
        [['evidence', context.issueId]],
      )
      assert.equal(
        (await context.app.browser().get(artworksLinkPath(context.artworksLink.key))).status,
        410,
      )
      assert.equal(context.app.mail.length, mailBefore)

      /* The issue holds nothing now, so it can be removed itself. */
      let issueRemove = await context.editor.get(`${DETAIL}/remove`)
      assert.equal(issueRemove.status, 200)
    }))

  it('marks the article’s unsent uploads removed, so the sweep leaves them to the bin', () =>
    withArticle(async (context) => {
      let artworks = createArtworkStore(context.app.database)
      let upload = await artworks.addUpload({
        articleId: context.articleId,
        at: now(),
        driveFileId: 'img-unsent',
        formKey: 'unsent-form',
        isReadable: true,
        linkId: context.artworksLink.id,
        mimeType: 'image/jpeg',
        originalName: 'trener.jpg',
        size: 1000,
        storedName: `${'b'.repeat(64)}.jpg`,
        uploadKey: 'upload-unsent',
      })
      assert.equal((await remove(context)).status, 303)
      assert.ok((await artworks.findUpload(upload.id))?.removedAt != null)
      assert.deepEqual(await artworks.expiredUploads(now().add({ hours: 48 })), [])
    }))

  it('takes a folder already in the bin as removed', () =>
    withArticle(async (context) => {
      let article = await articleOf(context)
      context.app.drive.trash(article.folderId ?? '')
      assert.equal((await remove(context)).status, 303)
      assert.ok((await articleOf(context)).removedAt !== null)
    }))

  it('refuses a file a person put in, and a folder somebody moved, and keeps the article', () =>
    withArticle(async (context) => {
      let article = await articleOf(context)
      context.app.drive.seedDoc('person-1', 'rozhovor-prepis.docx', article.artworksFolderId ?? '')
      let refused = await remove(context)
      assert.equal(refused.status, 409)
      assert.equal(
        calloutOf(await refused.text()),
        'Přesuňte ze složky článku soubory, které do ní nedala aplikace. Ve složce „Obrazová díla“: rozhovor-prepis.docx. Článek zůstal, jak byl.',
      )
      assert.equal((await articleOf(context)).removedAt, null)
      assert.ok(!isTrashed(context, article.folderId))

      context.app.drive.remove('person-1')
      context.app.drive.seedFolder('elsewhere', 'Jinde', 'root')
      context.app.drive.move(article.folderId ?? '', 'elsewhere')
      let moved = await remove(context)
      assert.equal(moved.status, 409)
      assert.equal(
        calloutOf(await moved.text()),
        'Vraťte složku článku do složky Články vydání VDM_2026_5. Teď je jinde, a tak článek zůstal, jak byl.',
      )
      assert.equal((await articleOf(context)).removedAt, null)
    }))

  it('keeps the article whole when Drive does not answer', () =>
    withArticle(async (context) => {
      context.app.drive.goDown()
      let refused = await remove(context)
      assert.equal(refused.status, 409)
      assert.equal(
        calloutOf(await refused.text()),
        'Zkuste článek odebrat za chvíli znovu. Článek zůstal, jak byl. Disk teď neodpovídá.',
      )
      assert.equal((await articleOf(context)).removedAt, null)
      assert.equal(
        (await context.app.browser().get(artworksLinkPath(context.artworksLink.key))).status,
        200,
      )
    }))

  it('writes nothing when a proofreader took it, artworks came, or the issue closed meanwhile', () =>
    withArticle(async (context) => {
      let articles = createArticleStore(context.app.database)
      let taken = await articles.takeProofreading(context.articleId, LENKA, now(), 'writing')
      assert.equal(taken.kind, 'done')
      await remove(context, DETAIL)
      let detail = await (await context.editor.get(DETAIL)).text()
      assert.ok(statusText(detail).startsWith('Korektura už probíhá. Článek zůstal ve vydání. od '))
      assert.ok(statusText(detail).endsWith('Lenka Svobodová'))
      assert.equal((await articleOf(context)).removedAt, null)

      await articles.cancelProofreading(context.articleId, now())
      await seedBatch(
        context.app,
        { articleId: context.articleId, link: context.artworksLink },
        context.issueId,
      )
      await remove(context, DETAIL)
      detail = await (await context.editor.get(DETAIL)).text()
      assert.equal(
        statusText(detail),
        'K článku mezitím přišla obrazová díla. Článek zůstal ve vydání.',
      )
      assert.equal((await articleOf(context)).removedAt, null)

      await context.app.database.exec(sql`UPDATE artwork_batches SET discarded_at = created_at`)
      await createIssueStore(context.app.database).close(context.issueId, now())
      await remove(context, DETAIL)
      detail = await (await context.editor.get(DETAIL)).text()
      assert.equal(statusText(detail), 'Vydání VDM_2026_5 je uzavřené. Článek zůstal ve vydání.')
      assert.equal((await articleOf(context)).removedAt, null)
    }))

  it('refuses a batch the provider’s page starts after the removal', () =>
    withArticle(async (context) => {
      assert.equal((await remove(context)).status, 303)
      await assert.rejects(
        () =>
          seedBatch(
            context.app,
            { articleId: context.articleId, link: context.artworksLink },
            context.issueId,
          ),
        HolderRemovedError,
      )
    }))

  it('says what happens to replies to discarded batches, and then claims none of them', () =>
    withArticle(async (context) => {
      await discardedBatch(context)
      let html = await (await context.editor.get(removePath(context))).text()
      assert.ok(
        dialogOf(html).endsWith(
          'Odebráním článku se žádný e-mail nepošle. Pokud ještě přijde odpověď na žádost k zahozené dávce, najdete ji jen ve schránce publikace@. Zrušit Odebrat článek',
        ),
      )

      let waiting = await discardedBatch(context, { hasReply: true })
      html = await (await context.editor.get(removePath(context))).text()
      assert.ok(
        dialogOf(html).includes(
          'Pokud ještě přijde odpověď na žádost k zahozeným dávkám, najdete ji jen ve schránce publikace@. Odebráním článku zmizí z části Ke kontrole i odpověď, která tam už čeká.',
        ),
      )
      let artworks = createArtworkStore(context.app.database)
      assert.deepEqual(
        (await artworks.reviewQueue()).map((batch) => batch.id),
        [waiting.id],
      )

      assert.equal((await remove(context)).status, 303)
      assert.deepEqual(await artworks.reviewQueue(), [])
      assert.equal(await artworks.reviewCount(), 0)
      let claimed = (await (await claimReplies(context)).json()) as { batches: unknown[] }
      assert.deepEqual(claimed.batches, [])
    }))

  it('goes back to the detail when the article was removed in another tab', () =>
    withArticle(async (context) => {
      assert.equal((await remove(context)).status, 303)
      let again = await remove(context, DETAIL)
      assert.equal(again.status, 303)
      assert.equal(again.headers.get('Location'), DETAIL)
    }))
})
