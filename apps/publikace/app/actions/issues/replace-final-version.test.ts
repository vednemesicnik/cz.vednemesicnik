import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { createArticleStore } from '../../data/articles.server.ts'
import { createProofreadersStore } from '../../data/proofreaders.server.ts'
import { stamp } from '../../domain/time.ts'
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
const PROOFREADERS = 'korektura@vednemesicnik.test'
const ISSUE = 'VDM_2026_6'
const DETAIL = `/issues/${ISSUE}`
const MARKED_AT = Temporal.Instant.from('2026-11-21T09:12:00Z')

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

/** Where the row's _Označit novou finální verzi…_ leads, from the menu's items. */
function replaceHref(html: string, id: number): string | null {
  let match = new RegExp(
    `"href":"(/issues/${ISSUE}/articles/${id}/final-version/replace\\?marked=[^"]*)"`,
  ).exec(html)
  return match?.[1] ?? null
}

function dialogAction(html: string): string | null {
  return (
    /<form action="([^"]*)"[^>]*class="vdm-dialog__actions"/
      .exec(html)?.[1]
      ?.replaceAll('&amp;', '&') ?? null
  )
}

/**
 * An article of two authors whose final version Lenka marked, and whose first clause a run of
 * the job took and sent: the second is still to send, so only one author may have an e-mail.
 */
async function sentToOne(): Promise<{
  app: TestApp
  articleId: number
  editor: TestBrowser
  folderId: string
  proofreader: TestBrowser
}> {
  let app = await createTestApp()
  await seedAdmin(app, MARIE.email)
  await connectDriveAccount(app)
  await createProofreadersStore(app.database).save(PROOFREADERS, MARIE.email, MARKED_AT)
  app.setMembership(PROOFREADERS, (email) =>
    email === LENKA.email
      ? { displayName: null, groupName: null, status: 'member' }
      : { groupName: null, status: 'not-member' },
  )
  let issueId = await seedIssue(app, ISSUE)
  let { articleId, folderId } = await seedArticle(app, issueId, 'Kavárna v knihovně')
  await app.database.exec(
    sql`INSERT INTO article_authors (article_id, position, name, email)
        VALUES (${articleId}, 2, 'Ondřej Beneš', 'ondrej.benes@external.test')`,
  )
  let articles = createArticleStore(app.database)
  await articles.takeProofreading(articleId, LENKA, MARKED_AT.subtract({ hours: 1 }), 'writing')
  let marked = await articles.markFinalVersion({
    at: MARKED_AT,
    by: LENKA,
    id: articleId,
    pdf: { attemptKey: 'a-1', fileId: 'pdf-old', hash: 'h-old' },
    takenAt: MARKED_AT.subtract({ hours: 1 }),
  })
  assert.equal(marked.kind, 'done')
  let [first] = await articles.claimForSending('run-1', MARKED_AT.add({ minutes: 20 }))
  assert.ok(first !== undefined)
  await articles.recordSending('run-1', first.clauseKey, { kind: 'sent' }, MARKED_AT)
  /* The run took one clause only, as if it had stopped before the second. */
  await app.database.exec(
    sql`UPDATE article_clauses SET claim_key = NULL, claimed_at = NULL, first_claimed_at = NULL
        WHERE article_id = ${articleId} AND position = 2`,
  )
  let editor = app.browser()
  await editor.signInAs(MARIE.email, MARIE.name)
  let proofreader = app.browser()
  await proofreader.signInAs(LENKA.email, LENKA.name, Date.now() + 60_000, {
    isEditor: false,
    isProofreader: true,
  })
  return { app, articleId, editor, folderId, proofreader }
}

/** Opens the dialog from the row's „⋯“ and confirms it. */
async function replace(editor: TestBrowser, id: number): Promise<Response> {
  let href = replaceHref(await (await editor.get(DETAIL)).text(), id)
  assert.ok(href !== null, 'the row offers the step')
  let dialog = await editor.get(href)
  assert.equal(dialog.status, 200)
  let action = dialogAction(await dialog.text())
  assert.ok(action !== null, 'the dialog posts')
  return editor.post(action, {}, href)
}

async function claim(app: TestApp) {
  let response = await app.fetch(
    new Request('http://localhost/api/v1/approvals/claim', {
      body: JSON.stringify({ intervalMinutes: 30 }),
      headers: { Authorization: `Bearer ${JOB_TOKEN}`, 'Content-Type': 'application/json' },
      method: 'POST',
    }),
  )
  assert.equal(response.status, 200)
  return (await response.json()) as {
    clauses: { authorEmail: string; replacesEarlier: boolean }[]
    replies: { clauseKey: string }[]
  }
}

