import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { createArticleStore } from '../../data/articles.server.ts'
import { createProofreadersStore } from '../../data/proofreaders.server.ts'
import {
  connectDriveAccount,
  createTestApp,
  JOB_TOKEN,
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
    .replaceAll('&nbsp;', ' ')
    .replaceAll(' ', ' ')
    .replace(/\s+/g, ' ')
    .replace(/ ([.,;)])/g, '$1')
}

function statusText(html: string): string {
  let toasts = html.matchAll(/<div class="vdm-toast(?: [^"]*)?"[^>]*>(.*?)<\/div>/gs)
  return [...toasts].map((toast) => textOf(toast[1] ?? '').trim()).join(' | ')
}

function toastAction(html: string): string | null {
  let toast = /<div class="vdm-toast(?: [^"]*)?"[^>]*>(.*?)<\/div>/s.exec(html)?.[1] ?? ''
  return /action="([^"]*)"/.exec(toast)?.[1]?.replaceAll('&amp;', '&') ?? null
}

function cardOf(html: string, id: number): string {
  let card = new RegExp(`<li[^>]*id="article-${id}"[^>]*>(.*?)</li>`, 's').exec(html)
  return card?.[1] ?? ''
}

/** Where the card's _Označit finální verzi…_ leads, unescaped. */
function markHref(html: string, id: number): string | null {
  let card = cardOf(html, id)
  let match = new RegExp(`href="(/proofreading/articles/${id}/final-version\\?take=[^"]*)"`).exec(
    card,
  )
  return match?.[1]?.replaceAll('&amp;', '&') ?? null
}

/** The dialog's form action, unescaped. */
function dialogAction(html: string): string | null {
  return (
    /<form action="([^"]*)"[^>]*class="vdm-dialog__actions"/
      .exec(html)?.[1]
      ?.replaceAll('&amp;', '&') ?? null
  )
}

async function newsroom(): Promise<{
  app: TestApp
  articleId: number
  docId: string
  editor: TestBrowser
  folderId: string
  proofreader: TestBrowser
}> {
  let app = await createTestApp()
  await seedAdmin(app, MARIE.email)
  await connectDriveAccount(app)
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
  let { articleId, docId, folderId } = await seedArticle(app, issueId, 'Kavárna v knihovně')
  let editor = app.browser()
  await editor.signInAs(MARIE.email, MARIE.name)
  let proofreader = app.browser()
  await proofreader.signInAs(LENKA.email, LENKA.name, Date.now() + 60_000, PROOFREADER)
  await proofreader.post(`${PAGE}/articles/${articleId}`, { shown: 'writing' }, PAGE)
  /* The card just taken stands settled for one load, without its steps (`15d`). */
  await proofreader.get(PAGE)
  return { app, articleId, docId, editor, folderId, proofreader }
}

/** Opens the dialog from the card and confirms it. */
async function mark(browser: TestBrowser, id: number): Promise<Response> {
  let page = await (await browser.get(PAGE)).text()
  let href = markHref(page, id)
  assert.ok(href !== null, 'the card offers the step')
  let dialog = await browser.get(href)
  assert.equal(dialog.status, 200)
  let action = dialogAction(await dialog.text())
  assert.ok(action !== null, 'the dialog posts')
  return browser.post(action, {}, href)
}

