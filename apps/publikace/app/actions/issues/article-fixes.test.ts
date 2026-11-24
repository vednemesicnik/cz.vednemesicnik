import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { createArticleStore } from '../../data/articles.server.ts'
import { createArtworkStore } from '../../data/artworks.server.ts'
import { createIssueStore } from '../../data/issues.server.ts'
import { createLinkStore } from '../../data/links.server.ts'
import { articleLinkPath } from '../../domain/link.ts'
import { NBSP } from '../../domain/public/typography.ts'
import { now, stamp } from '../../domain/time.ts'
import { drainRecordQueue } from '../../drive/record-queue.server.ts'
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
const ONDREJ = { email: 'ondrej.benes@external.test', name: 'Ondřej Beneš' }
const LUCIE = { email: 'lucie.kralova@external.test', name: 'Lucie Králová' }
const ISSUE = 'VDM_2026_5'
const DETAIL = `/issues/${ISSUE}`
const NAME = 'Školní jídelna po roce'
const MARKED_AT = Temporal.Instant.from('2026-11-21T09:12:00Z')

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

/** The Callout of the dialog as text, or `null` when it has none. */
function calloutOf(html: string): string | null {
  let dialog = html.slice(html.indexOf('class="vdm-dialog"'))
  let found = /class="vdm-callout__body">(.*?)<\/div>/s.exec(dialog)
  return found === null ? null : textOf(found[1] ?? '').trim()
}

type Context = { app: TestApp; articleId: number; editor: TestBrowser; issueId: number }

/**
 * An issue made through the app and one article through its link, so the folder, the Doc and
 * `_meta.json` are on the fake Drive, by the authors given.
 */
async function withArticle(
  run: (context: Context) => Promise<void>,
  authors: readonly { email: string; name: string }[] = [TEREZA],
): Promise<void> {
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
    for (let author of authors) {
      body.append('author-name', author.name)
      body.append('author-email', author.email)
    }
    assert.equal((await visitor.send(articleLinkPath(link.key), body)).status, 200)
    let [article] = await createArticleStore(app.database).listCreated(issue.id)
    assert.ok(article !== undefined)
    await run({ app, articleId: article.id, editor, issueId: issue.id })
  } finally {
    await app.close()
  }
}

async function articleOf(context: Context) {
  let article = await createArticleStore(context.app.database).findById(context.articleId)
  assert.ok(article !== null)
  return article
}

function fileOf(context: Context, id: string | null) {
  return context.app.drive.files().find((file) => file.id === id)
}

function metaOf(context: Context, id: string | null): Record<string, unknown> {
  return JSON.parse(fileOf(context, id)?.content ?? '{}') as Record<string, unknown>
}

/** Marks the final version, as a proofreader would, so the clauses stand _K odeslání_. */
async function markFinal(context: Context): Promise<void> {
  let articles = createArticleStore(context.app.database)
  let takenAt = MARKED_AT.subtract({ hours: 1 })
  await articles.takeProofreading(context.articleId, LENKA, takenAt, 'writing')
  let marked = await articles.markFinalVersion({
    at: MARKED_AT,
    by: LENKA,
    id: context.articleId,
    pdf: { attemptKey: 'a-1', docModifiedAt: null, fileId: 'pdf-1', hash: 'h-1' },
    takenAt,
  })
  assert.equal(marked.kind, 'done')
}

async function clausesOf(context: Context) {
  let result = await context.app.database.exec(
    sql`SELECT * FROM article_clauses WHERE article_id = ${context.articleId} ORDER BY position`,
  )
  return result.rows ?? []
}

async function agree(context: Context, position: number): Promise<void> {
  await context.app.database.exec(
    sql`UPDATE article_clauses SET state = 'sent', sent_at = ${stamp(MARKED_AT)},
          approved_at = ${stamp(MARKED_AT)}, consent_file_id = 'consent-pdf'
        WHERE article_id = ${context.articleId} AND position = ${position}`,
  )
}

async function evidenceMarked(context: Context): Promise<boolean> {
  let result = await context.app.database.exec(
    sql`SELECT 1 FROM record_marks WHERE kind = 'evidence' AND issue_id = ${context.issueId}`,
  )
  return (result.rows ?? []).length > 0
}

function renamePath(context: Context): string {
  return `${DETAIL}/articles/${context.articleId}/rename`
}

function authorsPath(context: Context): string {
  return `${DETAIL}/articles/${context.articleId}/authors`
}

