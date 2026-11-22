import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { createArticleStore } from '../../data/articles.server.ts'
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
const ISSUE = 'VDM_2026_7'
const DETAIL = `/issues/${ISSUE}`
const MARKED_AT = Temporal.Instant.from('2026-11-21T09:12:00Z')
/** The Doc's `modifiedTime` just before the export, five minutes before the marking. */
const EXPORTED_AT = MARKED_AT.subtract({ minutes: 5 })
const EDITED_AT = Temporal.Instant.from('2026-11-22T07:12:00Z')

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

/** Where the row's button _Označit novou verzi…_ leads. */
function buttonHref(html: string): string | null {
  let match = /<a aria-label="Označit novou verzi článku [^"]*"[^>]*href="([^"]*)"/.exec(html)
  return match?.[1]?.replaceAll('&amp;', '&') ?? null
}

function dialogAction(html: string): string | null {
  return (
    /<form action="([^"]*)"[^>]*class="vdm-dialog__actions"/
      .exec(html)?.[1]
      ?.replaceAll('&amp;', '&') ?? null
  )
}

function revisionCalls(app: TestApp): number {
  return app.drive.calls.filter((call) => call.endsWith('/revisions')).length
}

/**
 * An article of two authors whose final version Lenka marked from the Doc as it was at
 * `EXPORTED_AT`, and whose both conversations are in `Licence`: _Schváleno_.
 */
async function approved(): Promise<{
  app: TestApp
  articleId: number
  docId: string
  editor: TestBrowser
  issueId: number
}> {
  let app = await createTestApp()
  await seedAdmin(app, MARIE.email)
  await connectDriveAccount(app)
  let issueId = await seedIssue(app, ISSUE)
  let { articleId, docId } = await seedArticle(app, issueId, 'Kavárna v knihovně')
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
    pdf: { attemptKey: 'a-1', docModifiedAt: EXPORTED_AT, fileId: 'pdf-old', hash: 'h-old' },
    takenAt: MARKED_AT.subtract({ hours: 1 }),
  })
  assert.equal(marked.kind, 'done')
  let at = stamp(MARKED_AT.add({ hours: 2 }))
  await app.database.exec(
    sql`UPDATE article_clauses
        SET state = 'sent', claim_key = 'run-1', first_claimed_at = ${at}, sent_at = ${at},
            reply_message_id = 'm-' || id, reply_received_at = ${at}, reply_text = 'Souhlasím',
            is_exact_consent = 1, approved_at = ${at}, consent_file_id = 'c-' || id
        WHERE article_id = ${articleId}`,
  )
  let editor = app.browser()
  await editor.signInAs(MARIE.email, MARIE.name)
  return { app, articleId, docId, editor, issueId }
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
    clauses: { authorEmail: string; replacesAgreed: boolean; replacesEarlier: boolean }[]
  }
}

