import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { createArticleStore } from '../../data/articles.server.ts'
import { createIssueStore } from '../../data/issues.server.ts'
import { createLinkStore } from '../../data/links.server.ts'
import { now } from '../../domain/time.ts'
import {
  connectDriveAccount,
  createTestApp,
  seedAdmin,
  type TestApp,
  type TestBrowser,
} from '../../test-app.server.ts'

const MARIE = 'marie@vednemesicnik.test'
const TEREZA = { email: 'tereza.vlkova@external.test', name: 'Tereza Vlková' }
const ONDREJ = { email: 'ondrej.benes@external.test', name: 'Ondřej Beneš' }

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ ([.,;)])/g, '$1')
}

/** An app with an issue created through the dialog, its link, and an anonymous visitor. */
async function withLink(
  run: (context: {
    app: TestApp
    editor: TestBrowser
    key: string
    visitor: TestBrowser
  }) => Promise<void>,
  options: { isConnected?: boolean } = {},
): Promise<void> {
  let app = await createTestApp()
  try {
    await seedAdmin(app, MARIE)
    await connectDriveAccount(app)
    let editor = app.browser()
    await editor.signInAs(MARIE, 'Marie Horáková')
    let created = await editor.post('/issues/new', { name: 'VDM_2026_5' }, '/issues/new')
    assert.equal(created.status, 303)
    let issueId = Number(
      (await app.database.exec({ text: 'SELECT id FROM issues', values: [] } as never)).rows?.[0]?.[
        'id'
      ],
    )
    let link = await createLinkStore(app.database).articleLinkOf(issueId)
    assert.ok(link !== null)
    if (options.isConnected === false) await app.driveAccount.markDisconnected(now())
    await run({ app, editor, key: link.key, visitor: app.browser() })
  } finally {
    await app.close()
  }
}

function articleForm(
  formKey: string,
  name: string,
  authors: readonly { email: string; name: string }[],
  intent = 'create',
): URLSearchParams {
  let body = new URLSearchParams({ formKey, intent, name })
  for (let author of authors) {
    body.append('author-name', author.name)
    body.append('author-email', author.email)
  }
  return body
}

function formKeyOf(html: string): string {
  return /name="formKey" type="hidden" value="([^"]+)"/.exec(html)?.[1] ?? ''
}

/** The text of the element the island focuses after a send, or `null` when it is not drawn. */
function messageOf(html: string): string | null {
  let match = /<div ([^>]*id="article-message"[^>]*)>([\s\S]*?)<form/.exec(html)
  if (match === null) return null
  assert.match(match[1] ?? '', /tabindex="-1"/)
  return textOf(match[2] ?? '')
}

/** The page's heading, asserted to be one the island can focus. */
function focusableHeadingOf(html: string): string {
  let match = /<h1 ([^>]*)>([\s\S]*?)<\/h1>/.exec(html)
  assert.match(match?.[1] ?? '', /tabindex="-1"/)
  return textOf(match?.[2] ?? '').trim()
}

describe('the page behind the link (20a)', () => {
  it('draws the form for the issue, without a cookie and with noindex', () =>
    withLink(async ({ key, visitor }) => {
      let response = await visitor.get(`/l/${key}/article`)
      let html = await response.text()

      assert.equal(response.status, 200)
      assert.equal(response.headers.getSetCookie().length, 0)
      assert.match(response.headers.get('X-Robots-Tag') ?? '', /noindex/)
      assert.match(html, /<meta content="noindex, nofollow" name="robots"/)
      assert.match(html, /property="og:title"/)
      assert.ok(textOf(html).includes('Vydání VDM_2026_5'))
      assert.ok(textOf(html).includes('Nový článek'))
      assert.ok(formKeyOf(html) !== '')
      assert.ok(!textOf(html).includes('Zkuste článek vytvořit později'))
    }))

  it('warns at once while the account is disconnected', () =>
    withLink(
      async ({ key, visitor }) => {
        let html = await (await visitor.get(`/l/${key}/article`)).text()
        assert.ok(
          textOf(html).includes('Zkuste článek vytvořit později, nebo dejte vědět šéfredakci.'),
        )
      },
      { isConnected: false },
    ))

  it('warns at once when the issue’s Články folder is gone', () =>
    withLink(async ({ app, key, visitor }) => {
      let articles = app.drive.folders().find((folder) => folder.name === 'Články')
      if (articles !== undefined) app.drive.trash(articles.id)

      let html = await (await visitor.get(`/l/${key}/article`)).text()
      assert.ok(textOf(html).includes('Z tohoto odkazu teď nejde založit článek.'))
    }))
})

