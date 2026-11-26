import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { createArticleStore } from '../../data/articles.server.ts'
import { createProofreadersStore } from '../../data/proofreaders.server.ts'
import {
  createTestApp,
  seedAdmin,
  seedArticle,
  seedIssue,
  type TestApp,
  type TestBrowser,
} from '../../test-app.server.ts'

const MARIE = { email: 'marie@vednemesicnik.test', name: 'Marie Horáková' }
const LENKA = { email: 'lenka.svobodova@vednemesicnik.test', name: 'Lenka Svobodová' }
const JAKUB = { email: 'jakub.novak@vednemesicnik.test', name: 'Jakub Novák' }
const PROOFREADERS = 'korektura@vednemesicnik.test'
const ISSUE = 'VDM_2026_6'
const PAGE = '/proofreading'
const PROOFREADER = { isEditor: false, isProofreader: true }

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replaceAll(' ', ' ')
    .replace(/\s+/g, ' ')
    .replace(/ ([.,;)])/g, '$1')
}

/** The confirmations' toasts, each with its line and its action. */
function statusText(html: string): string {
  let toasts = html.matchAll(/<div class="vdm-toast(?: [^"]*)?"[^>]*>(.*?)<\/div>/gs)
  return [...toasts].map((toast) => textOf(toast[1] ?? '').trim()).join(' | ')
}

/** Where the toast's _Vrátit_ posts. */
function toastAction(html: string): string | null {
  let toast = /<div class="vdm-toast(?: [^"]*)?"[^>]*>(.*?)<\/div>/s.exec(html)?.[1] ?? ''
  return /action="([^"]*)"/.exec(toast)?.[1]?.replaceAll('&amp;', '&') ?? null
}

/** The headings of the parts, in their order, with their counts. */
function partsOf(html: string): string[] {
  return [...html.matchAll(/<h2[^>]*class="h2"[^>]*>(.*?)<\/h2>/gs)].map((part) =>
    textOf(part[1] ?? '').trim(),
  )
}

/** Whether the card offers _Zrušit korekturu_: the „⋯“ is an island, its items in its props. */
function canCancel(html: string, id: number): boolean {
  return html.includes(`"action":"/proofreading/articles/${id}/cancel?take=`)
}

/** One card's text, by the article's ID. */
function cardOf(html: string, id: number): string {
  let card = new RegExp(`<li[^>]*id="article-${id}"[^>]*>(.*?)</li>`, 's').exec(html)
  return textOf(card?.[1] ?? '')
}

async function newsroom(): Promise<{
  app: TestApp
  articleId: number
  issueId: number
  editor: TestBrowser
  proofreader: TestBrowser
}> {
  let app = await createTestApp()
  await seedAdmin(app, MARIE.email)
  await createProofreadersStore(app.database).save(
    PROOFREADERS,
    MARIE.email,
    Temporal.Now.instant(),
  )
  app.setMembership(PROOFREADERS, (email) =>
    email === LENKA.email || email === JAKUB.email
      ? { displayName: null, groupName: null, status: 'member' }
      : { groupName: null, status: 'not-member' },
  )
  let issueId = await seedIssue(app, ISSUE)
  let { articleId } = await seedArticle(app, issueId, 'Kavárna v knihovně')
  let editor = app.browser()
  await editor.signInAs(MARIE.email, MARIE.name)
  let proofreader = app.browser()
  await proofreader.signInAs(LENKA.email, LENKA.name, Date.now() + 60_000, PROOFREADER)
  return { app, articleId, editor, issueId, proofreader }
}

function takePath(id: number): string {
  return `${PAGE}/articles/${id}`
}