describe('an approved article whose Doc was edited afterwards (01a, 12b, 12q)', () => {
  it('stays Schváleno while the Doc has no revision after its PDF, a comment included', async () => {
    let { app, docId, editor } = await approved()
    try {
      let detail = textOf(await (await editor.get(DETAIL)).text())
      assert.ok(detail.includes('Schváleno konverzace v Licencích'))
      assert.equal(revisionCalls(app), 0, 'a Doc that did not move is not listed')

      /* A revision made before the export is in the PDF. */
      app.drive.reviseDoc(docId, EXPORTED_AT.subtract({ minutes: 1 }))
      app.drive.touch(docId, EDITED_AT)
      detail = textOf(await (await editor.get(DETAIL)).text())
      assert.ok(detail.includes('Schváleno konverzace v Licencích'))
      assert.equal(revisionCalls(app), 1)

      await editor.get(DETAIL)
      assert.equal(revisionCalls(app), 1, 'the same modifiedTime is not listed twice')
    } finally {
      await app.close()
    }
  })

  it('shows Upraveno po schválení with the day of the edit, the button and the Callout', async () => {
    let { app, articleId, docId, editor } = await approved()
    try {
      app.drive.reviseDoc(docId, EDITED_AT)
      let html = await (await editor.get(DETAIL)).text()
      assert.ok(textOf(html).includes('Upraveno po schválení poslední úprava 22. 11.'))
      assert.ok(html.includes('aria-label="Označit novou verzi článku Kavárna v knihovně"'))
      assert.ok(textOf(html).includes('Označit novou verzi…'))
      assert.ok(!html.includes('"label":"Označit novou finální verzi…"'), 'not in „⋯“ too')

      let open = textOf(await (await editor.get(`${DETAIL}?article=${articleId}`)).text())
      assert.ok(
        open.includes(
          'Text dokumentu byl po uložení PDF upraven Poslední úprava textu 22. 11. v 8:12. Autoři souhlasili s verzí z 21. 11. v 10:12. Až bude text hotový, označte novou finální verzi.',
        ),
      )
      assert.ok(open.includes('Souhlasí s verzí z 21. 11. v 10:12'))
      /* Nothing on the row speaks of the material for print; the header's „⋯“ opens its folder. */
      assert.ok(!open.replace('Otevřít podklady pro tisk', '').includes('podklad'))
    } finally {
      await app.close()
    }
  })

  it('keeps what it found when Drive does not answer, and never goes back to Schváleno', async () => {
    let { app, docId, editor } = await approved()
    try {
      app.drive.reviseDoc(docId, EDITED_AT)
      app.drive.failStep('revisions')
      assert.ok(textOf(await (await editor.get(DETAIL)).text()).includes('Schváleno'))
      app.drive.heal()
      assert.ok(textOf(await (await editor.get(DETAIL)).text()).includes('Upraveno po schválení'))
      app.drive.goDown()
      assert.ok(textOf(await (await editor.get(DETAIL)).text()).includes('Upraveno po schválení'))
    } finally {
      await app.close()
    }
  })

  it('marks a new version from the dialog, tells the agreed authors so, and Vrátit restores the consents', async () => {
    let { app, articleId, docId, editor } = await approved()
    try {
      app.drive.reviseDoc(docId, EDITED_AT)
      let href = buttonHref(await (await editor.get(DETAIL)).text())
      assert.ok(href !== null, 'the row offers the step')
      let dialogHtml = await (await editor.get(href)).text()
      let dialog = textOf(dialogHtml)
      assert.ok(dialog.includes('Označit novou finální verzi?'))
      assert.ok(dialog.includes('Dokument „Kavárna v knihovně“ se uloží jako PDF tak, jak je teď.'))
      assert.ok(
        dialog.includes(
          'Každému autorovi se pošle nové PDF s žádostí o souhlas s redakční doložkou.',
        ),
      )
      assert.ok(
        dialog.includes(
          'Souhlasy s verzí z 21. 11. v 10:12 zůstanou v Licencích. Do nové verze se nezapočítají.',
        ),
      )
      assert.ok(
        dialog.includes(
          'Do začátku odesílání e-mailů autorům můžete novou verzi zrušit. Obnoví se tím předchozí verze i se souhlasy.',
        ),
      )
      assert.ok(!dialog.includes('přestanou platit'))

      let action = dialogAction(dialogHtml)
      assert.ok(action !== null)
      assert.equal((await editor.post(action, {}, href)).status, 303)
      let after = await (await editor.get(DETAIL)).text()
      assert.equal(statusText(after), 'Nová finální verze je uložená. Vrátit')
      assert.ok(textOf(after).includes('K souhlasu e-mail autorům čeká na odeslání'))
      let article = await createArticleStore(app.database).findById(articleId)
      assert.equal(article?.finalVersion?.isReplacement, true)

      let undo = toastAction(after)
      assert.ok(undo !== null)
      await editor.post(undo, {}, DETAIL)
      let restored = await (await editor.get(DETAIL)).text()
      assert.equal(statusText(restored), 'Verze z 21. 11. v 10:12 je obnovená i se souhlasy.')
      assert.ok(textOf(restored).includes('Upraveno po schválení poslední úprava 22. 11.'))

      /* Marked again and taken by a run: both authors had agreed to the earlier version. */
      let again = buttonHref(restored)
      assert.ok(again !== null)
      let confirm = dialogAction(await (await editor.get(again)).text())
      assert.ok(confirm !== null)
      await editor.post(confirm, {}, again)
      let { clauses } = await claim(app)
      assert.deepEqual(
        clauses.map((clause) => [
          clause.authorEmail,
          clause.replacesEarlier,
          clause.replacesAgreed,
        ]),
        [
          ['tereza.vlkova@external.test', true, true],
          ['ondrej.benes@external.test', true, true],
        ],
      )
    } finally {
      await app.close()
    }
  })

  it('refuses a new version of an approved text nobody edited', async () => {
    let { app, articleId, editor } = await approved()
    try {
      let marked = encodeURIComponent(stamp(MARKED_AT))
      let href = `/issues/${ISSUE}/articles/${articleId}/final-version/replace?marked=${marked}`
      assert.equal((await editor.get(href)).status, 303)
      let after = await (await editor.get(DETAIL)).text()
      assert.equal(
        statusText(after),
        'S touto verzí už souhlasili všichni autoři. Nová finální verze se neuložila.',
      )
      assert.equal(buttonHref(after), null)
    } finally {
      await app.close()
    }
  })

  it('measures from the marking itself for a version marked without the Doc’s modifiedTime', async () => {
    let { app, articleId, docId, editor } = await approved()
    try {
      await app.database.exec(
        sql`UPDATE final_versions SET doc_modified_at = NULL, doc_checked_at = NULL
            WHERE article_id = ${articleId}`,
      )
      /* Between the export and the marking: counted only from a baseline read before it. */
      app.drive.reviseDoc(docId, EXPORTED_AT.add({ minutes: 1 }))
      assert.ok(textOf(await (await editor.get(DETAIL)).text()).includes('Schváleno'))
      app.drive.reviseDoc(docId, EDITED_AT)
      assert.ok(textOf(await (await editor.get(DETAIL)).text()).includes('Upraveno po schválení'))
    } finally {
      await app.close()
    }
  })

  it('does not ask Drive about the Docs of a closed issue', async () => {
    let { app, docId, editor, issueId } = await approved()
    try {
      app.drive.reviseDoc(docId, EDITED_AT)
      await app.database.exec(
        sql`UPDATE issues SET closed_at = ${stamp(EDITED_AT)} WHERE id = ${issueId}`,
      )
      await editor.get(DETAIL)
      assert.equal(revisionCalls(app), 0)
    } finally {
      await app.close()
    }
  })

  it('counts in Čeká na vás and leaves the approved on the overview once the detail found the edit, without Drive, and not once closed', async () => {
    let { app, docId, editor, issueId } = await approved()
    try {
      app.drive.reviseDoc(docId, EDITED_AT)
      assert.match(
        textOf(await (await editor.get('/')).text()),
        /VDM_2026_7 .* Aktivní 1 schválený 0 — /,
      )

      await editor.get(DETAIL)
      let calls = revisionCalls(app)
      assert.match(
        textOf(await (await editor.get('/')).text()),
        /VDM_2026_7 .* Aktivní 1 0 schválených 0 1 /,
      )
      assert.equal(revisionCalls(app), calls)

      await app.database.exec(
        sql`UPDATE issues SET closed_at = ${stamp(EDITED_AT)} WHERE id = ${issueId}`,
      )
      assert.match(textOf(await (await editor.get('/')).text()), /VDM_2026_7 .* Uzavřené 1 0 — /)
    } finally {
      await app.close()
    }
  })
})
