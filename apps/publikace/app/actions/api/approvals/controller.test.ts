import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { appOrigin } from '../../../auth/environment.server.ts'
import { createArticleStore } from '../../../data/articles.server.ts'
import {
  createTestApp,
  fakeIdentityToken,
  JOB_TOKEN,
  seedArticle,
  seedIssue,
  type TestApp,
} from '../../../test-app.server.ts'

const CLAIM = '/api/v1/approvals/claim'
const REPORT = '/api/v1/approvals/report'
const LENKA = { email: 'lenka.svobodova@vednemesicnik.test', name: 'Lenka Svobodová' }
const AT = Temporal.Instant.from('2026-11-21T08:00:00Z')

type Claimed = {
  clauses: { authorEmail: string; clauseKey: string; pdfFileId: string; signature: string }[]
  runKey: string
}

function call(
  app: TestApp,
  path: string,
  body: unknown,
  token: string | null = JOB_TOKEN,
): Promise<Response> {
  let headers = new Headers({ 'Content-Type': 'application/json' })
  if (token !== null) headers.set('Authorization', `Bearer ${token}`)
  return app.fetch(
    new Request(new URL(path, appOrigin()), {
      body: JSON.stringify(body),
      headers,
      method: 'POST',
    }),
  )
}

async function claim(app: TestApp): Promise<Claimed> {
  let response = await call(app, CLAIM, { intervalMinutes: 30 })
  assert.equal(response.status, 200)
  assert.equal(response.headers.getSetCookie().length, 0)
  return (await response.json()) as Claimed
}

/** An article taken and marked, as the page Korektura leaves it. */
async function marked(app: TestApp, issueName = 'VDM_2026_6'): Promise<number> {
  let issueId = await seedIssue(app, issueName)
  let { articleId } = await seedArticle(app, issueId)
  let articles = createArticleStore(app.database)
  await articles.takeProofreading(articleId, LENKA, AT, 'writing')
  let outcome = await articles.markFinalVersion({
    at: AT.add({ hours: 1 }),
    by: LENKA,
    id: articleId,
    pdf: { attemptKey: `a-${articleId}`, fileId: `pdf-${articleId}`, hash: 'h' },
    takenAt: AT,
  })
  assert.equal(outcome.kind, 'done')
  return articleId
}

