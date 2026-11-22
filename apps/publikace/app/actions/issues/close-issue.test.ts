import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { createIssueStore } from '../../data/issues.server.ts'
import { createLinkStore } from '../../data/links.server.ts'
import { articleLinkPath } from '../../domain/link.ts'
import {
  createTestApp,
  seedAdmin,
  seedArticle,
  seedBatch,
  seedIssue,
  type TestApp,
  type TestBrowser,
} from '../../test-app.server.ts'

const MARIE = 'marie@vednemesicnik.test'
const ISSUE = 'VDM_2026_7'
const DETAIL = `/issues/${ISSUE}`
const CLOSE = `${DETAIL}/close`
const REOPEN = `${DETAIL}/reopen`

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('&nbsp;', ' ')
    .replaceAll(' ', ' ')
    .replace(/\s+/g, ' ')
    .replace(/ ([.,;?)])/g, '$1')
}

function statusText(html: string): string {
  let toasts = html.matchAll(/<div class="vdm-toast(?: [^"]*)?"[^>]*>(.*?)<\/div>/gs)
  return [...toasts].map((toast) => textOf(toast[1] ?? '').trim()).join(' | ')
}

/** The dialog's form: where it posts and the fields it carries back. */
function dialogForm(html: string): { action: string; fields: Record<string, string> } | null {
  let form = /<form action="([^"]*)"[^>]*class="vdm-dialog__actions"[^>]*>(.*?)<\/form>/s.exec(html)
  if (form === null) return null
  let fields: Record<string, string> = {}
  for (let input of (form[2] ?? '').matchAll(
    /<input name="([^"]+)" type="hidden" value="([^"]*)"/g,
  )) {
    if (input[1] !== '_csrf') fields[input[1] ?? ''] = input[2] ?? ''
  }
  return { action: (form[1] ?? '').replaceAll('&amp;', '&'), fields }
}

async function issueApp(): Promise<{ app: TestApp; editor: TestBrowser; issueId: number }> {
  let app = await createTestApp()
  await seedAdmin(app, MARIE)
  let issueId = await seedIssue(app, ISSUE)
  let editor = app.browser()
  await editor.signInAs(MARIE, 'Marie Horáková')
  return { app, editor, issueId }
}

async function articleLink(app: TestApp, issueId: number): Promise<string> {
  let link = await createLinkStore(app.database).articleLinkOf(issueId)
  if (link === null) throw new Error('The issue has no link.')
  return articleLinkPath(link.key)
}

async function closedAt(app: TestApp, issueId: number): Promise<Temporal.Instant | null> {
  return (await createIssueStore(app.database).findById(issueId))?.closedAt ?? null
}

