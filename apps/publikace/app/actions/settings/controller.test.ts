import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { now } from '../../domain/time.ts'
import {
  connectDriveAccount,
  createTestApp,
  seedAdmin,
  type TestApp,
} from '../../test-app.server.ts'

/** Marie administers; Jakub and Eva are named accounts, Jakub has signed in. */
async function editorialBoard(): Promise<TestApp> {
  let app = await createTestApp()
  await seedAdmin(app, 'marie@priklad.cz')
  await app.directory.recordSignIn('marie@priklad.cz', 'Marie Horáková', now())
  await app.directory.addAccount('marie@priklad.cz', 'jakub@priklad.cz', now())
  await app.directory.recordSignIn('jakub@priklad.cz', 'Jakub Novák', now())
  await app.directory.addAccount('marie@priklad.cz', 'eva@priklad.cz', now())
  return app
}

function textOf(html: string): string {
  return html
    .replace(/<wbr\s*\/?>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ ([.,)])/g, '$1')
}

async function idOf(app: TestApp, email: string): Promise<number> {
  let account = (await app.directory.listAccounts()).find((candidate) => candidate.email === email)
  return account?.id ?? 0
}

describe('settings, Přístup', () => {
  it('shows an administrator the lists, the menus and the add form (14a)', async () => {
    let app = await editorialBoard()
    try {
      await app.directory.addGroup('marie@priklad.cz', 'vybor@priklad.cz', now())
      let browser = app.browser()
      await browser.signInAs('marie@priklad.cz', 'Marie Horáková')
      let html = await (await browser.get('/settings')).text()
      let text = textOf(html)

      assert.ok(
        text.includes('Přihlásit se mohou účty @priklad.cz přidané jmenovitě nebo přes skupinu.'),
      )
      assert.ok(text.includes('Skupiny Google'))
      assert.ok(text.includes('členství se ověřuje při přihlášení a pak každých 10 minut'))
      assert.ok(text.includes('Marie Horáková (vy)'))
      assert.ok(text.includes('jakub@priklad.cz · poslední přihlášení dnes'))
      assert.ok(/eva@priklad\.cz účet přidán \d+\. \d+\. \d{4} · zatím bez přihlášení/.test(text))
      assert.ok(html.includes('aria-label="Další akce Jakub Novák"'))
      assert.ok(html.includes('aria-label="Další akce eva@priklad.cz"'))
      assert.ok(
        !html.includes('aria-label="Další akce Marie Horáková"'),
        'no menu on one’s own row',
      )
      assert.ok(text.includes('Nastavit jako správce'))
      assert.ok(html.includes('Jen adresa @priklad.cz. Pozvánka se neposílá.'))
      assert.ok(html.includes('Skupina Google na doméně priklad.cz.'))
      // A whole page after adding, so the field comes back empty and focus lands where it should.
      assert.ok(/<form [^>]*action="\/settings\/access"[^>]*data-rmx-document/.test(html))
      assert.ok(/<a [^>]*data-rmx-document[^>]*>Odebrat…<\/a>/.test(html))
    } finally {
      await app.close()
    }
  })

  it('shows everybody else Přístup read-only, with who changes it (14b)', async () => {
    let app = await editorialBoard()
    try {
      let browser = app.browser()
      await browser.signInAs('eva@priklad.cz')
      let html = await (await browser.get('/settings')).text()
      let text = textOf(html)

      assert.ok(text.includes('Přístup mění správce: Marie Horáková.'))
      assert.ok(text.includes('Účty · 3'))
      assert.ok(!html.includes('name="email"'), 'no field')
      assert.ok(!html.includes('Další akce'), 'no menu')
    } finally {
      await app.close()
    }
  })

  it('adds an account and says so on the next page', async () => {
    let app = await editorialBoard()
    try {
      let browser = app.browser()
      await browser.signInAs('marie@priklad.cz', 'Marie Horáková')

      let response = await browser.post('/settings/access', {
        email: ' Jan@Priklad.cz ',
        kind: 'account',
      })
      assert.equal(response.status, 303)
      assert.equal(response.headers.get('Location'), '/settings')

      let html = await (await browser.get('/settings')).text()
      assert.ok(/<div[^>]*role="status"[^>]*>.*jan@priklad\.cz má přístup\./s.test(html))
      assert.ok(
        !(await (await browser.get('/settings')).text()).includes('má přístup.</span>'),
        'said once',
      )
    } finally {
      await app.close()
    }
  })

  it('keeps what was typed and says what is wrong with it', async () => {
    let app = await editorialBoard()
    try {
      let browser = app.browser()
      await browser.signInAs('marie@priklad.cz', 'Marie Horáková')

      let duplicate = await browser.post('/settings/access', {
        email: 'eva@priklad.cz',
        kind: 'account',
      })
      let duplicateHtml = await duplicate.text()
      assert.equal(duplicate.status, 400)
      assert.ok(duplicateHtml.includes('Účet eva@priklad.cz už je přidaný.'))
      assert.ok(duplicateHtml.includes('value="eva@priklad.cz"'))
      assert.ok(
        /<input [^>]*autofocus[^>]*id="access-email"|<input [^>]*id="access-email"[^>]*autofocus/.test(
          duplicateHtml,
        ),
      )

      let elsewhere = await (
        await browser.post('/settings/access', { email: 'vybor@jinde.cz', kind: 'group' })
      ).text()
      assert.ok(elsewhere.includes('Zadejte adresu skupiny na doméně priklad.cz.'))
      assert.ok(
        /<input checked[^>]*value="group"/.test(elsewhere) ||
          /value="group"[^>]*checked/.test(elsewhere),
      )
    } finally {
      await app.close()
    }
  })

  it('asks the membership service before a group is added', async () => {
    let app = await editorialBoard()
    try {
      let browser = app.browser()
      await browser.signInAs('marie@priklad.cz', 'Marie Horáková')

      let unknown = await (
        await browser.post('/settings/access', { email: 'vybor@priklad.cz', kind: 'group' })
      ).text()
      assert.ok(
        unknown.includes(
          'Požádejte člověka, který spravuje Google Workspace, o povolení skupiny vybor@priklad.cz pro ověřování členství.',
        ),
      )

      app.setMembership('vybor@priklad.cz', () => ({ status: 'unavailable' }))
      let down = await (
        await browser.post('/settings/access', { email: 'vybor@priklad.cz', kind: 'group' })
      ).text()
      assert.ok(down.includes('Zkuste skupinu přidat za chvíli znovu. Členství teď nelze ověřit.'))
      assert.equal((await app.directory.listGroups()).length, 0)

      app.setMembership('vybor@priklad.cz', () => ({ status: 'not-member' }))
      let added = await browser.post('/settings/access', {
        email: 'vybor@priklad.cz',
        kind: 'group',
      })
      assert.equal(added.status, 303)
      let html = await (await browser.get('/settings')).text()
      assert.ok(html.includes('Členové skupiny vybor@priklad.cz mají přístup.'))
    } finally {
      await app.close()
    }
  })

  it('refuses a change from a page opened before the role was taken away (14b)', async () => {
    let app = await editorialBoard()
    try {
      let jakub = await idOf(app, 'jakub@priklad.cz')
      await app.directory.setAdmin('marie@priklad.cz', jakub, true)
      let browser = app.browser()
      await browser.signInAs('jakub@priklad.cz', 'Jakub Novák')
      let token =
        /name="_csrf" type="hidden" value="([^"]+)"/.exec(
          await (await browser.get('/settings')).text(),
        )?.[1] ?? ''

      await app.directory.setAdmin('marie@priklad.cz', jakub, false)
      let response = await browser.post('/settings/access', {
        _csrf: token,
        email: 'jan@priklad.cz',
        kind: 'account',
      })
      let text = textOf(await response.text())

      assert.equal(response.status, 403)
      assert.ok(
        text.includes(
          'Obraťte se na správce uvedeného níže. Změna se neuložila, protože už nemáte roli správce. Přístup mění správce: Marie Horáková.',
        ),
      )
      assert.equal(await app.directory.findAccount('jan@priklad.cz'), null)
    } finally {
      await app.close()
    }
  })

  it('makes and unmakes an administrator from the menu', async () => {
    let app = await editorialBoard()
    try {
      let browser = app.browser()
      await browser.signInAs('marie@priklad.cz', 'Marie Horáková')
      let eva = await idOf(app, 'eva@priklad.cz')

      assert.equal(
        (await browser.post(`/settings/access/accounts/${eva}/admin`, { isAdmin: '1' })).status,
        303,
      )
      assert.equal((await app.directory.findAccount('eva@priklad.cz'))?.isAdmin, true)
      await browser.post(`/settings/access/accounts/${eva}/admin`, { isAdmin: '0' })
      assert.equal((await app.directory.findAccount('eva@priklad.cz'))?.isAdmin, false)
    } finally {
      await app.close()
    }
  })

  it('asks before removing an account, then signs it out everywhere', async () => {
    let app = await editorialBoard()
    try {
      let browser = app.browser()
      await browser.signInAs('marie@priklad.cz', 'Marie Horáková')
      let jakubsBrowser = app.browser()
      await jakubsBrowser.signInAs('jakub@priklad.cz', 'Jakub Novák')
      let jakub = await idOf(app, 'jakub@priklad.cz')

      let question = await (await browser.get(`/settings/access/accounts/${jakub}/remove`)).text()
      assert.ok(/<h2 [^>]*class="vdm-dialog__title"[^>]*>Odebrat účet\?<\/h2>/.test(question))
      assert.ok(textOf(question).includes('Účet bude odhlášen ze všech zařízení.'))
      // Nothing behind the question can be reached while it is asked.
      assert.ok(/<div inert[^>]*>\s*<aside aria-label="Panel aplikace"/.test(question))
      assert.ok(!/<div inert/.test(await (await browser.get('/settings')).text()))

      let marie = await idOf(app, 'marie@priklad.cz')
      assert.equal(
        (await browser.get(`/settings/access/accounts/${marie}/remove`)).status,
        303,
        'never oneself',
      )

      let response = await browser.post(
        `/settings/access/accounts/${jakub}/remove`,
        {},
        `/settings/access/accounts/${jakub}/remove`,
      )
      assert.equal(response.status, 303)
      assert.equal(await app.directory.findAccount('jakub@priklad.cz'), null)
      let left = await app.database.exec(
        sql`SELECT COUNT(*) AS n FROM sessions WHERE email = ${'jakub@priklad.cz'}`,
      )
      assert.deepEqual(left.rows, [{ n: 0 }])
      assert.equal((await jakubsBrowser.get('/')).status, 303)
    } finally {
      await app.close()
    }
  })

  it('asks before removing a group, by its address', async () => {
    let app = await editorialBoard()
    try {
      await app.directory.addGroup('marie@priklad.cz', 'vybor@priklad.cz', now())
      let group = (await app.directory.listGroups())[0]?.id ?? 0
      let browser = app.browser()
      await browser.signInAs('marie@priklad.cz', 'Marie Horáková')

      let question = textOf(
        await (await browser.get(`/settings/access/groups/${group}/remove`)).text(),
      )
      assert.ok(
        question.includes(
          'Odebrat skupinu? vybor@priklad.cz Členové skupiny přijdou o přístup nejpozději za 10 minut',
        ),
      )

      await browser.post(
        `/settings/access/groups/${group}/remove`,
        {},
        `/settings/access/groups/${group}/remove`,
      )
      assert.equal((await app.directory.listGroups()).length, 0)
    } finally {
      await app.close()
    }
  })
})