/* The token comes from the detail, which stands whatever the dialog's own address answers. */
function rename(context: Context, name: string, shownName = NAME): Promise<Response> {
  return context.editor.post(renamePath(context), { name, shownName }, DETAIL)
}

/** The authors' form as a browser sends it, with every card and the marking it showed. */
function saveAuthors(
  context: Context,
  cards: readonly { email: string; name: string }[],
  extra: { clauses?: readonly number[]; marked?: string } = {},
): Promise<Response> {
  let path = authorsPath(context)
  let fields = new URLSearchParams({ intent: 'save', marked: extra.marked ?? '' })
  for (let [index, card] of cards.entries()) {
    let clause = extra.clauses?.[index]
    if (clause !== undefined) fields.append('clause', String(clause))
    fields.append('author-name', card.name)
    fields.append('author-email', card.email)
  }
  return context.editor.post(path, fields, DETAIL)
}

describe('where the fixes of an article stand (12u)', () => {
  it('end the row’s menu after a line before the final version', () =>
    withArticle(async (context) => {
      let html = await (await context.editor.get(DETAIL)).text()
      assert.match(
        html,
        new RegExp(
          `\\{"isSeparator":true\\},\\{"href":"${renamePath(context)}","isSameTab":true,"label":"Přejmenovat článek…"\\},\\{"href":"${authorsPath(context)}","isSameTab":true,"label":"Upravit autory…"\\}`,
        ),
      )
    }))

  it('keep only Upravit autory… after the final version, and nothing once every author agreed', () =>
    withArticle(async (context) => {
      await markFinal(context)
      let marked = await (await context.editor.get(DETAIL)).text()
      assert.ok(!marked.includes('Přejmenovat článek…'))
      assert.ok(marked.includes('Upravit autory…'))
      assert.equal((await context.editor.get(renamePath(context))).status, 303)

      await agree(context, 1)
      let agreed = await (await context.editor.get(DETAIL)).text()
      assert.ok(!agreed.includes('Upravit autory…'))
      assert.equal((await context.editor.get(authorsPath(context))).status, 303)
    }))

  it('offer neither in a closed issue', () =>
    withArticle(async (context) => {
      await createIssueStore(context.app.database).close(context.issueId, now())
      let html = await (await context.editor.get(DETAIL)).text()
      assert.ok(!html.includes('Přejmenovat článek…'))
      assert.ok(!html.includes('Upravit autory…'))
    }))
})

