import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { createJobRunStore } from '../../../data/job-runs.server.ts'
import { createProofreadersStore } from '../../../data/proofreaders.server.ts'
import { REPLY_CHECK_JOB } from '../../../domain/reply-check.ts'
import { createTestApp, type TestApp } from '../../../test-app.server.ts'

const MARIE = 'marie@vednemesicnik.test'

async function setup() {
  let app = await createTestApp()
  await app.directory.seedInitialAdmin(MARIE, Temporal.Now.instant())
  let browser = app.browser()
  await browser.signInAs(MARIE, 'Marie Horáková')
  return { app, browser, runs: createJobRunStore(app.database) }
}

/** A run of the reply check that started `minutesAgo`, and how it ended, if it did. */
async function run(
  app: TestApp,
  minutesAgo: number,
  end?: { error?: string; outcome: 'failed' | 'ok' },
) {
  let runs = createJobRunStore(app.database)
  let runKey = crypto.randomUUID()
  let at = Temporal.Now.instant().subtract({ minutes: minutesAgo })
  await runs.start({ at, intervalMinutes: 30, job: REPLY_CHECK_JOB, runKey })
  if (end !== undefined) {
    await runs.finish(REPLY_CHECK_JOB, runKey, {
      at: at.add({ minutes: 1 }),
      error: end.error ?? null,
      outcome: end.outcome,
    })
  }
}

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ ([.,)])/g, '$1')
}

