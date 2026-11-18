import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { createLinkStore } from '../../../data/links.server.ts'
import { now } from '../../../domain/time.ts'
import {
  connectDriveAccount,
  createTestApp,
  seedAdmin,
  type TestApp,
  type TestBrowser,
} from '../../../test-app.server.ts'

const MARIE = 'marie@vednemesicnik.test'
const TEREZA = { email: 'tereza.vlkova@external.test', name: 'Tereza Vlková' }
const ONDREJ = { email: 'ondrej.benes@external.test', name: 'Ondřej Beneš' }
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4])
const FORM = '22222222-2222-4222-8222-222222222222'

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ ([.,;)])/g, '$1')
}

type Context = {
  app: TestApp
  editor: TestBrowser
  issueKey: string
  key: string
  visitor: TestBrowser
}

/** An issue, an article created through its page, and that article's link for artworks. */
async function withArtworksLink(
  run: (context: Context) => Promise<void>,
  options: { isConnected?: boolean } = {},
): Promise<void> {
  let app = await createTestApp()
  try {
    await seedAdmin(app, MARIE)
    await connectDriveAccount(app)
    let editor = app.browser()
    await editor.signInAs(MARIE, 'Marie Horáková')
    await editor.post('/issues/new', { name: 'VDM_2026_5' }, '/issues/new')
    let links = createLinkStore(app.database)
    let articleLink = await links.articleLinkOf(1)
    assert.ok(articleLink !== null)
    let visitor = app.browser()
    let body = new URLSearchParams({
      formKey: '33333333-3333-4333-8333-333333333333',
      intent: 'create',
      name: 'Školní jídelna po roce',
    })
    body.append('author-name', TEREZA.name)
    body.append('author-email', TEREZA.email)
    assert.equal((await visitor.send(`/l/${articleLink.key}/article`, body)).status, 200)
    let [link] = [...(await links.artworksLinksOf(1)).values()]
    assert.ok(link !== undefined)
    if (options.isConnected === false) await app.driveAccount.markDisconnected(now())
    await run({ app, editor, issueKey: articleLink.key, key: link.key, visitor })
  } finally {
    await app.close()
  }
}

function upload(context: Context, name = 'jidelna-1.jpg', formKey = FORM): Promise<Response> {
  return context.visitor.sendBytes(`/l/${context.key}/artworks/files`, new Uint8Array(JPEG), {
    'Content-Type': 'image/jpeg',
    'X-File-Name': encodeURIComponent(name),
    'X-Form-Key': formKey,
  })
}

async function uploadedId(context: Context, name?: string): Promise<number> {
  let response = await upload(context, name)
  assert.equal(response.status, 201)
  let body = (await response.json()) as { artwork: { id: number }; outcome: string }
  assert.equal(body.outcome, 'uploaded')
  return body.artwork.id
}

function sendForm(
  ids: readonly number[],
  provider = ONDREJ,
  extra: Record<string, string> = {},
): URLSearchParams {
  let body = new URLSearchParams({
    formKey: FORM,
    'provider-email': provider.email,
    'provider-name': provider.name,
    ...extra,
  })
  for (let id of ids) {
    body.append('artwork-id', String(id))
    body.append('artwork-author', '')
    body.append('artwork-source', 'https://unsplash.com/photos/jidelna-a8Kq')
  }
  return body
}

