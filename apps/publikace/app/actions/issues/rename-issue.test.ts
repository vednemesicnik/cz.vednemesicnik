import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { createArticleStore } from '../../data/articles.server.ts'
import { createGroupStore } from '../../data/artwork-groups.server.ts'
import { createIssueStore } from '../../data/issues.server.ts'
import { createLinkStore } from '../../data/links.server.ts'
import { drainRecordQueue } from '../../drive/record-queue.server.ts'
import { articleLinkPath } from '../../domain/link.ts'
import { NBSP } from '../../domain/public/typography.ts'
import { REGISTRY_LIST } from '../../domain/record.ts'
import { now } from '../../domain/time.ts'
import {
  connectDriveAccount,
  createTestApp,
  seedAdmin,
  seedIssue,
  started,
  TEST_REGISTRY,
  type TestApp,
  type TestBrowser,
} from '../../test-app.server.ts'

const MARIE = 'marie@vednemesicnik.test'
const TEREZA = { email: 'tereza.vlkova@external.test', name: 'Tereza Vlková' }
const ISSUE = 'VDM_2026_5'
const RENAMED = 'VDM_2026_6'
const DETAIL = `/issues/${ISSUE}`
const RENAME = `${DETAIL}/rename`

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

type Context = { app: TestApp; editor: TestBrowser; issueId: number }

/** An issue made through the app, so its folders are on the fake Drive. */
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

/** An article through the newsroom's link, with its folder, Doc and `_meta.json` on Drive. */
async function addArticle(context: Context, name: string): Promise<number> {
  let link = await createLinkStore(context.app.database).articleLinkOf(context.issueId)
  assert.ok(link !== null)
  let visitor = context.app.browser()
  let page = await (await visitor.get(articleLinkPath(link.key))).text()
  let formKey = /name="formKey" type="hidden" value="([^"]+)"/.exec(page)?.[1] ?? ''
  let body = new URLSearchParams({ formKey, intent: 'create', name })
  body.append('author-name', TEREZA.name)
  body.append('author-email', TEREZA.email)
  assert.equal((await visitor.send(articleLinkPath(link.key), body)).status, 200)
  let created = await createArticleStore(context.app.database).listCreated(context.issueId)
  let article = created.find((each) => each.name === name)
  assert.ok(article !== undefined, 'the article was created')
  return article.id
}

async function addGroup(context: Context, name: string): Promise<number> {
  let path = `${DETAIL}/artwork-groups/new`
  let response = await context.editor.post(
    path,
    { formKey: crypto.randomUUID(), name, note: '' },
    path,
  )
  assert.equal(response.status, 303)
  let groups = await createGroupStore(context.app.database).listByIssue(context.issueId)
  let group = groups.find((each) => each.name === name)
  assert.ok(group !== undefined, 'the group was created')
  return group.id
}

async function metaFilesOf(context: Context): Promise<string[]> {
  let articles = await createArticleStore(context.app.database).listCreated(context.issueId)
  let groups = await createGroupStore(context.app.database).listByIssue(context.issueId)
  return [...articles, ...groups].map((each) => each.metaFileId ?? '')
}

function metaIssueOf(context: Context, fileId: string): unknown {
  let file = context.app.drive.files().find((each) => each.id === fileId)
  return JSON.parse(file?.content ?? '{}')['issue']
}

function rename(
  context: Context,
  name: string,
  fields: Record<string, string> = {},
): Promise<Response> {
  return context.editor.post(
    RENAME,
    { id: String(context.issueId), name, returnTo: 'detail', shownName: ISSUE, ...fields },
    RENAME,
  )
}

async function issueFolderName(context: Context): Promise<string | undefined> {
  let issue = await createIssueStore(context.app.database).findById(context.issueId)
  return context.app.drive.folders().find((each) => each.id === issue?.folderIds.issue)?.name
}

async function storedName(context: Context): Promise<string | undefined> {
  return (await createIssueStore(context.app.database).findById(context.issueId))?.name
}