describe('closing an issue (12g)', () => {
  it('offers Uzavřít vydání… in the detail’s „⋯“ and in the overview row’s', async () => {
    let { app, editor } = await issueApp()
    try {
      let detail = await (await editor.get(DETAIL)).text()
      assert.ok(detail.includes('aria-label="Další akce vydání"'))
      assert.ok(detail.includes(`"href":"${CLOSE}"`))
      assert.ok(textOf(detail).includes('Složka na Disku'))
      assert.ok(detail.includes('Otevřít podklady pro tisk'))

      let overview = await (await editor.get('/?state=open')).text()
      assert.ok(overview.includes(`"href":"${CLOSE}?from=overview&state=open"`))
      assert.ok(!overview.includes('Znovu otevřít vydání…'))
    } finally {
      await app.close()
    }
  })

  it('asks over the detail, without a warning when nothing lacks consent, and closes', async () => {
    let { app, editor, issueId } = await issueApp()
    try {
      let asked = await editor.get(CLOSE)
      assert.equal(asked.status, 200)
      let html = await asked.text()
      let text = textOf(html)
      assert.ok(text.includes('Uzavřít vydání VDM_2026_7?'))
      assert.ok(
        text.includes('Odkazy pro redakci přestanou platit a úlohy na pozadí vydání přeskočí.'),
      )
      assert.ok(!text.includes('grafik'), 'nothing in the app shares the designer’s folder yet')
      assert.ok(!text.includes('Přesto uzavřít'))
      assert.ok(
        html.includes('class="vdm-btn vdm-btn--danger vdm-btn--sm">Uzavřít vydání</button>'),
      )

      let form = dialogForm(html)
      assert.equal(form?.action, CLOSE)
      assert.deepEqual(form?.fields, { returnTo: 'detail' })
      let answered = await editor.post(CLOSE, form?.fields ?? {}, CLOSE)
      assert.equal(answered.status, 303)
      assert.equal(answered.headers.get('Location'), DETAIL)
      assert.ok((await closedAt(app, issueId)) !== null)

      let after = await (await editor.get(DETAIL)).text()
      assert.equal(statusText(after), 'Vydání VDM_2026_7 je uzavřené.')
    } finally {
      await app.close()
    }
  })

  it('warns of the articles and artworks still without consent, and says Přesto uzavřít', async () => {
    let { app, editor, issueId } = await issueApp()
    try {
      let first = await seedArticle(app, issueId, 'Kavárna v knihovně')
      await seedArticle(app, issueId, 'Školní jídelna po roce')
      await seedBatch(app, first, issueId, { count: 3 })
      let approved = await seedBatch(app, first, issueId, { count: 2 })
      await app.database.exec(
        sql`UPDATE artwork_batches SET approved_at = ${'2026-11-20T09:00:00.000Z'},
              consent_file_id = 'c-approved' WHERE id = ${approved.id}`,
      )

      let text = textOf(await (await editor.get(CLOSE)).text())
      assert.ok(
        text.includes(
          'U 2 článků a 3 děl zatím chybí souhlas. Dokud je vydání uzavřené, aplikace neodesílá žádosti o souhlas ani nečte odpovědi.',
        ),
      )
      assert.ok(text.includes('Přesto uzavřít'))
    } finally {
      await app.close()
    }
  })

  it('asks over the overview and goes back to it with its filter', async () => {
    let { app, editor, issueId } = await issueApp()
    try {
      let path = `${CLOSE}?from=overview&state=open`
      let html = await (await editor.get(path)).text()
      assert.ok(textOf(html).includes('Uzavřít vydání VDM_2026_7?'))
      assert.ok(html.includes('aria-label="Vydání"'), 'the overview stands under the dialog')
      assert.ok(
        html.includes('href="/?state=open" class="vdm-btn vdm-btn--ghost vdm-btn--sm">Zrušit</a>'),
      )

      let form = dialogForm(html)
      assert.deepEqual(form?.fields, { returnTo: 'overview', state: 'open' })
      let answered = await editor.post(CLOSE, form?.fields ?? {}, path)
      assert.equal(answered.headers.get('Location'), '/?state=open')
      assert.ok((await closedAt(app, issueId)) !== null)
    } finally {
      await app.close()
    }
  })

  it('takes the issue’s link away, and reopening brings the same one back', async () => {
    let { app, editor, issueId } = await issueApp()
    try {
      let link = await articleLink(app, issueId)
      let visitor = app.browser()
      assert.equal((await visitor.get(link)).status, 200)

      await editor.post(CLOSE, { returnTo: 'detail' }, CLOSE)
      assert.equal((await visitor.get(link)).status, 410)

      await editor.post(REOPEN, { returnTo: 'detail' }, REOPEN)
      assert.equal((await visitor.get(link)).status, 200)
      assert.equal(await articleLink(app, issueId), link)
    } finally {
      await app.close()
    }
  })

  it('changes nothing on a second answer, and the dialog of a closed issue goes back', async () => {
    let { app, editor, issueId } = await issueApp()
    try {
      await editor.post(CLOSE, { returnTo: 'detail' }, CLOSE)
      let first = await closedAt(app, issueId)
      await editor.get(DETAIL)

      let again = await editor.post(CLOSE, { returnTo: 'detail' }, DETAIL)
      assert.equal(again.headers.get('Location'), DETAIL)
      assert.deepEqual(await closedAt(app, issueId), first)
      assert.equal(statusText(await (await editor.get(DETAIL)).text()), '')

      let asked = await editor.get(CLOSE)
      assert.equal(asked.status, 303)
      assert.equal(asked.headers.get('Location'), DETAIL)
      let fromOverview = await editor.get(`${CLOSE}?from=overview`)
      assert.equal(fromOverview.headers.get('Location'), '/')
    } finally {
      await app.close()
    }
  })

  it('answers 404 for an unfinished or unknown issue, and 403 to a proofreader', async () => {
    let { app, editor } = await issueApp()
    try {
      await seedIssue(app, 'VDM_2026_8', { isComplete: false })
      assert.equal((await editor.get('/issues/VDM_2026_8/close')).status, 404)
      assert.equal((await editor.post('/issues/VDM_2026_8/close', {}, DETAIL)).status, 404)
      assert.equal((await editor.get('/issues/VDM_2026_9/close')).status, 404)
      let unfinished = await (await editor.get('/issues/VDM_2026_8')).text()
      assert.ok(!unfinished.includes('Uzavřít vydání…'))

      let proofreader = app.browser()
      await proofreader.signInAs(
        'lenka.svobodova@vednemesicnik.test',
        'Lenka Svobodová',
        undefined,
        {
          isEditor: false,
          isProofreader: true,
        },
      )
      assert.equal((await proofreader.get(CLOSE)).status, 403)
    } finally {
      await app.close()
    }
  })
})

