import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { createGroupStore } from '../../data/artwork-groups.server.ts'
import { createArtworkStore, HolderRemovedError } from '../../data/artworks.server.ts'
import { createIssueStore } from '../../data/issues.server.ts'
import { NBSP } from '../../domain/public/typography.ts'
import { now } from '../../domain/time.ts'
import {
  connectDriveAccount,
  createTestApp,
  JOB_TOKEN,
  seedAdmin,
  type TestApp,
  type TestBrowser,
} from '../../test-app.server.ts'

/**
 * Correcting and removing an artwork group (#154, `12f`): the dialogs over the detail, the group
 * folder and `_meta.json` on Drive, the row, the link, the claims, and every race `12f` draws. And
 * a new link for the group (#169, `02g`), which sits in the same „⋯“.
 */

const MARIE = 'marie@vednemesicnik.test'
const KLARA = { email: 'klara.simkova@external.test', name: 'Klára Šimková' }
const ISSUE = 'VDM_2003_1'
const DETAIL = `/issues/${ISSUE}`
const NAME = 'Mapa obce k rozhovoru i reportáži'
const NOTE = 'K textům „Rozhovor se starostou“ a „Cyklostezka“.'
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4])

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

/** The dialog's text, from its title to the end of its form. */
function dialogOf(html: string): string {
  let start = html.indexOf('class="vdm-dialog"')
  if (start === -1) return ''
  let body = html.slice(html.indexOf('>', start) + 1, html.lastIndexOf('</form>'))
  return textOf(body).trim()
}

function calloutOf(html: string): string | null {
  let dialog = html.slice(html.indexOf('class="vdm-dialog"'))
  let found = /class="vdm-callout__body">(.*?)<\/div>/s.exec(dialog)
  return found === null ? null : textOf(found[1] ?? '').trim()
}

type Context = { app: TestApp; editor: TestBrowser; groupId: number; issueId: number }

/** An issue made through the app and one group in it, its files on the fake Drive. */
async function withGroup(run: (context: Context) => Promise<void>): Promise<void> {
  let app = await createTestApp()
  try {
    await seedAdmin(app, MARIE)
    await connectDriveAccount(app)
    let editor = app.browser()
    await editor.signInAs(MARIE, 'Marie Horáková')
    assert.equal((await editor.post('/issues/new', { name: ISSUE }, '/issues/new')).status, 303)
    let issue = await createIssueStore(app.database).findByName(ISSUE)
    assert.ok(issue !== null)
    let created = await editor.post(
      `${DETAIL}/artwork-groups/new`,
      { formKey: crypto.randomUUID(), name: NAME, note: NOTE },
      `${DETAIL}/artwork-groups/new`,
    )
    assert.equal(created.status, 303)
    let [group] = await createGroupStore(app.database).listByIssue(issue.id)
    assert.ok(group !== undefined)
    await editor.get(DETAIL)
    await run({ app, editor, groupId: group.id, issueId: issue.id })
  } finally {
    await app.close()
  }
}

async function groupOf(context: Context) {
  let group = await createGroupStore(context.app.database).findById(context.groupId)
  assert.ok(group !== null && group.folderId !== null && group.metaFileId !== null)
  return { ...group, folderId: group.folderId, metaFileId: group.metaFileId }
}

async function linkKeyOf(context: Context): Promise<string> {
  let links = await context.app.database.exec(
    sql`SELECT key FROM links WHERE group_id = ${context.groupId} AND revoked_at IS NULL`,
  )
  return String(links.rows?.[0]?.['key'])
}

function editPath(context: Context): string {
  return `${DETAIL}/artwork-groups/${context.groupId}/edit`
}

function removePath(context: Context): string {
  return `${DETAIL}/artwork-groups/${context.groupId}/remove`
}

function renewPath(context: Context): string {
  return `${DETAIL}/artwork-groups/${context.groupId}/link/renew`
}

function renew(context: Context, shownKey: string, from = renewPath(context)): Promise<Response> {
  return context.editor.post(renewPath(context), { shownKey }, from)
}

/**
 * The edit sent with what the dialog showed, its CSRF token read from `from`: the dialog, or the
 * detail when the dialog would no longer open, as for a POST from a dialog left open.
 */
