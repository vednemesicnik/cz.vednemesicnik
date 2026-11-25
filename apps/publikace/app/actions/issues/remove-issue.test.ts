import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { createArticleStore } from '../../data/articles.server.ts'
import { createGroupStore } from '../../data/artwork-groups.server.ts'
import { createIssueStore } from '../../data/issues.server.ts'
import { createLinkStore } from '../../data/links.server.ts'
import { createPrintHandoffStore } from '../../data/print-handoff.server.ts'
import { drainRecordQueue } from '../../drive/record-queue.server.ts'
import { articleLinkPath } from '../../domain/link.ts'
import { NBSP } from '../../domain/public/typography.ts'
import { REGISTRY_LIST } from '../../domain/record.ts'
import { now } from '../../domain/time.ts'
import {
  connectDriveAccount,
  createTestApp,
  seedAdmin,
  started,
  TEST_ISSUES_FOLDER,
  TEST_REGISTRY,
  type TestApp,
  type TestBrowser,
} from '../../test-app.server.ts'

const MARIE = 'marie@vednemesicnik.test'
const ISSUE = 'VDM_2026_6'
const DETAIL = `/issues/${ISSUE}`
const REMOVE = `${DETAIL}/remove`

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

function calloutOf(html: string): string | null {
  let dialog = html.slice(html.indexOf('class="vdm-dialog"'))
  let found = /class="vdm-callout__body">(.*?)<\/div>/s.exec(dialog)
  return found === null ? null : textOf(found[1] ?? '').trim()
}

type Context = { app: TestApp; editor: TestBrowser; issueId: number }

async function withIssue(run: (context: Context) => Promise<void>): Promise<void> {
  let app = await createTestApp()
  try {
    await seedAdmin(app, MARIE)
    await connectDriveAccount(app)
    let editor = app.browser()
    await editor.signInAs(MARIE, 'Marie Horáková')
    assert.equal((await editor.post('/issues/new', { name: ISSUE }, '/issues/new')).status, 303)
    let issue = await createIssueStore(app.database).findByName(ISSUE)
    assert.ok(issue !== null)
    await run({ app, editor, issueId: issue.id })
  } finally {
    await app.close()
  }
}

function remove(context: Context, fields: Record<string, string> = {}): Promise<Response> {
  return context.editor.post(
    REMOVE,
    { id: String(context.issueId), returnTo: 'detail', shownName: ISSUE, ...fields },
    REMOVE,
  )
}

async function issueOf(context: Context) {
  return createIssueStore(context.app.database).findById(context.issueId)
}

function isTrashed(context: Context, id: string | null | undefined): boolean {
  return context.app.drive.files().find((file) => file.id === id)?.isTrashed === true
}