describe('one page for every link that does not work (02e)', () => {
  it('answers 404 for a key nobody issued and for a cut-off address, and says no more', () =>
    withLink(async ({ visitor }) => {
      for (let path of ['/l/AAAAAAAAAAAA/article', '/l/k7Qm2x/article']) {
        let response = await visitor.get(path)
        let html = await response.text()
        assert.equal(response.status, 404)
        assert.ok(textOf(html).includes('Z tohoto odkazu nejde založit článek'))
        assert.ok(!html.includes('og:description'))
      }
    }))

  it('answers 410 for a replaced link, the same page', () =>
    withLink(async ({ editor, key, visitor }) => {
      let renewed = await editor.post(
        '/issues/VDM_2026_5/link/renew',
        { shownKey: key },
        '/issues/VDM_2026_5/link/renew',
      )
      assert.equal(renewed.status, 303)

      let response = await visitor.get(`/l/${key}/article`)
      assert.equal(response.status, 410)
      assert.ok(
        textOf(await response.text()).includes('Napište šéfredakci a požádejte o aktuální odkaz.'),
      )
    }))
  it('answers 410 once the issue is closed, and is never cached', () =>
    withLink(async ({ app, key, visitor }) => {
      let open = await visitor.get(`/l/${key}/article`)
      assert.equal(open.headers.get('Cache-Control'), 'no-store')

      await app.database.exec({
        text: "UPDATE issues SET closed_at = '2026-11-18T12:00:00Z'",
        values: [],
      } as never)
      let response = await visitor.get(`/l/${key}/article`)
      assert.equal(response.status, 410)
      assert.equal(response.headers.get('Cache-Control'), 'no-store')
    }))
})

