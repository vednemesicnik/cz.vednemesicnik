import { createController } from 'remix/router'

import type { IdentityTokenVerifier } from '../../../auth/identity-token.server.ts'
import type { ArticleStore } from '../../../data/articles.server.ts'
import type { JobRunStore } from '../../../data/job-runs.server.ts'
import type { ProofreadersStore } from '../../../data/proofreaders.server.ts'
import {
  type DigestRun,
  digestOf,
  digestOutcome,
  PROOFREADING_DIGEST_JOB,
  readDigestRun,
  writeDigestRun,
} from '../../../domain/proofreading-digest.ts'
import type { Lock } from '../../../drive/one-at-a-time.server.ts'
import { digestEmail } from '../../../mail/proofreading-digest-email.server.ts'
import type { Mailer } from '../../../mail/mailer.server.ts'
import { routes } from '../../../routes.ts'

/**
 * The API the proofreaders' digest calls (#14): `SCRIPT__Publication__Proofreading_Digest`, a
 * standalone Apps Script project running as `publikace.app@` on a trigger once a day between 7
 * and 8. The job only calls; the app composes the digest and sends it through the Mailer it
 * already signs for, so the job holds no secret and reads no article.
 *
 * One call, `run`, with the trigger's interval: the app opens the run, builds the digest, sends
 * it when there is something new and an address to send it to, records what a confirmed digest
 * told, and closes the run with what came of it, which `14e` shows. A digest the Mailer did not
 * confirm marks nothing, so the next run sends it again, under the same idempotency key while
 * its content is the same.
 *
 * The call carries the job's Google identity token as a bearer, and only the account in
 * `SCRIPT_JOB_ACCOUNT` is let in, as for the reply check. No cookie is set. A path or a field is
 * never renamed in place: the job's deployed code is its contract.
 */

export type ProofreadingDigestDependencies = {
  articles: ArticleStore
  /** The account the jobs run as, in lower case. */
  jobAccount: string
  /** One run at a time: a run by hand and the trigger's would otherwise both send. */
  lock: Lock
  mailer: Mailer
  now: () => Temporal.Instant
  /** `APP_ORIGIN`, which the digest's links lead to. */
  origin: string
  proofreaders: ProofreadersStore
  runs: JobRunStore
  verifyIdentityToken: IdentityTokenVerifier
}

/* A run a day and a few by hand: a confirmed digest is found well within this many runs, and one
   older than that is far past the Mailer's six hours of remembered keys. */
const RUNS_FOR_LAST_SENT = 100

/* A trigger fires at most once a minute and at least once a day. */
const MAX_INTERVAL_MINUTES = 24 * 60

const NO_STORE = { 'Cache-Control': 'no-store' }

function json(body: unknown, status = 200): Response {
  return Response.json(body, { headers: NO_STORE, status })
}

function bearerOf(request: Request): string | null {
  let match = /^Bearer (\S+)$/.exec(request.headers.get('Authorization') ?? '')
  return match?.[1] ?? null
}

async function intervalOf(request: Request): Promise<number | null> {
  try {
    let body: unknown = await request.json()
    if (typeof body !== 'object' || body === null || Array.isArray(body)) return null
    let interval = (body as Record<string, unknown>)['intervalMinutes']
    return typeof interval === 'number' &&
      Number.isInteger(interval) &&
      interval >= 1 &&
      interval <= MAX_INTERVAL_MINUTES
      ? interval
      : null
  } catch {
    return null
  }
}

/** What the job hears back: `sent`, `nothing`, `unconfirmed` or `no-address`. */
function answerOf(runKey: string, run: DigestRun): Response {
  return json({ runKey, state: run.kind })
}

export default function createProofreadingDigestController(
  dependencies: ProofreadingDigestDependencies,
) {
  async function refusal(request: Request): Promise<Response | null> {
    let bearer = bearerOf(request)
    if (bearer === null) return json({ error: 'unauthorized' }, 401)
    let check = await dependencies.verifyIdentityToken(bearer)
    if (check.status === 'unavailable') return json({ error: 'unavailable' }, 503)
    if (
      check.status !== 'verified' ||
      check.identity.email.toLowerCase() !== dependencies.jobAccount
    ) {
      return json({ error: 'unauthorized' }, 401)
    }
    return null
  }

  /**
   * When the last digest the Mailer confirmed was started: it changes with every confirmed send
   * and stays across the retries of one that was not, which is what the idempotency key needs.
   */
  async function lastSentAt(): Promise<Temporal.Instant | null> {
    let runs = await dependencies.runs.latestRuns(PROOFREADING_DIGEST_JOB, RUNS_FOR_LAST_SENT)
    return runs.find((run) => readDigestRun(run.summary)?.kind === 'sent')?.startedAt ?? null
  }

  /** Builds and sends the digest, and says how it went; nothing is recorded as told before. */
  async function send(): Promise<{ error: string | null; run: DigestRun }> {
    let digest = digestOf(await dependencies.articles.listForDigest())
    if (digest === null) return { error: null, run: { kind: 'nothing' } }
    let address = await dependencies.proofreaders.find()
    if (address === null) return { error: null, run: { kind: 'no-address' } }

    let today = dependencies.now()
    let result = await dependencies.mailer(
      digestEmail({
        digest,
        lastSentAt: await lastSentAt(),
        origin: dependencies.origin,
        to: address.email,
        today,
      }),
    )
    if (!result.ok) return { error: result.error, run: { kind: 'unconfirmed' } }

    await dependencies.articles.markAnnounced(
      {
        cancelled: digest.cancelled.map((each) => ({
          handedOverAt: each.handedOverAt,
          id: each.id,
        })),
        handedOver: digest.handedOver.map((each) => ({
          handedOverAt: each.handedOverAt,
          id: each.id,
        })),
      },
      dependencies.now(),
    )
    return {
      error: null,
      run: {
        cancelled: digest.cancelled.length,
        handedOver: digest.handedOver.length,
        kind: 'sent',
        waiting: digest.waiting.length,
      },
    }
  }

  return createController(routes.api.proofreadingDigest, {
    actions: {
      async run(context) {
        let refused = await refusal(context.request)
        if (refused !== null) return refused
        let interval = await intervalOf(context.request)
        if (interval === null) return json({ error: 'invalid_request' }, 400)

        return dependencies.lock(PROOFREADING_DIGEST_JOB, async () => {
          let runKey = crypto.randomUUID()
          await dependencies.runs.start({
            at: dependencies.now(),
            intervalMinutes: interval,
            job: PROOFREADING_DIGEST_JOB,
            runKey,
          })
          let outcome: { error: string | null; run: DigestRun }
          try {
            outcome = await send()
          } catch (error) {
            /* The database did not answer midway: whatever went is unknown, as a send the
               Mailer did not confirm. */
            let message = error instanceof Error ? error.message : 'unknown error'
            outcome = { error: message, run: { kind: 'unconfirmed' } }
          }
          await dependencies.runs.finish(PROOFREADING_DIGEST_JOB, runKey, {
            at: dependencies.now(),
            error: outcome.error,
            outcome: digestOutcome(outcome.run),
            summary: writeDigestRun(outcome.run),
          })
          return answerOf(runKey, outcome.run)
        })
      },
    },
  })
}