describe('a proofreader in the app (10d)', () => {
  it('takes a proofreader from / to the page, and refuses the editors’ screens in place', async () => {
    let { app, proofreader } = await newsroom()
    try {
      let home = await proofreader.get('/')
      assert.equal(home.status, 303)
      assert.equal(home.headers.get('Location'), PAGE)

      for (let path of [`/issues/${ISSUE}`, '/review', '/settings']) {
        let answer = await proofreader.get(path)
        assert.equal(answer.status, 403, path)
        let text = textOf(await answer.text())
        assert.ok(text.includes('Sem má přístup jen šéfredakce'), path)
        assert.ok(text.includes('Přejít na Korekturu'), path)
        assert.ok(!text.includes('Vydání Ke kontrole'), path)
      }
    } finally {
      await app.close()
    }
  })

  it('writes nothing from a form of the editors', async () => {
    let { app, articleId, proofreader } = await newsroom()
    try {
      let answer = await proofreader.post(
        `/issues/${ISSUE}/articles/${articleId}/handover`,
        {},
        PAGE,
      )
      assert.equal(answer.status, 403)
      let article = await createArticleStore(app.database).findById(articleId)
      assert.equal(article?.handover, null)
    } finally {
      await app.close()
    }
  })

  it('gives the proofreader one section in the panel with the number of what waits', async () => {
    let { app, articleId, proofreader } = await newsroom()
    try {
      await createArticleStore(app.database).handOver(articleId, MARIE, Temporal.Now.instant())
      let html = await (await proofreader.get(PAGE)).text()
      let nav = /<nav aria-label="Sekce aplikace"[^>]*>(.*?)<\/nav>/s.exec(html)?.[1] ?? ''
      assert.equal(textOf(nav).trim(), 'Korektura 1')
    } finally {
      await app.close()
    }
  })
})

