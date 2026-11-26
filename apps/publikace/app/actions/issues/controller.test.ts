import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { pragueYear } from '../../domain/time.ts'
import {
  connectDriveAccount,
  createTestApp,
  seedAdmin,
  TEST_ISSUES_FOLDER,
  type TestApp,
  type TestBrowser,
} from '../../test-app.server.ts'

const MARIE = 'marie@vednemesicnik.test'
const YEAR = pragueYear(Temporal.Now.instant())

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ ([.,;)])/g, '$1')
}

/** An app with Marie signed in as an editor-in-chief, and the Drive account connected or not. */
async function newsroom(
  options: { hasRegistry?: boolean; isConnected?: boolean } = {},
): Promise<{ app: TestApp; browser: TestBrowser }> {
  let app = await createTestApp(options.hasRegistry === false ? { registrySpreadsheetId: '' } : {})
  await seedAdmin(app, MARIE)
  if (options.isConnected !== false) await connectDriveAccount(app)
  let browser = app.browser()
  await browser.signInAs(MARIE, 'Marie Horáková')
  return { app, browser }
}

/** The text of the error toasts: the `alert` region, which holds nothing else. */
function alertText(html: string): string {
  let region = /<div [^>]*role="alert"[^>]*>(.*?)<\/div>\s*<div [^>]*role="status"/s.exec(html)
  let inside = region?.[1] ?? ''
  assert.ok(inside === '' || inside.includes('vdm-toast vdm-toast--error'))
  return textOf(inside).trim()
}

function create(browser: TestBrowser, name: string, search = ''): Promise<Response> {
  return browser.post(`/issues/new${search}`, { name }, `/issues/new${search}`)
}

/** Where every link with these words leads, in the order of the page. */
function hrefsOf(html: string, label: string): string[] {
  let links = html.matchAll(/<a [^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g)
  return [...links].filter((link) => link[2]?.trim() === label).map((link) => link[1] ?? '')
}

/** The words of the filter item the page marks current. */
function activeFilter(html: string): string {
  let item = /<a [^>]*aria-current="true"[^>]*class="vdm-statefilter__item[^>]*>([^<]*)</.exec(html)
  return item?.[1]?.trim() ?? ''
}

describe('home, the shell', () => {
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
      assert.match(html, /<h1 class="vdm-page-title">Vydání<\/h1>/)
      assert.ok(html.includes(`<link rel="stylesheet" href="${app.assets.stylesheetHref}" />`))
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
      assert.ok(!connected.includes('vdm-callout--'))

      await app.driveAccount.markDisconnected(Temporal.Now.instant())
      let disconnected = await (await browser.get('/')).text()
      assert.ok(disconnected.includes('vdm-callout--error'))
      assert.ok(disconnected.includes('Účet publikace.app@ je odpojený.'))
    } finally {
      await app.close()
    }
  })
})

describe('the overview of issues (11a, 11b)', () => {
  it('invites to the first issue while the app knows none, with no filter', async () => {
    let { app, browser } = await newsroom()
    try {
      let html = await (await browser.get('/')).text()
      let text = textOf(html)

      assert.ok(text.includes('Zatím tu není žádné vydání'))
      assert.ok(
        text.includes(
          'Založte první vydání v aplikaci. Vydání z doby před aplikací dál dokončujte v původních tabulkách.',
        ),
      )
      assert.ok(html.includes('href="/issues/new"'))
      assert.ok(!html.includes('vdm-statefilter'))
    } finally {
      await app.close()
    }
  })

  it('lists the issues with the filter, and says when a filter has none', async () => {
    let { app, browser } = await newsroom()
    try {
      await create(browser, `VDM_${YEAR}_5`)
      let html = await (await browser.get('/?state=all')).text()
      let text = textOf(html)

      assert.ok(text.includes(`VDM_${YEAR}_5`))
      assert.ok(text.includes('Aktivní'))
      assert.match(text, /založeno \d+\. \d+\. \d{4}/)
      assert.ok(html.includes(`href="/issues/VDM_${YEAR}_5"`))
      assert.ok(text.includes('Vše 1 Neuzavřené 1 Uzavřené 0'))
      assert.ok(html.includes('Otevřít složku na Disku'))

      let closed = textOf(await (await browser.get('/?state=closed')).text())
      assert.ok(closed.includes('Žádné uzavřené vydání'))
      assert.ok(closed.includes('Filtr Vše ukáže 1 vydání.'))
      assert.ok(closed.includes('Zobrazit vše'))
    } finally {
      await app.close()
    }
  })
})

