import type { Database } from 'remix/data-table'
import { sql } from 'remix/data-table'

import { stamp } from '../domain/time.ts'

/**
 * The e-mails public pages started and the editors resent, one row per recipient, for the cap of
 * the whole app (`02a`, _Ochrana_): the welcome e-mails of a new article and the consent requests.
 * It counts what the app asked the Mailer for, sent or not, since a request the Mailer never
 * confirmed may still have gone.
 */
export type PublicMailKind = 'consent' | 'welcome'

export type PublicMailLog = {
  /** E-mails started since a moment. */
  countSince(since: Temporal.Instant): Promise<number>
  record(kind: PublicMailKind, count: number, at: Temporal.Instant): Promise<void>
  /**
   * Takes `count` places under the cap of the day, or none when they do not fit. The count and the
   * rows are one step for the whole app, so sends in parallel, from either page, cannot all pass
   * the same count. A place taken stays taken when the send then fails: the cap errs on the side
   * of sending less.
   */
  reserve(
    kind: PublicMailKind,
    count: number,
    limit: { cap: number; since: Temporal.Instant },
    at: Temporal.Instant,
  ): Promise<boolean>
}

/* One process, so a chain of promises is the whole of the lock; every log shares it. */
let queue: Promise<unknown> = Promise.resolve()

function oneAtATime<T>(run: () => Promise<T>): Promise<T> {
  let current = queue.then(run, run)
  queue = current.catch(() => undefined)
  return current
}

export function createPublicMailLog(database: Database): PublicMailLog {
  async function countSince(since: Temporal.Instant): Promise<number> {
    let result = await database.exec(
      sql`SELECT count(*) AS count FROM public_mail_log WHERE sent_at >= ${stamp(since)}`,
    )
    return Number(result.rows?.[0]?.['count'] ?? 0)
  }

  async function record(kind: PublicMailKind, count: number, at: Temporal.Instant): Promise<void> {
    for (let index = 0; index < count; index += 1) {
      await database.exec(
        sql`INSERT INTO public_mail_log (kind, sent_at) VALUES (${kind}, ${stamp(at)})`,
      )
    }
  }

  return {
    countSince,
    record,
    reserve(kind, count, limit, at) {
      return oneAtATime(async () => {
        if ((await countSince(limit.since)) + count > limit.cap) return false
        await record(kind, count, at)
        return true
      })
    },
  }
}