describe('where Přejmenovat vydání… and Odebrat vydání… stand (12u)', () => {
  it('end the menus of an empty active issue after a line, and the row’s from the overview', () =>
    withIssue(async ({ editor }) => {
      let detail = await (await editor.get(DETAIL)).text()
      assert.ok(
        detail.includes(`"href":"${RENAME}","isSameTab":true,"label":"Přejmenovat vydání…"`),
      )
      assert.ok(
        detail.includes(`"href":"${DETAIL}/remove","isSameTab":true,"label":"Odebrat vydání…"`),
      )
      assert.match(
        detail,
        /"label":"Uzavřít vydání…"\},\{"isSeparator":true\},\{"href":"[^"]+\/rename"/,
      )

      let overview = await (await editor.get('/?state=open')).text()
      assert.ok(overview.includes(`"href":"${RENAME}?from=overview&state=open"`))
      assert.ok(overview.includes(`"href":"${DETAIL}/remove?from=overview&state=open"`))
    }))

  it('leave Odebrat out once the issue has an article or a group', () =>
    withIssue(async (context) => {
      await addGroup(context, 'Mapa obce k rozhovoru i reportáži')
      let detail = await (await context.editor.get(DETAIL)).text()
      assert.ok(detail.includes('Přejmenovat vydání…'))
      assert.ok(!detail.includes('Odebrat vydání…'))
      let overview = await (await context.editor.get('/')).text()
      assert.ok(!overview.includes('Odebrat vydání…'))
      /* An address typed by hand goes back rather than asking. */
      assert.equal((await context.editor.get(`${DETAIL}/remove`)).status, 303)
    }))

  it('offer a closed issue only the removal, and an unfinished one its folder and both', async () => {
    let app = await createTestApp()
    try {
      await seedAdmin(app, MARIE)
      let closedId = await seedIssue(app, 'VDM_2026_3')
      await createIssueStore(app.database).close(closedId, now())
      await seedIssue(app, 'VDM_2026_4', { isComplete: false })
      let editor = app.browser()
      await editor.signInAs(MARIE, 'Marie Horáková')

      let closed = await (await editor.get('/issues/VDM_2026_3')).text()
      assert.ok(!closed.includes('Přejmenovat vydání…'))
      assert.ok(closed.includes('Odebrat vydání…'))
      assert.equal((await editor.get('/issues/VDM_2026_3/rename')).status, 303)

      let unfinished = await (await editor.get('/issues/VDM_2026_4')).text()
      assert.match(
        unfinished,
        /"label":"Otevřít složku na Disku"\},\{"isSeparator":true\},\{"href":"\/issues\/VDM_2026_4\/rename"/,
      )
      assert.ok(unfinished.includes('Odebrat vydání…'))
    } finally {
      await app.close()
    }
  })
})