describe('Úlohy na pozadí (14d)', () => {
  it('lists the reply check that never reported, with no schedule and no action', async () => {
    let { app, browser } = await setup()
    try {
      let html = await (await browser.get('/settings/jobs')).text()
      let text = textOf(html)
      assert.ok(text.includes('Odpovědi k obrazovým dílům'))
      assert.ok(text.includes('přečte „Souhlasím“ k licencím, archivuje'))
      assert.ok(text.includes('Zatím se neohlásila'))
      assert.doesNotMatch(html, /každých/)
      assert.doesNotMatch(html, />\s*Zobrazit\s*</)
      assert.doesNotMatch(html, /vdm-callout--error/)
      assert.doesNotMatch(textOf(await (await browser.get('/')).text()), /nepromítají do stavu děl/)
    } finally {
      await app.close()
    }
  })

  it('tags a finished run V pořádku with its schedule and no action', async () => {
    let { app, browser } = await setup()
    try {
      await run(app, 5, { outcome: 'ok' })
      let html = await (await browser.get('/settings/jobs')).text()
      assert.match(html, /každých 30 min/)
      assert.match(html, /V\u00a0pořádku/)
      assert.match(html, /Poslední běh ve?\u00a0\d+:\d\d\u00a0· další\u00a0kolem\u00a0\d+:\d\d/)
      assert.doesNotMatch(html, /href="\/settings\/jobs\/artwork-replies"/)
    } finally {
      await app.close()
    }
  })

  it('tags an open run Běží, and one open past its time S chybou with Zobrazit', async () => {
    let { app, browser } = await setup()
    try {
      await run(app, 2)
      let running = await (await browser.get('/settings/jobs')).text()
      assert.match(running, /Běží/)
      assert.match(running, /spuštěno ve?\u00a0\d+:\d\d/)
    } finally {
      await app.close()
    }

    let second = await setup()
    try {
      await run(second.app, 15)
      let overdue = await (await second.browser.get('/settings/jobs')).text()
      assert.match(overdue, /S\u00a0chybou/)
      assert.match(overdue, /href="\/settings\/jobs\/artwork-replies"/)
    } finally {
      await second.app.close()
    }
  })

  it('tags a job that missed two runs Neběží, whatever its last run did', async () => {
    let { app, browser } = await setup()
    try {
      await run(app, 70, { outcome: 'failed' })
      let html = await (await browser.get('/settings/jobs')).text()
      assert.match(html, /vdm-status--problem"><span class="vdm-status__tag">Neběží/)
      assert.doesNotMatch(html, /další kolem/)
      assert.match(html, /href="\/settings\/jobs\/artwork-replies"/)
    } finally {
      await app.close()
    }
  })

  it('sends somebody not signed in to sign in', async () => {
    let app = await createTestApp()
    try {
      for (let path of ['/settings/jobs', '/settings/jobs/artwork-replies']) {
        let response = await app.browser().get(path)
        assert.equal(response.status, 303)
        assert.match(response.headers.get('Location') ?? '', /^\/sign-in/)
      }
    } finally {
      await app.close()
    }
  })
})

describe('the banner of a job that keeps failing (14d)', () => {
  const BANNER = 'Odpovědi k obrazovým dílům se teď v aplikaci nepromítají do stavu děl.'
  /* Right after the banner's sentence: Settings has a button of its own to the same page. */
  const BUTTON =
    /nepromítají do stavu děl\.<\/p><div class="vdm-callout__actions"><a href="\/settings\/jobs" class="vdm-btn[^"]*">Zobrazit úlohy<\/a>/

  it('stands over every editor screen after two failed runs, leading to the jobs', async () => {
    let { app, browser } = await setup()
    try {
      await run(app, 35, { outcome: 'failed' })
      await run(app, 5, { outcome: 'failed' })
      for (let path of ['/', '/review', '/settings', '/settings/jobs/artwork-replies']) {
        let html = await (await browser.get(path)).text()
        assert.ok(textOf(html).includes(BANNER), path)
        assert.match(html, BUTTON, path)
      }
    } finally {
      await app.close()
    }
  })

  it('has no button on the jobs page, whose table is right under it', async () => {
    let { app, browser } = await setup()
    try {
      await run(app, 35, { outcome: 'failed' })
      await run(app, 5, { outcome: 'failed' })
      let html = await (await browser.get('/settings/jobs')).text()
      assert.ok(textOf(html).includes(BANNER))
      assert.doesNotMatch(html, BUTTON)
    } finally {
      await app.close()
    }
  })

  it('counts a run left open past its time as failed, and holds while the next one runs', async () => {
    let { app, browser } = await setup()
    try {
      await run(app, 65, { outcome: 'failed' })
      await run(app, 35)
      await run(app, 2)
      assert.ok(textOf(await (await browser.get('/')).text()).includes(BANNER))
    } finally {
      await app.close()
    }
  })

  it('shows for neither one failure nor a failure that a good run followed', async () => {
    let { app, browser } = await setup()
    try {
      await run(app, 50, { outcome: 'failed' })
      assert.ok(!textOf(await (await browser.get('/')).text()).includes(BANNER))
      await run(app, 30, { outcome: 'ok' })
      await run(app, 5, { outcome: 'failed' })
      assert.ok(!textOf(await (await browser.get('/')).text()).includes(BANNER))
    } finally {
      await app.close()
    }
  })

  it('stands over every editor screen for a job that stopped reporting', async () => {
    let { app, browser } = await setup()
    try {
      await run(app, 70, { outcome: 'ok' })
      for (let path of ['/', '/review', '/settings', '/settings/jobs/artwork-replies']) {
        let html = await (await browser.get(path)).text()
        assert.ok(textOf(html).includes(BANNER), path)
        assert.match(html, BUTTON, path)
      }
      let jobs = await (await browser.get('/settings/jobs')).text()
      assert.ok(textOf(jobs).includes(BANNER))
      assert.doesNotMatch(jobs, BUTTON)
    } finally {
      await app.close()
    }
  })

  it('names a job that failed twice and then went quiet once', async () => {
    let { app, browser } = await setup()
    try {
      await run(app, 100, { outcome: 'failed' })
      await run(app, 70, { outcome: 'failed' })
      let text = textOf(await (await browser.get('/')).text())
      assert.equal(text.split(BANNER).length - 1, 1)
    } finally {
      await app.close()
    }
  })

  it('is not shown to somebody who is not signed in', async () => {
    let app = await createTestApp()
    try {
      await run(app, 35, { outcome: 'failed' })
      await run(app, 5, { outcome: 'failed' })
      let signIn = await (await app.browser().get('/sign-in')).text()
      assert.ok(!textOf(signIn).includes(BANNER))
    } finally {
      await app.close()
    }
  })
})

