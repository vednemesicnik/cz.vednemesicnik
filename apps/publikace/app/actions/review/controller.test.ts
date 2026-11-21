import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { createArticleStore } from '../../data/articles.server.ts'
import { createArtworkStore } from '../../data/artworks.server.ts'
import type { BatchRow } from '../../data/artworks.server.ts'
import { createJobRunStore } from '../../data/job-runs.server.ts'
import { APPROVAL_SEND_JOB } from '../../domain/approvals.ts'
import { REPLY_CHECK_JOB, type ReportedArchive } from '../../domain/reply-check.ts'
import {
  createTestApp,
  seedArticle,
  seedBatch,
  seedIssue,
  type TestApp,
} from '../../test-app.server.ts'

const MARIE = 'marie@vednemesicnik.test'
const RECEIVED = Temporal.Instant.from('2026-11-14T06:12:00Z')

/** What a run of the reply check leaves behind: a reported reply, and an archive if any. */
async function replyTo(
  app: TestApp,
  batch: BatchRow,
  text: string,
  options: { archive?: ReportedArchive; isExact?: boolean } = {},
) {
  let store = createArtworkStore(app.database)
  let runKey = crypto.randomUUID()
  let at = Temporal.Now.instant()
  await createJobRunStore(app.database).start({
    at,
    intervalMinutes: 30,
    job: REPLY_CHECK_JOB,
    runKey,
  })
  await app.database.exec(sql`UPDATE artwork_batches SET claimed_at = NULL`)
  await store.claimForReplyCheck(runKey, at)
  return store.recordReport(
    runKey,
    batch.id,
    {
      archive: options.archive ?? null,
      reply: { messageId: `m-${crypto.randomUUID()}`, receivedAt: RECEIVED, text, threadId: 't-1' },
      state: options.isExact === true ? 'reply_matches' : 'other_reply',
    },
    at,
  )
}

/** A later run reading the same reply again, with what it did about the archive. */
async function reportAgain(
  app: TestApp,
  batch: BatchRow,
  messageId: string,
  archive: ReportedArchive,
) {
  let store = createArtworkStore(app.database)
  let runKey = crypto.randomUUID()
  let at = Temporal.Now.instant()
  await createJobRunStore(app.database).start({
    at,
    intervalMinutes: 30,
    job: REPLY_CHECK_JOB,
    runKey,
  })
  await app.database.exec(sql`UPDATE artwork_batches SET claimed_at = NULL`)
  await store.claimForReplyCheck(runKey, at)
  return store.recordReport(
    runKey,
    batch.id,
    {
      archive,
      reply: { messageId, receivedAt: RECEIVED, text: 'ok, souhlas', threadId: 't-1' },
      state: 'other_reply',
    },
    at,
  )
}

/** _Je to souhlas_ as the card sends it, with the reply it showed. */
async function consent(
  app: TestApp,
  browser: ReturnType<TestApp['browser']>,
  batch: BatchRow,
  replyId?: string,
) {
  let current = await createArtworkStore(app.database).findBatch(batch.id)
  return browser.post(
    `/review/batches/${batch.id}/consent`,
    { reply: replyId ?? current?.replyMessageId ?? '' },
    '/review',
  )
}

async function setup() {
  let app = await createTestApp()
  await app.directory.seedInitialAdmin(MARIE, Temporal.Now.instant())
  let browser = app.browser()
  await browser.signInAs(MARIE, 'Marie Horáková')
  let issueId = await seedIssue(app, 'VDM_2026_5')
  let article = await seedArticle(app, issueId, 'Ilustrace k tématu Volby')
  let batch = await seedBatch(app, article, issueId)
  return { app, article, batch, browser, issueId, store: createArtworkStore(app.database) }
}