describe('creating an article from the link (20b–20d)', () => {
  it('creates it, mails both authors and says so', () =>
    withLink(async ({ app, key, visitor }) => {
      let formKey = formKeyOf(await (await visitor.get(`/l/${key}/article`)).text())
      let response = await visitor.send(
        `/l/${key}/article`,
        articleForm(formKey, 'Školní jídelna po roce', [TEREZA, ONDREJ]),
      )
      let text = textOf(await response.text())

      assert.equal(response.status, 200)
      assert.equal(response.headers.getSetCookie().length, 0)
      assert.ok(text.includes('Článek je založený'))
      assert.ok(text.includes('„Školní jídelna po roce“ je ve vydání VDM_2026_5.'))
      assert.ok(text.includes('Uvítací e-mail jsme odeslali na všechny uvedené adresy.'))
      assert.ok(
        text.includes('Až bude text připravený ke korektuře, dejte prosím vědět šéfredakci.'),
      )
      assert.ok(!text.includes('Co bude dál'))
      assert.ok(!text.includes('Souhlasím'))
      assert.deepEqual(
        app.mail.map((message) => message.to),
        [TEREZA.email, ONDREJ.email],
      )
    }))

  it('answers a second send of the same form with the same page and no second article', () =>
    withLink(async ({ app, key, visitor }) => {
      let body = articleForm(crypto.randomUUID(), 'Školní jídelna po roce', [TEREZA])
      await visitor.send(`/l/${key}/article`, body)
      let again = await visitor.send(`/l/${key}/article`, body)

      assert.equal(again.status, 200)
      assert.ok(textOf(await again.text()).includes('Článek je založený'))
      let link = await createLinkStore(app.database).findByKey(key)
      assert.equal(
        (await createArticleStore(app.database).listCreated(link?.issueId ?? 0)).length,
        1,
      )
      assert.equal(app.mail.length, 1)
    }))

  it('refuses the fields with a summary and the sentence at each field, keeping what was typed', () =>
    withLink(async ({ key, visitor }) => {
      let response = await visitor.send(
        `/l/${key}/article`,
        articleForm(crypto.randomUUID(), '', [
          { email: 'tereza.external.test', name: 'Tereza Vlková' },
        ]),
      )
      let html = await response.text()

      assert.equal(response.status, 400)
      assert.ok(textOf(html).includes('Opravte 2 pole'))
      assert.ok(textOf(html).includes('Vyplňte název článku.'))
      assert.ok(textOf(html).includes('Doplňte do e-mailové adresy zavináč.'))
      assert.ok(html.includes('value="tereza.external.test"'))
    }))

  it('draws one more author card for Přidat autora without the browser runtime', () =>
    withLink(async ({ key, visitor }) => {
      let response = await visitor.send(
        `/l/${key}/article`,
        articleForm(crypto.randomUUID(), 'Článek', [TEREZA], 'add-author'),
      )
      let html = await response.text()
      assert.equal(response.status, 200)
      assert.ok(textOf(html).includes('Autor 2'))
    }))

  it('takes the card out for Odebrat without the browser runtime', () =>
    withLink(async ({ key, visitor }) => {
      let response = await visitor.send(
        `/l/${key}/article`,
        articleForm(crypto.randomUUID(), 'Článek', [TEREZA, ONDREJ], 'remove-2'),
      )
      let html = await response.text()
      assert.equal(response.status, 200)
      assert.ok(html.includes(`value="${TEREZA.email}"`))
      assert.ok(!html.includes(`value="${ONDREJ.email}"`))
    }))

  it('refuses eleven authors and an author name over 200 characters, creating nothing', () =>
    withLink(async ({ app, key, visitor }) => {
      let eleven = Array.from({ length: 11 }, (_, index) => ({
        email: `autor${index + 1}@external.test`,
        name: `Autor ${index + 1}`,
      }))
      let many = await visitor.send(
        `/l/${key}/article`,
        articleForm(crypto.randomUUID(), 'Článek', eleven),
      )
      assert.equal(many.status, 400)
      assert.ok(textOf(await many.text()).includes('Článek může mít nejvýš 10 autorů.'))

      let long = await visitor.send(
        `/l/${key}/article`,
        articleForm(crypto.randomUUID(), 'Článek', [{ ...TEREZA, name: 'T'.repeat(201) }]),
      )
      assert.equal(long.status, 400)
      assert.ok(textOf(await long.text()).includes('Zkraťte jméno na nejvýš 200 znaků.'))
      assert.equal(app.mail.length, 0)
    }))

  it('says Drive did not answer, keeps the fields, and leaves nothing behind', () =>
    withLink(async ({ app, key, visitor }) => {
      app.drive.failStep('copy')
      let response = await visitor.send(
        `/l/${key}/article`,
        articleForm(crypto.randomUUID(), 'Školní jídelna po roce', [TEREZA]),
      )
      let html = await response.text()

      assert.equal(response.status, 409)
      assert.ok(
        textOf(html).includes('Zkuste článek vytvořit za chvíli znovu. Článek se nevytvořil.'),
      )
      assert.ok(html.includes('value="Školní jídelna po roce"'))
      assert.ok(
        app.drive
          .files()
          .filter((file) => file.appProperties['publikaceAttempt'] !== undefined)
          .every((file) => file.isTrashed),
      )
    }))

  it('answers 410 with the fields kept when the link was replaced since the page opened', () =>
    withLink(async ({ editor, key, visitor }) => {
      await editor.post(
        '/issues/VDM_2026_5/link/renew',
        { shownKey: key },
        '/issues/VDM_2026_5/link/renew',
      )
      let response = await visitor.send(
        `/l/${key}/article`,
        articleForm(crypto.randomUUID(), 'Školní jídelna po roce', [TEREZA]),
      )
      let html = await response.text()

      assert.equal(response.status, 410)
      assert.ok(textOf(html).includes('Napište šéfredakci o aktuální odkaz.'))
      assert.ok(html.includes('value="Školní jídelna po roce"'))
      assert.ok(!textOf(html).includes('Vytvořit článek'))
    }))

  it('answers a resend of a created form with its page, also after the link was replaced', () =>
    withLink(async ({ app, editor, key, visitor }) => {
      let body = articleForm(crypto.randomUUID(), 'Školní jídelna po roce', [TEREZA])
      await visitor.send(`/l/${key}/article`, body)
      await editor.post(
        '/issues/VDM_2026_5/link/renew',
        { shownKey: key },
        '/issues/VDM_2026_5/link/renew',
      )

      let again = await visitor.send(`/l/${key}/article`, body)
      assert.equal(again.status, 200)
      assert.ok(textOf(await again.text()).includes('Článek je založený'))
      assert.equal(app.mail.length, 1)
    }))
})