describe('the API of Article_Approvals', () => {
  it('lets in only the job account', async () => {
    let app = await createTestApp()
    try {
      assert.equal((await call(app, CLAIM, { intervalMinutes: 30 }, null)).status, 401)
      let other = fakeIdentityToken({ email: 'marie@vednemesicnik.test', name: null })
      assert.equal((await call(app, CLAIM, { intervalMinutes: 30 }, other)).status, 401)
      assert.equal((await call(app, CLAIM, { intervalMinutes: 0 })).status, 400)
    } finally {
      await app.close()
    }
  })

  it('hands each clause to one run, and ends the marking’s way back', async () => {
    let app = await createTestApp()
    try {
      let articleId = await marked(app)
      let first = await claim(app)
      assert.deepEqual(
        first.clauses.map((clause) => [clause.signature, clause.authorEmail, clause.pdfFileId]),
        [['Tereza Vlková', 'tereza.vlkova@external.test', `pdf-${articleId}`]],
      )
      assert.deepEqual((await claim(app)).clauses, [])
      let article = await createArticleStore(app.database).findById(articleId)
      assert.equal(article?.finalVersion?.isCancellable, false)
      assert.deepEqual(
        await createArticleStore(app.database).cancelFinalVersion(
          articleId,
          AT.add({ hours: 2 }),
          AT.add({ hours: 1 }),
        ),
        { kind: 'too-late' },
      )
    } finally {
      await app.close()
    }
  })

  it('records sent and failed clauses, and refuses a run it does not know', async () => {
    let app = await createTestApp()
    try {
      let sentId = await marked(app, 'VDM_2026_6')
      let failedId = await marked(app, 'VDM_2026_7')
      let { clauses, runKey } = await claim(app)
      let [sent, failed] = clauses
      assert.ok(sent !== undefined && failed !== undefined)

      let unknown = await call(app, REPORT, { outcome: 'ok', results: [], runKey: 'nope' })
      assert.equal(unknown.status, 409)
      let response = await call(app, REPORT, {
        outcome: 'ok',
        results: [
          { clauseKey: sent.clauseKey, outcome: 'sent' },
          { clauseKey: failed.clauseKey, error: 'Mailer: 550', outcome: 'failed' },
          { clauseKey: 'clause_0_0_0', outcome: 'sent' },
        ],
        runKey,
      })
      assert.equal(response.status, 200)
      assert.deepEqual(
        ((await response.json()) as { results: { answer: string }[] }).results.map((r) => r.answer),
        ['done', 'done', 'unknown'],
      )

      let articles = createArticleStore(app.database)
      assert.deepEqual((await articles.findById(sentId))?.finalVersion?.clauses, {
        approved: 0,
        pending: 0,
        review: 0,
        total: 1,
        unarchived: 0,
        unsent: 0,
        verified: 0,
        waiting: 1,
      })
      assert.equal((await articles.findById(failedId))?.finalVersion?.clauses.unsent, 1)
      let error = await app.database.exec(
        sql`SELECT error FROM article_clauses WHERE clause_key = ${failed.clauseKey}`,
      )
      assert.equal(error.rows?.[0]?.['error'], 'Mailer: 550')
    } finally {
      await app.close()
    }
  })

  it('leaves out the clauses of closed issues and cancelled markings', async () => {
    let app = await createTestApp()
    try {
      let articleId = await marked(app)
      let articles = createArticleStore(app.database)
      let cancelled = await articles.cancelFinalVersion(
        articleId,
        AT.add({ hours: 2 }),
        AT.add({ hours: 1 }),
      )
      assert.deepEqual(cancelled, { kind: 'done', pdfFileId: `pdf-${articleId}` })
      assert.equal((await articles.findById(articleId))?.proofreading?.email, LENKA.email)
      assert.deepEqual((await claim(app)).clauses, [])

      let closedId = await marked(app, 'VDM_2026_7')
      let closed = await articles.findById(closedId)
      await app.database.exec(
        sql`UPDATE issues SET closed_at = ${AT.toString()} WHERE id = ${closed?.issueId ?? 0}`,
      )
      assert.deepEqual((await claim(app)).clauses, [])
    } finally {
      await app.close()
    }
  })

  it('refuses Zrušit korekturu once the final version stands', async () => {
    let app = await createTestApp()
    try {
      let articleId = await marked(app)
      let outcome = await createArticleStore(app.database).cancelProofreading(
        articleId,
        AT.add({ hours: 2 }),
      )
      assert.equal(outcome.kind, 'final-version')
    } finally {
      await app.close()
    }
  })
})

type ClaimedReplies = Claimed & {
  replies: {
    clauseKey: string
    expectedReply: string
    isVerified: boolean
    licencesFolderId: string | null
    sender: string
    subjectContains: string[]
    subjectPrefix: string
    subjectTag: string
    verifiedConsentNote: string
  }[]
}

const EDITOR = { displayName: 'Marie Horáková', email: 'marie@vednemesicnik.test' }

function replyOf(messageId: string, text: string) {
  return { messageId, receivedAt: '2026-11-21T10:00:00Z', text, threadId: 'thread-1' }
}

/** One run's report of one reply, sending nothing. */
async function reportReply(
  app: TestApp,
  runKey: string,
  reply: Record<string, unknown>,
): Promise<string | undefined> {
  let response = await call(app, REPORT, { outcome: 'ok', replies: [reply], results: [], runKey })
  assert.equal(response.status, 200)
  let body = (await response.json()) as { replies: { answer: string }[] }
  return body.replies[0]?.answer
}