describe('renaming an article (12x)', () => {
  it('asks with the name in the field and the two sentences', () =>
    withArticle(async (context) => {
      let html = await (await context.editor.get(renamePath(context))).text()
      let text = textOf(html)
      assert.ok(
        text.includes(
          'Přejmenuje se i dokument Google a složka článku. Nový název článku se v Evidenci může objevit později.',
        ),
      )
      assert.ok(
        text.includes(
          'Text v dokumentu se nezmění: pokud je v něm název napsaný, opravte ho tam. Nikomu se nic nepošle.',
        ),
      )
      assert.match(html, /name="name"[^>]*value="Školní jídelna po roce"/)
      assert.ok(html.includes(`name="shownName" type="hidden" value="${NAME}"`))
    }))

  it('renames the Doc, the folder, _meta.json and the row, and marks the Evidence', () =>
    withArticle(async (context) => {
      let before = await articleOf(context)
      let docText = fileOf(context, before.docId)?.replacements
      await drainRecordQueue(context.app.record)
      let mailBefore = context.app.mail.length

      let answered = await rename(context, 'Školní jídelna o rok později')
      assert.equal(answered.status, 303)
      assert.equal(answered.headers.get('Location'), DETAIL)
      let after = await articleOf(context)
      assert.equal(after.name, 'Školní jídelna o rok později')
      assert.equal(fileOf(context, after.docId)?.name, 'Školní jídelna o rok později')
      assert.equal(fileOf(context, after.folderId)?.name, 'Školní jídelna o rok později')
      assert.equal(metaOf(context, after.metaFileId)['articleName'], 'Školní jídelna o rok později')
      /* The Doc's text is left alone, the name the template took included. */
      assert.deepEqual(fileOf(context, after.docId)?.replacements, docText)
      assert.ok(await evidenceMarked(context))
      assert.equal(context.app.mail.length, mailBefore)

      let page = await (await context.editor.get(DETAIL)).text()
      assert.equal(statusText(page), 'Článek je přejmenovaný.')
      assert.match(page, /<h2 (?=[^>]*autofocus)(?=[^>]*tabindex="-1")[^>]*>Články/)
    }))

  it('keeps the field’s messages of 20b and allows a name another article has', () =>
    withArticle(async (context) => {
      let empty = await rename(context, '  ')
      assert.equal(empty.status, 400)
      assert.ok(textOf(await empty.text()).includes('Vyplňte název článku.'))
      let long = await rename(context, 'x'.repeat(201))
      assert.equal(long.status, 400)
      assert.ok(textOf(await long.text()).includes('Zkraťte název na nejvýš 200 znaků.'))
      assert.equal((await articleOf(context)).name, NAME)
    }))

  it('puts Drive back when a step fails midway, and keeps the name in the dialog', () =>
    withArticle(async (context) => {
      let before = await articleOf(context)
      context.app.drive.failRewriteOf(before.metaFileId ?? '')
      let answered = await rename(context, 'Jiný název')
      assert.equal(answered.status, 409)
      let html = await answered.text()
      assert.equal(
        calloutOf(html),
        'Zkuste článek přejmenovat za chvíli znovu. Nic se nezměnilo. Disk teď neodpovídá.',
      )
      assert.match(html, /name="name"[^>]*value="Jiný název"/)
      context.app.drive.heal()
      assert.equal(fileOf(context, before.docId)?.name, NAME)
      assert.equal(fileOf(context, before.folderId)?.name, NAME)
      assert.equal(metaOf(context, before.metaFileId)['articleName'], NAME)
      assert.equal((await articleOf(context)).name, NAME)
    }))

  it('asks for the folder back when it is in the bin, and changes nothing', () =>
    withArticle(async (context) => {
      let before = await articleOf(context)
      context.app.drive.trash(before.folderId ?? '')
      let answered = await rename(context, 'Jiný název')
      assert.equal(answered.status, 409)
      assert.equal(
        calloutOf(await answered.text()),
        'Obnovte složku článku z koše, nebo ji vraťte na sdílený disk Publikace. Nic se nezměnilo.',
      )
      assert.equal(fileOf(context, before.docId)?.name, NAME)
      assert.equal((await articleOf(context)).name, NAME)
    }))

  it('writes nothing over a rename by somebody else or a final version marked meanwhile', () =>
    withArticle(async (context) => {
      let meanwhile = await rename(context, 'Jiný název', 'Starý název')
      assert.equal(meanwhile.status, 303)
      let page = await (await context.editor.get(DETAIL)).text()
      assert.equal(statusText(page), 'Článek se mezitím přejmenoval. Vaše změna se neuložila.')

      await markFinal(context)
      let late = await rename(context, 'Jiný název')
      assert.equal(late.status, 303)
      let after = await (await context.editor.get(DETAIL)).text()
      assert.ok(
        statusText(after).startsWith(
          'Článek už má finální verzi. Přejmenovat ho nejde. Finální verze z',
        ),
      )
      assert.ok(statusText(after).endsWith('Lenka Svobodová'))
      assert.equal((await articleOf(context)).name, NAME)
    }))

  it('keeps pairing a reply to a batch whose request went before the rename', () =>
    withArticle(async (context) => {
      let link = (await createLinkStore(context.app.database).artworksLinksOf(context.issueId)).get(
        context.articleId,
      )
      assert.ok(link !== undefined)
      let batch = await seedBatch(
        context.app,
        { articleId: context.articleId, link },
        context.issueId,
      )
      await createArtworkStore(context.app.database).recordRequestName(batch.id, NAME)
      assert.equal((await rename(context, 'Jiný název')).status, 303)

      let claimed = await context.app.fetch(
        new Request('http://localhost/api/v1/artwork-replies/claim', {
          body: JSON.stringify({ intervalMinutes: 30 }),
          headers: { Authorization: `Bearer ${JOB_TOKEN}`, 'Content-Type': 'application/json' },
          method: 'POST',
        }),
      )
      assert.equal(claimed.status, 200)
      let answer = (await claimed.json()) as {
        batches: { articleName: string; subjectContains: string[] }[]
      }
      assert.deepEqual(answer.batches[0]?.subjectContains, [NAME])
      assert.equal(answer.batches[0]?.articleName, 'Jiný název')
    }))
})

