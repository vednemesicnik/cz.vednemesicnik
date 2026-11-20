import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { createSignedInUntilCookie } from '../../auth/session.server.ts'
import { stamp } from '../../domain/time.ts'
import { createTestApp, seedAdmin } from '../../test-app.server.ts'

function locationOf(response: Response): URL {
  return new URL(response.headers.get('Location') ?? '', 'http://localhost')
}

/** The text of the page's Callout, or `null` when it has none. */
function calloutOf(html: string): { isError: boolean; text: string } | null {
  let match = /<div class="(vdm-callout[^"]*)">(.*?)<\/div>/s.exec(html)
  if (match === null) return null
  let text = (match[2] ?? '').replace(/<[^>]+>/g, '').trim()
  return { isError: (match[1] ?? '').includes('vdm-callout--error'), text }
}

describe('sign-in page', () => {
  it('draws 10a: the card, the one way in and the hint, nothing under the title', async () => {
    let app = await createTestApp()
    try {
      let response = await app.browser().get('/sign-in?redirectTo=%2Fsettings')
      let html = await response.text()

      assert.equal(response.status, 200)
      assert.ok(html.includes('class="vdm-signin vdm-signin--wordmark"'))
      assert.ok(html.includes('<h1 class="vdm-signin__title">Přihlášení do Publikace</h1>'))
      assert.ok(
        /href="\/sign-in\/google\?redirectTo=%2Fsettings"[^>]*>Přihlásit se přes Google<\/a>/.test(
          html,
        ),
      )
      assert.ok(html.includes('S účtem @vednemesicnik.test, který má přístup do Publikace.'))
      // The client runtime must leave the way to Google to the browser.
      assert.ok(/<a [^>]*data-rmx-document[^>]*>Přihlásit se přes Google<\/a>/.test(html))
      assert.equal(calloutOf(html), null)
      assert.ok(!html.includes('vdm-signin__text'), 'no sentence under the title')
    } finally {
      await app.close()
    }
  })

  it('says each refusal in the words of 10a, expiry as information', async () => {
    let app = await createTestApp()
    try {
      let browser = app.browser()
      let messages: Record<string, { isError: boolean; text: string }> = {
        domain: {
          isError: true,
          text: 'Vyberte účet Google s adresou @vednemesicnik.test — jinou adresou se přihlásit nelze.',
        },
        expired: {
          isError: false,
          text: 'Přihlášení vypršelo. Přihlaste se znovu a pokračujte tam, kde jste skončili.',
        },
        oauth: { isError: true, text: 'Zkuste přihlášení přes Google znovu.' },
        unavailable: {
          isError: true,
          text: 'Zkuste se přihlásit za chvíli znovu. Přístup se teď nepodařilo ověřit.',
        },
      }

      for (let [error, expected] of Object.entries(messages)) {
        let html = await (await browser.get(`/sign-in?error=${error}`)).text()
        assert.deepEqual(calloutOf(html), expected)
      }
      assert.equal(calloutOf(await (await browser.get('/sign-in?error=whatever')).text()), null)
    } finally {
      await app.close()
    }
  })

  it('sends somebody already signed in where they were going', async () => {
    let app = await createTestApp()
    try {
      await seedAdmin(app, 'marie@vednemesicnik.test')
      let browser = app.browser()
      await browser.signInAs('marie@vednemesicnik.test')

      let response = await browser.get('/sign-in?redirectTo=%2Fsettings')
      assert.equal(response.status, 303)
      assert.equal(locationOf(response).pathname, '/settings')
      for (let foreign of [
        '//external.test',
        '/\\external.test',
        '/\\/external.test',
        '/\texternal.test',
        'https://external.test',
        '/..//external.test',
        '/.//external.test',
        '/a/..//external.test',
        '/%2e%2e//external.test',
      ]) {
        let response = await browser.get(`/sign-in?redirectTo=${encodeURIComponent(foreign)}`)
        assert.equal(locationOf(response).href, 'http://localhost/', foreign)
      }
    } finally {
      await app.close()
    }
  })

  it('starts Google with the account chooser and the domain as a hint', async () => {
    let app = await createTestApp()
    process.env.GOOGLE_CLIENT_ID = 'test-client'
    process.env.GOOGLE_CLIENT_SECRET = 'test-secret'
    try {
      let response = await app.browser().get('/sign-in/google?redirectTo=%2Fsettings')
      let location = locationOf(response)

      assert.equal(response.status, 302)
      assert.equal(location.host, 'accounts.google.com')
      assert.equal(location.searchParams.get('prompt'), 'select_account')
      assert.equal(location.searchParams.get('hd'), 'vednemesicnik.test')
      assert.equal(
        location.searchParams.get('redirect_uri'),
        'http://localhost:44100/sign-in/google/callback',
      )
    } finally {
      delete process.env.GOOGLE_CLIENT_ID
      delete process.env.GOOGLE_CLIENT_SECRET
      await app.close()
    }
  })
})

