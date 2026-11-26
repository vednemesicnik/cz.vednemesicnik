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

const CHECK = `${DETAIL}/doc-revisions/check`

/** The island of the detail's own revision check, mounted on the page (`12q`). */
const CHECK_ISLAND = '/ui/public/doc-revision-check/component.tsx'

/** The sentence a screen reader hears on the load that shows a find (`12q`). */
function announcement(html: string): string {
  return textOf(/<p role="status" class="vdm-sr-only">(.*?)<\/p>/s.exec(html)?.[1] ?? '').trim()
}

/** The IDs of the rows tinted as just found (`12q`). */
function tintedRows(html: string): string[] {
  return [...html.matchAll(/<div id="article-(\d+)" role="row"[^>]*class="[^"]*vdm-changed/g)].map(
    (match) => match[1] ?? '',
  )
}

/** The articles' rows in the order the detail stands them. */
function rowOrder(html: string): string[] {
  return [...html.matchAll(/id="article-(\d+)" role="row"/g)].map((match) => match[1] ?? '')
}

/**
 * The detail as its page leaves it: opened, then its own check once it stands, then the reload
 * the island starts when the answer lists a changed row (`12q`). The check's answer comes back
 * with the page.
 */
async function opened(
  editor: TestBrowser,
  path = DETAIL,
): Promise<{ changed: number[]; first: string; html: string }> {
  let first = await (await editor.get(path)).text()
  let csrf = /name="_csrf" type="hidden" value="([^"]+)"/.exec(first)?.[1] ?? ''
  let response = await editor.post(CHECK, { _csrf: csrf }, path)
  assert.equal(response.status, 200)
  let { changed } = (await response.json()) as { changed: number[] }
  let html = changed.length === 0 ? first : await (await editor.get(path)).text()
  return { changed, first, html }
}