describe('the page Korektura (15a, 15b, 15e)', () => {
  it('lays the articles out in their parts, with the steps of each role', async () => {
    let { app, articleId, editor, issueId, proofreader } = await newsroom()
    try {
      let articles = createArticleStore(app.database)
      let at = Temporal.Instant.from('2026-11-20T08:00:00Z')
      await articles.handOver(articleId, MARIE, at)
      let mine = await seedArticle(app, issueId, 'Proč nechodíme volit')
      await articles.takeProofreading(mine.articleId, LENKA, at, 'writing')
      let others = await seedArticle(app, issueId, 'Volební kampaň na sítích')
      await articles.takeProofreading(others.articleId, JAKUB, at, 'writing')
      let writing = await seedArticle(app, issueId, 'Sport na středních')

      let html = await (await proofreader.get(PAGE)).text()
      assert.deepEqual(partsOf(html), [
        'Moje korektury 1',
        'Čeká na korekturu 1',
        'V korektuře 1',
        'Ještě se píšou 1',
      ])
      assert.ok(textOf(html).includes('Než začnete opravovat, zvolte u článku Vzít si korekturu.'))
      assert.ok(cardOf(html, articleId).includes('Vzít si korekturu'))
      assert.ok(cardOf(html, articleId).includes('Vydání VDM_2026_6'))
      assert.ok(cardOf(html, writing.articleId).includes('Vzít si korekturu'))
      assert.ok(canCancel(html, mine.articleId))
      assert.ok(!canCancel(html, others.articleId))
      assert.ok(!html.includes('tereza.vlkova@external.test'))

      let editorHtml = await (await editor.get(PAGE)).text()
      assert.deepEqual(partsOf(editorHtml), [
        'Čeká na korekturu 1',
        'V korektuře 2',
        'Ještě se píšou 1',
      ])
      assert.ok(!editorHtml.includes('Vzít si korekturu'))
      assert.ok(canCancel(editorHtml, others.articleId))
      assert.ok(!textOf(editorHtml).includes('Než začnete opravovat'))
    } finally {
      await app.close()
    }
  })

  it('says what an empty page and an empty Čeká mean, by role', async () => {
    let { app, articleId, editor, proofreader } = await newsroom()
    try {
      let articles = createArticleStore(app.database)
      await articles.takeProofreading(articleId, LENKA, Temporal.Now.instant(), 'writing')
      let nothingWaiting = await (await proofreader.get(PAGE)).text()
      assert.deepEqual(partsOf(nothingWaiting), ['Moje korektury 1', 'Čeká na korekturu'])
      assert.ok(
        nothingWaiting.includes(
          '<div class="vdm-empty"><p class="vdm-empty__text">Žádný článek teď nečeká na korekturu.</p></div>',
        ),
      )

      await app.database.exec(sql`DELETE FROM article_authors`)
      await app.database.exec(sql`DELETE FROM articles`)
      let empty = textOf(await (await proofreader.get(PAGE)).text())
      assert.ok(empty.includes('Nic ke korektuře'))
      assert.ok(empty.includes('Až šéfredakce předá článek ke korektuře, objeví se tady.'))
      assert.ok(!empty.includes('Přejít na vydání'))
      assert.ok(textOf(await (await editor.get(PAGE)).text()).includes('Přejít na vydání'))
      assert.equal(await articles.findById(articleId), null)
    } finally {
      await app.close()
    }
  })

  it('sends a link from the digest to its card, and says why an article of a closed issue is not here', async () => {
    let { app, articleId, issueId, proofreader } = await newsroom()
    try {
      let never = await seedArticle(app, issueId, 'Nikdy nepředaný')
      await createArticleStore(app.database).handOver(articleId, MARIE, Temporal.Now.instant())
      let linked = await proofreader.get(`${PAGE}?article=${articleId}`)
      assert.equal(linked.status, 303)
      assert.equal(linked.headers.get('Location'), `${PAGE}#article-${articleId}`)

      await app.database.exec(
        sql`UPDATE issues SET closed_at = ${new Date().toISOString()} WHERE id = ${issueId}`,
      )
      let closed = textOf(await (await proofreader.get(`${PAGE}?article=${articleId}`)).text())
      assert.ok(closed.includes('„Kavárna v knihovně“ Vydání VDM_2026_6 je uzavřené.'))
      /* Only a handed-over article was ever in a digest: an ID tried by hand learns nothing. */
      let guessed = textOf(
        await (await proofreader.get(`${PAGE}?article=${never.articleId}`)).text(),
      )
      assert.ok(!guessed.includes('Nikdy nepředaný'))
      assert.ok(textOf(await (await proofreader.get(PAGE)).text()).includes('Nic ke korektuře'))
    } finally {
      await app.close()
    }
  })
})

