import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { now } from '../../domain/time.ts'
import {
  connectDriveAccount,
  createTestApp,
  seedAdmin,
  TEST_ISSUES_FOLDER,
  TEST_REGISTRY,
  TEST_TEMPLATE,
  type TestApp,
} from '../../test-app.server.ts'

/** Marie administers; Jakub and Eva are named accounts, Jakub has signed in. */
async function editorialBoard(): Promise<TestApp> {
  let app = await createTestApp()
  await seedAdmin(app, 'marie@vednemesicnik.test')
  await app.directory.recordSignIn('marie@vednemesicnik.test', 'Marie Horáková', now())
  await app.directory.addAccount('marie@vednemesicnik.test', 'jakub@vednemesicnik.test', now())
  await app.directory.recordSignIn('jakub@vednemesicnik.test', 'Jakub Novák', now())
  await app.directory.addAccount('marie@vednemesicnik.test', 'eva@vednemesicnik.test', now())
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
      await app.directory.addGroup(
        'marie@vednemesicnik.test',
        'sefredakce@vednemesicnik.test',
        'Šéfredakce 2026',
        now(),
      )
      await app.directory.addGroup(
        'marie@vednemesicnik.test',
        'vybor@vednemesicnik.test',
        null,
        now(),
      )
      let browser = app.browser()
      await browser.signInAs('marie@vednemesicnik.test', 'Marie Horáková')
      let html = await (await browser.get('/settings')).text()
      let text = textOf(html)

      assert.ok(
        text.includes(
          'Přihlásit se mohou účty @vednemesicnik.test přidané jmenovitě nebo přes skupinu.',
        ),
      )
      assert.ok(
        text.includes(
          'Skupiny Google Členství se ověřuje při přihlášení. Dokud je člověk přihlášený, ověřuje se každých 10 minut.',
        ),
      )
      // A named group stands by its name with the address under it, the other by its address.
      assert.ok(text.includes('Šéfredakce 2026 sefredakce@vednemesicnik.test Odebrat'))
      assert.ok(text.includes('vybor@vednemesicnik.test Odebrat'))
      assert.ok(!text.includes('a pak každých 10 minut'))
      assert.ok(text.includes('Marie Horáková (vy)'))
      assert.ok(text.includes('jakub@vednemesicnik.test · poslední přihlášení dnes'))
      assert.ok(
        /eva@vednemesicnik\.test účet přidán \d+\. \d+\. \d{4} · zatím bez přihlášení/.test(text),
      )
      assert.ok(html.includes('aria-label="Další akce Jakub Novák"'))
      assert.ok(text.includes('Úlohy na pozadí Zobrazit úlohy'))
      assert.ok(text.includes('Odpovědi k obrazovým dílům · Zatím se neohlásila'))
      assert.ok(html.includes('href="/settings/jobs"'))
      assert.ok(html.includes('aria-label="Další akce eva@vednemesicnik.test"'))
      assert.ok(
        !html.includes('aria-label="Další akce Marie Horáková"'),
        'no menu on one’s own row',
      )
      assert.ok(text.includes('Nastavit jako správce'))
      assert.ok(html.includes('Jen adresa @vednemesicnik.test. Pozvánka se neposílá.'))
      assert.ok(html.includes('Skupina Google na doméně vednemesicnik.test.'))
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
      await app.directory.addGroup(
        'marie@vednemesicnik.test',
        'sefredakce@vednemesicnik.test',
        'Šéfredakce, 2026',
        now(),
      )
      await app.directory.addGroup(
        'marie@vednemesicnik.test',
        'vybor@vednemesicnik.test',
        null,
        now(),
      )
      let browser = app.browser()
      await browser.signInAs('eva@vednemesicnik.test')
      let html = await (await browser.get('/settings')).text()
      let text = textOf(html)

      assert.ok(text.includes('Přístup mění správce: Marie Horáková.'))
      // A group to a line, the name first: a comma in a name cannot run two groups together.
      assert.ok(
        text.includes(
          'Skupiny Šéfredakce, 2026 · sefredakce@vednemesicnik.test vybor@vednemesicnik.test',
        ),
      )
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
      await browser.signInAs('marie@vednemesicnik.test', 'Marie Horáková')

      let response = await browser.post('/settings/access', {
        email: ' Jan@Vednemesicnik.test ',
        kind: 'account',
      })
      assert.equal(response.status, 303)
      assert.equal(response.headers.get('Location'), '/settings')

      let html = await (await browser.get('/settings')).text()
      assert.ok(/<div[^>]*role="status"[^>]*>.*jan@vednemesicnik\.test má přístup\./s.test(html))
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
      await browser.signInAs('marie@vednemesicnik.test', 'Marie Horáková')

      let duplicate = await browser.post('/settings/access', {
        email: 'eva@vednemesicnik.test',
        kind: 'account',
      })
      let duplicateHtml = await duplicate.text()
      assert.equal(duplicate.status, 400)
      assert.ok(duplicateHtml.includes('Účet eva@vednemesicnik.test už je přidaný.'))
      assert.ok(duplicateHtml.includes('value="eva@vednemesicnik.test"'))
      assert.ok(
        /<input [^>]*autofocus[^>]*id="access-email"|<input [^>]*id="access-email"[^>]*autofocus/.test(
          duplicateHtml,
        ),
      )

      let elsewhere = await (
        await browser.post('/settings/access', { email: 'vybor@external.test', kind: 'group' })
      ).text()
      assert.ok(elsewhere.includes('Zadejte adresu skupiny na doméně vednemesicnik.test.'))
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
      await browser.signInAs('marie@vednemesicnik.test', 'Marie Horáková')

      let unknown = await (
        await browser.post('/settings/access', { email: 'vybor@vednemesicnik.test', kind: 'group' })
      ).text()
      assert.ok(
        unknown.includes(
          'Požádejte člověka, který spravuje Google Workspace, o\u00a0povolení skupiny vybor@vednemesicnik.test pro ověřování členství.',
        ),
      )

      app.setMembership('vybor@vednemesicnik.test', () => ({ status: 'unavailable' }))
      let down = await (
        await browser.post('/settings/access', { email: 'vybor@vednemesicnik.test', kind: 'group' })
      ).text()
      assert.ok(down.includes('Zkuste skupinu přidat za chvíli znovu. Členství teď nelze ověřit.'))
      assert.equal((await app.directory.listGroups()).length, 0)

      app.setMembership('vybor@vednemesicnik.test', () => ({
        groupName: null,
        status: 'not-member',
      }))
      let added = await browser.post('/settings/access', {
        email: 'vybor@vednemesicnik.test',
        kind: 'group',
      })
      assert.equal(added.status, 303)
      let html = await (await browser.get('/settings')).text()
      assert.ok(html.includes('Přidána skupina vybor@vednemesicnik.test.'))

      app.setMembership('sefredakce@vednemesicnik.test', () => ({
        groupName: 'Šéfredakce 2026',
        status: 'not-member',
      }))
      await browser.post('/settings/access', {
        email: 'sefredakce@vednemesicnik.test',
        kind: 'group',
      })
      let named = await (await browser.get('/settings')).text()
      assert.ok(named.includes('Přidána skupina „Šéfredakce 2026“.'))
      assert.deepEqual(
        (await app.directory.listGroups()).map((group) => [group.email, group.name]),
        [
          ['vybor@vednemesicnik.test', null],
          ['sefredakce@vednemesicnik.test', 'Šéfredakce 2026'],
        ],
      )
    } finally {
      await app.close()
    }
  })

  it('refuses a change from a page opened before the role was taken away (14b)', async () => {
    let app = await editorialBoard()
    try {
      let jakub = await idOf(app, 'jakub@vednemesicnik.test')
      await app.directory.setAdmin('marie@vednemesicnik.test', jakub, true)
      let browser = app.browser()
      await browser.signInAs('jakub@vednemesicnik.test', 'Jakub Novák')
      let token =
        /name="_csrf" type="hidden" value="([^"]+)"/.exec(
          await (await browser.get('/settings')).text(),
        )?.[1] ?? ''

      await app.directory.setAdmin('marie@vednemesicnik.test', jakub, false)
      let response = await browser.post('/settings/access', {
        _csrf: token,
        email: 'jan@vednemesicnik.test',
        kind: 'account',
      })
      let text = textOf(await response.text())

      assert.equal(response.status, 403)
      assert.ok(
        text.includes(
          'Obraťte se na správce uvedeného níže. Změna se neuložila, protože už nemáte roli správce. Přístup mění správce: Marie Horáková.',
        ),
      )
      assert.equal(await app.directory.findAccount('jan@vednemesicnik.test'), null)
    } finally {
      await app.close()
    }
  })

  it('makes and unmakes an administrator from the menu', async () => {
    let app = await editorialBoard()
    try {
      let browser = app.browser()
      await browser.signInAs('marie@vednemesicnik.test', 'Marie Horáková')
      let eva = await idOf(app, 'eva@vednemesicnik.test')

      assert.equal(
        (await browser.post(`/settings/access/accounts/${eva}/admin`, { isAdmin: '1' })).status,
        303,
      )
      assert.equal((await app.directory.findAccount('eva@vednemesicnik.test'))?.isAdmin, true)
      await browser.post(`/settings/access/accounts/${eva}/admin`, { isAdmin: '0' })
      assert.equal((await app.directory.findAccount('eva@vednemesicnik.test'))?.isAdmin, false)
    } finally {
      await app.close()
    }
  })

  it('asks before removing an account, then signs it out everywhere', async () => {
    let app = await editorialBoard()
    try {
      let browser = app.browser()
      await browser.signInAs('marie@vednemesicnik.test', 'Marie Horáková')
      let jakubsBrowser = app.browser()
      await jakubsBrowser.signInAs('jakub@vednemesicnik.test', 'Jakub Novák')
      let jakub = await idOf(app, 'jakub@vednemesicnik.test')

      let question = await (await browser.get(`/settings/access/accounts/${jakub}/remove`)).text()
      assert.ok(/<h2 [^>]*class="vdm-dialog__title"[^>]*>Odebrat účet\?<\/h2>/.test(question))
      assert.ok(textOf(question).includes('Účet bude odhlášen ze všech zařízení.'))
      // Nothing behind the question can be reached while it is asked.
      assert.ok(/<div inert[^>]*>\s*<div [^>]*>\s*<header class="vdm-topbar"/.test(question))
      assert.ok(!/<div inert/.test(await (await browser.get('/settings')).text()))

      let marie = await idOf(app, 'marie@vednemesicnik.test')
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
      assert.equal(await app.directory.findAccount('jakub@vednemesicnik.test'), null)
      let left = await app.database.exec(
        sql`SELECT COUNT(*) AS n FROM sessions WHERE email = ${'jakub@vednemesicnik.test'}`,
      )
      assert.deepEqual(left.rows, [{ n: 0 }])
      assert.equal((await jakubsBrowser.get('/')).status, 303)
    } finally {
      await app.close()
    }
  })

  it('asks before removing a group, by its name and its address', async () => {
    let app = await editorialBoard()
    try {
      await app.directory.addGroup(
        'marie@vednemesicnik.test',
        'vybor@vednemesicnik.test',
        'Výbor redakce',
        now(),
      )
      let group = (await app.directory.listGroups())[0]?.id ?? 0
      let browser = app.browser()
      await browser.signInAs('marie@vednemesicnik.test', 'Marie Horáková')

      let question = textOf(
        await (await browser.get(`/settings/access/groups/${group}/remove`)).text(),
      )
      assert.ok(
        question.includes(
          'Odebrat skupinu? Výbor redakce vybor@vednemesicnik.test Členové skupiny přijdou o přístup nejpozději za 10 minut',
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

describe('settings, Soubory na Disku (14a, 14j)', () => {
  it('shows every editor-in-chief where the files and the record are, before Účty Publikace', async () => {
    let app = await editorialBoard()
    try {
      let browser = app.browser()
      await browser.signInAs('eva@vednemesicnik.test')
      let html = await (await browser.get('/settings')).text()
      let text = textOf(html)

      assert.ok(html.includes('aria-labelledby="drive-files-title"'))
      assert.ok(html.indexOf('id="drive-files-title"') > html.indexOf('id="access-title"'))
      assert.ok(html.indexOf('id="drive-files-title"') < html.indexOf('id="accounts-title"'))
      assert.ok(
        text.includes(
          'Soubory na Disku Na sdíleném disku Publikace vznikají složky a dokumenty nových vydání. Stavy těchto vydání a jejich článků a děl se mění jen v aplikaci. Licence a souhlasy můžete mimo aplikaci dohledat pomocí Registru a Evidence. Aplikace do obou tabulek zapisuje a údaje z nich nepřebírá. Záznamy mohou být opožděné.',
        ),
      )
      assert.ok(
        text.includes('Sdílený disk Publikace · složka s vydáními (otevře se v nové záložce)'),
      )
      assert.ok(
        text.includes(
          'Registr vydání Registr (otevře se v nové záložce) · list Vydání z aplikace je jen pro čtení',
        ),
      )
      assert.ok(
        text.includes(
          'Evidence v každé složce vydání · listy Články, Redakční doložky, Obrazová díla jen pro čtení',
        ),
      )
      assert.ok(
        text.includes('Šablona článku TEMPLATE__Publication__Article (otevře se v nové záložce)'),
      )
      assert.ok(text.includes('Podklady pro tisk v každé složce vydání › _Podklady_pro_tisk'))
      // The tag stands at the Evidence only; the Registr says it in its sentence.
      assert.equal(text.split('jen pro čtení').length - 1, 2)
      assert.ok(
        html.includes(`href="https://drive.google.com/drive/folders/${TEST_ISSUES_FOLDER}"`),
      )
      assert.ok(
        html.includes(`href="https://docs.google.com/spreadsheets/d/${TEST_REGISTRY}/edit"`),
      )
      assert.ok(html.includes(`href="https://docs.google.com/document/d/${TEST_TEMPLATE}/edit"`))
      assert.equal(html.match(/target="_blank"/g)?.length, 3)
    } finally {
      await app.close()
    }
  })

  it('says the app writes no Registr when the deployment names none (14j)', async () => {
    let app = await createTestApp({ registrySpreadsheetId: '' })
    try {
      await seedAdmin(app, 'marie@vednemesicnik.test')
      let browser = app.browser()
      await browser.signInAs('marie@vednemesicnik.test')
      let html = await (await browser.get('/settings')).text()
      let text = textOf(html)

      assert.ok(
        text.includes(
          'Licence a souhlasy můžete mimo aplikaci dohledat v Evidenci. Aplikace do ní zapisuje a údaje z ní nepřebírá. Záznamy mohou být opožděné.',
        ),
      )
      assert.ok(!text.includes('pomocí Registru a Evidence'))
      assert.ok(text.includes('Registr vydání Aplikace do Registru nezapisuje. Evidence'))
      assert.ok(!html.includes('/spreadsheets/d/'))

      /* The card under it follows the same deployment, connected and disconnected (cac9z72q). */
      await connectDriveAccount(app)
      let connected = textOf(await (await browser.get('/settings')).text())
      assert.ok(connected.includes('sdíleném disku a zapisuje do Evidence. Soubory patří disku.'))
      assert.ok(!connected.includes('zapisuje do Registru'))

      await app.driveAccount.markDisconnected(now())
      let disconnected = textOf(await (await browser.get('/settings')).text())
      assert.ok(
        disconnected.includes(
          'Po připojení účtu aplikace do Evidence doplní všechny čekající změny.',
        ),
      )
      assert.ok(!disconnected.includes('do Registru a Evidence'))
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
      await browser.signInAs('jakub@vednemesicnik.test', 'Jakub Novák')
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
          'V Googlu vyberte účet publikace.app@vednemesicnik.test a povolte aplikaci pracovat se soubory na Disku.',
        ),
      )
      assert.ok(text.includes('publikace@ vednemesicnik.test'), 'the mailbox, without a state')
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
      await browser.signInAs('marie@vednemesicnik.test', 'Marie Horáková')
      let html = await (await browser.get('/settings')).text()
      let text = textOf(html)

      assert.ok(html.includes('vdm-status--published'))
      assert.ok(text.includes('Připojeno'))
      assert.ok(
        text.includes(
          'Pod tímto účtem běží úlohy na pozadí. Aplikace pod ním zakládá složky a dokumenty na sdíleném disku a zapisuje do Registru a Evidence. Soubory patří disku.',
        ),
      )
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
      await browser.signInAs('marie@vednemesicnik.test', 'Marie Horáková')
      let html = await (await browser.get('/settings')).text()
      let text = textOf(html)

      assert.ok(html.includes('vdm-status--problem'))
      assert.ok(text.includes('Odpojeno'))
      assert.ok(
        text.includes(
          'Připojte účet znovu, aby aplikace mohla pracovat se soubory na Disku. Po připojení účtu aplikace do Registru a Evidence doplní všechny čekající změny.',
        ),
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

describe('settings, Korektura (14a, 14f)', () => {
  const PATH = '/settings/proofreaders'

  it('shows no address yet, and lets an administrator set one through the dialog', async () => {
    let app = await editorialBoard()
    try {
      let browser = app.browser()
      await browser.signInAs('marie@vednemesicnik.test', 'Marie Horáková')
      let page = textOf(await (await browser.get('/settings')).text()).replaceAll(' ', ' ')
      assert.ok(page.includes('Korektura'))
      assert.ok(page.includes('Zatím žádná. Přístup přes adresu korektorů není nastavený'))
      assert.ok(page.includes('Nastavit'))

      let dialog = textOf(await (await browser.get(PATH)).text()).replaceAll(' ', ' ')
      assert.ok(dialog.includes('Adresa korektorů'))
      assert.ok(dialog.includes('Další přehled odejde na novou adresu.'))

      let saved = await browser.post(PATH, { email: ' Korektori@Vednemesicnik.test ' }, PATH)
      assert.equal(saved.status, 303)
      let after = textOf(await (await browser.get('/settings')).text())
      assert.ok(after.includes('korektori@vednemesicnik.test'))
      assert.ok(after.includes('Adresa korektorů je uložená.'))
      assert.ok(after.includes('Změnit'))
    } finally {
      await app.close()
    }
  })

  it('keeps an error in the dialog, and saves nothing', async () => {
    let app = await editorialBoard()
    try {
      let browser = app.browser()
      await browser.signInAs('marie@vednemesicnik.test', 'Marie Horáková')
      let cases = [
        ['', 'Zadejte adresu korektorů.'],
        ['korektori', 'Zadejte platnou e-mailovou adresu.'],
        ['korektori@external.test', 'Zadejte adresu na doméně vednemesicnik.test.'],
      ]
      for (let [value, message] of cases) {
        let answer = await browser.post(PATH, { email: value ?? '' }, PATH)
        assert.equal(answer.status, 400)
        let text = textOf(await answer.text()).replaceAll(' ', ' ')
        assert.ok(text.includes(message ?? ''), message)
      }
      let page = textOf(await (await browser.get('/settings')).text())
      assert.ok(page.includes('Zatím žádná'))
    } finally {
      await app.close()
    }
  })

  it('shows the address to somebody who is not an administrator, who cannot change it', async () => {
    let app = await editorialBoard()
    try {
      let marie = app.browser()
      await marie.signInAs('marie@vednemesicnik.test', 'Marie Horáková')
      await marie.post(PATH, { email: 'korektori@vednemesicnik.test' }, PATH)

      let jakub = app.browser()
      await jakub.signInAs('jakub@vednemesicnik.test', 'Jakub Novák')
      let html = await (await jakub.get('/settings')).text()
      assert.ok(textOf(html).includes('korektori@vednemesicnik.test'))
      assert.ok(textOf(html).includes('Adresu mění správci.'))
      assert.ok(!html.includes(`href="${PATH}"`))
      assert.equal((await jakub.get(PATH)).status, 303)

      let refused = await jakub.post(PATH, { email: 'jini@vednemesicnik.test' }, '/settings')
      assert.equal(refused.status, 403)
      let after = textOf(await (await marie.get('/settings')).text())
      assert.ok(after.includes('korektori@vednemesicnik.test'))
    } finally {
      await app.close()
    }
  })

  it('warns under an address the membership service does not know, and not once it does', async () => {
    let app = await editorialBoard()
    try {
      let browser = app.browser()
      await browser.signInAs('marie@vednemesicnik.test', 'Marie Horáková')
      await browser.post(PATH, { email: 'korektura@vednemesicnik.test' }, PATH)
      let unknown = textOf(await (await browser.get('/settings')).text())
      assert.ok(
        unknown.includes(
          'o povolení skupiny korektura@vednemesicnik.test pro ověřování členství. Dokud nebude možné ověřit členství, samotné členství ve skupině k přístupu nestačí.',
        ),
      )

      app.setMembership('korektura@vednemesicnik.test', () => ({
        groupName: null,
        status: 'not-member',
      }))
      let known = textOf(await (await browser.get('/settings')).text())
      assert.ok(!known.includes('Dokud nebude možné ověřit členství'))
      assert.ok(known.includes('Přístup ke korektuře určuje adresa v části Korektura.'))
      assert.ok(known.includes('Přístup do Publikace, soubory, účty aplikace a adresa korektorů.'))
    } finally {
      await app.close()
    }
  })
})