describe('correcting the authors before the final version (12y)', () => {
  it('draws the cards of 20a, every one removable while there are two', () =>
    withArticle(
      async (context) => {
        let html = await (await context.editor.get(authorsPath(context))).text()
        let text = textOf(html)
        assert.ok(text.includes(`Článek „${NAME}“`))
        assert.ok(
          text.includes(
            'Po uložení odejde na každou novou nebo opravenou adresu uvítací e-mail s odkazem na dokument. Na odebrané adresy nic neodejde. Kdo už odkaz z uvítání má, může dokument dál upravovat.',
          ),
        )
        assert.ok(html.includes('Odebrat autora 1'))
        assert.ok(html.includes('Odebrat autora 2'))
        assert.ok(html.includes('Uložit autory'))
      },
      [TEREZA, ONDREJ],
    ))

  it('sends the welcome only to an address the article did not have, past no cap', () =>
    withArticle(
      async (context) => {
        let mailBefore = context.app.mail.length
        await drainRecordQueue(context.app.record)
        let answered = await saveAuthors(context, [
          { email: TEREZA.email, name: 'Tereza Vlková-Nová' },
          LUCIE,
        ])
        assert.equal(answered.status, 303)
        let sent = context.app.mail.slice(mailBefore)
        assert.deepEqual(
          sent.map((message) => message.to),
          [LUCIE.email],
        )
        let article = await articleOf(context)
        assert.deepEqual(
          article.authors.map((author) => [author.name, author.email]),
          [
            ['Tereza Vlková-Nová', TEREZA.email],
            [LUCIE.name, LUCIE.email],
          ],
        )
        let meta = metaOf(context, article.metaFileId)['authors'] as { authorEmail: string }[]
        assert.deepEqual(
          meta.map((author) => author.authorEmail),
          [TEREZA.email, LUCIE.email],
        )
        /* Ondřej went: the Evidence is marked by the removal too. */
        assert.ok(await evidenceMarked(context))
        let page = await (await context.editor.get(DETAIL)).text()
        assert.equal(
          statusText(page),
          `Údaje o autorech jsou uložené. Uvítací e-mail odešel na ${LUCIE.email}`,
        )
      },
      [TEREZA, ONDREJ],
    ))

  it('sends nothing for a corrected name, and says so', () =>
    withArticle(async (context) => {
      let mailBefore = context.app.mail.length
      let answered = await saveAuthors(context, [{ email: TEREZA.email, name: 'Tereza Vlková' }])
      assert.equal(answered.status, 303)
      assert.equal(context.app.mail.length, mailBefore)
      let page = await (await context.editor.get(DETAIL)).text()
      assert.equal(statusText(page), 'Údaje o autorech jsou uložené.')
    }))

  it('tells the editor to send the link where the Mailer did not confirm the welcome', () =>
    withArticle(async (context) => {
      context.app.failMail(true)
      let answered = await saveAuthors(context, [TEREZA, LUCIE])
      assert.equal(answered.status, 303)
      context.app.failMail(false)
      let page = await (await context.editor.get(DETAIL)).text()
      assert.equal(
        statusText(page),
        `Pošlete odkaz na dokument na adresu uvedenou níže. Údaje o autorech jsou uložené. Odeslání uvítacího e-mailu se nepodařilo potvrdit. ${LUCIE.email}`,
      )
      assert.equal((await articleOf(context)).authors.length, 2)
    }))

  it('keeps the cards and the messages of 20b on a refused save', () =>
    withArticle(async (context) => {
      let answered = await saveAuthors(context, [
        TEREZA,
        { email: TEREZA.email, name: 'Jan Novák' },
      ])
      assert.equal(answered.status, 400)
      let text = textOf(await answered.text())
      assert.ok(text.includes('Opravte 1 pole'))
      assert.ok(text.includes('Zkontrolujte adresu. Stejnou má i autor 1.'))
      assert.equal((await articleOf(context)).authors.length, 1)
    }))

  it('puts _meta.json back and sends nothing when the row refuses', () =>
    withArticle(async (context) => {
      let before = await articleOf(context)
      let mailBefore = context.app.mail.length
      context.app.drive.failRewriteOf(before.metaFileId ?? '')
      let answered = await saveAuthors(context, [TEREZA, LUCIE])
      assert.equal(answered.status, 409)
      assert.equal(
        calloutOf(await answered.text()),
        'Zkuste autory uložit za chvíli znovu. Nic se nezměnilo a nic neodešlo. Disk teď neodpovídá.',
      )
      context.app.drive.heal()
      assert.equal(context.app.mail.length, mailBefore)
      assert.equal((await articleOf(context)).authors.length, 1)
    }))

  it('writes nothing once a final version was marked meanwhile', () =>
    withArticle(async (context) => {
      await markFinal(context)
      let answered = await saveAuthors(context, [TEREZA, LUCIE])
      assert.equal(answered.status, 303)
      let page = await (await context.editor.get(DETAIL)).text()
      assert.equal(statusText(page), 'Článek už má finální verzi. Vaše změny se neuložily.')
      assert.equal((await articleOf(context)).authors.length, 1)
    }))
})