describe('renaming an issue (12v)', () => {
  it('asks with the name in the field, the Registr sentence, and the issue’s ID in the form', () =>
    withIssue(async ({ editor, issueId }) => {
      let html = await (await editor.get(RENAME)).text()
      let text = textOf(html)
      assert.ok(
        text.includes(
          'Přejmenuje se i složka vydání na sdíleném disku Publikace. Nový název vydání se v Registru může objevit později.',
        ),
      )
      assert.ok(
        text.includes(
          'Odkazy pro redakci i odkazy na nahrání děl platí dál. Nikomu se nic nepošle a e-maily, které už odešly, nesou dosavadní název.',
        ),
      )
      assert.ok(!text.includes('Evidenc'))
      assert.ok(html.includes(`name="id" type="hidden" value="${issueId}"`))
      assert.ok(html.includes(`name="shownName" type="hidden" value="${ISSUE}"`))
      assert.match(html, /name="name"[^>]*value="VDM_2026_5"/)
      assert.ok(text.includes('Vydání se přejmenovává…') || html.includes('Vydání se přejmenovává'))
    }))

  it('renames the folder and every _meta.json, opens the new address and marks the Registr', () =>
    withIssue(async (context) => {
      let articleId = await addArticle(context, 'Školní jídelna po roce')
      await addGroup(context, 'Mapa obce k rozhovoru i reportáži')
      await drainRecordQueue(context.app.record)

      let answered = await rename(context, RENAMED)
      assert.equal(answered.status, 303)
      assert.equal(answered.headers.get('Location'), `/issues/${RENAMED}`)
      assert.equal(await storedName(context), RENAMED)
      assert.equal(await issueFolderName(context), RENAMED)
      for (let fileId of await metaFilesOf(context)) {
        assert.equal(metaIssueOf(context, fileId), RENAMED)
      }

      let after = await (await context.editor.get(`/issues/${RENAMED}`)).text()
      assert.equal(statusText(after), 'Vydání i jeho složka jsou přejmenované.')
      assert.match(after, /<h1 (?=[^>]*autofocus)(?=[^>]*tabindex="-1")[^>]*>VDM_2026_6<\/h1>/)
      assert.equal((await context.editor.get(DETAIL)).status, 404)

      /* The link keeps its key, and nothing went out. */
      let link = await createLinkStore(context.app.database).articleLinkOf(context.issueId)
      assert.equal((await context.app.browser().get(articleLinkPath(link?.key ?? ''))).status, 200)
      let mailBefore = context.app.mail.length
      await drainRecordQueue(context.app.record)
      assert.equal(context.app.mail.length, mailBefore)
      let registry = context.app.drive.spreadsheet(TEST_REGISTRY)
      let cells = registry?.lists.find((list) => list.title === REGISTRY_LIST.name)?.cells ?? []
      assert.ok(cells.some((row) => row[0] === RENAMED))
      assert.ok(!cells.some((row) => row[0] === ISSUE))

      /* A later article carries the new name in its `_meta.json` too. */
      let later = await addArticle(context, 'Zahrada na střeše tělocvičny')
      let row = await createArticleStore(context.app.database).findById(later)
      assert.equal(metaIssueOf(context, row?.metaFileId ?? ''), RENAMED)
      assert.ok(articleId !== later)
    }))

  it('goes back to the overview with the row on the tint of a change', () =>
    withIssue(async (context) => {
      let answered = await rename(context, RENAMED, { returnTo: 'overview', state: 'open' })
      assert.equal(answered.headers.get('Location'), '/?state=open')
      let overview = await (await context.editor.get('/?state=open')).text()
      assert.equal(statusText(overview), 'Vydání i jeho složka jsou přejmenované.')
      let changed = overview.indexOf('vdm-changed')
      assert.ok(changed > 0, 'a row is on the tint of a change')
      assert.ok(overview.slice(changed, changed + 400).includes(RENAMED))
    }))

  it('refuses the field as 11d does, passes a change of case, and closes on the same name', () =>
    withIssue(async (context) => {
      await seedIssue(context.app, 'VDM_2026_4')
      let empty = await rename(context, '  ')
      assert.equal(empty.status, 400)
      assert.ok(textOf(await empty.text()).includes('Vyplňte název vydání.'))
      let taken = await rename(context, 'vdm_2026_4')
      assert.equal(taken.status, 400)
      assert.ok(
        textOf(await taken.text()).includes(
          'Zvolte jiný název — vydání VDM_2026_4 už v aplikaci existuje.',
        ),
      )

      let calls = context.app.drive.calls.length
      let same = await rename(context, ISSUE)
      assert.equal(same.headers.get('Location'), DETAIL)
      assert.equal(context.app.drive.calls.length, calls, 'nothing was asked of Drive')
      assert.equal(statusText(await (await context.editor.get(DETAIL)).text()), '')

      assert.equal((await rename(context, 'vdm_2026_5')).status, 303)
      assert.equal(await storedName(context), 'vdm_2026_5')
    }))

  it('puts back everything it changed when Drive fails at a _meta.json', () =>
    withIssue(async (context) => {
      await addArticle(context, 'Školní jídelna po roce')
      await addGroup(context, 'Mapa obce k rozhovoru i reportáži')
      let [first, second] = await metaFilesOf(context)
      context.app.drive.failRewriteOf(second ?? '')

      let answered = await rename(context, RENAMED)
      assert.equal(answered.status, 409)
      assert.equal(
        calloutOf(await answered.text()),
        'Zkuste vydání přejmenovat za chvíli znovu. Nic se nezměnilo. Disk teď neodpovídá.',
      )
      assert.equal(await storedName(context), ISSUE)
      assert.equal(await issueFolderName(context), ISSUE)
      assert.equal(metaIssueOf(context, first ?? ''), ISSUE)
    }))

  it('names the article folders and group folders it did not find, and changes nothing', () =>
    withIssue(async (context) => {
      await addArticle(context, 'Školní jídelna po roce')
      let groupId = await addGroup(context, 'Mapa obce k rozhovoru i reportáži')
      let group = await createGroupStore(context.app.database).findById(groupId)
      context.app.drive.trash(group?.folderId ?? '')

      let groupOnly = await rename(context, RENAMED)
      assert.equal(groupOnly.status, 409)
      assert.equal(
        calloutOf(await groupOnly.text()),
        'Obnovte složku skupiny „Mapa obce k rozhovoru i reportáži“ z koše, nebo ji vraťte na sdílený disk Publikace. K přejmenování vydání jsou potřeba složky všech skupin obrazových děl. Nic se nezměnilo.',
      )

      let [article] = await createArticleStore(context.app.database).listCreated(context.issueId)
      context.app.drive.trash(article?.folderId ?? '')
      let both = await (await rename(context, RENAMED)).text()
      assert.equal(
        calloutOf(both),
        'Obnovte složky článku „Školní jídelna po roce“ a skupiny „Mapa obce k rozhovoru i reportáži“ z koše, nebo je vraťte na sdílený disk Publikace. K přejmenování vydání jsou potřeba složky všech článků a skupin obrazových děl. Nic se nezměnilo.',
      )
      assert.match(both, /name="name"[^>]*value="VDM_2026_6"/)
      assert.equal(await storedName(context), ISSUE)
      assert.equal(await issueFolderName(context), ISSUE)
    }))

  it('asks for a _meta.json in the bin, and writes anew one deleted for good', () =>
    withIssue(async (context) => {
      await addArticle(context, 'Školní jídelna po roce')
      let [meta] = await metaFilesOf(context)
      context.app.drive.trash(meta ?? '')
      let binned = await rename(context, RENAMED)
      assert.equal(
        calloutOf(await binned.text()),
        'Otevřete soubor pro článek „Školní jídelna po roce“ a obnovte ho z koše. Nic se nezměnilo.',
      )
      assert.equal(await storedName(context), ISSUE)

      context.app.drive.remove(meta ?? '')
      assert.equal((await rename(context, RENAMED)).status, 303)
      let [written] = await metaFilesOf(context)
      assert.ok(written !== meta)
      assert.equal(metaIssueOf(context, written ?? ''), RENAMED)
    }))

  it('asks for the issue folder or Články when one is missing', () =>
    withIssue(async (context) => {
      let issue = await createIssueStore(context.app.database).findById(context.issueId)
      context.app.drive.trash(issue?.folderIds.articles ?? '')
      assert.equal(
        calloutOf(await (await rename(context, RENAMED)).text()),
        'Obnovte složku Články vydání VDM_2026_5 z koše, nebo ji vraťte na sdílený disk Publikace. Nic se nezměnilo.',
      )
      context.app.drive.restore(issue?.folderIds.articles ?? '')
      context.app.drive.trash(issue?.folderIds.issue ?? '')
      assert.equal(
        calloutOf(await (await rename(context, RENAMED)).text()),
        'Obnovte složku vydání z koše, nebo ji vraťte na sdílený disk Publikace. Nic se nezměnilo.',
      )
      assert.equal(await storedName(context), ISSUE)
    }))

  it('asks to connect the account when it is disconnected', () =>
    withIssue(async (context) => {
      await context.app.driveAccount.markDisconnected(now())
      assert.equal(
        calloutOf(await (await rename(context, RENAMED)).text()),
        'Nejdřív v Nastavení připojte účet publikace.app@vednemesicnik.cz. Nic se nezměnilo.',
      )
    }))

  it('answers a rename or a closing meanwhile with what holds now', () =>
    withIssue(async (context) => {
      let stale = await rename(context, 'VDM_2026_9', { shownName: 'VDM_2026_1' })
      assert.equal(stale.headers.get('Location'), DETAIL)
      assert.equal(
        statusText(await (await context.editor.get(DETAIL)).text()),
        'Vydání se mezitím přejmenovalo. Vaše změna se neuložila.',
      )

      await createIssueStore(context.app.database).close(context.issueId, now())
      /* The dialog was drawn before the closing; its form's token is the session's. */
      let closed = await context.editor.post(
        RENAME,
        { id: String(context.issueId), name: RENAMED, returnTo: 'detail', shownName: ISSUE },
        DETAIL,
      )
      assert.equal(closed.headers.get('Location'), DETAIL)
      assert.equal(
        statusText(await (await context.editor.get(DETAIL)).text()),
        'Vydání VDM_2026_5 je uzavřené. Přejmenovat ho už nejde.',
      )
      assert.equal(await storedName(context), ISSUE)
    }))

  it('changes nothing while an article is being created, and Drive is put back', () =>
    withIssue(async (context) => {
      let link = await createLinkStore(context.app.database).articleLinkOf(context.issueId)
      started(
        await createArticleStore(context.app.database).startAttempt({
          at: now(),
          authors: [TEREZA],
          formKey: crypto.randomUUID(),
          issueId: context.issueId,
          linkId: link?.id ?? 0,
          name: 'Školní jídelna po roce',
        }),
      )
      assert.equal((await rename(context, RENAMED)).status, 409)
      assert.equal(await storedName(context), ISSUE)
      assert.equal(await issueFolderName(context), ISSUE)
    }))

  it('renames an unfinished issue’s folder, and the row alone when it has none yet', async () => {
    let app = await createTestApp()
    try {
      await seedAdmin(app, MARIE)
      await connectDriveAccount(app)
      let editor = app.browser()
      await editor.signInAs(MARIE, 'Marie Horáková')
      let issueId = await seedIssue(app, ISSUE, { isComplete: false })
      let store = createIssueStore(app.database)
      let answered = await editor.post(
        RENAME,
        { id: String(issueId), name: RENAMED, returnTo: 'detail', shownName: ISSUE },
        RENAME,
      )
      /* The seeded folder is not on the fake Drive, so the rename meets it as missing. */
      assert.equal(answered.status, 409)

      app.drive.seedFolder(`f-${ISSUE}`, ISSUE, 'fake-issues-folder')
      let renamed = await editor.post(
        RENAME,
        { id: String(issueId), name: RENAMED, returnTo: 'detail', shownName: ISSUE },
        RENAME,
      )
      assert.equal(renamed.status, 303)
      assert.equal((await store.findById(issueId))?.name, RENAMED)
      assert.equal(app.drive.folders().find((each) => each.id === `f-${ISSUE}`)?.name, RENAMED)
    } finally {
      await app.close()
    }
  })
})