describe('removing an issue (12w)', () => {
  it('asks with the name in the title, red, and the Registr and the link both said', () =>
    withIssue(async ({ editor }) => {
      let html = await (await editor.get(REMOVE)).text()
      let text = textOf(html)
      assert.ok(text.includes('Odebrat vydání VDM_2026_6?'))
      assert.ok(
        text.includes(
          'Složka vydání se přesune do koše sdíleného disku Publikace i se vším, co v ní je. Vydání zmizí z přehledu i z Registru a jeho název půjde použít znovu. Odkaz pro redakci přestane platit. Obnovením složky z koše se vydání do aplikace nevrátí. Nikomu se nic nepošle.',
        ),
      )
      assert.ok(
        html.includes('class="vdm-btn vdm-btn--danger vdm-btn--sm">Odebrat vydání</button>'),
      )
    }))

  it('bins the folder, frees the name, leaves the overview, the Registr and the link', () =>
    withIssue(async (context) => {
      await drainRecordQueue(context.app.record)
      let issue = await issueOf(context)
      let link = await createLinkStore(context.app.database).articleLinkOf(context.issueId)
      let mailBefore = context.app.mail.length

      let answered = await remove(context)
      assert.equal(answered.status, 303)
      assert.equal(answered.headers.get('Location'), '/')
      assert.ok((await issueOf(context))?.removedAt != null)
      assert.ok(isTrashed(context, issue?.folderIds.issue))
      /* Its folders and its Evidence went with it, by the folder alone. */
      assert.ok(!isTrashed(context, issue?.folderIds.articles))

      let overview = await (await context.editor.get('/')).text()
      assert.equal(
        statusText(overview),
        'Složka vydání VDM_2026_6 je v koši sdíleného disku Publikace.',
      )
      assert.match(overview, /<h1 (?=[^>]*autofocus)(?=[^>]*tabindex="-1")[^>]*>Vydání<\/h1>/)
      assert.ok(!overview.includes(DETAIL))
      assert.equal((await context.editor.get(DETAIL)).status, 404)
      assert.equal((await context.app.browser().get(articleLinkPath(link?.key ?? ''))).status, 410)
      assert.equal(context.app.mail.length, mailBefore)

      await drainRecordQueue(context.app.record)
      let registry = context.app.drive.spreadsheet(TEST_REGISTRY)
      let cells = registry?.lists.find((list) => list.title === REGISTRY_LIST.name)?.cells ?? []
      assert.ok(!cells.some((row) => row[0] === ISSUE))
      let claimed = await createPrintHandoffStore(context.app.database).claim('run-1', now())
      assert.deepEqual(
        claimed.map((each) => each.issueId),
        [],
      )

      let again = await context.editor.post('/issues/new', { name: ISSUE }, '/issues/new')
      assert.equal(again.status, 303)
      assert.equal(again.headers.get('Location'), DETAIL)
    }))

  it('counts the Evidence and the print sheet the app made as its own', () =>
    withIssue(async (context) => {
      await drainRecordQueue(context.app.record)
      let issue = await issueOf(context)
      assert.ok(issue?.evidenceSpreadsheetId != null)
      context.app.drive.seedSpreadsheet('sheet-podklady', '_Podklady', [])
      context.app.drive.move('sheet-podklady', issue.folderIds.print ?? '')
      await context.app.database.exec(
        sql`INSERT INTO print_handoffs (issue_id, sheet_id) VALUES (${context.issueId}, 'sheet-podklady')`,
      )
      assert.equal((await remove(context)).status, 303)
      assert.ok((await issueOf(context))?.removedAt != null)
    }))

  it('refuses a folder holding a file a person put in, and names it', () =>
    withIssue(async (context) => {
      let issue = await issueOf(context)
      context.app.drive.seedDoc(
        'doc-notes',
        'poznamky-k-vydani.docx',
        issue?.folderIds.articles ?? '',
      )

      let answered = await remove(context)
      assert.equal(answered.status, 409)
      assert.equal(
        calloutOf(await answered.text()),
        'Přesuňte ze složky vydání soubory, které do ní nedala aplikace. Ve složce „Články“: poznamky-k-vydani.docx. Vydání zůstalo, jak bylo.',
      )
      assert.equal((await issueOf(context))?.removedAt, null)
      assert.ok(!isTrashed(context, issue?.folderIds.issue))
    }))

  it('lists every file from four, by folder in the order the app names its folders', () =>
    withIssue(async (context) => {
      let issue = await issueOf(context)
      context.app.drive.seedDoc('doc-print', 'logo.png', issue?.folderIds.print ?? '')
      context.app.drive.seedDoc('doc-b', 'obalka-2.pdf', issue?.folderIds.articles ?? '')
      context.app.drive.seedDoc('doc-a', 'obalka-10.pdf', issue?.folderIds.articles ?? '')
      context.app.drive.seedDoc('doc-root', 'rozpocet.xlsx', issue?.folderIds.issue ?? '')

      let answered = await remove(context)
      assert.equal(answered.status, 409)
      let html = await answered.text()
      assert.equal(html.match(/class="vdm-callout__group"/g)?.length, 3)
      assert.equal(
        calloutOf(html)?.replace(/\s+/g, ' '),
        `Přesuňte ze složky vydání soubory, které do ní nedala aplikace. Ve složce „${ISSUE}“: rozpocet.xlsx Ve složce „Články“: obalka-2.pdf obalka-10.pdf Ve složce „_Podklady_pro_tisk“: logo.png Vydání zůstalo, jak bylo.`,
      )
      assert.equal((await issueOf(context))?.removedAt, null)
    }))

  it('refuses a folder moved from where the app made it', () =>
    withIssue(async (context) => {
      let issue = await issueOf(context)
      context.app.drive.seedFolder('f-elsewhere', 'Jinde', TEST_ISSUES_FOLDER)
      context.app.drive.move(issue?.folderIds.issue ?? '', 'f-elsewhere')
      let answered = await remove(context)
      assert.equal(
        calloutOf(await answered.text()),
        'Vraťte složku vydání tam, kde ji aplikace založila. Teď je jinde, a tak vydání zůstalo, jak bylo.',
      )
      assert.equal((await issueOf(context))?.removedAt, null)
    }))

  it('records the removal of a folder already in the bin, which the dialog says', () =>
    withIssue(async (context) => {
      let issue = await issueOf(context)
      context.app.drive.trash(issue?.folderIds.issue ?? '')
      await createIssueStore(context.app.database).markMissing(context.issueId, ['issue'], now())
      let asked = textOf(await (await context.editor.get(REMOVE)).text())
      assert.ok(asked.includes('Složka vydání už je v koši sdíleného disku Publikace.'))
      assert.equal((await remove(context)).status, 303)
      assert.ok((await issueOf(context))?.removedAt != null)
    }))

  it('changes nothing when Drive does not answer or the account is disconnected', () =>
    withIssue(async (context) => {
      context.app.drive.failStep('trash')
      assert.equal(
        calloutOf(await (await remove(context)).text()),
        'Zkuste vydání odebrat za chvíli znovu. Vydání zůstalo, jak bylo. Disk teď neodpovídá.',
      )
      assert.equal((await issueOf(context))?.removedAt, null)
      context.app.drive.heal()

      await context.app.driveAccount.markDisconnected(now())
      assert.equal(
        calloutOf(await (await remove(context)).text()),
        'Nejdřív v Nastavení připojte účet publikace.app@vednemesicnik.cz. Pak zkuste vydání odebrat znovu.',
      )
      assert.equal((await issueOf(context))?.removedAt, null)
    }))

  it('leaves the issue when an article or a group started meanwhile, and opens its detail', () =>
    withIssue(async (context) => {
      let link = await createLinkStore(context.app.database).articleLinkOf(context.issueId)
      let attempt = started(
        await createArticleStore(context.app.database).startAttempt({
          at: now(),
          authors: [{ email: 'tereza.vlkova@external.test', name: 'Tereza Vlková' }],
          formKey: crypto.randomUUID(),
          issueId: context.issueId,
          linkId: link?.id ?? 0,
          name: 'Školní jídelna po roce',
        }),
      )
      let answered = await remove(context)
      assert.equal(answered.headers.get('Location'), DETAIL)
      assert.equal(
        statusText(await (await context.editor.get(DETAIL)).text()),
        'Ve vydání mezitím vznikl článek. Vydání se neodebralo.',
      )
      await createArticleStore(context.app.database).discard(attempt.attempt.id)

      let group = await createGroupStore(context.app.database).startAttempt({
        at: now(),
        formKey: crypto.randomUUID(),
        issueId: context.issueId,
        name: 'Mapa obce k rozhovoru i reportáži',
        nameKey: 'mapa obce k rozhovoru i reportáži',
        note: '',
        startedBy: { email: MARIE, name: 'Marie Horáková' },
      })
      assert.ok(typeof group === 'object')
      await remove(context)
      assert.equal(
        statusText(await (await context.editor.get(DETAIL)).text()),
        'Ve vydání mezitím vznikla skupina. Vydání se neodebralo.',
      )
      assert.equal((await issueOf(context))?.removedAt, null)
    }))

  it('answers a second removal with the overview, and refuses a link’s article after the first', () =>
    withIssue(async (context) => {
      let link = await createLinkStore(context.app.database).articleLinkOf(context.issueId)
      assert.equal((await remove(context)).status, 303)
      let second = await context.editor.post(
        REMOVE,
        { id: String(context.issueId), returnTo: 'overview', shownName: ISSUE },
        '/',
      )
      assert.equal(second.headers.get('Location'), '/')
      assert.equal(
        statusText(await (await context.editor.get('/')).text()),
        'Vydání už je odebrané.',
      )
      let refused = await createArticleStore(context.app.database).startAttempt({
        at: now(),
        authors: [{ email: 'tereza.vlkova@external.test', name: 'Tereza Vlková' }],
        formKey: crypto.randomUUID(),
        issueId: context.issueId,
        linkId: link?.id ?? 0,
        name: 'Školní jídelna po roce',
      })
      assert.equal(refused, 'issue-removed')
    }))
})