function edit(
  context: Context,
  fields: { name: string; note: string; shownName?: string; shownNote?: string },
  from = editPath(context),
): Promise<Response> {
  return context.editor.post(
    editPath(context),
    {
      name: fields.name,
      note: fields.note,
      shownName: fields.shownName ?? NAME,
      shownNote: fields.shownNote ?? NOTE,
    },
    from,
  )
}

function remove(context: Context, from = removePath(context)): Promise<Response> {
  return context.editor.post(removePath(context), {}, from)
}

function isTrashed(context: Context, id: string | null): boolean {
  return [...context.app.drive.files(), ...context.app.drive.folders()].some(
    (file) => file.id === id && file.isTrashed,
  )
}

function folderName(context: Context, id: string): string | undefined {
  return context.app.drive.folders().find((folder) => folder.id === id)?.name
}

function metaOf(context: Context, id: string): Record<string, unknown> {
  let content = context.app.drive.files().find((file) => file.id === id)?.content ?? '{}'
  return JSON.parse(content) as Record<string, unknown>
}

/** One batch through the group's link: an upload, then _Odeslat díla_, whose request goes. */
async function sendBatch(context: Context): Promise<number> {
  let key = await linkKeyOf(context)
  let visitor = context.app.browser()
  let formKey = crypto.randomUUID()
  let uploaded = await visitor.sendBytes(`/l/${key}/artworks/files`, new Uint8Array(JPEG), {
    'Content-Type': 'image/jpeg',
    'X-File-Name': encodeURIComponent('mapa-obce.jpg'),
    'X-Form-Key': formKey,
  })
  assert.equal(uploaded.status, 201)
  let { artwork } = (await uploaded.json()) as { artwork: { id: number } }
  let body = new URLSearchParams({
    formKey,
    'provider-email': KLARA.email,
    'provider-name': KLARA.name,
  })
  body.append('artwork-id', String(artwork.id))
  body.append('artwork-author', KLARA.name)
  body.append('artwork-source', '')
  assert.equal((await visitor.send(`/l/${key}/artworks`, body)).status, 200)
  let batches = await context.app.database.exec(
    sql`SELECT id FROM artwork_batches WHERE group_id = ${context.groupId} ORDER BY id DESC`,
  )
  return Number(batches.rows?.[0]?.['id'])
}

async function discard(context: Context, batchId: number): Promise<void> {
  await context.app.database.exec(
    sql`UPDATE artwork_batches SET discarded_at = ${now().toString()} WHERE id = ${batchId}`,
  )
  await context.app.database.exec(
    sql`UPDATE artworks SET removed_at = ${now().toString()} WHERE batch_id = ${batchId}`,
  )
}

function claimReplies(context: Context): Promise<Response> {
  return context.app.fetch(
    new Request('http://localhost/api/v1/artwork-replies/claim', {
      body: JSON.stringify({ intervalMinutes: 30 }),
      headers: { Authorization: `Bearer ${JOB_TOKEN}`, 'Content-Type': 'application/json' },
      method: 'POST',
    }),
  )
}

describe('the group’s „⋯“ (12u, iuepzv2t)', () => {
  it('holds the folder, the new link and the fixes, each behind its own line, the removal last', () =>
    withGroup(async (context) => {
      let detail = await (await context.editor.get(DETAIL)).text()
      let folder = detail.indexOf('Otevřít složku skupiny')
      let renewItem = detail.indexOf(renewPath(context))
      let editItem = detail.indexOf('Upravit název a poznámku…')
      let removeItem = detail.indexOf('Odebrat skupinu…')
      assert.ok(
        folder !== -1 && folder < renewItem && renewItem < editItem && editItem < removeItem,
      )
      let menu = detail.slice(folder, removeItem)
      assert.equal(menu.match(/"isSeparator":true/g)?.length, 2)
      assert.ok(detail.includes(editPath(context)) && detail.includes(removePath(context)))
    }))

  it('drops both fixes once the issue is closed, and the removal once artworks came', () =>
    withGroup(async (context) => {
      await sendBatch(context)
      let detail = await (await context.editor.get(DETAIL)).text()
      assert.ok(detail.includes('Upravit název a poznámku…'))
      assert.ok(!detail.includes(removePath(context)))
      let asked = await context.editor.get(removePath(context))
      assert.equal(asked.status, 303)
      assert.equal(asked.headers.get('Location'), DETAIL)

      await createIssueStore(context.app.database).close(context.issueId, now())
      detail = await (await context.editor.get(DETAIL)).text()
      assert.ok(!detail.includes('Upravit název a poznámku…'))
      assert.equal((await context.editor.get(editPath(context))).status, 303)
    }))
})