describe('expiry', () => {
  it('tells an expired sign-in from a first visit and from one ended early', async () => {
    let app = await createTestApp()
    try {
      let marker = createSignedInUntilCookie()
      let browser = app.browser()

      browser.setCookie(
        await marker.serialize(stamp(Temporal.Now.instant().subtract({ hours: 1 }))),
      )
      let expired = locationOf(await browser.get('/settings'))
      assert.equal(expired.searchParams.get('error'), 'expired')
      assert.equal(expired.searchParams.get('redirectTo'), '/settings')
      // Said once.
      assert.equal(locationOf(await browser.get('/settings')).searchParams.get('error'), null)

      browser.setCookie(await marker.serialize(stamp(Temporal.Now.instant().add({ hours: 1 }))))
      assert.equal(locationOf(await browser.get('/settings')).searchParams.get('error'), null)
    } finally {
      await app.close()
    }
  })

  it('brings a form sent after expiry back to the page it was sent from', async () => {
    let app = await createTestApp()
    try {
      await seedAdmin(app, 'marie@vednemesicnik.test')
      let browser = app.browser()
      await browser.signInAs('marie@vednemesicnik.test')
      let token = /name="_csrf" type="hidden" value="([^"]+)"/.exec(
        await (await browser.get('/settings')).text(),
      )?.[1]
      assert.ok(token !== undefined)

      // The page keeps its token, but the session behind it, token and all, has expired.
      await app.database.exec(sql`UPDATE sessions SET expires_at = ${'2000-01-01T00:00:00.000Z'}`)
      browser.setCookie(
        await createSignedInUntilCookie().serialize(
          stamp(Temporal.Now.instant().subtract({ hours: 1 })),
        ),
      )

      let response = await browser.post(
        '/settings/access',
        { _csrf: token, email: 'eva@vednemesicnik.test', kind: 'account' },
        '/settings?x=1',
      )
      assert.equal(response.status, 303)
      assert.equal(locationOf(response).pathname, '/sign-in')
      assert.equal(locationOf(response).searchParams.get('error'), 'expired')
      assert.equal(locationOf(response).searchParams.get('redirectTo'), '/settings?x=1')
    } finally {
      await app.close()
    }
  })
})