describe('the history of a job (14e)', () => {
  it('shows a reported failure with what holds and the technical text under a disclosure', async () => {
    let { app, browser } = await setup()
    try {
      await run(app, 35, { outcome: 'ok' })
      await run(app, 5, { error: 'Reply check failed: <timeout>', outcome: 'failed' })
      let html = await (await browser.get('/settings/jobs/artwork-replies')).text()
      let text = textOf(html)
      assert.ok(text.includes('Úloha skončila s chybou. Na dílech se nic nezměnilo.'))
      assert.match(text, /Další běh proběhne kolem \d+:\d\d\./)
      assert.ok(text.includes('Pokud se to opakuje, obraťte se na toho, kdo má úlohu na starosti.'))
      assert.match(html, /<summary>Zobrazit podrobnosti<\/summary>/)
      assert.match(html, /Reply check failed: &lt;timeout&gt;/)
      assert.ok(
        text.indexOf('Skončila s chybou, na dílech se nic nezměnilo') <
          text.indexOf('Skončila bez chyby'),
      )
      assert.ok(text.includes('· systém'))
      assert.ok(text.includes('Historie ukazuje posledních 30 dní.'))
    } finally {
      await app.close()
    }
  })

  it('says a run never reported how it ended, with nothing to show under it', async () => {
    let { app, browser } = await setup()
    try {
      await run(app, 15)
      let html = await (await browser.get('/settings/jobs/artwork-replies')).text()
      assert.match(html, /Úloha neohlásila, jak poslední běh skončil\./)
      assert.match(html, /Neohlásila výsledek/)
      assert.doesNotMatch(html, /Zobrazit podrobnosti/)
    } finally {
      await app.close()
    }
  })

  it('keeps runs older than 30 days out, but still shows when a silent job last reported', async () => {
    let { app, browser } = await setup()
    try {
      await run(app, 60 * 24 * 40, { outcome: 'ok' })
      await run(app, 60 * 24 * 35, { outcome: 'ok' })
      let html = await (await browser.get('/settings/jobs/artwork-replies')).text()
      assert.equal(html.match(/vdm-history__item/g)?.length, 1)
      assert.match(html, /Naposledy se ohlásila \d+\. \d+\.( \d{4})? ve?\u00a0\d+:\d\d\./)
    } finally {
      await app.close()
    }
  })

  it('tells the editors who to turn to when the job went quiet, with nothing to start', async () => {
    let { app, browser } = await setup()
    try {
      await run(app, 70, { error: 'Reply check failed: <timeout>', outcome: 'failed' })
      let html = await (await browser.get('/settings/jobs/artwork-replies')).text()
      let text = textOf(html)
      assert.match(
        html,
        /class="vdm-callout__title">Dejte vědět tomu, kdo má úlohu na starosti\.<\/p><p[^>]*>Úloha má běžet/,
      )
      assert.match(
        html,
        /Úloha má běžet každých 30 min\. Naposledy se ohlásila ve?\u00a0\d+:\d\d\. Příčinu aplikace nezná\./,
      )
      assert.doesNotMatch(html, /Spustit teď/)
      assert.doesNotMatch(html, /Zobrazit podrobnosti/)
      assert.doesNotMatch(text, /Úloha skončila s chybou/)
    } finally {
      await app.close()
    }
  })

  it('says a job that never reported so, and knows no other job', async () => {
    let { app, browser } = await setup()
    try {
      let html = await (await browser.get('/settings/jobs/artwork-replies')).text()
      assert.match(html, /Úloha Odpovědi k\u00a0obrazovým dílům se zatím neohlásila\./)
      assert.equal((await browser.get('/settings/jobs/comment-digest')).status, 404)
    } finally {
      await app.close()
    }
  })
})

describe('Přehled pro korektory among the jobs (14d, 14e, 14i)', () => {
  const JOB = 'proofreading-digest'

  async function digestRun(app: TestApp, summary: string, outcome: 'failed' | 'ok') {
    let runs = createJobRunStore(app.database)
    let runKey = crypto.randomUUID()
    let at = Temporal.Now.instant().subtract({ minutes: 5 })
    await runs.start({ at, intervalMinutes: 1440, job: JOB, runKey })
    await runs.finish(JOB, runKey, { at, error: null, outcome, summary })
  }

  it('shows the window as its schedule and says what the last digest did', async () => {
    let { app, browser } = await setup()
    try {
      await digestRun(app, '{"kind":"sent","handedOver":2,"cancelled":1,"waiting":3}', 'ok')
      let list = textOf(await (await browser.get('/settings/jobs')).text())
      assert.ok(list.includes('Přehled pro korektory'))
      assert.ok(list.includes('denně 7:00–8:00'))
      let history = textOf(await (await browser.get(`/settings/jobs/${JOB}`)).text())
      assert.ok(
        history.includes(
          'Přehled odeslán. Nová předání: 2 · zrušená předání: 1 · čekající články: 3.',
        ),
      )
    } finally {
      await app.close()
    }
  })

  it('raises the banner from the first unconfirmed digest, with its Callout over the history', async () => {
    let { app, browser } = await setup()
    try {
      await digestRun(app, '{"kind":"unconfirmed"}', 'failed')
      let home = textOf(await (await browser.get('/')).text()).replaceAll(' ', ' ')
      assert.ok(home.includes('Přehled pro korektory teď nemá potvrzené odeslání.'))
      let history = textOf(await (await browser.get(`/settings/jobs/${JOB}`)).text())
      assert.ok(history.replaceAll(' ', ' ').includes('Odeslání přehledu se nepodařilo potvrdit.'))
    } finally {
      await app.close()
    }
  })

  it('warns of a missing address without the banner, and stops once the address is saved', async () => {
    let { app, browser } = await setup()
    try {
      await digestRun(app, '{"kind":"no-address"}', 'failed')
      let home = textOf(await (await browser.get('/')).text())
      assert.doesNotMatch(home, /nemá potvrzené odeslání/)
      let html = await (await browser.get(`/settings/jobs/${JOB}`)).text()
      assert.ok(textOf(html).replaceAll(' ', ' ').includes('Doplňte adresu korektorů.'))
      assert.ok(html.includes('href="/settings#proofreading"'))

      await createProofreadersStore(app.database).save(
        'korektori@vednemesicnik.test',
        MARIE,
        Temporal.Now.instant(),
      )
      assert.doesNotMatch(
        textOf(await (await browser.get(`/settings/jobs/${JOB}`)).text()),
        /adresu korektorů\./,
      )
    } finally {
      await app.close()
    }
  })
})