describe('editing a group (12f)', () => {
  it('opens with both fields filled, the two paragraphs, and Uložit', () =>
    withGroup(async (context) => {
      let html = await (await context.editor.get(editPath(context))).text()
      let dialog = dialogOf(html)
      assert.ok(
        dialog.startsWith(
          'Upravit skupinu Při změně názvu se přejmenuje i složka skupiny na sdíleném disku Publikace. V Evidenci se nový název může objevit později. Pokud upravíte jen poznámku, na Disku se nic nezmění. Odkaz na nahrání děl platí dál. Nikomu se nic nepošle a e-maily, které už odešly, nesou dosavadní název. Pole s hvězdičkou jsou povinná.',
        ),
      )
      assert.ok(dialog.endsWith('Zrušit Uložit'))
      assert.ok(html.includes(`value="${NAME}"`))
      assert.ok(html.includes('name="shownNote" type="hidden"'))
    }))

  it('saves a note alone without asking Drive anything', () =>
    withGroup(async (context) => {
      let before = context.app.drive.calls.length
      let answered = await edit(context, { name: NAME, note: 'K rozhovoru a k reportáži.' })
      assert.equal(answered.status, 303)
      assert.equal(answered.headers.get('Location'), DETAIL)
      assert.equal(context.app.drive.calls.length, before)
      assert.equal((await groupOf(context)).note, 'K rozhovoru a k reportáži.')

      let detail = await (await context.editor.get(DETAIL)).text()
      assert.equal(statusText(detail), 'Poznámka pro grafika je uložená.')
      assert.ok(detail.includes('class="vdm-changed"'))
      assert.ok(/<h2\s[^>]*autofocus[^>]*id="groups-title"/.test(detail))
    }))

  it('saves a note alone while Drive does not answer', () =>
    withGroup(async (context) => {
      context.app.drive.goDown()
      assert.equal((await edit(context, { name: NAME, note: '' })).status, 303)
      assert.equal((await groupOf(context)).note, '')
    }))

  it('renames the folder and _meta.json with the row, keeps the link, and marks the Evidence', () =>
    withGroup(async (context) => {
      let group = await groupOf(context)
      let key = await linkKeyOf(context)
      await context.app.database.exec(sql`DELETE FROM record_marks`)
      let mailBefore = context.app.mail.length

      let answered = await edit(context, { name: 'Mapa obce', note: NOTE })
      assert.equal(answered.status, 303)
      assert.equal(folderName(context, group.folderId), 'Mapa obce')
      let meta = metaOf(context, group.metaFileId)
      assert.equal(meta['articleName'], 'Mapa obce')
      assert.equal(meta['note'], NOTE)
      assert.equal((await groupOf(context)).name, 'Mapa obce')
      assert.equal(await linkKeyOf(context), key)
      let marks = await context.app.database.exec(sql`SELECT kind, issue_id FROM record_marks`)
      assert.deepEqual(
        (marks.rows ?? []).map((row) => [row['kind'], row['issue_id']]),
        [['evidence', context.issueId]],
      )
      assert.equal(context.app.mail.length, mailBefore)
      let detail = await (await context.editor.get(DETAIL)).text()
      assert.equal(statusText(detail), 'Skupina i její složka jsou přejmenované.')
    }))

  it('takes a change of case as a rename, and refuses a name another group has', () =>
    withGroup(async (context) => {
      assert.equal((await edit(context, { name: NAME.toLowerCase(), note: NOTE })).status, 303)
      assert.equal((await groupOf(context)).name, NAME.toLowerCase())

      let second = await context.editor.post(
        `${DETAIL}/artwork-groups/new`,
        { formKey: crypto.randomUUID(), name: 'Ilustrace k volbám', note: '' },
        `${DETAIL}/artwork-groups/new`,
      )
      assert.equal(second.status, 303)
      let refused = await edit(context, {
        name: 'ilustrace k VOLBÁM',
        note: NOTE,
        shownName: NAME.toLowerCase(),
      })
      assert.equal(refused.status, 400)
      assert.ok(
        textOf(await refused.text()).includes(
          'Skupina Ilustrace k volbám už ve vydání je. Zvolte jiný název.',
        ),
      )
      assert.equal((await groupOf(context)).name, NAME.toLowerCase())
    }))

  it('changes nothing when Drive does not answer, or the file or the folder is in the bin', () =>
    withGroup(async (context) => {
      let group = await groupOf(context)
      context.app.drive.failStep('rewrite')
      let refused = await edit(context, { name: 'Mapa obce', note: NOTE })
      assert.equal(refused.status, 409)
      assert.equal(
        calloutOf(await refused.text()),
        'Zkuste skupinu přejmenovat za chvíli znovu. Nic se nezměnilo. Disk teď neodpovídá.',
      )
      assert.equal(folderName(context, group.folderId), NAME)
      assert.equal((await groupOf(context)).name, NAME)
      context.app.drive.heal()

      context.app.drive.trash(group.metaFileId)
      let binned = await edit(context, { name: 'Mapa obce', note: NOTE })
      assert.equal(binned.status, 409)
      assert.ok(
        calloutOf(await binned.text())?.startsWith(
          'Otevřete soubor pro tuto skupinu a obnovte ho z koše.',
        ),
      )
      context.app.drive.restore(group.metaFileId)

      context.app.drive.trash(group.folderId)
      let missing = await edit(context, { name: 'Mapa obce', note: NOTE })
      assert.equal(missing.status, 409)
      assert.equal(
        calloutOf(await missing.text()),
        'Obnovte složku skupiny z koše, nebo ji vraťte na sdílený disk Publikace. Nic se nezměnilo.',
      )
      assert.equal((await groupOf(context)).name, NAME)
    }))

  it('writes nothing when the group changed, was removed, or the issue closed meanwhile', () =>
    withGroup(async (context) => {
      await edit(context, { name: NAME, note: 'Jiná poznámka.' })
      let answered = await edit(context, { name: 'Mapa obce', note: NOTE }, DETAIL)
      assert.equal(answered.status, 303)
      let detail = await (await context.editor.get(DETAIL)).text()
      assert.equal(statusText(detail), 'Skupina se mezitím změnila. Vaše změny se neuložily.')
      assert.equal((await groupOf(context)).name, NAME)

      await createIssueStore(context.app.database).close(context.issueId, now())
      await edit(
        context,
        { name: 'Mapa obce', note: 'Jiná poznámka.', shownNote: 'Jiná poznámka.' },
        DETAIL,
      )
      detail = await (await context.editor.get(DETAIL)).text()
      assert.equal(statusText(detail), 'Vydání VDM_2003_1 je uzavřené. Skupinu už nejde upravit.')
      assert.equal((await groupOf(context)).name, NAME)

      await createIssueStore(context.app.database).reopen(context.issueId)
      assert.equal((await remove(context)).status, 303)
      await context.editor.get(DETAIL)
      await edit(
        context,
        { name: 'Mapa obce', note: 'Jiná poznámka.', shownNote: 'Jiná poznámka.' },
        DETAIL,
      )
      detail = await (await context.editor.get(DETAIL)).text()
      assert.equal(statusText(detail), 'Skupina už je odebraná. Vaše změny se neuložily.')
    }))

  it('closes without a toast when nothing changed', () =>
    withGroup(async (context) => {
      assert.equal((await edit(context, { name: ` ${NAME} `, note: NOTE })).status, 303)
      let detail = await (await context.editor.get(DETAIL)).text()
      assert.equal(statusText(detail), '')
    }))

  it('still claims a reply to a request sent before the rename under the old name', () =>
    withGroup(async (context) => {
      await sendBatch(context)
      assert.equal((await edit(context, { name: 'Mapa obce', note: NOTE })).status, 303)
      let claimed = (await (await claimReplies(context)).json()) as {
        batches: { articleName: string; subjectContains: string[] }[]
      }
      assert.equal(claimed.batches.length, 1)
      assert.deepEqual(claimed.batches[0]?.subjectContains, [NAME])
      assert.equal(claimed.batches[0]?.articleName, 'Mapa obce')
    }))
})