describe('the link and the articles in the detail (12a, 12c, 02d)', () => {
  it('shows a fresh issue’s link highlighted, then its articles and the count in the overview', () =>
    withLink(async ({ editor, key, visitor }) => {
      let fresh = await (await editor.get('/issues/VDM_2026_5')).text()
      assert.ok(textOf(fresh).includes('Odkaz pro redakci'))
      assert.ok(fresh.includes(`/l/${key}/article`))
      assert.ok(textOf(fresh).includes('Zatím nepoužit'))
      assert.ok(fresh.includes('vdm-changed'))

      await visitor.send(
        `/l/${key}/article`,
        articleForm(crypto.randomUUID(), 'Školní jídelna po roce', [TEREZA, ONDREJ]),
      )
      let detail = await (await editor.get('/issues/VDM_2026_5')).text()
      assert.ok(!detail.includes('vdm-changed'))
      assert.ok(textOf(detail).includes('Použit 1×, naposledy'))
      assert.ok(textOf(detail).includes('Školní jídelna po roce'))
      assert.ok(textOf(detail).includes('Tereza Vlková, Ondřej Beneš'))
      assert.ok(textOf(detail).includes('Píše se'))

      let overview = await (await editor.get('/')).text()
      assert.match(overview, /<span class="vdm-num">1<\/span><small>0 schválených<\/small>/)
    }))

  it('asks before renewing, then shows the new link with the toast', () =>
    withLink(async ({ editor, key }) => {
      let question = await editor.get('/issues/VDM_2026_5/link/renew')
      let html = await question.text()
      assert.equal(question.status, 200)
      assert.ok(textOf(html).includes('Vydat nový odkaz pro redakci?'))

      let renewed = await editor.post(
        '/issues/VDM_2026_5/link/renew',
        { shownKey: key },
        '/issues/VDM_2026_5/link/renew',
      )
      assert.equal(renewed.status, 303)
      let detail = await (await editor.get('/issues/VDM_2026_5')).text()
      assert.ok(!detail.includes(`/l/${key}/article`))
      assert.ok(textOf(detail).includes('Pošlete redakci nový odkaz. Starý už neplatí.'))
    }))

  it('writes nothing for a dialog whose link another editor renewed meanwhile', () =>
    withLink(async ({ app, editor, key }) => {
      let validKey = async () => {
        let result = await app.database.exec({
          text: "SELECT key FROM links WHERE kind = 'article' AND revoked_at IS NULL",
          values: [],
        } as never)
        return String(result.rows?.[0]?.['key'])
      }
      let renew = () =>
        editor.post(
          '/issues/VDM_2026_5/link/renew',
          { shownKey: key },
          '/issues/VDM_2026_5/link/renew',
        )
      assert.equal((await renew()).status, 303)
      await editor.get('/issues/VDM_2026_5')
      let renewed = await validKey()
      assert.notEqual(renewed, key)

      assert.equal((await renew()).status, 303)
      let detail = await (await editor.get('/issues/VDM_2026_5')).text()
      assert.ok(
        textOf(detail).includes(
          'Odkaz pro redakci se mezitím změnil. Aktuální odkaz můžete zkopírovat.',
        ),
      )
      assert.ok(detail.includes('vdm-changed'))
      assert.equal(await validKey(), renewed)
    }))

  it('goes back to the detail with the reason when the issue closed under the dialog', () =>
    withLink(async ({ app, editor, key, visitor }) => {
      assert.equal((await editor.get('/issues/VDM_2026_5/link/renew')).status, 200)
      let issues = createIssueStore(app.database)
      let issue = await issues.findByName('VDM_2026_5')
      assert.ok(issue !== null)
      await issues.close(issue.id, now())

      /* The token comes from the detail, as for a dialog left open: the dialog no longer opens. */
      let answered = await editor.post(
        '/issues/VDM_2026_5/link/renew',
        { shownKey: key },
        '/issues/VDM_2026_5',
      )
      assert.equal(answered.status, 303)
      assert.equal(answered.headers.get('Location'), '/issues/VDM_2026_5')
      let detail = await (await editor.get('/issues/VDM_2026_5')).text()
      assert.ok(
        textOf(detail).includes('Vydání VDM_2026_5 je uzavřené. Nový odkaz už nejde vydat.'),
      )
      assert.equal((await createLinkStore(app.database).articleLinkOf(issue.id))?.key, key)
      assert.equal((await visitor.get(`/l/${key}/article`)).status, 410)
    }))

  it('refuses a renewal sent without the form’s token, keeping the link', () =>
    withLink(async ({ editor, key, visitor }) => {
      let refused = await editor.send('/issues/VDM_2026_5/link/renew', new URLSearchParams())
      assert.equal(refused.status, 403)
      assert.equal((await visitor.get(`/l/${key}/article`)).status, 200)
    }))
})