describe('the dialog Nové vydání (11d, 14g)', () => {
  it('opens over the overview, at its own address, with the next number of the year', async () => {
    let { app, browser } = await newsroom()
    try {
      let empty = await (await browser.get('/issues/new')).text()
      assert.ok(/<div inert[^>]*>/.test(empty))
      assert.ok(/<h2 [^>]*class="vdm-dialog__title"[^>]*>Nové vydání<\/h2>/.test(empty))
      assert.ok(textOf(empty).includes('Na sdíleném disku Publikace vznikne složka vydání'))
      assert.ok(textOf(empty).includes('Ve tvaru VDM_RRRR_N.'))
      assert.match(empty, /name="name"[^>]*value=""/)

      await create(browser, `VDM_${YEAR}_5`)
      let next = await (await browser.get('/issues/new')).text()
      assert.match(next, new RegExp(`name="name"[^>]*value="VDM_${YEAR}_6"`))
    } finally {
      await app.close()
    }
  })

  it('names the Registr only when the deployment has one (11d)', async () => {
    let withRegistry = await newsroom()
    try {
      let text = textOf(await (await withRegistry.browser.get('/issues/new')).text())
      assert.ok(text.includes('Evidence a záznam v Registru vzniknou až po vytvoření vydání.'))
    } finally {
      await withRegistry.app.close()
    }

    let withoutRegistry = await newsroom({ hasRegistry: false })
    try {
      let text = textOf(await (await withoutRegistry.browser.get('/issues/new')).text())
      assert.ok(text.includes('podklady pro tisk. Evidence vznikne až po vytvoření vydání. Odkaz'))
      assert.ok(!text.includes('Registr'))
    } finally {
      await withoutRegistry.app.close()
    }
  })

  it('creates the issue with its folders and opens the detail with the toast', async () => {
    let { app, browser } = await newsroom()
    try {
      let response = await create(browser, `  VDM_${YEAR}_6 `)

      assert.equal(response.status, 303)
      assert.equal(response.headers.get('Location'), `/issues/VDM_${YEAR}_6`)
      assert.deepEqual(
        app.drive.folders().map((folder) => folder.name),
        [`VDM_${YEAR}_6`, 'Články', '_Podklady_pro_tisk'],
      )
      assert.equal(app.drive.folders()[0]?.parentId, TEST_ISSUES_FOLDER)

      let detail = textOf(await (await browser.get(`/issues/VDM_${YEAR}_6`)).text())
      assert.ok(detail.includes(`Vydání VDM_${YEAR}_6 je založené. Použijte Odkaz pro redakci.`))
    } finally {
      await app.close()
    }
  })

  it('refuses an empty, a long and a duplicate name, keeping what was typed', async () => {
    let { app, browser } = await newsroom()
    try {
      let empty = await create(browser, '   ')
      assert.equal(empty.status, 400)
      assert.ok(textOf(await empty.text()).includes('Vyplňte název vydání.'))

      let long = await create(browser, 'x'.repeat(101))
      let longHtml = await long.text()
      assert.equal(long.status, 400)
      assert.ok(textOf(longHtml).includes('Zkraťte název na nejvýš 100 znaků.'))
      assert.ok(longHtml.includes(`value="${'x'.repeat(101)}"`))

      await create(browser, `VDM_${YEAR}_5`)
      let calls = app.drive.calls.length
      let duplicate = await create(browser, `vdm_${YEAR}_5`)
      let html = await duplicate.text()
      assert.equal(duplicate.status, 400)
      assert.ok(
        textOf(html).includes(`Zvolte jiný název — vydání VDM_${YEAR}_5 už v aplikaci existuje.`),
      )
      assert.match(html, new RegExp(`value="vdm_${YEAR}_5"`))
      assert.equal(app.drive.calls.length, calls)
    } finally {
      await app.close()
    }
  })

  it('warns from the moment it opens while the account is not connected, and creates nothing', async () => {
    let { app, browser } = await newsroom({ isConnected: false })
    try {
      let sentence = 'Nejdřív v Nastavení připojte účet publikace.app@, aby šlo vytvořit vydání.'
      let opened = await (await browser.get('/issues/new')).text()
      assert.ok(textOf(opened).includes(sentence))

      let response = await create(browser, `VDM_${YEAR}_6`)
      let html = await response.text()
      assert.equal(response.status, 409)
      assert.ok(textOf(html).includes(sentence))
      assert.match(html, new RegExp(`value="VDM_${YEAR}_6"`))
      assert.deepEqual(app.drive.calls, [])
      assert.ok(!textOf(await (await browser.get('/')).text()).includes(`VDM_${YEAR}_6`))
    } finally {
      await app.close()
    }
  })

  it('says nothing was created when Drive fails at the issue folder, and the name stays free', async () => {
    let { app, browser } = await newsroom()
    try {
      app.drive.failCreate(`VDM_${YEAR}_6`)
      let response = await create(browser, `VDM_${YEAR}_6`)
      let text = textOf(await response.text())

      assert.equal(response.status, 409)
      assert.ok(text.includes('Zkuste vytvořit vydání za chvíli znovu'))
      assert.ok(text.includes('Nic se nevytvořilo. Disk teď neodpovídá.'))

      app.drive.heal()
      assert.equal((await create(browser, `VDM_${YEAR}_6`)).status, 303)
    } finally {
      await app.close()
    }
  })

  it('leaves the issue unfinished when Drive fails after the issue folder (1jv85zum)', async () => {
    let { app, browser } = await newsroom()
    try {
      app.drive.failCreate('Články')
      let response = await create(browser, `VDM_${YEAR}_6`)
      let html = await response.text()
      let text = textOf(html)

      assert.equal(response.status, 409)
      assert.ok(text.includes(`Vydání VDM_${YEAR}_6 není dokončené`))
      assert.ok(
        text.includes(
          'Zvolte Dokončit vydání. Doplní se chybějící složky Články a podklady pro tisk; složka vydání už vznikla.',
        ),
      )
      assert.ok(html.includes(`action="/issues/VDM_${YEAR}_6/finish"`))
      assert.ok(text.includes('Zavřít'))

      let overview = textOf(await (await browser.get('/')).text())
      assert.ok(overview.includes('Nedokončené'))
      assert.match(overview, /založení zahájeno \d+\. \d+\. \d{4}/)
      assert.ok(overview.includes('Dokončit vydání'))
    } finally {
      await app.close()
    }
  })

  it('keeps the filter of the overview behind it, in Zrušit and in a refusal', async () => {
    let { app, browser } = await newsroom()
    try {
      await create(browser, `VDM_${YEAR}_5`)
      assert.deepEqual(hrefsOf(await (await browser.get('/?state=open')).text(), 'Nové vydání'), [
        '/issues/new?state=open',
      ])

      let opened = await (await browser.get('/issues/new?state=open')).text()
      assert.equal(activeFilter(opened), 'Neuzavřené')
      assert.deepEqual(hrefsOf(opened, 'Zrušit'), ['/?state=open'])
      assert.ok(opened.includes('action="/issues/new?state=open"'))

      let refused = await create(browser, '   ', '?state=closed')
      let html = await refused.text()
      assert.equal(refused.status, 400)
      assert.equal(activeFilter(html), 'Uzavřené')
      assert.deepEqual(hrefsOf(html, 'Zrušit'), ['/?state=closed'])
      assert.ok(html.includes('action="/issues/new?state=closed"'))
    } finally {
      await app.close()
    }
  })

  it('takes an unknown filter as Vše, and writes Vše as no filter at all', async () => {
    let { app, browser } = await newsroom()
    try {
      await create(browser, `VDM_${YEAR}_5`)
      assert.deepEqual(hrefsOf(await (await browser.get('/?state=all')).text(), 'Nové vydání'), [
        '/issues/new',
      ])

      let opened = await (await browser.get('/issues/new?state=active')).text()
      assert.equal(activeFilter(opened), 'Vše')
      assert.deepEqual(hrefsOf(opened, 'Zrušit'), ['/'])
      assert.ok(opened.includes('action="/issues/new"'))
    } finally {
      await app.close()
    }
  })

  it('keeps the filter in Zavřít of an issue Drive left unfinished', async () => {
    let { app, browser } = await newsroom()
    try {
      app.drive.failCreate('Články')
      let response = await create(browser, `VDM_${YEAR}_6`, '?state=open')
      let html = await response.text()

      assert.equal(response.status, 409)
      assert.equal(activeFilter(html), 'Neuzavřené')
      assert.deepEqual(hrefsOf(html, 'Zavřít'), ['/?state=open'])
    } finally {
      await app.close()
    }
  })
})