describe('removing a group (12f)', () => {
  it('asks with every sentence of the drawing, the name in quotes in the title', () =>
    withGroup(async (context) => {
      let html = await (await context.editor.get(removePath(context))).text()
      assert.equal(
        dialogOf(html),
        'Odebrat skupinu „Mapa obce k rozhovoru i reportáži“? Složka skupiny se přesune do koše sdíleného disku Publikace i s nahranými soubory, které nikdo neodeslal. Skupina zmizí z vydání. Odkaz na nahrání děl přestane platit. Obnovením složky z koše se skupina do aplikace nevrátí. Nikomu se nic nepošle. Zrušit Odebrat skupinu',
      )
      assert.ok(
        html.includes('class="vdm-btn vdm-btn--danger vdm-btn--sm">Odebrat skupinu</button>'),
      )
    }))

  it('bins the folder, leaves every list and claim, frees the name, and sends nothing', () =>
    withGroup(async (context) => {
      let group = await groupOf(context)
      let key = await linkKeyOf(context)
      let mailBefore = context.app.mail.length

      let answered = await remove(context)
      assert.equal(answered.status, 303)
      assert.equal(answered.headers.get('Location'), DETAIL)
      assert.ok(isTrashed(context, group.folderId))
      let detail = await (await context.editor.get(DETAIL)).text()
      assert.equal(statusText(detail), 'Složka skupiny je v koši sdíleného disku Publikace.')
      assert.ok(!detail.includes(NAME))

      let groups = createGroupStore(context.app.database)
      assert.deepEqual(await groups.listByIssue(context.issueId), [])
      assert.equal((await groups.countsByIssue()).get(context.issueId), undefined)
      assert.equal((await context.app.browser().get(`/l/${key}/artworks`)).status, 410)
      assert.equal(context.app.mail.length, mailBefore)

      /* The issue holds nothing now, so it can be removed itself, and the name is free. */
      assert.equal((await context.editor.get(`${DETAIL}/remove`)).status, 200)
      let again = await context.editor.post(
        `${DETAIL}/artwork-groups/new`,
        { formKey: crypto.randomUUID(), name: NAME, note: '' },
        `${DETAIL}/artwork-groups/new`,
      )
      assert.equal(again.status, 303)
      assert.equal((await groups.listByIssue(context.issueId)).length, 1)
    }))

  it('says what happens to replies to discarded batches, and then claims none of them', () =>
    withGroup(async (context) => {
      let batchId = await sendBatch(context)
      await discard(context, batchId)
      let html = await (await context.editor.get(removePath(context))).text()
      assert.ok(
        dialogOf(html).endsWith(
          'Nikomu se nic nepošle. Pokud ještě přijde odpověď na žádost k zahozené dávce, najdete ji jen ve schránce publikace@. Zrušit Odebrat skupinu',
        ),
      )
      let before = (await (await claimReplies(context)).json()) as { batches: unknown[] }
      assert.equal(before.batches.length, 1)

      await context.app.database.exec(sql`UPDATE artwork_batches SET claimed_at = NULL`)
      assert.equal((await remove(context)).status, 303)
      let artworks = createArtworkStore(context.app.database)
      assert.deepEqual(await artworks.reviewQueue(), [])
      let claimed = (await (await claimReplies(context)).json()) as { batches: unknown[] }
      assert.deepEqual(claimed.batches, [])
    }))

  it('takes a folder already in the bin as removed', () =>
    withGroup(async (context) => {
      context.app.drive.trash((await groupOf(context)).folderId)
      assert.equal((await remove(context)).status, 303)
      assert.ok((await groupOf(context)).removedAt !== null)
    }))

  it('refuses a file a person put in, and a folder somebody moved, and keeps the group', () =>
    withGroup(async (context) => {
      let group = await groupOf(context)
      context.app.drive.seedDoc('person-1', 'skica-cyklostezka.docx', group.artworksFolderId ?? '')
      let refused = await remove(context)
      assert.equal(refused.status, 409)
      assert.equal(
        calloutOf(await refused.text()),
        'Přesuňte ze složky skupiny soubory, které do ní nedala aplikace. Ve složce „Obrazová díla“: skica-cyklostezka.docx. Skupina zůstala, jak byla.',
      )
      assert.equal((await groupOf(context)).removedAt, null)
      assert.ok(!isTrashed(context, group.folderId))

      context.app.drive.remove('person-1')
      context.app.drive.seedFolder('elsewhere', 'Jinde', 'root')
      context.app.drive.move(group.folderId, 'elsewhere')
      let moved = await remove(context)
      assert.equal(moved.status, 409)
      assert.equal(
        calloutOf(await moved.text()),
        'Vraťte složku skupiny do složky Skupiny obrazových děl vydání VDM_2003_1. Teď je jinde, a tak skupina zůstala, jak byla.',
      )
      assert.equal((await groupOf(context)).removedAt, null)
    }))

  it('keeps the group whole when Drive does not answer', () =>
    withGroup(async (context) => {
      let key = await linkKeyOf(context)
      context.app.drive.goDown()
      let refused = await remove(context)
      assert.equal(refused.status, 409)
      assert.equal(
        calloutOf(await refused.text()),
        'Zkuste skupinu odebrat za chvíli znovu. Skupina zůstala, jak byla. Disk teď neodpovídá.',
      )
      assert.equal((await groupOf(context)).removedAt, null)
      context.app.drive.heal()
      assert.equal((await context.app.browser().get(`/l/${key}/artworks`)).status, 200)
    }))

  it('writes nothing when artworks came or the issue closed meanwhile', () =>
    withGroup(async (context) => {
      await context.editor.get(removePath(context))
      let batchId = await sendBatch(context)
      await remove(context, DETAIL)
      let detail = await (await context.editor.get(DETAIL)).text()
      assert.equal(
        statusText(detail),
        'Ke skupině mezitím přišla obrazová díla. Skupina zůstala ve vydání.',
      )
      assert.equal((await groupOf(context)).removedAt, null)

      await discard(context, batchId)
      await createIssueStore(context.app.database).close(context.issueId, now())
      await remove(context, DETAIL)
      detail = await (await context.editor.get(DETAIL)).text()
      assert.equal(statusText(detail), 'Vydání VDM_2003_1 je uzavřené. Skupina zůstala ve vydání.')
      assert.equal((await groupOf(context)).removedAt, null)
    }))

  it('refuses a batch the provider’s page starts after the removal', () =>
    withGroup(async (context) => {
      let links = await context.app.database.exec(
        sql`SELECT id FROM links WHERE group_id = ${context.groupId}`,
      )
      assert.equal((await remove(context)).status, 303)
      await assert.rejects(
        () =>
          createArtworkStore(context.app.database).startBatch({
            articleId: null,
            artworks: [],
            at: now(),
            formKey: 'late-batch',
            groupId: context.groupId,
            issueId: context.issueId,
            linkId: Number(links.rows?.[0]?.['id']),
            provider: KLARA,
          }),
        HolderRemovedError,
      )
    }))

  it('goes back to the detail when the group was removed in another tab', () =>
    withGroup(async (context) => {
      assert.equal((await remove(context)).status, 303)
      await context.editor.get(DETAIL)
      let again = await remove(context, DETAIL)
      assert.equal(again.status, 303)
      assert.equal(again.headers.get('Location'), DETAIL)
      let detail = await (await context.editor.get(DETAIL)).text()
      assert.equal(statusText(detail), '')
    }))
})

