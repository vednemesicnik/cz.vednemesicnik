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

const MARIE = 'marie@vednemesicnik.test'
const JANA = { email: 'jana.vesela@vednemesicnik.test', name: 'Jana Veselá' }
const JAKUB = { email: 'jakub.novak@vednemesicnik.test', name: 'Jakub Novák' }
const ISSUE = 'VDM_2026_6'
const DETAIL = `/issues/${ISSUE}`

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replaceAll(' ', ' ')
    .replace(/\s+/g, ' ')
    .replace(/ ([.,;)])/g, '$1')
}

/** The confirmations' toasts, each with its line and its action. */
function statusText(html: string): string {
  let toasts = html.matchAll(/<div class="vdm-toast(?: [^"]*)?"[^>]*>(.*?)<\/div>/gs)
  return [...toasts].map((toast) => textOf(toast[1] ?? '').trim()).join(' | ')
}

/** Where the toast's _Vrátit_ posts, if it has one. */
function undoAction(html: string): string | null {
  let form = /action="([^"]*\?undo=[^"]*)"/.exec(html)
  return form?.[1]?.replaceAll('&amp;', '&') ?? null
}

async function newsroom(options: { isAdmin?: boolean } = {}): Promise<{
  app: TestApp
  articleId: number
  browser: TestBrowser
}> {
  let app = await createTestApp()
  await seedAdmin(app, MARIE)
  let issueId = await seedIssue(app, ISSUE)
  let { articleId } = await seedArticle(app, issueId, 'Kavárna v knihovně')
  let browser = app.browser()
  if (options.isAdmin === false) {
    await app.directory.addAccount(MARIE, JANA.email, Temporal.Now.instant())
    await browser.signInAs(JANA.email, JANA.name)
  } else {
    await browser.signInAs(MARIE, 'Marie Horáková')
  }
  return { app, articleId, browser }
}

function handOverPath(id: number): string {
  return `${DETAIL}/articles/${id}/handover`
}

