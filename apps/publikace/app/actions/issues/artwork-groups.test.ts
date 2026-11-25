import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { appOrigin } from '../../auth/environment.server.ts'
import { createGroupStore } from '../../data/artwork-groups.server.ts'
import { createArtworkStore } from '../../data/artworks.server.ts'
import { createIssueStore } from '../../data/issues.server.ts'
import { createLinkStore } from '../../data/links.server.ts'
import { NBSP } from '../../domain/public/typography.ts'
import { drainRecordQueue } from '../../drive/record-queue.server.ts'
import {
  connectDriveAccount,
  createTestApp,
  JOB_TOKEN,
  seedAdmin,
  TEST_ENVIRONMENT,
  type TestApp,
  type TestBrowser,
} from '../../test-app.server.ts'

/**
 * Artwork groups end to end (#133): the dialog of `12e` over the detail, the group on Drive, its
 * row in `12a`, its link's page (`21a`, `21c`), its consent request, and its batches where an
 * article's go: _Ke kontrole_, the reply check, the print folder and the Evidence.
 */

const MARIE = 'marie@vednemesicnik.test'
const ISSUE = 'VDM_2026_5'
const DETAIL = `/issues/${ISSUE}`
const NEW = `${DETAIL}/artwork-groups/new`
const KLARA = { email: 'klara.simkova@external.test', name: 'Klára Šimková' }
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4])
const DIALOG_KEY = '44444444-4444-4444-8444-444444444444'
const PAGE_KEY = '55555555-5555-4555-8555-555555555555'
const NOTE = 'K textům „Proč nechodíme volit“ a „První volby“.'

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('&nbsp;', ' ')
    .replaceAll(NBSP, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ ([.,;?)])/g, '$1')
}

/** The section _Skupiny obrazových děl_ as text, or `null` when the page has none. */
function groupsSection(html: string): string | null {
  let found = /<section aria-labelledby="groups-title"[^>]*>(.*?)<\/section>/s.exec(html)
  return found === null ? null : textOf(found[1] ?? '').trim()
}

type Context = { app: TestApp; editor: TestBrowser; issueId: number }

/** An issue made through the app, and Marie signed in with the Drive account connected. */
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

function createGroup(
  context: Context,
  fields: { formKey?: string; name: string; note?: string },
): Promise<Response> {
  return context.editor.post(
    NEW,
    { formKey: fields.formKey ?? crypto.randomUUID(), name: fields.name, note: fields.note ?? '' },
    NEW,
  )
}

async function linkKeyOf(context: Context, name: string): Promise<string> {
  let [group] = (await createGroupStore(context.app.database).listByIssue(context.issueId)).filter(
    (each) => each.name === name,
  )
  assert.ok(group?.link != null)
  return group.link.key
}

/** One batch through the group's link: an upload, then _Odeslat díla_. */
async function sendBatch(context: Context, key: string): Promise<Response> {
  let visitor = context.app.browser()
  let uploaded = await visitor.sendBytes(`/l/${key}/artworks/files`, new Uint8Array(JPEG), {
    'Content-Type': 'image/jpeg',
    'X-File-Name': encodeURIComponent('mapa-obce.jpg'),
    'X-Form-Key': PAGE_KEY,
  })
  assert.equal(uploaded.status, 201)
  let { artwork } = (await uploaded.json()) as { artwork: { id: number } }
  let body = new URLSearchParams({
    formKey: PAGE_KEY,
    'provider-email': KLARA.email,
    'provider-name': KLARA.name,
  })
  body.append('artwork-id', String(artwork.id))
  body.append('artwork-author', 'Klára Šimková')
  body.append('artwork-source', '')
  return visitor.send(`/l/${key}/artworks`, body)
}