describe('the artworks page', () => {
  it('draws 21a for a valid link, public, uncached and without a cookie', () =>
    withArtworksLink(async (context) => {
      let response = await context.visitor.get(`/l/${context.key}/artworks`)
      assert.equal(response.status, 200)
      assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow')
      assert.equal(response.headers.get('Cache-Control'), 'no-store')
      assert.deepEqual(response.headers.getSetCookie(), [])
      let html = await response.text()
      let text = textOf(html)
      assert.ok(text.includes('K článku Školní jídelna po roce'))
      assert.ok(text.includes('Nahrání obrazových děl'))
      assert.ok(text.includes('Kdo díla poskytuje'))
      assert.match(html, /autocomplete="name"/)
      assert.match(html, /autocomplete="email"/)
      /* Uploading needs the script, so the chooser comes disabled until it runs (`21a`). */
      assert.match(html, /<input[^>]*type="file"[^>]*disabled|<input[^>]*disabled[^>]*type="file"/)
      assert.ok(text.includes('Načtěte stránku znovu, nebo odkaz otevřete v jiném prohlížeči.'))
    }))

  it('answers 02f for an unknown key and for the article link’s path with this key', () =>
    withArtworksLink(async (context) => {
      let unknown = await context.visitor.get('/l/AAAAAAAAAAAA/artworks')
      assert.equal(unknown.status, 404)
      assert.ok(textOf(await unknown.text()).includes('Z tohoto odkazu nejde nahrát obrazová díla'))
      let ofArticles = await context.visitor.get(`/l/${context.issueKey}/artworks`)
      assert.equal(ofArticles.status, 404)
      assert.equal((await context.visitor.get(`/l/${context.key}/article`)).status, 404)
    }))

  it('warns at once while the account is disconnected', () =>
    withArtworksLink(
      async (context) => {
        let text = textOf(await (await context.visitor.get(`/l/${context.key}/artworks`)).text())
        assert.ok(text.includes('Zkuste díla nahrát později, nebo dejte vědět šéfredakci.'))
      },
      { isConnected: false },
    ))

  it('takes a file as a raw body and refuses one over 15 MB from its length alone', () =>
    withArtworksLink(async (context) => {
      await uploadedId(context)
      let tooLarge = await context.visitor.sendBytes(
        `/l/${context.key}/artworks/files`,
        new Uint8Array(4),
        {
          'Content-Length': String(16 * 1024 * 1024),
          'Content-Type': 'image/jpeg',
          'X-Form-Key': FORM,
        },
      )
      assert.equal(tooLarge.status, 413)
      assert.deepEqual(await tooLarge.json(), { outcome: 'too-large' })
      let refused = await context.visitor.sendBytes(
        `/l/${context.key}/artworks/files`,
        new Uint8Array(JPEG),
        {
          'Content-Type': 'image/jpeg',
          'X-Form-Key': 'not-a-key',
        },
      )
      assert.equal(refused.status, 400)
    }))

  it('sends the batch and draws 21c, then opens the form again with the provider kept', () =>
    withArtworksLink(async (context) => {
      let id = await uploadedId(context)
      let response = await context.visitor.send(`/l/${context.key}/artworks`, sendForm([id]))
      assert.equal(response.status, 200)
      let text = textOf(await response.text())
      assert.ok(text.includes('Díky, díla máme'))
      assert.ok(text.includes('1 dílo k článku „Školní jídelna po roce“ je nahrané.'))
      assert.ok(text.includes(`Na ${ONDREJ.email} jsme poslali žádost o souhlas.`))
      assert.ok(text.includes('autor neuveden · unsplash.com/photos/…'))
      let consent = context.app.mail.find((message) => message.to === ONDREJ.email)
      assert.ok(consent?.subject.startsWith('Žádost o potvrzení souhlasu s užitím obrazových děl'))

      let again = await context.visitor.send(
        `/l/${context.key}/artworks`,
        new URLSearchParams({
          intent: 'another',
          'provider-email': ONDREJ.email,
          'provider-name': ONDREJ.name,
        }),
      )
      let html = await again.text()
      assert.ok(html.includes(`value="${ONDREJ.email}"`) || html.includes(ONDREJ.email))
      assert.ok(!html.includes(FORM))
    }))

  it('answers a field error with 400 and keeps the uploaded card', () =>
    withArtworksLink(async (context) => {
      let id = await uploadedId(context, 'jidelna-7.jpg')
      let response = await context.visitor.send(
        `/l/${context.key}/artworks`,
        sendForm([id], { email: '', name: ONDREJ.name }),
      )
      assert.equal(response.status, 400)
      let text = textOf(await response.text())
      assert.ok(text.includes('Opravte 1 pole'))
      assert.ok(text.includes('jidelna-7.jpg'))
    }))
})

