import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { stylesheetHref } from '../assets.ts'
import { connectDriveAccount, createTestApp, seedAdmin } from '../test-app.server.ts'

describe('home', () => {
  it('sends an anonymous visitor to the sign-in page, remembering where they were headed', async () => {
    let app = await createTestApp()
    try {
      let response = await app.browser().get('/?state=all')

      assert.equal(response.status, 303)
      let location = new URL(response.headers.get('Location') ?? '', 'http://localhost')
      assert.equal(location.pathname, '/sign-in')
      assert.equal(location.searchParams.get('redirectTo'), '/?state=all')
      assert.equal(location.searchParams.get('error'), null)
    } finally {
      await app.close()
    }
  })

  it('answers with the editors-in-chief layout in Czech', async () => {
    let app = await createTestApp()
    try {
      await seedAdmin(app, 'marie@vednemesicnik.test')
      let browser = app.browser()
      await browser.signInAs('marie@vednemesicnik.test', 'Marie Horáková')
      let response = await browser.get('/')
      let html = await response.text()

      assert.equal(response.status, 200)
      assert.match(response.headers.get('Content-Type') ?? '', /text\/html/)
      assert.match(html, /<html lang="cs">/)
      assert.match(html, /<title>Vydání · Publikace<\/title>/)
      assert.match(html, /<h1[^>]*>Vydání<\/h1>/)
      assert.ok(html.includes(`<link rel="stylesheet" href="${stylesheetHref}" />`))
    } finally {
      await app.close()
    }
  })

  it('draws the panel with Vydání current, Nastavení, and the signed-in person in the foot', async () => {
    let app = await createTestApp()
    try {
      await seedAdmin(app, 'marie@vednemesicnik.test')
      let browser = app.browser()
      await browser.signInAs('marie@vednemesicnik.test', 'Marie Horáková')
      let html = await (await browser.get('/')).text()

      assert.match(html, /<aside aria-label="Panel aplikace" class="vdm-sidebar">/)
      // Attribute order is the renderer's business, so the link is found first and read after.
      let issues = /<a [^>]*>Vydání<\/a>/.exec(html)?.[0] ?? ''
      assert.match(issues, /aria-current="page"/)
      assert.match(issues, /href="\/"/)
      let settings = /<a [^>]*>Nastavení<\/a>/.exec(html)?.[0] ?? ''
      assert.match(settings, /href="\/settings"/)
      assert.doesNotMatch(settings, /aria-current/)

      assert.match(html, /<span class="vdm-sidebar__username">Marie Horáková<\/span>/)
      assert.match(html, /<span class="vdm-sidebar__role">marie@vednemesicnik.test<\/span>/)
      assert.match(html, />MH<\/span>/)
      // Leaving is a form sent with POST, never a link.
      let form = /<form [^>]*class="vdm-sidebar__form"[^>]*>.*?<\/form>/s.exec(html)?.[0] ?? ''
      assert.ok(form.includes('action="/sign-out"'), 'the form posts to /sign-out')
      assert.ok(form.includes('method="post"'), 'the form is sent with POST')
      assert.ok(form.includes('name="_csrf"'), 'the form carries the CSRF token')
      assert.ok(/<button [^>]*type="submit"[^>]*>Odhlásit se<\/button>/.test(form))
      assert.ok(!/<a [^>]*>Odhlásit se<\/a>/.test(html), 'no link signs out')
    } finally {
      await app.close()
    }
  })
})

describe('home, the banner of the Drive account', () => {
  it('warns while publikace.app@ was never connected and leads to the card (14g)', async () => {
    let app = await createTestApp()
    try {
      await seedAdmin(app, 'marie@vednemesicnik.test')
      let browser = app.browser()
      await browser.signInAs('marie@vednemesicnik.test')
      let html = await (await browser.get('/')).text()

      assert.ok(html.includes('vdm-callout--warning'))
      assert.ok(
        html.includes(
          'Připojte účet publikace.app@. Bez připojení nejde zakládat vydání ani pracovat se soubory na Disku.',
        ),
      )
      assert.ok(html.includes('href="/settings#accounts"'))
      assert.ok(html.includes('Do Nastavení'))
    } finally {
      await app.close()
    }
  })

  it('says the account is disconnected, and says nothing once it is connected', async () => {
    let app = await createTestApp()
    try {
      await seedAdmin(app, 'marie@vednemesicnik.test')
      await connectDriveAccount(app)
      let browser = app.browser()
      await browser.signInAs('marie@vednemesicnik.test')

      let connected = await (await browser.get('/')).text()
      assert.ok(!connected.includes('vdm-callout'))

      await app.driveAccount.markDisconnected(Temporal.Now.instant())
      let disconnected = await (await browser.get('/')).text()
      assert.ok(disconnected.includes('vdm-callout--error'))
      assert.ok(disconnected.includes('Účet publikace.app@ je odpojený.'))
    } finally {
      await app.close()
    }
  })
})