describe('a new final version before every author agreed (12r, 12s)', () => {
  it('is offered once a run took a clause, in place of Zrušit finální verzi, and asks first', async () => {
    let { app, articleId, editor } = await sentToOne()
    try {
      let detail = await (await editor.get(DETAIL)).text()
      assert.ok(detail.includes('"label":"Označit novou finální verzi…"'))
      assert.ok(!detail.includes('/final-version/cancel'), 'the way back has ended')

      let href = replaceHref(detail, articleId)
      assert.ok(href !== null)
      let dialog = textOf(await (await editor.get(href)).text())
      assert.ok(dialog.includes('Označit novou finální verzi?'))
      assert.ok(dialog.includes('Dokument „Kavárna v knihovně“ se uloží jako PDF tak, jak je teď.'))
      assert.ok(
        dialog.includes(
          'Každému autorovi se pošle nové PDF s žádostí o souhlas s redakční doložkou, i tomu, kdo už s dřívější verzí souhlasí.',
        ),
      )
      assert.ok(dialog.includes('Jména v doložkách „Tereza Vlková“ „Ondřej Beneš“'))
      assert.ok(
        dialog.includes(
          'Žádosti k verzi z 21. 11. v 10:12 přestanou platit. Dosavadní souhlasy se do nové verze nezapočítají.',
        ),
      )
      assert.ok(dialog.includes('Zrušením se obnoví verze z 21. 11. v 10:12.'))
      assert.ok(dialog.includes('Označit novou verzi'))
    } finally {
      await app.close()
    }
  })

  it('stores a new PDF and new clauses, and nothing more of the old version is sent or asked', async () => {
    let { app, articleId, editor, folderId } = await sentToOne()
    try {
      let answer = await replace(editor, articleId)
      assert.equal(answer.status, 303)
      let after = await (await editor.get(DETAIL)).text()
      assert.equal(statusText(after), 'Nová finální verze je uložená. Vrátit')
      assert.ok(textOf(after).includes('K souhlasu e-mail autorům čeká na odeslání'))
      assert.ok(after.includes('/final-version/cancel'), 'the new version may be cancelled')
      assert.ok(!after.includes('Označit novou finální verzi…'))

      let article = await createArticleStore(app.database).findById(articleId)
      assert.equal(article?.finalVersion?.isReplacement, true)
      assert.equal(article?.finalVersion?.clauses.pending, 2)
      let pdfs = app.drive
        .files()
        .filter((file) => file.parentId === folderId && file.name.endsWith('.pdf'))
      assert.deepEqual(
        pdfs.map((file) => file.id),
        [article?.finalVersion?.pdfFileId],
      )

      /* Both authors are asked, and only the one who may have had the earlier e-mail is told it
         is replaced; the earlier clause still to send never goes. */
      let { clauses, replies } = await claim(app)
      assert.deepEqual(
        clauses.map((clause) => [clause.authorEmail, clause.replacesEarlier]),
        [
          ['tereza.vlkova@external.test', true],
          ['ondrej.benes@external.test', false],
        ],
      )
      assert.deepEqual(replies, [])
    } finally {
      await app.close()
    }
  })

  it('brings the earlier version back as it was with Vrátit, and bins the new PDF', async () => {
    let { app, articleId, editor } = await sentToOne()
    try {
      await replace(editor, articleId)
      let undo = toastAction(await (await editor.get(DETAIL)).text())
      assert.ok(undo !== null)
      let newPdf = (await createArticleStore(app.database).findById(articleId))?.finalVersion
        ?.pdfFileId
      await editor.post(undo, {}, DETAIL)
      let after = await (await editor.get(DETAIL)).text()
      assert.equal(statusText(after), 'Znovu platí finální verze z 21. 11. v 10:12.')

      let article = await createArticleStore(app.database).findById(articleId)
      assert.equal(article?.finalVersion?.at.toString(), MARKED_AT.toString())
      assert.equal(article?.finalVersion?.pdfFileId, 'pdf-old')
      assert.equal(app.drive.files().find((file) => file.id === newPdf)?.isTrashed, true)
      assert.deepEqual(await createArticleStore(app.database).replacedVersions(articleId), [])
      let { clauses, replies } = await claim(app)
      assert.deepEqual(
        clauses.map((clause) => [clause.authorEmail, clause.replacesEarlier]),
        [['ondrej.benes@external.test', false]],
      )
      assert.equal(replies.length, 1)
    } finally {
      await app.close()
    }
  })

  it('answers a row that is no longer true with the version that stands, and writes nothing', async () => {
    let { app, articleId, editor } = await sentToOne()
    try {
      let href = replaceHref(await (await editor.get(DETAIL)).text(), articleId)
      assert.ok(href !== null)
      let stale = dialogAction(await (await editor.get(href)).text())
      assert.ok(stale !== null)
      await replace(editor, articleId)
      await editor.get(DETAIL)

      /* The page the stale dialog was drawn on: the form keeps its token. */
      let refused = await editor.post(stale, {}, DETAIL)
      assert.equal(refused.status, 303)
      let after = await (await editor.get(DETAIL)).text()
      assert.match(
        statusText(after),
        /^Finální verze už je nahrazená\. Platná verze: .* · Marie Horáková$/,
      )
      assert.equal((await createArticleStore(app.database).replacedVersions(articleId)).length, 1)
    } finally {
      await app.close()
    }
  })

  it('refuses once every author agreed meanwhile', async () => {
    let { app, articleId, editor } = await sentToOne()
    try {
      let href = replaceHref(await (await editor.get(DETAIL)).text(), articleId)
      assert.ok(href !== null)
      await app.database.exec(
        sql`UPDATE article_clauses
            SET state = 'sent', sent_at = ${stamp(MARKED_AT)}, approved_at = ${stamp(MARKED_AT)},
                consent_file_id = 'consent-1', claim_key = 'run-1',
                first_claimed_at = ${stamp(MARKED_AT)}
            WHERE article_id = ${articleId}`,
      )
      await editor.get(href)
      let after = await (await editor.get(DETAIL)).text()
      assert.equal(
        statusText(after),
        'S touto verzí už souhlasili všichni autoři. Nová finální verze se neuložila.',
      )
      assert.ok(!after.includes('Označit novou finální verzi…'), 'Schváleno is not offered it')
    } finally {
      await app.close()
    }
  })

  it('keeps a Drive that does not answer in the dialog, and the old version stands', async () => {
    let { app, articleId, editor } = await sentToOne()
    try {
      app.drive.failStep('export')
      let answer = await replace(editor, articleId)
      assert.equal(answer.status, 409)
      let text = textOf(await answer.text())
      assert.ok(text.includes('Zkuste finální verzi za chvíli označit znovu.'))
      assert.ok(text.includes('Označit novou finální verzi?'))
      let article = await createArticleStore(app.database).findById(articleId)
      assert.equal(article?.finalVersion?.pdfFileId, 'pdf-old')
      assert.equal(article?.finalVersion?.isReplacement, false)
    } finally {
      await app.close()
    }
  })

  it('is the editors-in-chief’s: a proofreader is refused and never sees the new version', async () => {
    let { app, articleId, editor, proofreader } = await sentToOne()
    try {
      let href = replaceHref(await (await editor.get(DETAIL)).text(), articleId)
      assert.ok(href !== null)
      assert.equal((await proofreader.get(href)).status, 403)
      await replace(editor, articleId)
      let queue = await (await proofreader.get('/proofreading')).text()
      assert.ok(!queue.includes(`id="article-${articleId}"`), 'the queue leaves it out')
      let marking = (await createArticleStore(app.database).findById(articleId))?.finalVersion
      assert.ok(marking != null)
      let cancelled = await createArticleStore(app.database).cancelFinalVersion(
        articleId,
        Temporal.Now.instant(),
        marking.at,
        LENKA.email,
      )
      assert.deepEqual(cancelled, { kind: 'not-final' })
    } finally {
      await app.close()
    }
  })

  it('takes the old reply out of Ke kontrole, keeps it in the open row, and answers its card', async () => {
    let { app, articleId, editor } = await sentToOne()
    try {
      let articles = createArticleStore(app.database)
      let at = MARKED_AT.add({ hours: 2 })
      let [held] = await articles.claimForReplies('run-2', at)
      assert.ok(held !== undefined)
      let reply = {
        messageId: 'm-1',
        receivedAt: Temporal.Instant.from('2026-11-21T10:00:00Z'),
        text: 'V druhém odstavci je špatně jméno paní ředitelky.',
        threadId: 'thread-1',
      }
      await articles.recordReply(
        'run-2',
        held.clauseKey,
        { archive: null, reply, state: 'other_reply' },
        at,
      )
      assert.equal(await articles.reviewCount(), 1)
      let [card] = await articles.reviewQueue()
      assert.ok(card !== undefined)
      /* A run that holds the clause across the replacement, and archives it. */
      let [again] = await articles.claimForReplies('run-3', at.add({ minutes: 30 }))
      assert.equal(again?.clauseKey, held.clauseKey)

      await replace(editor, articleId)
      assert.equal(await articles.reviewCount(), 0)
      assert.equal(
        await articles.recordReply(
          'run-3',
          held.clauseKey,
          { archive: { fileId: 'consent-1' }, reply, state: 'other_reply' },
          at,
        ),
        'superseded',
      )

      let response = await editor.post(
        `/review/clauses/${card.id}/consent`,
        { reply: 'm-1' },
        '/review',
      )
      assert.equal(response.status, 303)
      assert.equal(response.headers.get('Location'), `/review#reply-clause-${card.id}`)
      let queue = await (await editor.get('/review')).text()
      assert.match(statusText(queue), /^Finální verze už je nahrazená\. Platná verze: /)
      assert.equal((await articles.findById(articleId))?.finalVersion?.clauses.verified, 0)

      let row = textOf(await (await editor.get(`${DETAIL}?article=${articleId}`)).text())
      assert.ok(row.includes('Nahrazená verze z 21. 11. v 10:12'), row)
      assert.ok(row.includes(`Označení: ${LENKA.name} · neplatí od`))
      assert.ok(row.includes('Stav doložek při nahrazení verze'))
      assert.ok(row.includes('Jiná odpověď'))
      assert.ok(row.includes('V druhém odstavci je špatně jméno paní ředitelky.'))
      assert.ok(row.includes('Neodesláno'))
    } finally {
      await app.close()
    }
  })
})