describe('taking and cancelling proofreading (15d)', () => {
  it('takes at once, keeps the card where it was, and Vrátit takes it back', async () => {
    let { app, articleId, proofreader } = await newsroom()
    try {
      let articles = createArticleStore(app.database)
      await articles.handOver(articleId, MARIE, Temporal.Now.instant())

      let answer = await proofreader.post(takePath(articleId), { shown: 'handedOver' }, PAGE)
      assert.equal(answer.status, 303)
      assert.equal(answer.headers.get('Location'), `${PAGE}#article-${articleId}`)
      assert.equal((await articles.findById(articleId))?.proofreading?.email, LENKA.email)

      let html = await (await proofreader.get(PAGE)).text()
      assert.equal(statusText(html), 'Teď máte korekturu na starosti vy. Vrátit')
      assert.deepEqual(partsOf(html), ['Čeká na korekturu 1'])
      assert.ok(cardOf(html, articleId).includes('Korektura'))
      assert.ok(cardOf(html, articleId).includes('Vrátit'))

      let undo = toastAction(html)
      assert.ok(undo !== null)
      await proofreader.post(undo, {}, PAGE)
      assert.equal((await articles.findById(articleId))?.proofreading, null)
      assert.deepEqual(partsOf(await (await proofreader.get(PAGE)).text()), ['Čeká na korekturu 1'])
    } finally {
      await app.close()
    }
  })

  it('lets an editor-in-chief cancel anyone’s take, and Vrátit gives it back to who had it', async () => {
    let { app, articleId, editor } = await newsroom()
    try {
      let articles = createArticleStore(app.database)
      let at = Temporal.Instant.from('2026-11-20T08:00:00Z')
      await articles.handOver(articleId, MARIE, at)
      await articles.takeProofreading(articleId, JAKUB, at.add({ hours: 1 }), 'handedOver')

      let page = await (await editor.get(PAGE)).text()
      let cancel = /"action":"(\/proofreading\/articles\/\d+\/cancel\?take=[^"]*)"/.exec(page)?.[1]
      assert.ok(cancel !== undefined)
      await editor.post(cancel, {}, PAGE)
      let html = await (await editor.get(PAGE)).text()
      assert.equal(statusText(html), 'Článek znovu čeká na korekturu. Vrátit')

      let restore = toastAction(html)
      assert.ok(restore !== null)
      await editor.post(restore, {}, PAGE)
      assert.deepEqual((await articles.findById(articleId))?.proofreading, {
        at: at.add({ hours: 1 }),
        ...JAKUB,
      })
    } finally {
      await app.close()
    }
  })

  it('refuses a proofreader somebody else’s take, and an editor-in-chief a take', async () => {
    let { app, articleId, editor, proofreader } = await newsroom()
    try {
      let articles = createArticleStore(app.database)
      let at = Temporal.Instant.from('2026-11-21T09:00:00Z')
      await articles.takeProofreading(articleId, JAKUB, at, 'writing')

      let take = encodeURIComponent(at.toString({ smallestUnit: 'millisecond' }))
      await proofreader.post(`${takePath(articleId)}/cancel?take=${take}`, {}, PAGE)
      assert.equal(
        statusText(await (await proofreader.get(PAGE)).text()),
        'Korektura už probíhá. od 21. 11. · Jakub Novák',
      )
      assert.equal((await articles.findById(articleId))?.proofreading?.email, JAKUB.email)

      let other = await seedArticle(app, (await articles.findById(articleId))?.issueId ?? 0, 'B')
      await editor.post(takePath(other.articleId), { shown: 'writing' }, PAGE)
      assert.equal(
        statusText(await (await editor.get(PAGE)).text()),
        'Váš účet už není mezi korektory.',
      )
      assert.equal((await articles.findById(other.articleId))?.proofreading, null)
    } finally {
      await app.close()
    }
  })

  it('writes nothing over a card that changed meanwhile, and says why', async () => {
    let { app, articleId, issueId, proofreader } = await newsroom()
    try {
      let articles = createArticleStore(app.database)
      let at = Temporal.Instant.from('2026-11-21T09:00:00Z')
      await articles.handOver(articleId, MARIE, at)
      await articles.cancelHandover(articleId, at.add({ minutes: 5 }))
      await proofreader.post(takePath(articleId), { shown: 'handedOver' }, PAGE)
      assert.equal(
        statusText(await (await proofreader.get(PAGE)).text()),
        'Šéfredakce mezitím zrušila předání. Článek nemáte v korektuře.',
      )

      let taken = await seedArticle(app, issueId, 'B')
      await articles.takeProofreading(taken.articleId, JAKUB, at, 'writing')
      await proofreader.post(takePath(taken.articleId), { shown: 'writing' }, PAGE)
      assert.equal(
        statusText(await (await proofreader.get(PAGE)).text()),
        'Korektura už probíhá. od 21. 11. · Jakub Novák',
      )

      await app.database.exec(
        sql`UPDATE issues SET closed_at = ${new Date().toISOString()} WHERE id = ${issueId}`,
      )
      await proofreader.post(takePath(articleId), { shown: 'writing' }, PAGE)
      assert.equal(
        statusText(await (await proofreader.get(PAGE)).text()),
        'Vydání VDM_2026_6 je uzavřené. Korekturu už si nelze vzít.',
      )
    } finally {
      await app.close()
    }
  })
})