describe('settings, Účty Publikace', () => {
  it('shows every editor-in-chief the account never connected, with the way to connect (14g)', async () => {
    let app = await editorialBoard()
    try {
      let browser = app.browser()
      await browser.signInAs('jakub@priklad.cz', 'Jakub Novák')
      let html = await (await browser.get('/settings')).text()
      let text = textOf(html)

      assert.ok(html.includes('id="accounts"'))
      assert.ok(text.includes('Účty Publikace'))
      assert.ok(html.includes('vdm-status--pending'))
      assert.ok(text.includes('Nepřipojeno'))
      assert.ok(
        text.includes(
          'Připojte účet, aby aplikace mohla zakládat vydání a pracovat se soubory na Disku.',
        ),
      )
      // A whole page: the answer is a redirect to Google, which a fetch could not follow.
      assert.ok(
        /<form [^>]*action="\/settings\/account\/connect"[^>]*data-rmx-document[^>]*method="post"/.test(
          html,
        ),
      )
      assert.ok(text.includes('Připojit účet'))
      assert.ok(
        text.includes(
          'V Googlu vyberte účet publikace.app@priklad.cz a povolte aplikaci pracovat se soubory na Disku.',
        ),
      )
      assert.ok(text.includes('publikace@ priklad.cz'), 'the mailbox, without a state')
      // The banner, with the action that jumps to the card on the page it is already on.
      assert.ok(html.includes('vdm-callout--warning'))
      assert.ok(text.includes('Přejít k účtu'))
      assert.ok(html.includes('href="#accounts"'))
    } finally {
      await app.close()
    }
  })

  it('shows the connected account without a button and without a banner (14a)', async () => {
    let app = await editorialBoard()
    try {
      await connectDriveAccount(app)
      let browser = app.browser()
      await browser.signInAs('marie@priklad.cz', 'Marie Horáková')
      let html = await (await browser.get('/settings')).text()
      let text = textOf(html)

      assert.ok(html.includes('vdm-status--published'))
      assert.ok(text.includes('Připojeno'))
      assert.ok(text.includes('Pod tímto účtem běží úlohy na pozadí.'))
      assert.ok(!html.includes('/settings/account/connect'))
      assert.ok(!text.includes('Přejít k účtu'))
    } finally {
      await app.close()
    }
  })

  it('shows the disconnected account with Připojit znovu and the error banner (14c)', async () => {
    let app = await editorialBoard()
    try {
      await connectDriveAccount(app)
      await app.driveAccount.markDisconnected(now())
      let browser = app.browser()
      await browser.signInAs('marie@priklad.cz', 'Marie Horáková')
      let html = await (await browser.get('/settings')).text()
      let text = textOf(html)

      assert.ok(html.includes('vdm-status--problem'))
      assert.ok(text.includes('Odpojeno'))
      assert.ok(
        text.includes('Připojte účet znovu, aby aplikace mohla pracovat se soubory na Disku.'),
      )
      assert.ok(text.includes('Připojit znovu'))
      assert.ok(html.includes('vdm-callout--error'))
      assert.ok(
        text.includes(
          'Účet publikace.app@ je odpojený. Akce se soubory na Disku teď nejsou dostupné.',
        ),
      )
    } finally {
      await app.close()
    }
  })
})