/** Every author of the article agreed through a run, archived in `Licence`: _Schváleno_. */
async function approve(app: TestApp, articleId: number): Promise<void> {
  let articles = createArticleStore(app.database)
  await articles.takeProofreading(articleId, LENKA, MARKED_AT.subtract({ hours: 1 }), 'writing')
  let marked = await articles.markFinalVersion({
    at: MARKED_AT,
    by: LENKA,
    id: articleId,
    pdf: {
      attemptKey: `a-${articleId}`,
      docModifiedAt: EXPORTED_AT,
      fileId: `pdf-${articleId}`,
      hash: `h-${articleId}`,
    },
    takenAt: MARKED_AT.subtract({ hours: 1 }),
  })
  assert.equal(marked.kind, 'done')
  let at = stamp(MARKED_AT.add({ hours: 2 }))
  await app.database.exec(
    sql`UPDATE article_clauses
        SET state = 'sent', claim_key = 'run-' || article_id, first_claimed_at = ${at},
            sent_at = ${at}, reply_message_id = 'm-' || id, reply_received_at = ${at},
            reply_text = 'Souhlasím', is_exact_consent = 1, approved_at = ${at},
            consent_file_id = 'c-' || id
        WHERE article_id = ${articleId}`,
  )
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
  await approve(app, articleId)
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
      let detail = await opened(editor)
      assert.ok(textOf(detail.html).includes('Schváleno konverzace v Licencích'))
      assert.deepEqual(detail.changed, [])
      assert.equal(revisionCalls(app), 0, 'a Doc that did not move is not listed')

      /* A revision made before the export is in the PDF. */
      app.drive.reviseDoc(docId, EXPORTED_AT.subtract({ minutes: 1 }))
      app.drive.touch(docId, EDITED_AT)
      detail = await opened(editor)
      assert.ok(textOf(detail.html).includes('Schváleno konverzace v Licencích'))
      assert.deepEqual(detail.changed, [], 'nothing to reload')
      assert.equal(revisionCalls(app), 1)

      await opened(editor)
      assert.equal(revisionCalls(app), 1, 'the same modifiedTime is not listed twice')
    } finally {
      await app.close()
    }
  })

  it('shows Upraveno po schválení with the day of the edit, the button and the Callout', async () => {
    let { app, articleId, docId, editor } = await approved()
    try {
      app.drive.reviseDoc(docId, EDITED_AT)
      let { changed, first, html } = await opened(editor)
      assert.ok(textOf(first).includes('Schváleno'), 'the page stands before Drive is asked')
      assert.ok(first.includes(CHECK_ISLAND))
      assert.equal(announcement(first), '')
      assert.deepEqual(changed, [articleId])
      assert.ok(textOf(html).includes('Upraveno po schválení poslední úprava 22. 11.'))
      assert.deepEqual(tintedRows(html), [String(articleId)])
      assert.equal(announcement(html), 'Nově má 1 článek stav „Upraveno po schválení“.')
      assert.ok(!html.includes(CHECK_ISLAND), 'the reload the check started asks nothing')
      assert.equal(statusText(html), '', 'no toast')
      assert.ok(html.includes('aria-label="Označit novou verzi článku Kavárna v knihovně"'))
      assert.ok(textOf(html).includes('Označit novou verzi…'))
      assert.ok(!html.includes('"label":"Označit novou finální verzi…"'), 'not in „⋯“ too')

      let openHtml = await (await editor.get(`${DETAIL}?article=${articleId}`)).text()
      assert.deepEqual(tintedRows(openHtml), [], 'tinted until the next load')
      assert.equal(announcement(openHtml), '')
      let open = textOf(openHtml)
      assert.ok(
        open.includes(
          'Text dokumentu byl po uložení PDF upraven Poslední úprava textu 22. 11. v 8:12. Autoři souhlasili s verzí z 21. 11. v 10:12. Až bude text hotový, označte novou finální verzi.',
        ),
      )
      assert.ok(open.includes('Souhlasí s verzí z 21. 11. v 10:12'))
      /* Nothing on the row speaks of the material for print: only its own section does (`12t`). */
      assert.ok(
        !open
          .replaceAll('Otevřít podklady pro tisk', '')
          .replace('Podklady pro tisk', '')
          .includes('podklad'),
      )
    } finally {
      await app.close()
    }
  })

  it('keeps what it found when Drive does not answer, and never goes back to Schváleno', async () => {
    let { app, docId, editor } = await approved()
    try {
      app.drive.reviseDoc(docId, EDITED_AT)
      app.drive.failStep('revisions')
      let failed = await opened(editor)
      assert.deepEqual(failed.changed, [])
      assert.ok(textOf(failed.html).includes('Schváleno'))
      assert.equal(announcement(failed.html), '')
      app.drive.heal()
      assert.ok(textOf((await opened(editor)).html).includes('Upraveno po schválení'))
      app.drive.goDown()
      let down = await opened(editor)
      assert.deepEqual(down.changed, [])
      assert.ok(textOf(down.html).includes('Upraveno po schválení'))
      assert.deepEqual(tintedRows(down.html), [])
    } finally {
      await app.close()
    }
  })

  it('marks a new version from the dialog, tells the agreed authors so, and Vrátit restores the consents', async () => {
    let { app, articleId, docId, editor } = await approved()
    try {
      app.drive.reviseDoc(docId, EDITED_AT)
      let href = buttonHref((await opened(editor)).html)
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
      assert.ok(textOf((await opened(editor)).html).includes('Schváleno'))
      app.drive.reviseDoc(docId, EDITED_AT)
      assert.ok(textOf((await opened(editor)).html).includes('Upraveno po schválení'))
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
      let { changed, first } = await opened(editor)
      assert.deepEqual(changed, [])
      assert.ok(!first.includes(CHECK_ISLAND), 'a closed issue mounts no check')
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

      await opened(editor)
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

  it('makes no Drive call before the page, and mounts no check under a dialog', async () => {
    let { app, docId, editor } = await approved()
    try {
      app.drive.reviseDoc(docId, EDITED_AT)
      let html = await (await editor.get(DETAIL)).text()
      assert.ok(textOf(html).includes('Schváleno'))
      assert.equal(revisionCalls(app), 0)
      assert.equal(app.drive.calls.length, 0, 'the detail asks Drive nothing before it stands')

      let dialog = await (await editor.get(`/issues/${ISSUE}/rename`)).text()
      assert.ok(dialog.includes('role="status"'))
      assert.ok(!dialog.includes(CHECK_ISLAND), 'no check under a dialog at its own address')
    } finally {
      await app.close()
    }
  })

  it('keeps a row just found revised where Schváleno stood for that one load, then sorts it with what waits', async () => {
    let { app, articleId, docId, editor, issueId } = await approved()
    try {
      let newer = await seedArticle(app, issueId, 'Kino v tělocvičně')
      await approve(app, newer.articleId)
      let before = await opened(editor)
      assert.deepEqual(rowOrder(before.html), [String(newer.articleId), String(articleId)])

      app.drive.reviseDoc(docId, EDITED_AT)
      let { html } = await opened(editor)
      assert.deepEqual(rowOrder(html), [String(newer.articleId), String(articleId)])
      assert.deepEqual(tintedRows(html), [String(articleId)])

      let next = await (await editor.get(DETAIL)).text()
      assert.deepEqual(rowOrder(next), [String(articleId), String(newer.articleId)])
      assert.deepEqual(tintedRows(next), [])
    } finally {
      await app.close()
    }
  })

  it('counts every row it found in the sentence, by the Czech forms', async () => {
    let { app, articleId, docId, editor, issueId } = await approved()
    try {
      let second = await seedArticle(app, issueId, 'Kino v tělocvičně')
      await approve(app, second.articleId)
      app.drive.reviseDoc(docId, EDITED_AT)
      app.drive.reviseDoc(second.docId, EDITED_AT)
      let { changed, html } = await opened(editor)
      assert.deepEqual([...changed].sort(), [articleId, second.articleId].sort())
      assert.equal(announcement(html), 'Nově mají 2 články stav „Upraveno po schválení“.')
    } finally {
      await app.close()
    }
  })

  it('moves only the day of a row already Upraveno po schválení, untinted and unannounced', async () => {
    let { app, articleId, docId, editor } = await approved()
    try {
      app.drive.reviseDoc(docId, EDITED_AT)
      await opened(editor)
      app.drive.reviseDoc(docId, EDITED_AT.add({ hours: 24 }))
      let { changed, html } = await opened(editor)
      assert.deepEqual(changed, [articleId])
      assert.ok(textOf(html).includes('Upraveno po schválení poslední úprava 23. 11.'))
      assert.deepEqual(tintedRows(html), [])
      assert.equal(announcement(html), '')
    } finally {
      await app.close()
    }
  })
})
