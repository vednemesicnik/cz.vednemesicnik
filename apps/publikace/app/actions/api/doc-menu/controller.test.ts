import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { appOrigin } from '../../../auth/environment.server.ts'
import { createArticleStore } from '../../../data/articles.server.ts'
import type { DocMenuDialog } from '../../../domain/doc-menu.ts'
import {
  connectDriveAccount,
  createTestApp,
  fakeIdentityToken,
  seedArticle,
  seedIssue,
  type TestApp,
  UNREACHABLE_IDENTITY_TOKEN,
} from '../../../test-app.server.ts'

const PREVIEW = '/api/v1/doc-menu/proofreading/preview'
const MARK = '/api/v1/doc-menu/proofreading'
const JAKUB = {
  email: 'jakub.novak@vednemesicnik.test',
  hostedDomain: 'vednemesicnik.test',
  name: 'Jakub Novák',
}
const KOREKTORI = 'korektori@vednemesicnik.test'

async function setup(options: { isShared?: boolean } = {}) {
  let app = await createTestApp()
  await connectDriveAccount(app)
  let issueId = await seedIssue(app, 'VDM_2026_5')
  let article = await seedArticle(app, issueId, 'Volební kampaň na sítích')
  if (options.isShared !== false) {
    app.drive.share(article.docId, { emailAddress: KOREKTORI, role: 'writer', type: 'group' })
    app.setMembership(KOREKTORI, (email) =>
      email === JAKUB.email ? { displayName: null, status: 'member' } : { status: 'not-member' },
    )
  }
  return { app, article, issueId }
}

function call(
  app: TestApp,
  path: string,
  body: unknown,
  token: string | null = fakeIdentityToken(JAKUB),
): Promise<Response> {
  let headers = new Headers({ 'Content-Type': 'application/json' })
  if (token !== null) headers.set('Authorization', `Bearer ${token}`)
  return app.fetch(
    new Request(new URL(path, appOrigin()), {
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers,
      method: 'POST',
    }),
  )
}

async function dialogOf(response: Response): Promise<DocMenuDialog> {
  assert.equal(response.status, 200)
  assert.equal(response.headers.getSetCookie().length, 0)
  return ((await response.json()) as { dialog: DocMenuDialog }).dialog
}