describe('a closed issue and reopening it (12h)', () => {
  async function closedApp() {
    let set = await issueApp()
    let article = await seedArticle(set.app, set.issueId, 'Kavárna v knihovně')
    await set.editor.post(CLOSE, { returnTo: 'detail' }, CLOSE)
    await set.editor.get(DETAIL)
    return { ...set, article }
  }

  it('is for reading: the Callout, the struck link, and no step that writes', async () => {
    let { app, editor } = await closedApp()
    try {
      let html = await (await editor.get(DETAIL)).text()
      let text = textOf(html)
      assert.match(
        text,
        /Vydání je uzavřené od \d+\. \d+\. \d{4}\. Odkazy neplatí, úlohy ho přeskakují\./,
      )
      assert.ok(
        html.includes(
          `href="${REOPEN}" class="vdm-btn vdm-btn--outline vdm-btn--sm">Znovu otevřít</a>`,
        ),
      )
      assert.ok(html.includes('<del'))
      assert.ok(text.includes('Neplatí od uzavření'))
      assert.ok(!text.includes('Kopírovat'), 'neither the newsroom’s link nor the artworks’')
      assert.ok(!html.includes('Vydat nový odkaz'))
      assert.ok(!html.includes('Předat ke korektuře'))
      assert.ok(!text.includes('Složka na Disku'), 'the folder is in „⋯“')
      assert.ok(html.includes('Otevřít složku na Disku'))
      assert.ok(html.includes(`"href":"${REOPEN}"`))
      assert.ok(!html.includes('Uzavřít vydání…'))
    } finally {
      await app.close()
    }
  })

  it('offers Znovu otevřít vydání… in the overview row, muted', async () => {
    let { app, editor } = await closedApp()
    try {
      let html = await (await editor.get('/?state=closed')).text()
      assert.ok(html.includes(`"href":"${REOPEN}?from=overview&state=closed"`))
      assert.ok(!html.includes('Uzavřít vydání…'))
    } finally {
      await app.close()
    }
  })

  it('reopens from a plain dialog and says so', async () => {
    let { app, editor, issueId } = await closedApp()
    try {
      let html = await (await editor.get(REOPEN)).text()
      let text = textOf(html)
      assert.ok(text.includes('Znovu otevřít VDM_2026_7?'))
      assert.ok(
        text.includes(
          'Původní odkazy pro redakci začnou znovu platit a úlohy na pozadí vydání zase zpracují.',
        ),
      )
      assert.ok(
        html.includes('class="vdm-btn vdm-btn--primary vdm-btn--sm">Znovu otevřít</button>'),
      )

      let answered = await editor.post(REOPEN, dialogForm(html)?.fields ?? {}, REOPEN)
      assert.equal(answered.headers.get('Location'), DETAIL)
      assert.equal(await closedAt(app, issueId), null)
      let after = await (await editor.get(DETAIL)).text()
      assert.equal(statusText(after), 'Vydání VDM_2026_7 je znovu otevřené.')
      assert.ok(after.includes('Kopírovat'))

      assert.equal((await editor.get(REOPEN)).status, 303, 'an open issue has nothing to reopen')
    } finally {
      await app.close()
    }
  })
})