/** A marked article whose one clause a run sent, as the Mailer confirmed it. */
async function sent(app: TestApp, outcome: 'failed' | 'sent' = 'sent') {
  let articleId = await marked(app)
  let { clauses, runKey } = await claim(app)
  let clauseKey = clauses[0]?.clauseKey ?? ''
  let result =
    outcome === 'sent' ? { clauseKey, outcome } : { clauseKey, error: 'Mailer: timeout', outcome }
  assert.equal((await call(app, REPORT, { outcome: 'ok', results: [result], runKey })).status, 200)
  return { articleId, clauseKey }
}

async function claimReplies(app: TestApp): Promise<ClaimedReplies> {
  let response = await call(app, CLAIM, { intervalMinutes: 30 })
  assert.equal(response.status, 200)
  return (await response.json()) as ClaimedReplies
}

describe('the replies of Article_Approvals', () => {
  it('hands a sent clause to one run, with what Reply_Check needs and where the PDF goes', async () => {
    let app = await createTestApp()
    try {
      let { articleId, clauseKey } = await sent(app)
      let next = await claimReplies(app)
      assert.deepEqual(next.clauses, [])
      let article = await createArticleStore(app.database).findById(articleId)
      assert.deepEqual(next.replies, [
        {
          articleName: article?.name,
          authorName: 'Tereza Vlková',
          clauseKey,
          expectedReply: 'Souhlasím',
          isVerified: false,
          issueName: 'VDM_2026_6',
          licencesFolderId: article?.licencesFolderId,
          sender: 'tereza.vlkova@external.test',
          subjectContains: [article?.name],
          subjectPrefix: 'Žádost o potvrzení finální verze článku',
          subjectTag: clauseKey,
          verifiedConsentNote: 'Odpověď autora byla ručně posouzena jako souhlas.',
        },
      ])
      assert.deepEqual((await claimReplies(app)).replies, [])
    } finally {
      await app.close()
    }
  })

  it('makes the article Schváleno once an exact „Souhlasím“ is archived', async () => {
    let app = await createTestApp()
    try {
      let { articleId, clauseKey } = await sent(app)
      let { runKey } = await claimReplies(app)
      let answer = await reportReply(app, runKey, {
        archive: { fileId: 'consent-1' },
        clauseKey,
        reply: replyOf('m-1', 'Souhlasím'),
        state: 'reply_matches',
      })
      assert.equal(answer, 'accepted')
      let articles = createArticleStore(app.database)
      assert.equal((await articles.findById(articleId))?.finalVersion?.clauses.approved, 1)
      await app.database.exec(sql`UPDATE article_clauses SET claimed_at = NULL`)
      assert.deepEqual((await claimReplies(app)).replies, [])
    } finally {
      await app.close()
    }
  })

  it('puts another reply in Ke kontrole, and archives it after Je to souhlas', async () => {
    let app = await createTestApp()
    try {
      let { articleId, clauseKey } = await sent(app)
      let articles = createArticleStore(app.database)
      let first = await claimReplies(app)
      let reply = replyOf('m-1', 'Souhlasím, jen prosím jiný podpis.')
      assert.equal(
        await reportReply(app, first.runKey, { clauseKey, reply, state: 'other_reply' }),
        'accepted',
      )
      assert.equal(
        (await articles.findById(articleId))?.finalVersion?.reviewAuthor,
        'Tereza Vlková',
      )
      assert.equal(await articles.reviewCount(), 1)
      let [queued] = await articles.reviewQueue()
      assert.equal(queued?.replyText, reply.text)
      assert.equal(await articles.verifyClause(queued?.id ?? 0, 'm-0', EDITOR, AT), false)
      assert.equal(await articles.verifyClause(queued?.id ?? 0, 'm-1', EDITOR, AT), true)
      assert.equal(await articles.reviewCount(), 0)
      assert.equal((await articles.findById(articleId))?.finalVersion?.clauses.verified, 1)

      let second = await claimReplies(app)
      assert.equal(second.replies[0]?.isVerified, true)
      let answer = await reportReply(app, second.runKey, {
        archive: { fileId: 'consent-1' },
        clauseKey,
        reply,
        state: 'other_reply',
      })
      assert.equal(answer, 'accepted')
      assert.equal((await articles.findById(articleId))?.finalVersion?.clauses.approved, 1)
    } finally {
      await app.close()
    }
  })

  it('answers superseded when Vrátit came while the job archived', async () => {
    let app = await createTestApp()
    try {
      let { articleId, clauseKey } = await sent(app)
      let articles = createArticleStore(app.database)
      let reply = replyOf('m-1', 'ok')
      await reportReply(app, (await claimReplies(app)).runKey, {
        clauseKey,
        reply,
        state: 'other_reply',
      })
      let [queued] = await articles.reviewQueue()
      await articles.verifyClause(queued?.id ?? 0, 'm-1', EDITOR, AT)
      let { runKey } = await claimReplies(app)
      assert.equal(await articles.undoClauseVerification(queued?.id ?? 0), true)
      let answer = await reportReply(app, runKey, {
        archive: { fileId: 'consent-1' },
        clauseKey,
        reply,
        state: 'other_reply',
      })
      assert.equal(answer, 'superseded')
      let article = await articles.findById(articleId)
      assert.equal(article?.finalVersion?.clauses.review, 1)
      assert.equal(article?.finalVersion?.clauses.approved, 0)
    } finally {
      await app.close()
    }
  })

  it('reads a reply to an e-mail the Mailer did not confirm, which went after all', async () => {
    let app = await createTestApp()
    try {
      let { articleId, clauseKey } = await sent(app, 'failed')
      let articles = createArticleStore(app.database)
      assert.equal((await articles.findById(articleId))?.finalVersion?.clauses.unsent, 1)
      let { replies, runKey } = await claimReplies(app)
      assert.deepEqual(
        replies.map((reply) => reply.clauseKey),
        [clauseKey],
      )
      await reportReply(app, runKey, {
        archive: { fileId: 'consent-1' },
        clauseKey,
        reply: replyOf('m-1', 'Souhlasím'),
        state: 'reply_matches',
      })
      let row = await app.database.exec(
        sql`SELECT state, error FROM article_clauses WHERE clause_key = ${clauseKey}`,
      )
      assert.deepEqual([row.rows?.[0]?.['state'], row.rows?.[0]?.['error']], ['sent', null])
      assert.equal((await articles.findById(articleId))?.finalVersion?.clauses.approved, 1)
    } finally {
      await app.close()
    }
  })

  it('counts a failed archive as waiting on the editors, and puts it in the queue', async () => {
    let app = await createTestApp()
    try {
      let { articleId, clauseKey } = await sent(app)
      let articles = createArticleStore(app.database)
      await reportReply(app, (await claimReplies(app)).runKey, {
        archive: { error: 'Drive: 403' },
        clauseKey,
        reply: replyOf('m-1', 'Souhlasím'),
        state: 'reply_matches',
      })
      let article = await articles.findById(articleId)
      assert.equal(article?.finalVersion?.clauses.unarchived, 1)
      assert.equal((await articles.missingCountsByIssue()).get(article?.issueId ?? 0), 1)
      assert.equal(await articles.reviewCount(), 1)
      /* A clause that only waits for a reply waits on nobody. */
      await app.database.exec(
        sql`UPDATE article_clauses SET archive_failed_at = NULL, archive_error = NULL,
              reply_message_id = NULL, is_exact_consent = 0`,
      )
      assert.equal((await articles.missingCountsByIssue()).get(article?.issueId ?? 0), undefined)
    } finally {
      await app.close()
    }
  })

  it('refuses a reply it cannot read, and a reply to a clause the run did not take', async () => {
    let app = await createTestApp()
    try {
      let { clauseKey } = await sent(app)
      let { runKey } = await claimReplies(app)
      let bad = await call(app, REPORT, {
        outcome: 'ok',
        replies: [{ clauseKey, state: 'other_reply' }],
        results: [],
        runKey,
      })
      assert.equal(bad.status, 400)
      assert.equal(
        await reportReply(app, runKey, { clauseKey: 'clause_0_0_0', state: 'no_reply' }),
        'unknown',
      )
    } finally {
      await app.close()
    }
  })
})