describe('discarding a batch whose archive failed meanwhile (12o, #154)', () => {
  it('goes back to the table instead of a missing page', () =>
    withGroup(async (context) => {
      let batchId = await sendBatch(context)
      await context.app.database.exec(
        sql`UPDATE artwork_batches SET reply_message_id = 'msg-1', reply_text = 'Souhlasím',
              reply_received_at = ${now().toString()}, is_exact_consent = 1,
              archive_failed_at = ${now().toString()}, archive_error = 'quota'
            WHERE id = ${batchId}`,
      )
      let path = `${DETAIL}/artworks/batches/${batchId}/discard`
      let answered = await context.editor.post(path, { wasSent: 'true' }, DETAIL)
      assert.equal(answered.status, 303)
      assert.equal(answered.headers.get('Location'), DETAIL)
      let batch = await createArtworkStore(context.app.database).findBatch(batchId)
      assert.equal(batch?.discardedAt, null)
    }))
})

describe('a new link for a group (02g, #169)', () => {
  it('asks with the group’s name in the title and both paragraphs, Zrušit first', () =>
    withGroup(async (context) => {
      let html = await (await context.editor.get(renewPath(context))).text()
      assert.equal(
        dialogOf(html),
        `Vydat nový odkaz ke skupině „${NAME}“? ` +
          'Dosavadní odkaz hned přestane platit. Kdo má nahrávání rozpracované, bude muset díla ' +
          'nahrát znovu přes nový odkaz. Odeslaná díla zůstanou ve skupině. Na dřívější žádosti ' +
          'o souhlas lze dál odpovědět. Nikomu se nic nepošle. Zrušit Vydat nový odkaz',
      )
      assert.ok(html.includes(`name="shownKey" type="hidden" value="${await linkKeyOf(context)}"`))
      assert.ok(html.includes('autofocus'))
    }))

  it('replaces the link at once, tints the row with focus on Kopírovat, and sends nothing', () =>
    withGroup(async (context) => {
      let old = await linkKeyOf(context)
      let mail = context.app.mail.length
      let drive = JSON.stringify([...context.app.drive.files(), ...context.app.drive.folders()])
      let answered = await renew(context, old)
      assert.equal(answered.status, 303)
      assert.equal(answered.headers.get('Location'), DETAIL)

      let renewed = await linkKeyOf(context)
      assert.notEqual(renewed, old)
      let detail = await (await context.editor.get(DETAIL)).text()
      assert.equal(statusText(detail), 'Pošlete nový odkaz tomu, kdo díla dodá. Starý už neplatí.')
      assert.ok(detail.includes(`/l/${renewed}/artworks`) && !detail.includes(`/l/${old}/artworks`))
      let groups =
        /<section aria-labelledby="groups-title"[^>]*>(.*?)<\/section>/s.exec(detail)?.[1] ?? ''
      let changed = groups.slice(groups.indexOf('class="vdm-changed"'))
      assert.ok(groups.includes('class="vdm-changed"') && changed.includes(renewed))
      assert.match(changed, /autofocus/)
      assert.equal(context.app.mail.length, mail)
      assert.equal(
        JSON.stringify([...context.app.drive.files(), ...context.app.drive.folders()]),
        drive,
      )

      let visitor = context.app.browser()
      assert.equal((await visitor.get(`/l/${old}/artworks`)).status, 410)
      assert.equal((await visitor.get(`/l/${renewed}/artworks`)).status, 200)
      let next = await (await context.editor.get(DETAIL)).text()
      assert.ok(!next.includes('vdm-changed'))
    }))

  it('keeps a sent batch and its request, whose reply is still claimed', () =>
    withGroup(async (context) => {
      await sendBatch(context)
      assert.equal((await renew(context, await linkKeyOf(context))).status, 303)
      let claimed = (await (await claimReplies(context)).json()) as { batches: unknown[] }
      assert.equal(claimed.batches.length, 1)
      let detail = await (await context.editor.get(DETAIL)).text()
      assert.ok(textOf(detail).includes(`${NAME} · 1 dílo`))
    }))

  it('writes nothing when the link changed, the group was removed, or the issue closed meanwhile', () =>
    withGroup(async (context) => {
      let old = await linkKeyOf(context)
      assert.equal((await renew(context, old)).status, 303)
      await context.editor.get(DETAIL)
      let renewed = await linkKeyOf(context)
      assert.equal((await renew(context, old, DETAIL)).status, 303)
      let detail = await (await context.editor.get(DETAIL)).text()
      assert.equal(
        statusText(detail),
        `Odkaz ke skupině „${NAME}“ se mezitím změnil. Aktuální odkaz můžete zkopírovat.`,
      )
      assert.ok(detail.includes('vdm-changed'))
      assert.equal(await linkKeyOf(context), renewed)

      await createIssueStore(context.app.database).close(context.issueId, now())
      assert.equal((await renew(context, renewed, DETAIL)).status, 303)
      detail = await (await context.editor.get(DETAIL)).text()
      assert.equal(statusText(detail), 'Vydání VDM_2003_1 je uzavřené. Nový odkaz už nejde vydat.')
      assert.equal(await linkKeyOf(context), renewed)

      await createIssueStore(context.app.database).reopen(context.issueId)
      assert.equal((await remove(context)).status, 303)
      await context.editor.get(DETAIL)
      assert.equal((await renew(context, renewed, DETAIL)).status, 303)
      detail = await (await context.editor.get(DETAIL)).text()
      assert.equal(statusText(detail), 'Skupina už je odebraná.')
    }))

  it('drops the item and the dialog once the issue is closed', () =>
    withGroup(async (context) => {
      await createIssueStore(context.app.database).close(context.issueId, now())
      let detail = await (await context.editor.get(DETAIL)).text()
      assert.ok(!detail.includes(renewPath(context)))
      let asked = await context.editor.get(renewPath(context))
      assert.equal(asked.status, 303)
      assert.equal(asked.headers.get('Location'), DETAIL)
    }))
})