function callJob(app: TestApp, path: string, body: unknown): Promise<Response> {
  return app.fetch(
    new Request(new URL(path, appOrigin(TEST_ENVIRONMENT)), {
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${JOB_TOKEN}`, 'Content-Type': 'application/json' },
      method: 'POST',
    }),
  )
}

describe('a new artwork group (12e)', () => {
  it('opens over the detail, which draws the empty section with Nová skupina (12c)', () =>
    withIssue(async (context) => {
      let detail = await (await context.editor.get(DETAIL)).text()
      assert.equal(
        groupsSection(detail),
        'Skupiny obrazových děl 0 Nová skupina Skupinu založte, když dílo patří k více textům.',
      )
      let dialog = textOf(await (await context.editor.get(NEW)).text())
      assert.ok(dialog.includes('Nová skupina obrazových děl'))
      assert.ok(dialog.includes('Skupina dostane složku a odkaz na nahrání.'))
      assert.ok(dialog.includes('Název skupiny *'))
      assert.ok(dialog.includes('Poznámka pro grafika (nepovinné)'))
      assert.ok(
        dialog.includes('Ke kterým textům díla patří. Grafik ji uvidí u každého díla skupiny.'),
      )
    }))

  it('refuses an empty name, a long name, a long note and a name the issue holds, keeping both fields', () =>
    withIssue(async (context) => {
      let empty = await createGroup(context, { name: '  ', note: NOTE })
      assert.equal(empty.status, 400)
      let emptyHtml = await empty.text()
      assert.ok(textOf(emptyHtml).includes('Vyplňte název skupiny.'))
      assert.ok(emptyHtml.includes('Proč nechodíme volit'))

      let long = await createGroup(context, { name: 'x'.repeat(201) })
      assert.equal(long.status, 400)
      let longHtml = await long.text()
      assert.ok(textOf(longHtml).includes('Zkraťte název na nejvýš 200 znaků.'))
      assert.ok(longHtml.includes(`value="${'x'.repeat(201)}"`))

      let longNote = await createGroup(context, {
        name: 'Mapa obce k rozhovoru i reportáži',
        note: 'x'.repeat(501),
      })
      assert.equal(longNote.status, 400)
      let longNoteHtml = await longNote.text()
      assert.ok(textOf(longNoteHtml).includes('Zkraťte poznámku na nejvýš 500 znaků.'))
      assert.ok(longNoteHtml.includes('value="Mapa obce k rozhovoru i reportáži"'))

      assert.equal(
        (await createGroup(context, { name: 'Mapa obce k rozhovoru i reportáži' })).status,
        303,
      )
      let calls = context.app.drive.calls.length
      let duplicate = await createGroup(context, { name: '  mapa obce k rozhovoru i reportáži ' })
      assert.equal(duplicate.status, 400)
      assert.ok(
        textOf(await duplicate.text()).includes(
          'Skupina Mapa obce k rozhovoru i reportáži už ve vydání je. Zvolte jiný název.',
        ),
      )
      assert.equal(context.app.drive.calls.length, calls)
    }))

  it('makes the group’s folders and _meta.json, lists it first with its link, and mails nobody', () =>
    withIssue(async (context) => {
      let mailBefore = context.app.mail.length
      assert.equal(
        (await createGroup(context, { name: 'Mapa obce k rozhovoru i reportáži' })).status,
        303,
      )
      let created = await createGroup(context, { name: 'Ilustrace k textům o volbách', note: NOTE })
      assert.equal(created.status, 303)
      assert.equal(created.headers.get('Location'), DETAIL)

      let folders = context.app.drive.folders()
      let groupsFolders = folders.filter((folder) => folder.name === 'Skupiny obrazových děl')
      assert.equal(groupsFolders.length, 1)
      let volby = folders.find((folder) => folder.name === 'Ilustrace k textům o volbách')
      assert.equal(volby?.parentId, groupsFolders[0]?.id)
      assert.deepEqual(
        folders
          .filter((folder) => folder.parentId === volby?.id)
          .map((folder) => folder.name)
          .toSorted(),
        ['Licence', 'Obrazová díla'],
      )
      let meta = context.app.drive
        .files()
        .find((file) => file.name === '_meta.json' && file.parentId === volby?.id)
      assert.ok(meta !== undefined)
      let parsed = JSON.parse(meta.content ?? '{}') as Record<string, unknown>
      assert.equal(parsed['kind'], 'artwork-group')
      assert.equal(parsed['articleName'], 'Ilustrace k textům o volbách')
      assert.equal(parsed['note'], NOTE)
      assert.equal(parsed['sheetId'], null)
      assert.equal(context.app.mail.length, mailBefore)

      let html = await (await context.editor.get(DETAIL)).text()
      let section = groupsSection(html) ?? ''
      assert.ok(
        section.startsWith(
          'Skupiny obrazových děl 2 Nová skupina Ilustrace k textům o volbách · zatím bez děl',
        ),
      )
      assert.ok(section.includes(`Pro grafika: ${NOTE}`))
      assert.ok(section.indexOf('volbách') < section.indexOf('Mapa obce k rozhovoru i reportáži'))
      assert.ok(textOf(html).includes('Skupina je vytvořená. Odkaz pošlete tomu, kdo díla dodá.'))
      let key = await linkKeyOf(context, 'Ilustrace k textům o volbách')
      assert.ok(html.includes(`/l/${key}/artworks`))
      /* The new group is highlighted, with focus on its Kopírovat, until the next load (`12e`). */
      let groupsHtml =
        /<section aria-labelledby="groups-title"[^>]*>(.*?)<\/section>/s.exec(html)?.[1] ?? ''
      let changed =
        /<div class="vdm-changed">(.*?)<\/div>\s*<\/div>\s*<\/div>/s.exec(groupsHtml)?.[1] ?? ''
      assert.ok(changed.includes('Ilustrace k textům o volbách'))
      assert.match(changed, /autofocus/)
      let again = await (await context.editor.get(DETAIL)).text()
      assert.ok(!/<section aria-labelledby="groups-title".*vdm-changed/s.test(again))
    }))

  it('says to try again when Drive fails midway, binning what the attempt made and freeing the name', () =>
    withIssue(async (context) => {
      context.app.drive.failCreate('Licence')
      let failed = await createGroup(context, {
        formKey: DIALOG_KEY,
        name: 'Mapa obce k rozhovoru i reportáži',
        note: NOTE,
      })
      assert.equal(failed.status, 409)
      let html = await failed.text()
      assert.ok(
        textOf(html).includes('Zkuste skupinu vytvořit za chvíli znovu. Disk teď neodpovídá.'),
      )
      assert.ok(html.includes('Proč nechodíme volit'))
      let left = context.app.drive
        .folders()
        .filter((folder) =>
          ['Mapa obce k rozhovoru i reportáži', 'Obrazová díla'].includes(folder.name),
        )
      assert.ok(left.length > 0)
      assert.ok(left.every((folder) => folder.isTrashed))
      let groupsFolder = context.app.drive
        .folders()
        .find((folder) => folder.name === 'Skupiny obrazových děl')
      assert.equal(groupsFolder?.isTrashed, false)
      assert.deepEqual(
        await createGroupStore(context.app.database).listByIssue(context.issueId),
        [],
      )

      /* The refused dialog sends its own key again, and the same key goes through. */
      context.app.drive.heal()
      assert.equal(
        (
          await createGroup(context, {
            formKey: DIALOG_KEY,
            name: 'Mapa obce k rozhovoru i reportáži',
            note: NOTE,
          })
        ).status,
        303,
      )
    }))

  it('takes no group in an unfinished issue and draws it no section (01a)', async () => {
    let app = await createTestApp()
    try {
      await seedAdmin(app, MARIE)
      await connectDriveAccount(app)
      let editor = app.browser()
      await editor.signInAs(MARIE, 'Marie Horáková')
      app.drive.failCreate('Články')
      await editor.post('/issues/new', { name: ISSUE }, '/issues/new')
      app.drive.heal()
      let issue = await createIssueStore(app.database).findByName(ISSUE)
      assert.equal(issue?.completedAt, null)

      let detail = await (await editor.get(DETAIL)).text()
      assert.equal(groupsSection(detail), null)
      assert.equal((await editor.get(NEW)).status, 404)
      let refused = await editor.post(
        NEW,
        { formKey: crypto.randomUUID(), name: 'Mapa obce k rozhovoru i reportáži', note: '' },
        DETAIL,
      )
      assert.equal(refused.status, 404)
    } finally {
      await app.close()
    }
  })

  it('lists a closed issue’s groups without what writes, its folder still at hand (12h)', () =>
    withIssue(async (context) => {
      assert.equal(
        (await createGroup(context, { name: 'Mapa obce k rozhovoru i reportáži' })).status,
        303,
      )
      let key = await linkKeyOf(context, 'Mapa obce k rozhovoru i reportáži')
      await createIssueStore(context.app.database).close(context.issueId, Temporal.Now.instant())

      assert.equal((await context.editor.get(NEW)).status, 404)
      /* The form is sent from the detail, which carries the session's token. */
      let refused = await context.editor.post(
        NEW,
        { formKey: crypto.randomUUID(), name: 'Zadní strana', note: '' },
        DETAIL,
      )
      assert.equal(refused.status, 404)
      let html = await (await context.editor.get(DETAIL)).text()
      /* Up to the next section: the menu's own markup may hold a nested one. */
      let section = html.slice(
        html.indexOf('aria-labelledby="groups-title"'),
        html.indexOf('aria-labelledby="artworks-title"'),
      )
      assert.ok(!section.includes('Nová skupina'))
      assert.match(section, new RegExp(`<del[^>]*>[^<]*/l/${key}/artworks</del>`))
      assert.ok(!section.includes('Kopírovat'))
      /* The „⋯“ with _Otevřít složku skupiny_ stays; its items are drawn when it opens. */
      assert.ok(
        section.includes('aria-label="Další akce skupiny Mapa obce k rozhovoru i reportáži"'),
      )
      assert.equal((await context.app.browser().get(`/l/${key}/artworks`)).status, 410)
    }))
})

describe('a group’s link and its batches', () => {
  it('names the group and its note on the page, and the group in the request and the 21c lead', () =>
    withIssue(async (context) => {
      await createGroup(context, { name: 'Mapa obce k rozhovoru i reportáži', note: NOTE })
      let key = await linkKeyOf(context, 'Mapa obce k rozhovoru i reportáži')

      let page = textOf(await (await context.app.browser().get(`/l/${key}/artworks`)).text())
      assert.ok(page.includes('Ke skupině Mapa obce k rozhovoru i reportáži'))
      assert.ok(page.includes(`Pro grafika: ${NOTE}`))

      let sent = await sendBatch(context, key)
      assert.equal(sent.status, 200)
      assert.ok(
        textOf(await sent.text()).includes(
          'Ve skupině „Mapa obce k rozhovoru i reportáži“ je nově nahrané 1 dílo.',
        ),
      )
      let request = context.app.mail.find((message) => message.to === KLARA.email)
      assert.match(
        request?.subject ?? '',
        /^Žádost o potvrzení souhlasu s užitím obrazových děl ze skupiny „Mapa obce k rozhovoru i reportáži“ – VDM_2026_5 \[\d{8}T\d{6}\]$/,
      )
      let groupFolder = context.app.drive
        .folders()
        .find((folder) => folder.name === 'Mapa obce k rozhovoru i reportáži')
      let artworksFolder = context.app.drive
        .folders()
        .find((folder) => folder.name === 'Obrazová díla' && folder.parentId === groupFolder?.id)
      assert.ok(
        context.app.drive.files().some((file) => file.parentId === artworksFolder?.id),
        'the upload is in the group’s Obrazová díla',
      )

      let detail = await (await context.editor.get(DETAIL)).text()
      assert.ok(
        (groupsSection(detail) ?? '').includes('Mapa obce k rozhovoru i reportáži · 1 dílo'),
      )
      /* The line under the artwork's name is the group it belongs to (`12a`). */
      assert.ok(
        textOf(detail).includes(
          'mapa-obce.jpg (otevře se v nové záložce) Mapa obce k rozhovoru i reportáži',
        ),
      )
    }))

  it('hands the reply check the group with its kind and its Licence, and a reply lands in Ke kontrole', () =>
    withIssue(async (context) => {
      await createGroup(context, { name: 'Mapa obce k rozhovoru i reportáži' })
      let key = await linkKeyOf(context, 'Mapa obce k rozhovoru i reportáži')
      await sendBatch(context, key)
      let [group] = await createGroupStore(context.app.database).listByIssue(context.issueId)

      let claimed = (await (
        await callJob(context.app, '/api/v1/artwork-replies/claim', { intervalMinutes: 30 })
      ).json()) as {
        batches: { articleName: string; batchId: number; kind: string; licencesFolderId: string }[]
        runKey: string
      }
      let [batch] = claimed.batches
      assert.equal(batch?.kind, 'artwork-group')
      assert.equal(batch?.articleName, 'Mapa obce k rozhovoru i reportáži')
      assert.equal(batch?.licencesFolderId, group?.licencesFolderId)

      let reported = await callJob(context.app, '/api/v1/artwork-replies/report', {
        outcome: 'ok',
        results: [
          {
            batchId: batch?.batchId,
            reply: {
              messageId: 'message-1',
              receivedAt: '2026-11-24T10:00:00.000Z',
              text: 'ok, souhlas',
              threadId: 'thread-1',
            },
            state: 'other_reply',
          },
        ],
        runKey: claimed.runKey,
      })
      assert.equal(reported.status, 200)
      let queue = textOf(await (await context.editor.get('/review')).text())
      assert.ok(queue.includes('Mapa obce k rozhovoru i reportáži'))
      assert.ok(queue.includes('ok, souhlas'))
    }))

  it('gives the print job the group with its note once it has an artwork with consent, and counts its copies', () =>
    withIssue(async (context) => {
      await createGroup(context, { name: 'Mapa obce k rozhovoru i reportáži', note: NOTE })
      await createGroup(context, { name: 'Zadní strana' })
      let key = await linkKeyOf(context, 'Mapa obce k rozhovoru i reportáži')
      await sendBatch(context, key)
      await context.app.database.exec(
        sql`UPDATE artwork_batches SET approved_at = '2026-11-24T10:00:00.000Z',
              consent_file_id = 'consent-1'`,
      )

      let claimed = (await (
        await callJob(context.app, '/api/v1/print-handoff/claim', { intervalMinutes: 360 })
      ).json()) as {
        issues: {
          groups: {
            artworks: { artworkId: number }[]
            folderTag: string
            groupId: number
            name: string
            note: string
          }[]
          issueId: number
        }[]
        runKey: string
      }
      let [issue] = claimed.issues
      assert.equal(issue?.groups.length, 1, 'the empty group is left out')
      let [group] = issue?.groups ?? []
      assert.equal(group?.name, 'Mapa obce k rozhovoru i reportáži')
      assert.equal(group?.note, NOTE)
      assert.equal(group?.folderTag, `group_${group?.groupId}`)
      assert.equal(group?.artworks.length, 1)

      let reported = await callJob(context.app, '/api/v1/print-handoff/report', {
        issues: [
          {
            articles: [],
            groups: [
              {
                copy: {
                  artworks: [
                    {
                      artworkId: group?.artworks[0]?.artworkId,
                      fileId: 'copy-1',
                      name: 'obr-01.jpg',
                    },
                  ],
                  folderId: 'print-mapa-obce',
                  lastImageNumber: 1,
                },
                groupId: group?.groupId,
              },
            ],
            isComplete: true,
            issueId: issue?.issueId,
            sheetId: 'sheet-1',
          },
        ],
        outcome: 'ok',
        runKey: claimed.runKey,
      })
      assert.equal(reported.status, 200)
      let detail = textOf(await (await context.editor.get(DETAIL)).text())
      assert.ok(detail.includes('1 dílo · poslední celý běh'))
    }))

  it('writes the group’s artworks into the Evidence with its name and folder', () =>
    withIssue(async (context) => {
      await createGroup(context, { name: 'Mapa obce k rozhovoru i reportáži' })
      let key = await linkKeyOf(context, 'Mapa obce k rozhovoru i reportáži')
      await sendBatch(context, key)
      let [group] = await createGroupStore(context.app.database).listByIssue(context.issueId)
      let batches = await createArtworkStore(context.app.database).listByIssue(context.issueId)
      assert.deepEqual(
        batches.map((batch) => [batch.holder.kind, batch.holder.name, batch.holder.folderId]),
        [['group', 'Mapa obce k rozhovoru i reportáži', group?.folderId ?? null]],
      )

      for (let pass = 0; pass < 3; pass += 1) await drainRecordQueue(context.app.record)
      let issue = await createIssueStore(context.app.database).findById(context.issueId)
      let [, , artworks] =
        context.app.drive.spreadsheet(issue?.evidenceSpreadsheetId ?? '')?.lists ?? []
      let row = artworks?.cells.find((cells) => cells[1] === 'Mapa obce k rozhovoru i reportáži')
      assert.ok(row !== undefined)
      assert.equal(row[2], group?.folderId)
    }))
})

describe('the group store', () => {
  it('lets one valid link per group, and a link names an article or a group, never both', () =>
    withIssue(async (context) => {
      await createGroup(context, { name: 'Mapa obce k rozhovoru i reportáži' })
      let [group] = await createGroupStore(context.app.database).listByIssue(context.issueId)
      let links = createLinkStore(context.app.database)
      let link = await links.findByKey(group?.link?.key ?? '')
      assert.equal(link?.groupId, group?.id)
      assert.equal(link?.articleId, null)
      await assert.rejects(
        context.app.database.exec(
          sql`INSERT INTO links (key, kind, issue_id, group_id, created_at)
              VALUES ('AAAAAAAAAAAA', 'artworks', ${context.issueId}, ${group?.id ?? 0},
                '2026-11-24T10:00:00.000Z')`,
        ),
      )
    }))
})

const GROUP_STEP = 'Obnovte složku skupiny z koše, nebo ji vraťte na sdílený disk Publikace.'
const GROUP_STOPPED = 'Z odkazu skupiny teď nejde díla nahrát ani odeslat.'

/** The group and its folders, as the group store keeps them. */
async function groupOf(context: Context, name: string) {
  let [group] = (await createGroupStore(context.app.database).listByIssue(context.issueId)).filter(
    (each) => each.name === name,
  )
  assert.ok(group?.folderId != null && group.licencesFolderId != null && group.link !== null)
  return { ...group, folderId: group.folderId, licencesFolderId: group.licencesFolderId }
}

/** The section _Skupiny obrazových děl_ as markup, up to the next section. */
async function groupsMarkup(context: Context): Promise<string> {
  let html = await (await context.editor.get(DETAIL)).text()
  return html.slice(
    html.indexOf('aria-labelledby="groups-title"'),
    html.indexOf('aria-labelledby="artworks-title"'),
  )
}

describe('a group’s missing folder in the detail (12j, #145)', () => {
  it('shows the group’s own folder in its frame, without Otevřít složku skupiny, and counts it', () =>
    withIssue(async (context) => {
      await createGroup(context, { name: 'Mapa obce k rozhovoru i reportáži' })
      let group = await groupOf(context, 'Mapa obce k rozhovoru i reportáži')
      context.app.drive.trash(group.folderId)
      await context.app.browser().get(`/l/${group.link?.key}/artworks`)

      let section = await groupsMarkup(context)
      let text = textOf(section)
      assert.ok(text.includes(GROUP_STEP))
      assert.match(text, new RegExp(`${GROUP_STOPPED} Zjištěno \\d+\\. \\d+\\. ve? \\d+:\\d{2}\\.`))
      assert.ok(section.includes(`action="${DETAIL}/artwork-groups/${group.id}/folders/check"`))
      /* A missing folder has nothing to open, and the fixes stay in the „⋯“ (`12f`, iuepzv2t). */
      assert.ok(!text.includes('Otevřít složku skupiny'))
      assert.ok(
        section.includes('aria-label="Další akce skupiny Mapa obce k rozhovoru i reportáži"'),
      )
      let detail = await (await context.editor.get(DETAIL)).text()
      assert.ok(detail.includes(`${DETAIL}/artwork-groups/${group.id}/edit`))

      let overview = textOf(await (await context.editor.get('/')).text())
      assert.ok(overview.includes('0 článků · 0 děl · 1 čeká na vás'))
      assert.equal(
        (await createGroupStore(context.app.database).missingCountsByIssue()).get(context.issueId),
        1,
      )
    }))

  it('names Licence with its link and the consents, and keeps the group’s folder to open', () =>
    withIssue(async (context) => {
      await createGroup(context, { name: 'Mapa obce k rozhovoru i reportáži' })
      let group = await groupOf(context, 'Mapa obce k rozhovoru i reportáži')
      assert.equal((await sendBatch(context, group.link?.key ?? '')).status, 200)
      context.app.drive.trash(group.licencesFolderId)
      await context.app.browser().get(`/l/${group.link?.key}/artworks`)

      let section = await groupsMarkup(context)
      let text = textOf(section)
      assert.ok(text.includes('Obnovte složku Licence'))
      assert.ok(
        section.includes(`https://drive.google.com/drive/folders/${group.licencesFolderId}`),
      )
      assert.ok(
        text.includes(
          `${GROUP_STOPPED} Souhlasy se dál zaznamenávají. Konverzace se do složky uloží při první kontrole odpovědí po jejím návratu.`,
        ),
      )
      assert.ok(
        section.includes('aria-label="Další akce skupiny Mapa obce k rozhovoru i reportáži"'),
      )
    }))

  it('says what Zkontrolovat znovu found, and the Callout goes once the folder is back', () =>
    withIssue(async (context) => {
      await createGroup(context, { name: 'Mapa obce k rozhovoru i reportáži' })
      let group = await groupOf(context, 'Mapa obce k rozhovoru i reportáži')
      context.app.drive.trash(group.folderId)
      await context.app.browser().get(`/l/${group.link?.key}/artworks`)
      let check = () =>
        context.editor.post(`${DETAIL}/artwork-groups/${group.id}/folders/check`, {}, '/')

      assert.equal((await check()).status, 303)
      let still = textOf(await (await context.editor.get(DETAIL)).text())
      assert.ok(
        still.includes(
          'Obnovte složku z koše, nebo ji vraťte na sdílený disk Publikace. Stále není dostupná.',
        ),
      )

      context.app.drive.restore(group.folderId)
      await check()
      let back = textOf(await (await context.editor.get(DETAIL)).text())
      assert.ok(back.includes('Složka je zpátky na sdíleném disku Publikace.'))
      assert.ok(!back.includes(GROUP_STEP))
      let marks = await createGroupStore(context.app.database).findById(group.id)
      assert.equal(marks?.missing.article, null)
    }))

  it('answers 404 for a group of another issue or none', () =>
    withIssue(async (context) => {
      let missing = await context.editor.post(`${DETAIL}/artwork-groups/99/folders/check`, {}, '/')
      assert.equal(missing.status, 404)
    }))

  it('drops the mark when the detail finds the folder back, and keeps it while Drive is down', () =>
    withIssue(async (context) => {
      await createGroup(context, { name: 'Mapa obce k rozhovoru i reportáži' })
      let group = await groupOf(context, 'Mapa obce k rozhovoru i reportáži')
      context.app.drive.trash(group.folderId)
      await context.app.browser().get(`/l/${group.link?.key}/artworks`)
      context.app.drive.restore(group.folderId)

      let check = () => context.editor.post(`${DETAIL}/folders/check-marked`, {}, DETAIL)
      context.app.drive.goDown()
      assert.equal((await check()).status, 204)
      assert.ok(textOf(await (await context.editor.get(DETAIL)).text()).includes(GROUP_STEP))
      context.app.drive.heal()

      assert.equal((await check()).status, 204)
      let text = textOf(await (await context.editor.get(DETAIL)).text())
      assert.ok(!text.includes(GROUP_STEP))
      assert.ok(!text.includes('Složka je zpátky'))
      let overview = textOf(await (await context.editor.get('/')).text())
      assert.ok(!overview.includes('čeká na vás'))
    }))

  it('hides under a binned issue folder, which is counted once', () =>
    withIssue(async (context) => {
      await createGroup(context, { name: 'Mapa obce k rozhovoru i reportáži' })
      let group = await groupOf(context, 'Mapa obce k rozhovoru i reportáži')
      let issue = await createIssueStore(context.app.database).findById(context.issueId)
      assert.ok(issue?.folderIds.issue != null)
      context.app.drive.trash(issue.folderIds.issue)
      await context.app.browser().get(`/l/${group.link?.key}/artworks`)
      assert.ok(
        (await createGroupStore(context.app.database).findById(group.id))?.missing.article != null,
      )

      await context.editor.post(`${DETAIL}/folders/check-marked`, {}, DETAIL)
      let text = textOf(await (await context.editor.get(DETAIL)).text())
      assert.ok(text.includes('Obnovte složku vydání VDM_2026_5'))
      assert.ok(!text.includes(GROUP_STEP))
      let overview = textOf(await (await context.editor.get('/')).text())
      assert.ok(overview.includes('0 článků · 0 děl · 1 čeká na vás'))
    }))

  it('keeps the step on a closed issue, without Zkontrolovat znovu', () =>
    withIssue(async (context) => {
      await createGroup(context, { name: 'Mapa obce k rozhovoru i reportáži' })
      let group = await groupOf(context, 'Mapa obce k rozhovoru i reportáži')
      context.app.drive.trash(group.folderId)
      await context.app.browser().get(`/l/${group.link?.key}/artworks`)
      await context.editor.post(`${DETAIL}/close`, { returnTo: 'detail' }, `${DETAIL}/close`)

      let text = textOf(await groupsMarkup(context))
      assert.ok(text.includes(GROUP_STEP))
      assert.ok(!text.includes('Zkontrolovat znovu'))
    }))
})