describe('handing an article over to proofreading (12k, 12l)', () => {
  it('offers the button on Píše se, and after it Dopsáno with Zrušit předání and Vrátit', async () => {
    let { app, articleId, browser } = await newsroom()
    try {
      let before = await (await browser.get(DETAIL)).text()
      assert.ok(before.includes(`action="${handOverPath(articleId)}"`))
      assert.ok(before.includes('aria-label="Předat ke korektuře článek Kavárna v knihovně"'))
      assert.ok(!textOf(before).includes('Zrušit předání'))

      let answer = await browser.post(handOverPath(articleId), {}, DETAIL)
      assert.equal(answer.status, 303)
      assert.equal(answer.headers.get('Location'), DETAIL)

      let after = await (await browser.get(DETAIL)).text()
      assert.equal(statusText(after), 'Článek je předaný ke korektuře. Vrátit')
      assert.ok(textOf(after).includes('Dopsáno'))
      assert.ok(!after.includes(`action="${handOverPath(articleId)}"`))
      assert.ok(textOf(after).includes('Zrušit předání'))
      let handover = (await createArticleStore(app.database).findById(articleId))?.handover
      assert.equal(handover?.email, MARIE)
      assert.equal(handover?.name, 'Marie Horáková')

      let undo = undoAction(after)
      assert.ok(undo?.startsWith(`${handOverPath(articleId)}/cancel?undo=`))
      await browser.post(undo ?? '', {}, DETAIL)
      assert.equal((await createArticleStore(app.database).findById(articleId))?.handover, null)
      assert.equal(statusText(await (await browser.get(DETAIL)).text()), '')
    } finally {
      await app.close()
    }
  })

  it('keeps a row where it stood after the step, and after its Vrátit', async () => {
    let { app, articleId, browser } = await newsroom()
    try {
      let issueId = (await createArticleStore(app.database).findById(articleId))?.issueId ?? 0
      await seedArticle(app, issueId, 'Zahrada na střeše')
      await seedArticle(app, issueId, 'Volební kampaň')
      let order = async () => {
        let html = await (await browser.get(DETAIL)).text()
        return [...html.matchAll(/(Kavárna v knihovně|Zahrada na střeše|Volební kampaň)/g)]
          .map((match) => match[1])
          .filter((name, index, all) => all.indexOf(name) === index)
      }
      let before = await order()

      await browser.post(handOverPath(articleId), {}, DETAIL)
      let html = await (await browser.get(DETAIL)).text()
      let undo = undoAction(html)
      assert.deepEqual(
        [...html.matchAll(/(Kavárna v knihovně|Zahrada na střeše|Volební kampaň)/g)]
          .map((match) => match[1])
          .filter((name, index, all) => all.indexOf(name) === index),
        before,
      )
      await browser.post(undo ?? '', {}, DETAIL)
      assert.deepEqual(await order(), before)
    } finally {
      await app.close()
    }
  })

  it('cancels a handover, and Vrátit brings back the very one, its time included', async () => {
    let { app, articleId, browser } = await newsroom()
    try {
      let articles = createArticleStore(app.database)
      let monday = Temporal.Instant.from('2026-11-16T09:00:00Z')
      await articles.handOver(articleId, JANA, monday)

      await browser.post(`${handOverPath(articleId)}/cancel`, {}, DETAIL)
      let after = await (await browser.get(DETAIL)).text()
      assert.equal(statusText(after), 'Předání je zrušené. Vrátit')
      assert.equal((await articles.findById(articleId))?.handover, null)

      await browser.post(undoAction(after) ?? '', {}, DETAIL)
      assert.deepEqual((await articles.findById(articleId))?.handover, { at: monday, ...JANA })
    } finally {
      await app.close()
    }
  })

  it('says who handed it over meanwhile, and writes nothing twice', async () => {
    let { app, articleId, browser } = await newsroom()
    try {
      let articles = createArticleStore(app.database)
      let at = Temporal.Instant.from('2026-11-21T08:40:00Z')
      await articles.handOver(articleId, JANA, at)

      await browser.post(handOverPath(articleId), {}, DETAIL)
      let html = await (await browser.get(DETAIL)).text()
      assert.equal(
        statusText(html),
        'Článek už je předaný ke korektuře. 21. 11. v 9:40 · Jana Veselá',
      )
      assert.ok(html.includes('class="vdm-toast__detail"'))
      assert.equal(undoAction(html), null)
      assert.deepEqual((await articles.findById(articleId))?.handover, { at, ...JANA })
    } finally {
      await app.close()
    }
  })

  it('says a proofreader took it meanwhile, for a handover and for a cancellation', async () => {
    let { app, articleId, browser } = await newsroom()
    try {
      let articles = createArticleStore(app.database)
      let at = Temporal.Instant.from('2026-11-21T08:40:00Z')
      await articles.handOver(articleId, JANA, at)
      await articles.markProofread(articleId, JAKUB, at.add({ minutes: 5 }))

      await browser.post(`${handOverPath(articleId)}/cancel`, {}, DETAIL)
      assert.equal(
        statusText(await (await browser.get(DETAIL)).text()),
        'Předání už nelze zrušit. Korektura probíhá od 21. 11. · Jakub Novák.',
      )

      let other = await seedArticle(app, (await articles.findById(articleId))?.issueId ?? 0, 'B')
      await articles.markProofread(other.articleId, JAKUB, at)
      await browser.post(handOverPath(other.articleId), {}, DETAIL)
      assert.equal(
        statusText(await (await browser.get(DETAIL)).text()),
        'Korektura už probíhá. od 21. 11. · Jakub Novák',
      )
    } finally {
      await app.close()
    }
  })

  it('says a handover cancelled meanwhile is cancelled already', async () => {
    let { app, articleId, browser } = await newsroom()
    try {
      await browser.post(`${handOverPath(articleId)}/cancel`, {}, DETAIL)
      assert.equal(statusText(await (await browser.get(DETAIL)).text()), 'Předání už je zrušené.')
    } finally {
      await app.close()
    }
  })

  it('offers neither step in a closed issue, and refuses both', async () => {
    let { app, articleId, browser } = await newsroom()
    try {
      await app.database.exec(
        sql`UPDATE issues SET closed_at = ${Temporal.Now.instant().toString()}`,
      )
      let html = await (await browser.get(DETAIL)).text()
      assert.ok(!html.includes(`action="${handOverPath(articleId)}"`))

      await browser.post(handOverPath(articleId), {}, DETAIL)
      assert.equal(
        statusText(await (await browser.get(DETAIL)).text()),
        `Vydání ${ISSUE} je uzavřené. Článek už nelze předat ke korektuře.`,
      )
      assert.equal((await createArticleStore(app.database).findById(articleId))?.handover, null)
    } finally {
      await app.close()
    }
  })

  it('answers an article of another issue as unknown', async () => {
    let { app, browser } = await newsroom()
    try {
      let otherIssue = await seedIssue(app, 'VDM_2026_7')
      let other = await seedArticle(app, otherIssue, 'Jinde')
      assert.equal((await browser.post(handOverPath(other.articleId), {}, DETAIL)).status, 404)
    } finally {
      await app.close()
    }
  })

  it('warns over the articles while a handed-over one has no proofreaders to go to', async () => {
    let { app, articleId, browser } = await newsroom()
    try {
      assert.ok(!textOf(await (await browser.get(DETAIL)).text()).includes('adresu korektorů'))
      await browser.post(handOverPath(articleId), {}, DETAIL)
      let admin = textOf(await (await browser.get(DETAIL)).text())
      assert.ok(admin.includes('Doplňte adresu korektorů. Bez adresy ranní přehled neodejde.'))
      assert.ok(
        (await (await browser.get(DETAIL)).text()).includes('href="/settings#proofreading"'),
      )

      await createProofreadersStore(app.database).save(
        'korektori@vednemesicnik.test',
        MARIE,
        Temporal.Now.instant(),
      )
      assert.ok(!textOf(await (await browser.get(DETAIL)).text()).includes('adresu korektorů'))
    } finally {
      await app.close()
    }
  })

  it('asks somebody who is not an administrator to ask one, without the way to Settings', async () => {
    let { app, articleId, browser } = await newsroom({ isAdmin: false })
    try {
      await browser.post(handOverPath(articleId), {}, DETAIL)
      let html = await (await browser.get(DETAIL)).text()
      assert.ok(textOf(html).includes('Požádejte správce o doplnění adresy korektorů.'))
      assert.ok(!html.includes('href="/settings#proofreading"'))
    } finally {
      await app.close()
    }
  })
})
