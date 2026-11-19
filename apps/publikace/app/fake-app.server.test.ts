import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { appOrigin } from './auth/environment.server.ts'
import { createFakeApp, type FakeApp } from './fake-app.server.ts'

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ ([.,;)])/g, '$1')
}

async function withFakeApp(run: (fake: FakeApp) => Promise<void>): Promise<void> {
  let fake = await createFakeApp()
  try {
    await run(fake)
  } finally {
    await fake.close()
  }
}

function get(fake: FakeApp, path: string, headers?: HeadersInit): Promise<Response> {
  return fake.fetch(new Request(new URL(path, appOrigin()), { headers }))
}

function control(fake: FakeApp, path: string, fields: Record<string, string> = {}) {
  return fake.fetch(
    new Request(new URL(`/_fake${path}`, appOrigin()), {
      body: new URLSearchParams(fields),
      method: 'POST',
    }),
  )
}

function articleForm(name: string): URLSearchParams {
  let body = new URLSearchParams({ formKey: crypto.randomUUID(), intent: 'create', name })
  body.append('author-name', 'Ondřej Beneš')
  body.append('author-email', 'ondrej.benes@external.test')
  return body
}

function pathOf(address: string): string {
  return new URL(address).pathname
}

describe('the fake app (pnpm app:fake)', () => {
  it('seeds an issue and an article whose pages open, and leads to them from /_fake', () =>
    withFakeApp(async (fake) => {
      let addresses = await fake.addresses()
      assert.equal((await get(fake, pathOf(addresses.article))).status, 200)
      assert.equal((await get(fake, pathOf(addresses.artworks))).status, 200)
      assert.equal(fake.app.mail.length, 1)
      assert.equal(fake.app.mail[0]?.to, 'tereza.vlkova@external.test')

      let toArticle = await get(fake, '/_fake/article')
      assert.equal(toArticle.status, 303)
      assert.equal(toArticle.headers.get('Location'), addresses.article)
      let toArtworks = await get(fake, '/_fake/artworks')
      assert.equal(toArtworks.headers.get('Location'), addresses.artworks)

      let controls = await get(fake, '/_fake')
      assert.equal(controls.status, 200)
      assert.ok((await controls.text()).includes(pathOf(addresses.article)))
    }))

  it('renews the article link: the old key answers 410, the new one the page', () =>
    withFakeApp(async (fake) => {
      let before = pathOf((await fake.addresses()).article)
      assert.equal((await control(fake, '/link/renew')).status, 303)
      let after = pathOf((await fake.addresses()).article)

      assert.notEqual(after, before)
      assert.equal((await get(fake, before)).status, 410)
      assert.equal((await get(fake, after)).status, 200)
    }))

  it('fails a Drive step until healed', () =>
    withFakeApp(async (fake) => {
      let path = pathOf((await fake.addresses()).article)
      let visitor = fake.app.browser()
      let form = articleForm('Nový park u nádraží')

      await control(fake, '/drive/fail', { step: 'copy' })
      let refused = await visitor.send(path, form)
      assert.equal(refused.status, 409)
      assert.ok(textOf(await refused.text()).includes('Zkuste článek vytvořit za chvíli znovu.'))

      await control(fake, '/drive/heal')
      let created = await visitor.send(path, form)
      assert.equal(created.status, 200)
      assert.ok((await created.text()).includes('Nový park u nádraží'))
    }))

  it('trashes and restores the issue’s Články folder', () =>
    withFakeApp(async (fake) => {
      let path = pathOf((await fake.addresses()).article)
      let warning = 'Z tohoto odkazu teď nejde založit článek.'

      await control(fake, '/folder/trash')
      assert.ok(textOf(await (await get(fake, path)).text()).includes(warning))
      await control(fake, '/folder/restore')
      assert.ok(!textOf(await (await get(fake, path)).text()).includes(warning))
    }))

  it('makes the Mailer fail and keeps what it was handed', () =>
    withFakeApp(async (fake) => {
      let path = pathOf((await fake.addresses()).article)
      await control(fake, '/mail/fail')
      let created = await fake.app.browser().send(path, articleForm('Nový park u nádraží'))

      assert.equal(created.status, 200)
      assert.equal(fake.app.mail.length, 2)
    }))

  it('signs the browser in as the editor', () =>
    withFakeApp(async (fake) => {
      let signedIn = await control(fake, '/sign-in')
      assert.equal(signedIn.status, 303)
      let [cookie = ''] = (signedIn.headers.get('Set-Cookie') ?? '').split(';')

      let overview = await get(fake, '/', { Cookie: cookie })
      assert.equal(overview.status, 200)
      assert.ok((await overview.text()).includes('VDM_2026_6'))
    }))

  it('refuses a step it does not know and never hands /_fake to the app', () =>
    withFakeApp(async (fake) => {
      assert.equal((await control(fake, '/drive/fail', { step: 'everything' })).status, 400)
      assert.equal((await control(fake, '/nothing')).status, 404)
      assert.equal((await get(fake, '/_fake/nothing')).status, 404)
      let bare = new Request(new URL('/_fake/drive/heal', appOrigin()), { method: 'POST' })
      assert.equal((await fake.fetch(bare)).status, 303)
      let calls = fake.app.drive.calls.length
      await control(fake, '/drive/down')
      assert.equal(fake.app.drive.calls.length, calls)
    }))
})