describe('where focus goes after a send (20c, 20d)', () => {
  it('draws the done page’s heading focusable, also for a resend', () =>
    withLink(async ({ key, visitor }) => {
      let body = articleForm(crypto.randomUUID(), 'Školní jídelna po roce', [TEREZA])
      let created = await (await visitor.send(`/l/${key}/article`, body)).text()
      assert.equal(focusableHeadingOf(created), 'Článek je založený')

      let again = await (await visitor.send(`/l/${key}/article`, body)).text()
      assert.equal(focusableHeadingOf(again), 'Článek je založený')
    }))

  it('marks the refusal above the form, with a new key for every answer', () =>
    withLink(async ({ app, key, visitor }) => {
      app.drive.failStep('copy')
      let body = articleForm(crypto.randomUUID(), 'Školní jídelna po roce', [TEREZA])
      let first = await (await visitor.send(`/l/${key}/article`, body)).text()
      let second = await (await visitor.send(`/l/${key}/article`, body)).text()

      assert.ok(messageOf(first)?.includes('Článek se nevytvořil.'))
      let keys = [first, second].map((html) => /"messageKey":"([^"]+)"/.exec(html)?.[1])
      assert.ok(keys[0] !== undefined && keys[1] !== undefined)
      assert.notEqual(keys[0], keys[1])
    }))

  it('marks the refusal when the link was replaced and the button is gone', () =>
    withLink(async ({ editor, key, visitor }) => {
      await editor.post(
        '/issues/VDM_2026_5/link/renew',
        { shownKey: key },
        '/issues/VDM_2026_5/link/renew',
      )
      let html = await (
        await visitor.send(
          `/l/${key}/article`,
          articleForm(crypto.randomUUID(), 'Školní jídelna po roce', [TEREZA]),
        )
      ).text()
      assert.ok(messageOf(html)?.includes('Napište šéfredakci o aktuální odkaz.'))
    }))

  it('marks the warning when a send meets a disconnected account, and nothing on opening', () =>
    withLink(
      async ({ key, visitor }) => {
        let opened = await (await visitor.get(`/l/${key}/article`)).text()
        assert.equal(messageOf(opened), null)

        let sent = await (
          await visitor.send(
            `/l/${key}/article`,
            articleForm(formKeyOf(opened), 'Školní jídelna po roce', [TEREZA]),
          )
        ).text()
        assert.ok(
          messageOf(sent)?.includes('Zkuste článek vytvořit později, nebo dejte vědět šéfredakci.'),
        )
      },
      { isConnected: false },
    ))

  it('marks nothing above the form for field errors, which the summary takes', () =>
    withLink(async ({ key, visitor }) => {
      let html = await (
        await visitor.send(`/l/${key}/article`, articleForm(crypto.randomUUID(), '', [TEREZA]))
      ).text()
      assert.equal(messageOf(html), null)
    }))
})
