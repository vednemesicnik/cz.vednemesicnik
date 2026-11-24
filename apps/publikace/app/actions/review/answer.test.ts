import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { createAnswerStore } from '../../data/answers.server.ts'
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
const ANSWER = 'Dobrý den,\n\nfotka vyjde uvnitř čísla na straně 12.\nNa obálku ji nedáváme.'

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

/** An article's final version whose one author answered something other than „Souhlasím“. */
async function articleReply(app: TestApp, articleId: number, text: string): Promise<number> {
  let articles = createArticleStore(app.database)
  let runs = createJobRunStore(app.database)
  let at = Temporal.Instant.fromEpochMilliseconds(Date.now())
  let taker = { email: 'lenka@vednemesicnik.test', name: 'Lenka Svobodová' }
  await articles.takeProofreading(articleId, taker, at, 'writing')
  await articles.markFinalVersion({
    at,
    by: taker,
    id: articleId,
    pdf: {
      attemptKey: `a-${articleId}`,
      docModifiedAt: null,
      fileId: `pdf-${articleId}`,
      hash: 'h',
    },
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

/** The answers the app handed the Mailer, sent or not: the messages that go into a thread. */
function answersMailed(app: TestApp) {
  return app.mail.filter((message) => message.replyToMessageId !== undefined)
}

/** _Odeslat odpověď_ as the form on a card sends it, to the reply the card showed. */
async function answerBatch(
  app: TestApp,
  browser: ReturnType<TestApp['browser']>,
  batch: BatchRow,
  text: string,
  replyId?: string,
) {
  let current = await createArtworkStore(app.database).findBatch(batch.id)
  return browser.post(
    `/review/batches/${batch.id}/reply`,
    { reply: replyId ?? current?.replyMessageId ?? '', text },
    '/review',
  )
}

/** The page the redirect after a send leads to. */
async function landing(browser: ReturnType<TestApp['browser']>, response: Response) {
  return (await browser.get(response.headers.get('Location') ?? '/review')).text()
}

/** The words without the non-breaking spaces `tied` puts after one-letter words. */
function plain(html: string): string {
  return html.replaceAll(' ', ' ')
}

describe('answering a reply from Ke kontrole', () => {
  it('offers Odpovědět and opens the form from the address, with the signature', async () => {
    let { app, batch, browser } = await setup()
    try {
      await replyTo(app, batch, 'Můžu se zeptat, kde přesně fotka vyjde?')
      let html = await (await browser.get('/review')).text()
      assert.match(html, new RegExp(`href="/review\\?reply=${batch.id}#reply-${batch.id}"`))
      /* Closed, the form is drawn hidden and the card's actions are not. */
      assert.match(html, /<div hidden[^>]*><form[^>]*class="vdm-queue-item__compose"/)
      assert.doesNotMatch(html, new RegExp(`<div hidden[^>]*id="reply-${batch.id}-actions"`))

      let open = plain(await (await browser.get(`/review?reply=${batch.id}`)).text())
      assert.match(open, new RegExp(`<div hidden[^>]*id="reply-${batch.id}-actions"`))
      assert.doesNotMatch(open, /<div hidden[^>]*><form[^>]*class="vdm-queue-item__compose"/)
      assert.match(open, /Odpověď poskytovateli/)
      assert.match(open, /Odpověď odejde jen poskytovateli ve vlákně žádosti o souhlas\./)
      assert.match(open, /Marie Horáková<br\s*\/?>Vedneměsíčník/)
    } finally {
      await app.close()
    }
  })

  it('sends the answer inside the thread, then keeps the card with what went', async () => {
    let { app, batch, browser, store } = await setup()
    try {
      await replyTo(app, batch, 'Můžu se zeptat, kde přesně fotka vyjde?')
      let replyId = (await store.findBatch(batch.id))?.replyMessageId ?? ''
      let response = await answerBatch(app, browser, batch, ANSWER)
      assert.equal(response.status, 303)
      assert.equal(response.headers.get('Location'), `/review#reply-${batch.id}`)

      let [mail] = answersMailed(app)
      let body = plain(mail?.htmlBody ?? '')
      assert.equal(mail?.replyToMessageId, replyId)
      assert.equal(mail?.to, 'klara.simkova@external.test')
      assert.equal(mail?.name, 'Publikace Vedneměsíčník')
      assert.match(
        body,
        /<p[^>]*>Dobrý den,<\/p><p[^>]*>fotka vyjde uvnitř čísla na straně 12\.<br>Na obálku ji nedáváme\.<\/p>/,
      )
      assert.match(body, /Marie Horáková<\/p><p[^>]*>Vedneměsíčník<\/p>/)
      assert.match(body, /Vaše zpráva přijatá 14\. 11\. 2026 v 7:12:/)
      assert.match(
        body,
        /<blockquote[^>]*><p[^>]*>Můžu se zeptat, kde přesně fotka vyjde\?<\/p><\/blockquote>/,
      )

      let after = plain(await (await browser.get('/review')).text())
      assert.match(after, /vdm-queue-item--settled/)
      assert.match(after, /U poskytovatele/)
      assert.match(after, /Odpovědi z Publikace \(1\)/)
      assert.match(after, /Odpověď odešla na klara\.simkova@external\.test\./)
      assert.equal(await store.reviewCount(), 0)

      let detail = await (await browser.get('/issues/VDM_2026_5')).text()
      assert.match(detail, /odpověď odeslána \d+\. \d+\./)
      assert.match(await (await browser.get('/review')).text(), /Nic ke kontrole/)
    } finally {
      await app.close()
    }
  })

  it('sends nothing without a text or over the cap, and says why under the field', async () => {
    let { app, batch, browser } = await setup()
    try {
      await replyTo(app, batch, 'Můžu se zeptat?')
      let empty = await answerBatch(app, browser, batch, '   \n ')
      assert.equal(empty.headers.get('Location'), `/review?reply=${batch.id}#reply-${batch.id}`)
      assert.match(await landing(browser, empty), /Napište odpověď\./)

      let long = await answerBatch(app, browser, batch, 'a'.repeat(5214))
      assert.match(
        plain(await landing(browser, long)),
        /Zkraťte odpověď na nejvýš 5 000 znaků\. Teď jich má 5 214\./,
      )
      assert.equal(answersMailed(app).length, 0)
    } finally {
      await app.close()
    }
  })

  it('locks the text of a send the Mailer did not confirm, and sends it again under its key', async () => {
    let { app, batch, browser, store } = await setup()
    try {
      await replyTo(app, batch, 'Můžu se zeptat?')
      app.failMail(true)
      let html = await landing(browser, await answerBatch(app, browser, batch, ANSWER))
      assert.match(html, /Zkuste odpověď odeslat za chvíli znovu\./)
      assert.match(html, /vdm-field__input--locked/)
      assert.match(html, /Odeslat znovu/)
      assert.equal(await store.reviewCount(), 1)

      /* Anybody opening the form again finds the same locked text, never an empty field. */
      let reopened = await (await browser.get(`/review?reply=${batch.id}`)).text()
      assert.match(reopened, /Odeslat znovu/)
      assert.match(reopened, /fotka vyjde uvnitř čísla na straně 12\./)

      let answerId = /name="answer" type="hidden" value="(\d+)"/.exec(html)?.[1] ?? ''
      app.failMail(false)
      await browser.post(
        `/review/batches/${batch.id}/reply/retry`,
        { answer: answerId, reply: '', text: 'jiný text' },
        '/review',
      )
      let [first, second] = answersMailed(app)
      assert.equal(second?.idempotencyKey, first?.idempotencyKey)
      assert.equal(second?.htmlBody, first?.htmlBody)
      assert.equal(await store.reviewCount(), 0)
    } finally {
      await app.close()
    }
  })

  it('takes the send away once the post refused the answer for good', async () => {
    let { app, batch, browser, store } = await setup()
    try {
      await replyTo(app, batch, 'Můžu se zeptat?')
      app.failMail('reply_not_allowed')
      let html = plain(await landing(browser, await answerBatch(app, browser, batch, ANSWER)))
      assert.match(html, /Pošta odpověď na klara\.simkova@external\.test trvale odmítla\./)
      assert.doesNotMatch(html, /Odeslat znovu/)
      assert.doesNotMatch(html, />Odeslat odpověď</)
      assert.match(html, /Zavřít/)
      assert.equal(await store.reviewCount(), 1)
    } finally {
      await app.close()
    }
  })

  it('sends nothing to a reply that is not the latest, and keeps the text in the field', async () => {
    let { app, batch, browser } = await setup()
    try {
      await replyTo(app, batch, 'Můžu se zeptat?')
      let stale = (await createArtworkStore(app.database).findBatch(batch.id))?.replyMessageId
      await replyTo(app, batch, 'A ještě jedna věc.')
      let html = await landing(browser, await answerBatch(app, browser, batch, ANSWER, stale ?? ''))
      assert.match(html, /Přečtěte si novou odpověď poskytovatele\./)
      assert.match(html, /fotka vyjde uvnitř čísla na straně 12\./)
      assert.equal(answersMailed(app).length, 0)
    } finally {
      await app.close()
    }
  })

  it('lets one answer through to one message, and shows the next writer what went', async () => {
    let { app, batch, browser } = await setup()
    try {
      await replyTo(app, batch, 'Můžu se zeptat?')
      let replyId = (await createArtworkStore(app.database).findBatch(batch.id))?.replyMessageId
      await answerBatch(app, browser, batch, ANSWER)
      await browser.get('/review')
      let second = await answerBatch(app, browser, batch, 'Druhá odpověď.', replyId ?? '')
      let html = await landing(browser, second)
      assert.match(html, /Přečtěte si odpověď, která poskytovateli mezitím odešla\./)
      assert.match(html, /Druhá odpověď\./)
      assert.equal(answersMailed(app).length, 1)
    } finally {
      await app.close()
    }
  })

  it('stops at the daily cap and keeps nothing of the answer but the text in the field', async () => {
    let { app, batch, browser } = await setup()
    try {
      await replyTo(app, batch, 'Můžu se zeptat?')
      let at = Temporal.Now.instant().toString()
      for (let index = 0; index < 300; index += 1) {
        await app.database.exec(
          sql`INSERT INTO public_mail_log (kind, sent_at) VALUES ('consent', ${at})`,
        )
      }
      let html = await landing(browser, await answerBatch(app, browser, batch, ANSWER))
      assert.match(html, /Zkuste odpověď odeslat později\./)
      assert.match(html, />Odeslat odpověď</)
      assert.match(html, /fotka vyjde uvnitř čísla na straně 12\./)
      assert.equal(answersMailed(app).length, 0)
      let kept = await app.database.exec(sql`SELECT count(*) AS count FROM consent_answers`)
      assert.equal(Number(kept.rows?.[0]?.['count']), 0)
    } finally {
      await app.close()
    }
  })

  it('brings the card back when the provider writes again, with the earlier answer closed', async () => {
    let { app, batch, browser, store } = await setup()
    try {
      await replyTo(app, batch, 'Můžu se zeptat?')
      await answerBatch(app, browser, batch, ANSWER)
      await browser.get('/review')
      await replyTo(app, batch, 'Na straně 12 je to v pořádku, tak tedy ano.')
      assert.equal(await store.reviewCount(), 1)
      let html = plain(await (await browser.get('/review')).text())
      assert.match(
        html,
        /<details class="vdm-queue-item__sent"><summary>Dřívější odpovědi z Publikace \(1\)/,
      )
      assert.match(html, /Na straně 12 je to v pořádku/)
    } finally {
      await app.close()
    }
  })

  it('has the Evidence written again once an answer went', async () => {
    let { app, batch, browser, issueId } = await setup()
    try {
      await replyTo(app, batch, 'Můžu se zeptat?')
      await app.database.exec(sql`DELETE FROM record_marks`)
      await answerBatch(app, browser, batch, ANSWER)
      let marks = await app.database.exec(
        sql`SELECT kind, issue_id FROM record_marks WHERE kind = 'evidence'`,
      )
      assert.deepEqual(
        (marks.rows ?? []).map((row) => Number(row['issue_id'])),
        [issueId],
      )
    } finally {
      await app.close()
    }
  })

  it('deletes the answers with the reply once the conversation is in Licence', async () => {
    let { app, batch, browser } = await setup()
    try {
      await replyTo(app, batch, 'Můžu se zeptat?')
      await answerBatch(app, browser, batch, ANSWER)
      await replyTo(app, batch, 'Souhlasím', { archive: { fileId: 'pdf-1' }, isExact: true })
      let kept = await app.database.exec(sql`SELECT count(*) AS count FROM consent_answers`)
      assert.equal(Number(kept.rows?.[0]?.['count']), 0)
    } finally {
      await app.close()
    }
  })

  it('sends nothing in a closed issue, and keeps the text on the card until the next load', async () => {
    let { app, batch, browser, issueId } = await setup()
    try {
      await replyTo(app, batch, 'Můžu se zeptat?')
      await app.database.exec(
        sql`UPDATE issues SET closed_at = ${'2026-11-19T10:00:00.000Z'} WHERE id = ${issueId}`,
      )
      let html = plain(await landing(browser, await answerBatch(app, browser, batch, ANSWER)))
      assertLockedOnCard(html, 'Vydání VDM_2026_5 je mezitím uzavřené.', 'Odpověď neodešla.')
      /* The card keeps what it showed: its reply and its tag. */
      assert.match(html, /Můžu se zeptat\?/)
      assert.match(html, /Ke kontrole/)
      assert.equal(answersMailed(app).length, 0)
      await assertGoneOnReload(browser)
    } finally {
      await app.close()
    }
  })

  it('keeps the card Schváleno with the text when the consent came meanwhile', async () => {
    let { app, batch, browser } = await setup()
    try {
      await replyTo(app, batch, 'Můžu se zeptat?')
      let asked = (await createArtworkStore(app.database).findBatch(batch.id))?.replyMessageId
      await replyTo(app, batch, 'Souhlasím', { isExact: true })
      let response = await answerBatch(app, browser, batch, ANSWER, asked ?? '')
      let html = plain(await landing(browser, response))
      assertLockedOnCard(
        html,
        'Díla jsou mezitím schválená. Od poskytovatele přišla odpověď „Souhlasím“.',
        'Vaše odpověď neodešla.',
      )
      assert.match(html, /Schváleno/)
      assert.match(html, /konverzace v Licencích/)
      /* The app keeps no text of the message answered, so the card quotes none. */
      assert.doesNotMatch(html, /Můžu se zeptat\?/)
      assert.match(html, /href="\/review"[^>]*>Vše<span[^>]*>0<\/span>/)
      assert.match(html, /href="\/review\?kind=artworks"[^>]*>Obrazová díla<span[^>]*>0<\/span>/)
      assert.equal(answersMailed(app).length, 0)
      await assertGoneOnReload(browser)
    } finally {
      await app.close()
    }
  })

  it('keeps the card Schváleno once the conversation is already in Licence', async () => {
    let { app, batch, browser } = await setup()
    try {
      await replyTo(app, batch, 'Můžu se zeptat?')
      let asked = (await createArtworkStore(app.database).findBatch(batch.id))?.replyMessageId
      await replyTo(app, batch, 'Souhlasím', { archive: { fileId: 'pdf-1' }, isExact: true })
      let response = await answerBatch(app, browser, batch, ANSWER, asked ?? '')
      let html = plain(await landing(browser, response))
      assertLockedOnCard(
        html,
        'Díla jsou mezitím schválená. Od poskytovatele přišla odpověď „Souhlasím“.',
        'Vaše odpověď neodešla.',
      )
      assert.match(html, /Schváleno/)
      assert.equal(answersMailed(app).length, 0)
      await assertGoneOnReload(browser)
    } finally {
      await app.close()
    }
  })
})

/**
 * The card an answer did not reach, as `13e` draws it: settled in place, the text locked in the
 * field, the Callout's title over its reason, _Zavřít_ alone and nothing above the queue.
 */
function assertLockedOnCard(html: string, title: string, reason: string) {
  let escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  assert.match(html, /vdm-queue-item--settled/)
  assert.match(
    html,
    new RegExp(`<p class="vdm-callout__title">${escape(title)}</p><p[^>]*>${escape(reason)}</p>`),
  )
  assert.match(html, /vdm-field__input--locked[^>]*>[^<]*fotka vyjde uvnitř čísla na straně 12\./)
  assert.match(html, />Zavřít</)
  assert.doesNotMatch(html, />Odeslat odpověď</)
  assert.doesNotMatch(html, /Po dalším načtení stránky už tu text nebude\./)
}

/** The next load: the card has left the queue, and its text with it. */
async function assertGoneOnReload(browser: ReturnType<TestApp['browser']>) {
  let html = await (await browser.get('/review')).text()
  assert.doesNotMatch(html, /vdm-queue-item--settled/)
  assert.doesNotMatch(html, /fotka vyjde uvnitř čísla na straně 12\./)
  assert.doesNotMatch(html, /neodešla/)
}

describe('an answer still on its way', () => {
  it('cannot be sent again from another tab, and the other editor keeps the text', async () => {
    let { app, batch, browser } = await setup()
    try {
      await replyTo(app, batch, 'Můžu se zeptat?')
      let replyId = (await createArtworkStore(app.database).findBatch(batch.id))?.replyMessageId
      /* A send that went to the Mailer a moment ago and has no answer from it yet. */
      let started = await createAnswerStore(app.database).start(
        { id: batch.id, kind: 'artworks' },
        {
          editor: { displayName: 'Jana Malá', email: 'jana@vednemesicnik.test' },
          messageId: replyId ?? '',
          signatureName: 'Jana Malá',
          text: 'Odpověď kolegyně.',
        },
        Temporal.Now.instant(),
      )
      assert.equal(started.kind, 'started')

      let response = await answerBatch(app, browser, batch, ANSWER)
      let html = plain(await landing(browser, response))
      assert.match(html, /Odpověď kolegyně\./)
      assert.doesNotMatch(html, />Odeslat znovu</)
      assert.match(html, /Odpověď neodešla/)
      assert.match(html, /fotka vyjde uvnitř čísla na straně 12\./)

      let answerId = started.kind === 'started' ? String(started.answer.id) : ''
      await browser.post(
        `/review/batches/${batch.id}/reply/retry`,
        { answer: answerId, reply: '', text: '' },
        '/review',
      )
      assert.equal(answersMailed(app).length, 0)
    } finally {
      await app.close()
    }
  })
})

describe('answering an author from Ke kontrole', () => {
  it('answers in the thread of the final version, in the article’s words', async () => {
    let { app, article, browser } = await setup()
    try {
      let id = await articleReply(app, article.articleId, 'Můžu ještě opravit podtitulek?')
      let open = plain(await (await browser.get(`/review?reply=clause-${id}`)).text())
      assert.match(open, /Odpověď autorovi/)
      assert.match(
        open,
        /Odpověď odejde jen tomuto autorovi ve vlákně žádosti o potvrzení finální verze\./,
      )

      await browser.post(
        `/review/clauses/${id}/reply`,
        { reply: 'm-article', text: ANSWER },
        '/review',
      )
      let [mail] = answersMailed(app)
      assert.equal(mail?.replyToMessageId, 'm-article')
      assert.equal(mail?.to, 'tereza.vlkova@external.test')
      assert.match(mail?.subject ?? '', /^Žádost o potvrzení finální verze článku/)
      assert.match(plain(mail?.htmlBody ?? ''), /mezi autory článku\./)
      assert.equal(await createArticleStore(app.database).reviewCount(), 0)

      /* The author's line is in the article's open row (`12b`). */
      let detail = await (
        await browser.get(`/issues/VDM_2026_5?article=${article.articleId}`)
      ).text()
      assert.match(detail, /odpověď odeslána \d+\. \d+\./)
    } finally {
      await app.close()
    }
  })

  it('keeps an author’s card Souhlasí with the text when the author agreed meanwhile', async () => {
    let { app, article, browser } = await setup()
    try {
      let id = await articleReply(app, article.articleId, 'Můžu ještě opravit podtitulek?')
      await app.database.exec(
        sql`UPDATE article_clauses SET approved_at = ${Temporal.Now.instant().toString()},
              consent_file_id = 'pdf-clause', reply_text = NULL WHERE id = ${id}`,
      )
      let response = await browser.post(
        `/review/clauses/${id}/reply`,
        { reply: 'm-article', text: ANSWER },
        '/review',
      )
      let html = plain(await landing(browser, response))
      assertLockedOnCard(
        html,
        'Od autora mezitím přišla odpověď „Souhlasím“.',
        'Vaše odpověď neodešla.',
      )
      assert.match(html, /Ilustrace k tématu Volby/)
      assert.match(html, /Souhlasí/)
      assert.equal(answersMailed(app).length, 0)
      await assertGoneOnReload(browser)
    } finally {
      await app.close()
    }
  })

  it('sends nothing on a final version a newer one replaced, and gives the text back', async () => {
    let { app, article, browser } = await setup()
    try {
      let id = await articleReply(app, article.articleId, 'Můžu ještě opravit podtitulek?')
      await app.database.exec(
        sql`UPDATE final_versions SET replaced_at = ${'2026-11-19T10:00:00.000Z'}`,
      )
      await browser.post(
        `/review/clauses/${id}/reply`,
        { reply: 'm-article', text: ANSWER },
        '/review',
      )
      let html = await (await browser.get('/review')).text()
      assert.match(html, /Odpověď neodešla/)
      assert.match(html, /Tereza Vlková · tereza\.vlkova@external\.test/)
      assert.match(html, /fotka vyjde uvnitř čísla na straně 12\./)
      assert.equal(answersMailed(app).length, 0)
    } finally {
      await app.close()
    }
  })
})