describe('finishing an issue (12i)', () => {
  async function unfinished(): Promise<{ app: TestApp; browser: TestBrowser }> {
    let setup = await newsroom()
    setup.app.drive.failCreate('_Podklady_pro_tisk')
    await create(setup.browser, `VDM_${YEAR}_6`)
    setup.app.drive.heal()
    return setup
  }

  it('adds what is missing from the row and says so on the overview', async () => {
    let { app, browser } = await unfinished()
    try {
      let response = await browser.post(
        `/issues/VDM_${YEAR}_6/finish`,
        { returnTo: 'overview' },
        '/',
      )
      assert.equal(response.status, 303)
      assert.equal(response.headers.get('Location'), '/')

      let overview = textOf(await (await browser.get('/')).text())
      assert.ok(overview.includes(`Vydání VDM_${YEAR}_6 je dokončené.`))
      assert.ok(overview.includes('Aktivní'))
      assert.ok(!overview.includes('Nedokončené'))
      assert.equal(
        app.drive.folders().filter((folder) => folder.name === '_Podklady_pro_tisk').length,
        1,
      )
    } finally {
      await app.close()
    }
  })

  it('sends the filter from the row and comes back to it, whatever the answer', async () => {
    let { app, browser } = await unfinished()
    try {
      let row = await (await browser.get('/?state=open')).text()
      assert.equal(row.match(/<input name="state" type="hidden" value="open"/g)?.length, 2)
      assert.ok(!(await (await browser.get('/')).text()).includes('name="state"'))

      let finish = (state: string) =>
        browser.post(`/issues/VDM_${YEAR}_6/finish`, { returnTo: 'overview', state }, '/')

      app.drive.goDown()
      assert.equal((await finish('open')).headers.get('Location'), '/?state=open')
      assert.equal((await finish('active')).headers.get('Location'), '/')

      app.drive.heal()
      let finished = await finish('closed')
      assert.equal(finished.status, 303)
      assert.equal(finished.headers.get('Location'), '/?state=closed')
    } finally {
      await app.close()
    }
  })

  it('says to try again in an error toast when Drive does not answer', async () => {
    let { app, browser } = await unfinished()
    try {
      app.drive.goDown()
      let response = await browser.post(
        `/issues/VDM_${YEAR}_6/finish`,
        { returnTo: 'detail' },
        `/issues/VDM_${YEAR}_6`,
      )
      assert.equal(response.headers.get('Location'), `/issues/VDM_${YEAR}_6`)

      let html = await (await browser.get(`/issues/VDM_${YEAR}_6`)).text()
      assert.equal(alertText(html), 'Zkuste dokončit vydání za chvíli znovu.')
      assert.ok(textOf(html).includes(`Vydání VDM_${YEAR}_6 není dokončené`))
    } finally {
      await app.close()
    }
  })

  it('asks for the issue folder back when it is gone, on the detail, creating nothing', async () => {
    let { app, browser } = await unfinished()
    try {
      let issueFolder = app.drive.folders()[0]
      app.drive.trash(issueFolder?.id ?? '')
      let before = app.drive.folders().length

      let response = await browser.post(
        `/issues/VDM_${YEAR}_6/finish`,
        { returnTo: 'overview' },
        '/',
      )
      assert.equal(response.status, 303)
      assert.equal(response.headers.get('Location'), `/issues/VDM_${YEAR}_6`)

      let gone = `Obnovte složku vydání VDM_${YEAR}_6 z koše, nebo ji vraťte na sdílený disk Publikace. Pak zvolte Dokončit vydání.`
      assert.ok(textOf(await (await browser.get(`/issues/VDM_${YEAR}_6`)).text()).includes(gone))
      assert.ok(!textOf(await (await browser.get(`/issues/VDM_${YEAR}_6`)).text()).includes(gone))
      assert.equal(app.drive.folders().length, before)
    } finally {
      await app.close()
    }
  })

  it('says the account is disconnected in an error toast, asking nothing of Drive (14c)', async () => {
    let { app, browser } = await unfinished()
    try {
      await app.driveAccount.markDisconnected(Temporal.Now.instant())
      let calls = app.drive.calls.length
      let response = await browser.post(
        `/issues/VDM_${YEAR}_6/finish`,
        { returnTo: 'overview' },
        '/',
      )
      assert.equal(response.status, 303)
      assert.equal(response.headers.get('Location'), '/')

      let html = await (await browser.get('/')).text()
      assert.equal(
        alertText(html),
        'Účet publikace.app@ je odpojený. Akce se soubory na Disku teď nejsou dostupné.',
      )
      assert.equal(app.drive.calls.length, calls)
      assert.ok(textOf(html).includes('Nedokončené'))
    } finally {
      await app.close()
    }
  })

  it('refuses a finish form sent without the token', async () => {
    let { app, browser } = await unfinished()
    try {
      let response = await browser.post(`/issues/VDM_${YEAR}_6/finish`, { _csrf: 'forged' })
      assert.equal(response.status, 403)
    } finally {
      await app.close()
    }
  })
})