describe('the final version (15f, 15g)', () => {
  it('asks first, then stores the PDF, the clauses and K souhlasu, with Vrátit', async () => {
    let { app, articleId, folderId, proofreader } = await newsroom()
    try {
      let page = await (await proofreader.get(PAGE)).text()
      let href = markHref(page, articleId)
      assert.ok(href !== null)
      let dialog = textOf(await (await proofreader.get(href)).text())
      assert.ok(dialog.includes('Označit finální verzi?'))
      assert.ok(dialog.includes('Dokument „Kavárna v knihovně“ se uloží jako PDF tak, jak je teď.'))
      assert.ok(dialog.includes('Jméno v doložce'))
      assert.ok(dialog.includes('„Tereza Vlková“'))

      let answer = await mark(proofreader, articleId)
      assert.equal(answer.status, 303)
      let after = await (await proofreader.get(PAGE)).text()
      assert.equal(statusText(after), 'Finální verze je uložená. Vrátit')
      assert.ok(textOf(cardOf(after, articleId)).includes('K souhlasu'))
      assert.ok(textOf(cardOf(after, articleId)).includes('Otevřít PDF'))

      let article = await createArticleStore(app.database).findById(articleId)
      assert.equal(article?.finalVersion?.clauses.pending, 1)
      let pdfs = app.drive
        .files()
        .filter((file) => file.parentId === folderId && file.name.endsWith('.pdf'))
      assert.equal(pdfs.length, 1)
      assert.equal(pdfs[0]?.id, article?.finalVersion?.pdfFileId)
    } finally {
      await app.close()
    }
  })

  it('takes it back with Vrátit: Korektura again, the PDF in the bin, and no Vrátit of its own', async () => {
    let { app, articleId, proofreader } = await newsroom()
    try {
      await mark(proofreader, articleId)
      let undo = toastAction(await (await proofreader.get(PAGE)).text())
      assert.ok(undo !== null)
      let pdfId = (await createArticleStore(app.database).findById(articleId))?.finalVersion
        ?.pdfFileId
      await proofreader.post(undo, {}, PAGE)
      let page = await (await proofreader.get(PAGE)).text()
      assert.equal(statusText(page), 'Článek je zpět v korektuře.')
      let article = await createArticleStore(app.database).findById(articleId)
      assert.equal(article?.finalVersion, null)
      assert.equal(article?.proofreading?.email, LENKA.email)
      assert.equal(app.drive.files().find((file) => file.id === pdfId)?.isTrashed, true)
      assert.ok(markHref(page, articleId) !== null)
    } finally {
      await app.close()
    }
  })

  it('cancels in the record even when Drive does not take the PDF to the bin', async () => {
    let { app, articleId, proofreader } = await newsroom()
    try {
      await mark(proofreader, articleId)
      let undo = toastAction(await (await proofreader.get(PAGE)).text())
      assert.ok(undo !== null)
      app.drive.failStep('trash')
      await proofreader.post(undo, {}, PAGE)
      let page = await (await proofreader.get(PAGE)).text()
      assert.equal(statusText(page), 'Článek je zpět v korektuře.')
      assert.equal((await createArticleStore(app.database).findById(articleId))?.finalVersion, null)
    } finally {
      await app.close()
    }
  })

  it('cannot be cancelled once a run of the job took a clause, and leaves the queue then', async () => {
    let { app, articleId, proofreader } = await newsroom()
    try {
      await mark(proofreader, articleId)
      let undo = toastAction(await (await proofreader.get(PAGE)).text())
      assert.ok(undo !== null)
      let claim = await app.fetch(
        new Request('http://localhost/api/v1/approvals/claim', {
          body: JSON.stringify({ intervalMinutes: 30 }),
          headers: { Authorization: `Bearer ${JOB_TOKEN}`, 'Content-Type': 'application/json' },
          method: 'POST',
        }),
      )
      assert.equal(claim.status, 200)
      let claimed = (await claim.json()) as { clauses: { signature: string }[] }
      assert.deepEqual(
        claimed.clauses.map((clause) => clause.signature),
        ['Tereza Vlková'],
      )

      await proofreader.post(undo, {}, PAGE)
      let page = await (await proofreader.get(PAGE)).text()
      assert.equal(statusText(page), 'Odesílání e-mailů už začalo. Finální verzi nelze zrušit.')
      assert.equal(cardOf(page, articleId), '')
      let article = await createArticleStore(app.database).findById(articleId)
      assert.equal(article?.finalVersion?.isCancellable, false)
      let pdf = app.drive.files().find((file) => file.id === article?.finalVersion?.pdfFileId)
      assert.equal(pdf?.isTrashed, false)
    } finally {
      await app.close()
    }
  })

  it('keeps a Drive that does not answer in the dialog, and records nothing', async () => {
    let { app, articleId, folderId, proofreader } = await newsroom()
    try {
      app.drive.failStep('export')
      let answer = await mark(proofreader, articleId)
      assert.equal(answer.status, 409)
      let text = textOf(await answer.text())
      assert.ok(text.includes('Zkuste finální verzi za chvíli označit znovu.'))
      assert.ok(text.includes('Nic se neuložilo. Disk teď neodpovídá.'))
      let article = await createArticleStore(app.database).findById(articleId)
      assert.equal(article?.finalVersion, null)
      let live = app.drive
        .files()
        .filter(
          (file) => file.parentId === folderId && file.name.endsWith('.pdf') && !file.isTrashed,
        )
      assert.equal(live.length, 0)
    } finally {
      await app.close()
    }
  })

  it('tells a proofreader to tell the editors-in-chief about a missing Doc', async () => {
    let { app, articleId, docId, proofreader } = await newsroom()
    try {
      app.drive.trash(docId)
      let answer = await mark(proofreader, articleId)
      let text = textOf(await answer.text())
      assert.ok(text.includes('Dejte vědět šéfredakci.'))
      assert.ok(text.includes('Na Disku chybí dokument článku. Nic se neuložilo.'))
    } finally {
      await app.close()
    }
  })

  it('lets an editor-in-chief mark for the proofreader from „⋯“, and the card stays the proofreader’s', async () => {
    let { app, articleId, editor, proofreader } = await newsroom()
    try {
      let editorsPage = await (await editor.get(PAGE)).text()
      assert.equal(markHref(editorsPage, articleId), null)
      assert.ok(
        editorsPage.includes(`"href":"/proofreading/articles/${articleId}/final-version?take=`),
      )

      let href = /"href":"(\/proofreading\/articles\/\d+\/final-version\?take=[^"]*)"/.exec(
        editorsPage,
      )?.[1]
      assert.ok(href !== undefined)
      let action = dialogAction(await (await editor.get(href)).text())
      assert.ok(action !== null)
      await editor.post(action, {}, href)

      let article = await createArticleStore(app.database).findById(articleId)
      assert.equal(article?.finalVersion?.email, MARIE.email)
      let proofreadersPage = await (await proofreader.get(PAGE)).text()
      assert.ok(textOf(cardOf(proofreadersPage, articleId)).includes('K souhlasu'))
      assert.ok(
        proofreadersPage.includes(
          `"action":"/proofreading/articles/${articleId}/final-version/cancel?marked=`,
        ),
      )
    } finally {
      await app.close()
    }
  })

  it('writes nothing over a take cancelled meanwhile, and says who cancelled it', async () => {
    let { app, articleId, editor, proofreader } = await newsroom()
    try {
      let page = await (await proofreader.get(PAGE)).text()
      let href = markHref(page, articleId)
      assert.ok(href !== null)
      let action = dialogAction(await (await proofreader.get(href)).text())
      assert.ok(action !== null)
      let take = (await createArticleStore(app.database).findById(articleId))?.proofreading
      assert.ok(take != null)
      await editor.post(
        `${PAGE}/articles/${articleId}/cancel?take=${encodeURIComponent(take.at.toString({ smallestUnit: 'millisecond' }))}`,
        {},
        PAGE,
      )

      /* The dialog's own address now answers with the refusal, so the token comes from the page. */
      await proofreader.post(action, {}, PAGE)
      let after = await (await proofreader.get(PAGE)).text()
      assert.equal(
        statusText(after),
        'Šéfredakce mezitím zrušila korekturu. Článek nemáte v korektuře.',
      )
      assert.equal((await createArticleStore(app.database).findById(articleId))?.finalVersion, null)
    } finally {
      await app.close()
    }
  })

  it('shows K souhlasu in the detail, with Otevřít PDF and Zrušit finální verzi in „⋯“', async () => {
    let { app, articleId, editor, proofreader } = await newsroom()
    try {
      await mark(proofreader, articleId)
      let detail = await (await editor.get(`/issues/${ISSUE}`)).text()
      assert.ok(textOf(detail).includes('K souhlasu e-mail autorům čeká na odeslání'))
      assert.ok(detail.includes('"label":"Otevřít PDF"'))
      let cancel = new RegExp(
        `"action":"(/issues/${ISSUE}/articles/${articleId}/final-version/cancel\\?marked=[^"]*)"`,
      ).exec(detail)?.[1]
      assert.ok(cancel !== undefined)
      await editor.post(cancel, {}, `/issues/${ISSUE}`)
      let after = await (await editor.get(`/issues/${ISSUE}`)).text()
      assert.equal(statusText(after), 'Článek je zpět v korektuře.')
      assert.ok(textOf(after).includes('Korektura od'))
    } finally {
      await app.close()
    }
  })
  it('opens the row from the tag, with each author, and sends a failed clause again', async () => {
    let { app, articleId, editor, proofreader } = await newsroom()
    try {
      await mark(proofreader, articleId)
      let articles = createArticleStore(app.database)
      let at = Temporal.Now.instant()
      let [claimed] = await articles.claimForSending('run-1', at)
      assert.ok(claimed !== undefined)
      let outcome = { error: 'Mailer answered 503', kind: 'failed' as const }
      await articles.recordSending('run-1', claimed.clauseKey, outcome, at)

      let detail = await (await editor.get(`/issues/${ISSUE}`)).text()
      let open = `/issues/${ISSUE}?article=${articleId}#article-${articleId}`
      assert.ok(detail.includes(`href="${open.replace('&', '&amp;')}"`), 'the tag opens the row')
      assert.ok(!textOf(detail).includes('Mailer answered 503'), 'a closed row shows no clause')

      let row = await (await editor.get(`/issues/${ISSUE}?article=${articleId}`)).text()
      let text = textOf(row)
      assert.ok(row.includes('vdm-row vdm-row--last vdm-row--selected'))
      assert.ok(text.includes('Chyba Mailer answered 503'), text)
      assert.ok(text.includes('Úloha Žádosti a odpovědi u článků'))
      assert.ok(text.includes(`Označení: ${LENKA.name}`))
      assert.ok(text.includes('Jméno v doložce'))
      assert.ok(row.includes('href="/settings/jobs/approval-send"'))
      let resend = new RegExp(
        `<form action="(/issues/${ISSUE}/articles/${articleId}/clauses/resend\\?marked=[^"]*)"`,
      ).exec(row)?.[1]
      assert.ok(resend !== undefined, 'the row offers Poslat žádost znovu')
      assert.ok(text.includes('Poslat žádost znovu'))

      let response = await editor.post(resend.replaceAll('&amp;', '&'), {}, `/issues/${ISSUE}`)
      assert.equal(response.status, 303)
      assert.equal(response.headers.get('Location'), open)
      let after = await (await editor.get(`/issues/${ISSUE}?article=${articleId}`)).text()
      assert.equal(statusText(after), 'Žádost čeká na odeslání.')
      assert.ok(textOf(after).includes('K souhlasu e-mail autorům čeká na odeslání'))
      assert.ok(textOf(after).includes('Čeká na odeslání'))
      assert.ok(!after.includes('/clauses/resend'), 'nothing is left to send again')
      assert.equal(
        (await articles.claimForSending('run-2', at))[0]?.sendKey,
        `${claimed.clauseKey}_2`,
      )

      await editor.post(resend.replaceAll('&amp;', '&'), {}, `/issues/${ISSUE}`)
      let twice = await (await editor.get(`/issues/${ISSUE}`)).text()
      assert.equal(statusText(twice), 'Žádnou žádost teď nelze poslat znovu.')
    } finally {
      await app.close()
    }
  })
})