describe('Ke kontrole', () => {
  it('says there is nothing to decide, and that the job never reported', async () => {
    let { app, browser } = await setup()
    try {
      let html = await (await browser.get('/review')).text()
      assert.match(html, /Nic ke kontrole/)
      assert.match(
        html,
        /<a href="\/settings\/jobs">Žádná z\u00a0úloh pro čtení odpovědí se zatím neohlásila\.<\/a>/,
      )
      assert.match(html, /href="\/review"[^>]*>\s*Ke kontrole\s*</)
    } finally {
      await app.close()
    }
  })

  it('shows a reply with who sent it, when, and its own text, and counts it in the panel', async () => {
    let { app, batch, browser } = await setup()
    try {
      await replyTo(app, batch, 'Můžu se zeptat, kde přesně fotka vyjde?')
      let html = await (await browser.get('/review')).text()
      assert.match(html, /Obrazová díla · 2 díla · VDM_2026_5/)
      assert.match(
        html,
        /Klára Šimková · klara\.simkova@external\.test · přijato 14\. 11\. v\u00a07:12/,
      )
      assert.match(
        html,
        /<blockquote class="vdm-queue-item__quote">Můžu se zeptat, kde přesně fotka vyjde\?<\/blockquote>/,
      )
      assert.match(html, /Další akce pro odpověď \(Klára Šimková\)/)
      assert.match(html, />Ke kontrole<span[^>]*>1<\/span>/)
      /* The artworks' job reported its run; the articles' never did, so the line names it. */
      assert.match(
        html,
        /Úloha <a href="\/settings\/jobs">Žádosti a\u00a0odpovědi u\u00a0článků<\/a> se zatím neohlásila\./,
      )

      let detail = await (await browser.get('/issues/VDM_2026_5')).text()
      assert.match(detail, /odpověď „Můžu se zeptat, kde přesně fotka vyjde\?“/)
    } finally {
      await app.close()
    }
  })

  it('records Je to souhlas, keeps the card for one load with Vrátit, and takes it back', async () => {
    let { app, batch, browser, store } = await setup()
    try {
      await replyTo(app, batch, 'ok, souhlas')
      let answer = await consent(app, browser, batch)
      assert.equal(answer.status, 303)
      assert.equal(answer.headers.get('Location'), `/review#reply-${batch.id}`)
      let stored = await store.findBatch(batch.id)
      assert.equal(stored?.consentVerifiedByEmail, MARIE)
      assert.equal(stored?.consentVerifiedByName, 'Marie Horáková')

      let settled = await (await browser.get('/review')).text()
      assert.match(settled, /vdm-queue-item--settled/)
      assert.match(settled, /Klára Šimková · odpověď „ok, souhlas“/)
      assert.match(
        settled,
        /Souhlas zaznamenán\. Pokus o\u00a0uložení konverzace proběhne kolem \d+:\d\d\./,
      )
      assert.match(
        settled,
        new RegExp(
          `<form action="/review/batches/${batch.id}/consent/undo" method="post"[^>]*><input name="_csrf" type="hidden" value="[^"]+" /><button type="submit" class="vdm-toast__action"`,
        ),
      )
      assert.match(settled, /vdm-btn--ghost vdm-btn--sm">Vrátit</)
      assert.doesNotMatch(settled, />Ke kontrole<span/)

      let next = await (await browser.get('/review')).text()
      assert.match(next, /Nic ke kontrole/)

      await browser.post(`/review/batches/${batch.id}/consent/undo`, {}, '/review')
      assert.equal((await store.findBatch(batch.id))?.consentVerifiedAt, null)
      assert.match(await (await browser.get('/review')).text(), /ok, souhlas<\/blockquote>/)
    } finally {
      await app.close()
    }
  })

  it('tells the editors a batch is discarded, and offers no menu for it', async () => {
    let { app, batch, browser, store } = await setup()
    try {
      await store.discardBatch(batch.id, Temporal.Instant.from('2026-11-18T10:00:00Z'))
      await replyTo(app, batch, 'Souhlasím', { isExact: true })
      let html = await (await browser.get('/review')).text()
      assert.match(html, /dávka zahozena 18\. 11\./)
      assert.match(html, /Dávka je od 18\. 11\. zahozená\./)
      assert.doesNotMatch(html, /Další akce pro odpověď/)
    } finally {
      await app.close()
    }
  })

  it('brings a consent back as Chyba when its archive failed', async () => {
    let { app, batch, browser } = await setup()
    try {
      await replyTo(app, batch, 'Souhlasím', { archive: { error: 'Drive' }, isExact: true })
      let html = await (await browser.get('/review')).text()
      assert.match(html, /konverzace se neuložila/)
      assert.match(html, /Souhlas platí\. Konverzaci se nepodařilo uložit do složky Licence\./)
      assert.match(html, /href="\/settings\/jobs"[^>]*>\s*Úlohy na pozadí\s*</)
      assert.doesNotMatch(html, />Je to souhlas</)
    } finally {
      await app.close()
    }
  })

  it('keeps a decided consent whose archive failed, even against a Vrátit sent by hand', async () => {
    let { app, batch, browser, store } = await setup()
    try {
      await replyTo(app, batch, 'ok, souhlas')
      await consent(app, browser, batch)
      let { replyMessageId } = (await store.findBatch(batch.id)) ?? {}
      await reportAgain(app, batch, replyMessageId ?? '', { error: 'Drive' })
      let html = await (await browser.get('/review')).text()
      assert.match(html, /konverzace se neuložila/)
      assert.doesNotMatch(html, /vdm-btn--ghost vdm-btn--sm">Vrátit</)

      await browser.post(`/review/batches/${batch.id}/consent/undo`, {}, '/review')
      let stored = await store.findBatch(batch.id)
      assert.equal(stored?.consentVerifiedByEmail, MARIE)
      assert.notEqual(stored?.archiveFailedAt, null)
    } finally {
      await app.close()
    }
  })

  it('keeps an approved batch out of the queue, with its conversation in Licence', async () => {
    let { app, batch, browser } = await setup()
    try {
      await replyTo(app, batch, 'Souhlasím', { archive: { fileId: 'pdf-1' }, isExact: true })
      assert.match(await (await browser.get('/review')).text(), /Nic ke kontrole/)
      assert.match(
        await (await browser.get('/issues/VDM_2026_5')).text(),
        /konverzace v\u00a0Licencích/,
      )
    } finally {
      await app.close()
    }
  })

  it('sends somebody not signed in to sign in, and records nothing they send', async () => {
    let { app, batch, store } = await setup()
    try {
      await replyTo(app, batch, 'ok, souhlas')
      let stranger = app.browser()
      let response = await stranger.get('/review')
      assert.equal(response.status, 303)
      assert.match(response.headers.get('Location') ?? '', /^\/sign-in/)
      await consent(app, stranger, batch)
      assert.equal((await store.findBatch(batch.id))?.consentVerifiedAt, null)
    } finally {
      await app.close()
    }
  })

  it('confirms only the reply the card showed', async () => {
    let { app, batch, browser, store } = await setup()
    try {
      await replyTo(app, batch, 'ok, souhlas')
      let shown = (await store.findBatch(batch.id))?.replyMessageId ?? ''
      await replyTo(app, batch, 'Ještě počkejte, prosím.')
      await consent(app, browser, batch, shown)
      assert.equal((await store.findBatch(batch.id))?.consentVerifiedAt, null)
    } finally {
      await app.close()
    }
  })

  it('sends a decided reply back to Ke kontrole when the provider writes again', async () => {
    let { app, batch, browser, store } = await setup()
    try {
      await replyTo(app, batch, 'ok, souhlas')
      await consent(app, browser, batch)
      await replyTo(app, batch, 'Ne, beru zpět.')
      let stored = await store.findBatch(batch.id)
      assert.equal(stored?.consentVerifiedAt, null)
      assert.equal(await store.reviewCount(), 1)
    } finally {
      await app.close()
    }
  })

  it('records nothing in an issue that was closed', async () => {
    let { app, batch, browser, issueId, store } = await setup()
    try {
      await replyTo(app, batch, 'ok, souhlas')
      await app.database.exec(
        sql`UPDATE issues SET closed_at = ${'2026-11-19T10:00:00.000Z'} WHERE id = ${issueId}`,
      )
      await consent(app, browser, batch)
      assert.equal((await store.findBatch(batch.id))?.consentVerifiedAt, null)
    } finally {
      await app.close()
    }
  })
})

/**
 * An article's final version whose one author answered something other than „Souhlasím“, as the
 * job leaves it: marked, sent, and its reply reported.
 */
async function articleReply(app: TestApp, articleId: number, text: string): Promise<number> {
  let articles = createArticleStore(app.database)
  let runs = createJobRunStore(app.database)
  /* To the millisecond, as the database keeps a take: the marking must find the same one. */
  let at = Temporal.Instant.fromEpochMilliseconds(Date.now())
  let taker = { email: 'lenka@vednemesicnik.test', name: 'Lenka Svobodová' }
  await articles.takeProofreading(articleId, taker, at, 'writing')
  await articles.markFinalVersion({
    at,
    by: taker,
    id: articleId,
    pdf: { attemptKey: `a-${articleId}`, fileId: `pdf-${articleId}`, hash: 'h' },
    takenAt: at,
  })
  let sending = crypto.randomUUID()
  await runs.start({ at, intervalMinutes: 30, job: APPROVAL_SEND_JOB, runKey: sending })
  let [clause] = await articles.claimForSending(sending, at)
  await articles.recordSending(sending, clause?.clauseKey ?? '', { kind: 'sent' }, at)
  let reading = crypto.randomUUID()
  await articles.claimForReplies(reading, at)
  await articles.recordReply(
    reading,
    clause?.clauseKey ?? '',
    {
      archive: null,
      reply: {
        messageId: 'm-article',
        receivedAt: RECEIVED.add({ hours: 1 }),
        text,
        threadId: 't',
      },
      state: 'other_reply',
    },
    at,
  )
  let [queued] = await articles.reviewQueue()
  return queued?.id ?? 0
}

describe('Ke kontrole for articles', () => {
  it('shows an author’s reply beside the artworks’, by when each arrived, and counts both', async () => {
    let { app, article, batch, browser } = await setup()
    try {
      await replyTo(app, batch, 'ok, souhlas')
      await articleReply(app, article.articleId, 'Souhlasím, jen prosím jiný podpis.')
      let html = await (await browser.get('/review')).text()
      assert.match(html, />Ke kontrole<span[^>]*>2<\/span>/)
      let artworks = html.indexOf('Obrazová díla · 2 díla · VDM_2026_5')
      let final = html.indexOf('Finální verze článku · VDM_2026_5')
      assert.ok(artworks !== -1 && final > artworks)
      assert.match(html, /Tereza Vlková · tereza\.vlkova@external\.test · přijato 14\. 11\./)
      assert.match(html, /Souhlasím, jen prosím jiný podpis\./)
      assert.match(html, /action="\/review\/clauses\/\d+\/consent"/)

      let detail = await (await browser.get('/issues/VDM_2026_5')).text()
      assert.match(detail, /Jiná odpověď · Tereza Vlková/)
    } finally {
      await app.close()
    }
  })

  it('records Je to souhlas on a clause, keeps the card with Vrátit, and takes it back', async () => {
    let { app, article, browser } = await setup()
    try {
      let id = await articleReply(app, article.articleId, 'ok')
      let wrong = await browser.post(
        `/review/clauses/${id}/consent`,
        { reply: 'm-other' },
        '/review',
      )
      assert.equal(wrong.status, 303)
      let articles = createArticleStore(app.database)
      assert.equal(await articles.reviewCount(), 1)

      let response = await browser.post(
        `/review/clauses/${id}/consent`,
        { reply: 'm-article' },
        '/review',
      )
      assert.equal(response.headers.get('Location'), `/review#reply-clause-${id}`)
      assert.equal(await articles.reviewCount(), 0)
      let html = await (await browser.get('/review')).text()
      assert.match(html, /vdm-queue-item--settled/)
      assert.match(html, new RegExp(`action="/review/clauses/${id}/consent/undo"`))
      assert.match(await (await browser.get('/issues/VDM_2026_5')).text(), /souhlas zaznamenán/)

      await browser.post(`/review/clauses/${id}/consent/undo`, {}, '/review')
      assert.equal(await articles.reviewCount(), 1)
    } finally {
      await app.close()
    }
  })
})
