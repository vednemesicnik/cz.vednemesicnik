import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { createJobRunStore } from '../../../data/job-runs.server.ts'
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
      assert.match(html, /V pořádku/)
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
      assert.match(overdue, /S chybou/)
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
      assert.match(html, /Neběží/)
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
      assert.doesNotMatch(html, /vdm-callout--error/)
    } finally {
      await app.close()
    }
  })

  it('says a job that never reported so, and knows no other job', async () => {
    let { app, browser } = await setup()
    try {
      let html = await (await browser.get('/settings/jobs/artwork-replies')).text()
      assert.match(html, /Úloha Odpovědi k obrazovým dílům se zatím neohlásila\./)
      assert.equal((await browser.get('/settings/jobs/approval-send')).status, 404)
    } finally {
      await app.close()
    }
  })
})