describe('correcting the authors after the final version (12y)', () => {
  it('draws an agreed author as text with the tag, and the others to correct', () =>
    withArticle(
      async (context) => {
        await markFinal(context)
        await agree(context, 1)
        let html = await (await context.editor.get(authorsPath(context))).text()
        let text = textOf(html)
        assert.ok(
          text.includes(
            `Článek „${NAME}“ má finální verzi. Upravit lze jen údaje u autorů bez souhlasu.`,
          ),
        )
        assert.ok(text.includes('Souhlasí'))
        assert.ok(!html.includes('Odebrat autora'))
        assert.ok(!html.includes('Přidat autora'))
        let [, second] = await clausesOf(context)
        assert.ok(html.includes(`name="clause" type="hidden" value="${String(second?.['id'])}"`))
        assert.ok(html.includes(`name="marked" type="hidden" value="${stamp(MARKED_AT)}"`))
      },
      [TEREZA, ONDREJ],
    ))

  it('gives a corrected clause a new key and puts it back to be sent, with no welcome', () =>
    withArticle(
      async (context) => {
        await markFinal(context)
        await agree(context, 1)
        let [, second] = await clausesOf(context)
        await context.app.database.exec(
          sql`UPDATE article_clauses SET state = 'sent', sent_at = ${stamp(MARKED_AT)},
                reply_message_id = 'msg-1', reply_received_at = ${stamp(MARKED_AT)},
                reply_text = 'Opravte mi jméno.'
              WHERE id = ${Number(second?.['id'])}`,
        )
        let mailBefore = context.app.mail.length
        let answered = await saveAuthors(
          context,
          [{ email: 'ondrej.benes@external.test', name: 'Ondřej Beneš ml.' }],
          { clauses: [Number(second?.['id'])], marked: stamp(MARKED_AT) },
        )
        assert.equal(answered.status, 303)
        assert.equal(context.app.mail.length, mailBefore)
        let [first, corrected] = await clausesOf(context)
        assert.equal(first?.['approved_at'], stamp(MARKED_AT))
        assert.equal(corrected?.['author_name'], 'Ondřej Beneš ml.')
        assert.equal(corrected?.['state'], 'pending')
        assert.equal(corrected?.['reply_message_id'], null)
        assert.notEqual(corrected?.['clause_key'], second?.['clause_key'])
        assert.equal((await articleOf(context)).authors[1]?.name, 'Ondřej Beneš ml.')
        let page = await (await context.editor.get(DETAIL)).text()
        assert.ok(
          statusText(page).startsWith(
            'Údaje jsou opravené. Žádost o souhlas s redakční doložkou čeká na odeslání.',
          ),
        )
      },
      [TEREZA, ONDREJ],
    ))

  it('refuses an address an agreed author has', () =>
    withArticle(
      async (context) => {
        await markFinal(context)
        await agree(context, 1)
        let [, second] = await clausesOf(context)
        let answered = await saveAuthors(context, [{ email: TEREZA.email, name: ONDREJ.name }], {
          clauses: [Number(second?.['id'])],
          marked: stamp(MARKED_AT),
        })
        assert.equal(answered.status, 400)
        assert.ok(textOf(await answered.text()).includes('Stejnou má i autor 1.'))
      },
      [TEREZA, ONDREJ],
    ))

  it('writes nothing when the author agreed meanwhile, or the marking was cancelled', () =>
    withArticle(
      async (context) => {
        await markFinal(context)
        let [, second] = await clausesOf(context)
        await agree(context, 2)
        let answered = await saveAuthors(context, [LUCIE], {
          clauses: [Number(second?.['id'])],
          marked: stamp(MARKED_AT),
        })
        assert.equal(answered.status, 303)
        let page = await (await context.editor.get(DETAIL)).text()
        assert.ok(statusText(page).startsWith('Ondřej Beneš už souhlasí. Vaše změny se neuložily.'))

        let cancelled = await saveAuthors(context, [LUCIE], {
          clauses: [Number(second?.['id'])],
          marked: stamp(MARKED_AT.subtract({ hours: 2 })),
        })
        assert.equal(cancelled.status, 303)
        assert.equal((await articleOf(context)).authors[1]?.email, ONDREJ.email)
      },
      [TEREZA, ONDREJ],
    ))
})