describe('Připomínky ke článkům among the jobs (14d, 14e)', () => {
  const JOB = 'article-comments'

  async function commentsRun(app: TestApp, summary: string, outcome: 'failed' | 'ok') {
    let runs = createJobRunStore(app.database)
    let runKey = crypto.randomUUID()
    let at = Temporal.Now.instant().subtract({ minutes: 5 })
    await runs.start({ at, intervalMinutes: 180, job: JOB, runKey })
    await runs.finish(JOB, runKey, { at, error: null, outcome, summary })
  }

  it('lists the job with its windows and says what the last run sent', async () => {
    let { app, browser } = await setup()
    try {
      await commentsRun(app, '{"hasFailed":false,"sent":3,"unconfirmed":[]}', 'ok')
      let list = textOf(await (await browser.get('/settings/jobs')).text())
      assert.ok(list.includes('Připomínky ke článkům'))
      assert.ok(list.replaceAll('⁠', '').includes('upozorní autory e-mailem na nové připomínky'))
      assert.ok(list.includes('každé 3 h od 0:00'))
      let history = textOf(await (await browser.get(`/settings/jobs/${JOB}`)).text())
      assert.ok(history.includes('Poslala 3 e-maily'))
    } finally {
      await app.close()
    }
  })

  it('names every unconfirmed e-mail under its Callout, without the banner for one run', async () => {
    let { app, browser } = await setup()
    try {
      await commentsRun(
        app,
        JSON.stringify({
          hasFailed: false,
          sent: 1,
          unconfirmed: [
            { articleName: 'Sbor, který zkouší v kotelně', email: 'j.novotny@external.test' },
            { articleName: 'Proč nechodíme volit', email: 'l.kralova@external.test' },
            { articleName: 'Rozhovor s varhaníkem z Kostelce', email: 'j.novotny@external.test' },
          ],
        }),
        'failed',
      )
      let list = textOf(await (await browser.get('/settings/jobs')).text()).replaceAll(' ', ' ')
      assert.ok(list.includes('2 e-maily bez potvrzení'))
      let home = textOf(await (await browser.get('/')).text()).replaceAll(' ', ' ')
      assert.doesNotMatch(home, /nemusí autorům posílat/)

      let html = await (await browser.get(`/settings/jobs/${JOB}`)).text()
      let text = textOf(html).replaceAll(' ', ' ').replaceAll('⁠', '')
      assert.ok(text.includes('Odeslání 2 e-mailů se nepodařilo potvrdit.'))
      assert.ok(text.includes('Při dalším běhu se úloha pokusí upozornění odeslat znovu.'))
      assert.ok(text.includes('Poslala 1 e-mail · u 2 e-mailů chybí potvrzení odeslání'))
      assert.equal(html.match(/class="vdm-callout__group"/g)?.length, 2)
      let novotny = text.indexOf('E-mail pro j.novotny@external.test:')
      let kralova = text.indexOf('E-mail pro l.kralova@external.test:')
      assert.ok(novotny !== -1 && novotny < kralova)
      assert.ok(text.indexOf('Rozhovor s varhaníkem') < text.indexOf('Sbor, který zkouší'))
    } finally {
      await app.close()
    }
  })
})