describe('the Doc menu’s Označit probíhající korekturu', () => {
  it('asks first and records nothing, then records who and when on the confirming call', async () => {
    let { app, article } = await setup()
    try {
      let body = { documentId: article.docId, metaDocumentId: article.docId }
      let preview = await dialogOf(await call(app, PREVIEW, body))
      assert.equal(preview.heading, 'Označit probíhající korekturu?')
      assert.equal(preview.title, '„Volební kampaň na sítích“')
      assert.equal(preview.meta, 'VDM_2026_5 · Ke korektuře zatím nepředáno')
      assert.equal(
        (await createArticleStore(app.database).findById(article.articleId))?.proofreading,
        null,
      )

      let marked = await dialogOf(await call(app, MARK, body))
      assert.equal(marked.heading, 'Korektura označena')
      let record = (await createArticleStore(app.database).findById(article.articleId))
        ?.proofreading
      assert.equal(record?.email, JAKUB.email)
      assert.equal(record?.name, JAKUB.name)

      let again = await dialogOf(await call(app, MARK, body))
      assert.equal(again.heading, 'Korektura už je označená')
      assert.ok(again.lines[0]?.text.endsWith('· Jakub Novák'))
    } finally {
      await app.close()
    }
  })

  it('shows the editors-in-chief Korektura with who and since when', async () => {
    let { app, article } = await setup()
    try {
      await call(app, MARK, { documentId: article.docId, metaDocumentId: article.docId })
      let browser = app.browser()
      await browser.signInAs('marie@vednemesicnik.test', 'Marie Horáková')
      let html = await (await browser.get('/issues/VDM_2026_5')).text()
      assert.match(html, /Korektura/)
      assert.match(html, /od \d+\. \d+\. · Jakub Novák/)
    } finally {
      await app.close()
    }
  })

  it('refuses a token that does not verify and an account that may not edit the Doc alike, saying nothing of the article', async () => {
    let { app, article } = await setup()
    try {
      let body = { documentId: article.docId, metaDocumentId: article.docId }
      let eva = { email: 'eva.mala@external.test', name: 'Eva Malá' }
      for (let response of [
        await call(app, MARK, body, 'forged'),
        await call(app, MARK, body, null),
        await call(app, MARK, body, fakeIdentityToken(eva)),
      ]) {
        let dialog = await dialogOf(response)
        assert.equal(dialog.heading, 'Publikace váš účet nepřijala')
        assert.ok(!JSON.stringify(dialog).includes('Volební'))
      }
      assert.equal(
        (await createArticleStore(app.database).findById(article.articleId))?.proofreading,
        null,
      )
    } finally {
      await app.close()
    }
  })

  it('sends a copy to its original, checking the right to edit both', async () => {
    let { app, article } = await setup()
    try {
      app.drive.seedDoc('d-copy', 'Kopie z Volební kampaň na sítích', article.folderId)
      app.drive.share('d-copy', { emailAddress: KOREKTORI, role: 'writer', type: 'group' })
      let dialog = await dialogOf(
        await call(app, PREVIEW, { documentId: 'd-copy', metaDocumentId: article.docId }),
      )
      assert.equal(dialog.heading, 'Toto je kopie dokumentu článku')
      assert.deepEqual(dialog.actions[1], {
        kind: 'open',
        label: 'Otevřít původní',
        url: `https://docs.google.com/document/d/${article.docId}/edit`,
      })
    } finally {
      await app.close()
    }
  })

  it('says a Doc it does not know is unknown only to somebody who may edit it', async () => {
    let { app } = await setup()
    try {
      app.drive.seedDoc('d-stray', 'Bez článku', 'f-somewhere')
      let refused = await dialogOf(
        await call(app, PREVIEW, { documentId: 'd-stray', metaDocumentId: null }),
      )
      assert.equal(refused.heading, 'Publikace váš účet nepřijala')

      app.drive.share('d-stray', { role: 'writer', type: 'anyone' })
      let unknown = await dialogOf(
        await call(app, PREVIEW, { documentId: 'd-stray', metaDocumentId: null }),
      )
      assert.equal(unknown.heading, 'Publikace tento dokument nezná')
    } finally {
      await app.close()
    }
  })

  it('records nothing in a closed issue', async () => {
    let { app, article, issueId } = await setup()
    try {
      await app.database.exec(
        sql`UPDATE issues SET closed_at = '2026-11-19T08:00:00.000Z' WHERE id = ${issueId}`,
      )
      let dialog = await dialogOf(
        await call(app, MARK, { documentId: article.docId, metaDocumentId: article.docId }),
      )
      assert.equal(dialog.heading, 'Vydání VDM_2026_5 je uzavřené')
      assert.equal(
        (await createArticleStore(app.database).findById(article.articleId))?.proofreading,
        null,
      )
    } finally {
      await app.close()
    }
  })

  it('answers 503 when Google, Drive or the membership service cannot be asked, and 400 for a call that is not one', async (t) => {
    t.mock.method(console, 'error', () => {})
    let { app, article } = await setup()
    try {
      let body = { documentId: article.docId, metaDocumentId: article.docId }
      assert.equal((await call(app, MARK, body, UNREACHABLE_IDENTITY_TOKEN)).status, 503)

      app.setMembership(KOREKTORI, () => ({ status: 'unavailable' }))
      assert.equal((await call(app, MARK, body)).status, 503)

      app.drive.failStep('permissions')
      assert.equal((await call(app, MARK, body)).status, 503)
      app.drive.heal()

      assert.equal((await call(app, MARK, 'not json')).status, 400)
      assert.equal((await call(app, MARK, { documentId: '' })).status, 400)
      assert.equal(
        (await createArticleStore(app.database).findById(article.articleId))?.proofreading,
        null,
      )
    } finally {
      await app.close()
    }
  })

  it('stops one account after twenty calls in ten minutes, before Drive is asked', async () => {
    let { app, article } = await setup()
    try {
      let body = { documentId: article.docId, metaDocumentId: article.docId }
      for (let attempt = 0; attempt < 20; attempt += 1) {
        assert.equal((await call(app, PREVIEW, body)).status, 200)
      }
      let asked = app.drive.calls.length
      let over = await call(app, PREVIEW, body)
      assert.equal(over.status, 429)
      assert.equal(app.drive.calls.length, asked)

      let eva = { email: 'eva.mala@external.test', name: 'Eva Malá' }
      assert.equal((await call(app, PREVIEW, body, fakeIdentityToken(eva))).status, 200)
    } finally {
      await app.close()
    }
  })

  it('asks about both Docs a call names, so editing one tells nothing about another ID', async () => {
    let { app, article } = await setup({ isShared: false })
    try {
      app.drive.seedDoc('d-mine', 'Můj dokument', 'f-somewhere')
      app.drive.share('d-mine', { emailAddress: JAKUB.email, role: 'writer', type: 'user' })

      let probingArticle = await dialogOf(
        await call(app, PREVIEW, { documentId: 'd-mine', metaDocumentId: article.docId }),
      )
      let probingNothing = await dialogOf(
        await call(app, PREVIEW, { documentId: 'd-mine', metaDocumentId: 'd-made-up' }),
      )
      assert.equal(probingArticle.heading, 'Publikace váš účet nepřijala')
      assert.equal(probingNothing.heading, 'Publikace váš účet nepřijala')
    } finally {
      await app.close()
    }
  })
})

describe('two proofreaders marking the same article at once', () => {
  it('keeps the first record and tells the second who it is', async () => {
    let { app, article } = await setup()
    try {
      /* Eva's mark lands between the check and Jakub's write, as two clicks a moment apart can:
         the trigger writes hers first and drops his. */
      await app.database.exec(sql`
        CREATE TEMP TRIGGER eva_first BEFORE UPDATE OF proofread_at ON articles
        WHEN NEW.proofread_by_email = 'jakub.novak@vednemesicnik.test'
        BEGIN
          UPDATE articles
          SET proofread_at = '2026-11-19T09:00:00.000Z',
              proofread_by_email = 'eva.mala@vednemesicnik.test',
              proofread_by_name = 'Eva Malá'
          WHERE id = NEW.id AND proofread_at IS NULL;
          SELECT RAISE(IGNORE);
        END`)

      let dialog = await dialogOf(
        await call(app, MARK, { documentId: article.docId, metaDocumentId: article.docId }),
      )
      assert.equal(dialog.heading, 'Korektura už je označená')
      assert.ok(dialog.lines[0]?.text.endsWith('· Eva Malá'))
      let record = (await createArticleStore(app.database).findById(article.articleId))
        ?.proofreading
      assert.equal(record?.email, 'eva.mala@vednemesicnik.test')
    } finally {
      await app.close()
    }
  })
})