describe('the detail of an issue (12a, 12c, 12i)', () => {
  it('shows the header and the empty sections of a fresh issue', async () => {
    let { app, browser } = await newsroom()
    try {
      await create(browser, `VDM_${YEAR}_6`)
      let html = await (await browser.get(`/issues/VDM_${YEAR}_6`)).text()
      let text = textOf(html)
      let folderId = app.drive.folders()[0]?.id ?? ''

      assert.ok(html.includes(`<h1 class="vdm-page-title">VDM_${YEAR}_6</h1>`))
      assert.ok(html.includes(`href="https://drive.google.com/drive/folders/${folderId}"`))
      assert.ok(text.includes('Složka na Disku'))
      assert.match(text, /Založeno \d+\. \d+\. \d{4} · Marie Horáková/)
      assert.ok(text.includes('Články 0'))
      assert.ok(text.includes('Obrazová díla 0'))
      assert.ok(!text.includes('Dokončit vydání'))
    } finally {
      await app.close()
    }
  })

  it('shows an unfinished issue with its one action and the place of the link', async () => {
    let { app, browser } = await newsroom()
    try {
      app.drive.failCreate('Články')
      await create(browser, `VDM_${YEAR}_6`)
      let text = textOf(await (await browser.get(`/issues/VDM_${YEAR}_6`)).text())

      assert.ok(text.includes('Nedokončené'))
      assert.match(text, /Založení zahájeno \d+\. \d+\. \d{4} · Marie Horáková/)
      assert.ok(text.includes('Dokončit vydání'))
      assert.ok(text.includes('Odkaz na nový článek bude tady, až bude vydání dokončené.'))
      assert.ok(!text.includes('Články 0'))
    } finally {
      await app.close()
    }
  })

  it('answers 404 for an issue the app does not know, and sends a visitor to sign in', async () => {
    let { app, browser } = await newsroom()
    try {
      assert.equal((await browser.get('/issues/VDM_1999_1')).status, 404)
      let anonymous = await app.browser().get('/issues/new')
      assert.equal(anonymous.status, 303)
      assert.match(anonymous.headers.get('Location') ?? '', /^\/sign-in/)
    } finally {
      await app.close()
    }
  })
})