describe('the ten-minute check', () => {
  it('refreshes a group’s name whenever the service names it', async () => {
    let app = await createTestApp()
    try {
      await seedAdmin(app, 'marie@vednemesicnik.test')
      await app.directory.addGroup(
        'marie@vednemesicnik.test',
        'vybor@vednemesicnik.test',
        'Výbor redakce',
        Temporal.Now.instant(),
      )
      app.setMembership('vybor@vednemesicnik.test', () => ({
        displayName: null,
        groupName: 'Výbor redakce 2026',
        status: 'member',
      }))
      let browser = app.browser()
      await browser.signInAs('jan@vednemesicnik.test', 'Jan Novák', 0)
      assert.equal((await browser.get('/')).status, 200)
      assert.equal((await app.directory.listGroups())[0]?.name, 'Výbor redakce 2026')

      // An answer without a name keeps the one already stored.
      app.setMembership('vybor@vednemesicnik.test', () => ({
        displayName: null,
        groupName: null,
        status: 'member',
      }))
      await browser.get('/')
      assert.equal((await app.directory.listGroups())[0]?.name, 'Výbor redakce 2026')
    } finally {
      await app.close()
    }
  })

  it('signs out a member dropped from the group, keeping the address for the message', async () => {
    let app = await createTestApp()
    try {
      await seedAdmin(app, 'marie@vednemesicnik.test')
      await app.directory.addGroup(
        'marie@vednemesicnik.test',
        'vybor@vednemesicnik.test',
        null,
        Temporal.Now.instant(),
      )
      app.setMembership('vybor@vednemesicnik.test', () => ({
        groupName: null,
        status: 'not-member',
      }))
      let browser = app.browser()
      await browser.signInAs('jan@vednemesicnik.test', 'Jan Novák', 0)

      let refused = locationOf(await browser.get('/'))
      assert.equal(refused.searchParams.get('error'), 'notlisted')

      let html = await (await browser.get(refused.pathname + refused.search)).text()
      assert.equal(
        calloutOf(html)?.text,
        'Požádejte šéfredakci o kontakt na správce Publikace. Účet jan@vednemesicnik.test nemá přístup.',
      )
      app.setMembership('vybor@vednemesicnik.test', () => ({
        displayName: null,
        groupName: null,
        status: 'member',
      }))
      assert.equal((await browser.get('/')).status, 303, 'the sign-in is gone, not paused')
    } finally {
      await app.close()
    }
  })

  it('refuses while the service is down, and remembers nothing', async () => {
    let app = await createTestApp()
    try {
      await seedAdmin(app, 'marie@vednemesicnik.test')
      await app.directory.addGroup(
        'marie@vednemesicnik.test',
        'vybor@vednemesicnik.test',
        null,
        Temporal.Now.instant(),
      )
      app.setMembership('vybor@vednemesicnik.test', () => ({ status: 'unavailable' }))
      let browser = app.browser()
      await browser.signInAs('jan@vednemesicnik.test', 'Jan Novák', 0)

      assert.equal(locationOf(await browser.get('/')).searchParams.get('error'), 'unavailable')

      app.setMembership('vybor@vednemesicnik.test', () => ({
        displayName: 'Jan Novák',
        groupName: null,
        status: 'member',
      }))
      assert.equal((await browser.get('/')).status, 200)
    } finally {
      await app.close()
    }
  })

  it('lets a named account through without the service', async () => {
    let app = await createTestApp()
    try {
      await seedAdmin(app, 'marie@vednemesicnik.test')
      let browser = app.browser()
      await browser.signInAs('marie@vednemesicnik.test', 'Marie Horáková', 0)

      assert.equal((await browser.get('/')).status, 200)
    } finally {
      await app.close()
    }
  })
})

describe('sign-out', () => {
  it('leaves with POST and lands on 10b with the time', async () => {
    let app = await createTestApp()
    try {
      await seedAdmin(app, 'marie@vednemesicnik.test')
      let browser = app.browser()
      await browser.signInAs('marie@vednemesicnik.test')
      let before = browser.cookie('publikace_session')

      let response = await browser.post('/sign-out', {}, '/')
      assert.equal(response.status, 303)
      assert.equal(response.headers.get('Location'), '/sign-in?signed-out=1')
      assert.notEqual(browser.cookie('publikace_session'), before, 'the id is rotated')

      let html = await (await browser.get('/sign-in?signed-out=1')).text()
      assert.ok(html.includes('<h1 class="vdm-signin__title">Jste odhlášeni</h1>'))
      assert.ok(
        /Odhlášeno ve? \d{1,2}:\d{2}\. Na sdíleném počítači se ještě odhlaste z účtu Google\./.test(
          html,
        ),
      )
      assert.ok(/<a [^>]*href="\/sign-in\/google"[^>]*>Přihlásit se znovu<\/a>/.test(html))
      assert.ok(
        /<a [^>]*href="https:\/\/accounts.google.com\/Logout"[^>]*>Odhlásit i účet Google<\/a>/.test(
          html,
        ),
      )

      // A reload keeps the state and loses the time.
      let again = await (await browser.get('/sign-in?signed-out=1')).text()
      assert.ok(again.includes('<p class="vdm-signin__text">Na sdíleném počítači'))
      assert.equal((await browser.get('/')).status, 303)
    } finally {
      await app.close()
    }
  })

  it('refuses a form sent without the token', async () => {
    let app = await createTestApp()
    try {
      await seedAdmin(app, 'marie@vednemesicnik.test')
      let browser = app.browser()
      await browser.signInAs('marie@vednemesicnik.test')

      let response = await browser.post('/sign-out', { _csrf: 'forged' }, '/')
      assert.equal(response.status, 403)
      assert.equal((await browser.get('/')).status, 200)
    } finally {
      await app.close()
    }
  })
})