describe('the artworks in the issue detail', () => {
  it('lists a sent batch, counts it on the article row and offers the link to copy', () =>
    withArtworksLink(async (context) => {
      let id = await uploadedId(context, 'jidelna-2.jpg')
      await context.visitor.send(`/l/${context.key}/artworks`, sendForm([id]))
      let html = await (await context.editor.get('/issues/VDM_2026_5')).text()
      let text = textOf(html)
      assert.ok(text.includes('jidelna-2.jpg'))
      assert.ok(text.includes('U poskytovatele'))
      assert.ok(text.includes('neuveden · unsplash.com/photos/…'))
      assert.ok(text.includes('u poskytovatele'))
      assert.match(text, /Píše se založen [^ ]+ [^ ]+ 1 u poskytovatele/)
      assert.ok(html.includes(`/l/${context.key}/artworks`))

      let filtered = textOf(
        await (await context.editor.get('/issues/VDM_2026_5?artworks=error')).text(),
      )
      assert.ok(!filtered.includes('jidelna-2.jpg'))
    }))

  it('asks before discarding a batch in Chyba, then discards it with a toast', () =>
    withArtworksLink(async (context) => {
      let id = await uploadedId(context)
      /* The Mailer of the suite always answers; a batch is put in _Chyba_ by hand here. */
      await context.visitor.send(`/l/${context.key}/artworks`, sendForm([id]))
      await context.app.database.exec({
        text: 'UPDATE artwork_batches SET mail_sent_at = NULL',
        values: [],
      } as never)

      let detail = textOf(await (await context.editor.get('/issues/VDM_2026_5')).text())
      assert.ok(detail.includes('chybí potvrzení o odeslání žádosti'))

      let dialog = textOf(
        await (await context.editor.get('/issues/VDM_2026_5/artworks/batches/1/discard')).text(),
      )
      assert.ok(dialog.includes('Zahodit dávku 1 díla?'))

      let discarded = await context.editor.post(
        '/issues/VDM_2026_5/artworks/batches/1/discard',
        {},
        '/issues/VDM_2026_5/artworks/batches/1/discard',
      )
      assert.equal(discarded.status, 303)
      let after = textOf(await (await context.editor.get('/issues/VDM_2026_5')).text())
      assert.ok(after.includes('1 dílo i jeho PDF je v koši sdíleného disku Publikace.'))
      assert.ok(!after.includes('chybí potvrzení o odeslání žádosti'))
    }))

  it('resends the request of a batch in Chyba from the row', () =>
    withArtworksLink(async (context) => {
      let id = await uploadedId(context)
      await context.visitor.send(`/l/${context.key}/artworks`, sendForm([id]))
      await context.app.database.exec({
        text: 'UPDATE artwork_batches SET mail_sent_at = NULL',
        values: [],
      } as never)
      let sentBefore = context.app.mail.length
      /* The row's menu is an island: the token it posts with is the one in its props. */
      let detail = await (await context.editor.get('/issues/VDM_2026_5?artworks=error')).text()
      let token = /csrfToken(?:"|&quot;|\\")\s*:\s*(?:"|&quot;|\\")([^"&\\]+)/.exec(detail)?.[1]
      assert.ok(token !== undefined && token !== '')
      assert.ok(detail.includes('/issues/VDM_2026_5/artworks/batches/1/resend?artworks=error'))

      let refused = await context.editor.post(
        '/issues/VDM_2026_5/artworks/batches/1/resend',
        { _csrf: 'not-the-token' },
        '/issues/VDM_2026_5',
      )
      assert.equal(refused.status, 403)
      let elsewhere = await context.editor.post(
        '/issues/VDM_2026_5/artworks/batches/99/resend',
        { _csrf: token },
        '/issues/VDM_2026_5',
      )
      assert.equal(elsewhere.status, 404)
      assert.equal(context.app.mail.length, sentBefore)

      let resent = await context.editor.post(
        '/issues/VDM_2026_5/artworks/batches/1/resend?artworks=error',
        { _csrf: token },
        '/issues/VDM_2026_5',
      )
      assert.equal(resent.status, 303)
      assert.equal(resent.headers.get('Location'), '/issues/VDM_2026_5?artworks=error')
      assert.equal(context.app.mail.length, sentBefore + 1)
      let after = textOf(await (await context.editor.get('/issues/VDM_2026_5')).text())
      assert.ok(after.includes(`Žádost o souhlas odešla na ${ONDREJ.email}.`))
    }))
})
