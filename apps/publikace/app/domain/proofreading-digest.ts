/**
 * The proofreaders' morning digest (`12n`) and the job that sends it (`14d`, `14e`, `14i`),
 * decided in `ojfczb2m` and worded by the copywriter (`tlb36tk0`).
 *
 * One e-mail a day instead of one per handover: in the week before the deadline that would be ten
 * or more to the same group. It goes only when something is new to the proofreaders, a handover
 * or the cancellation of one they were told of, and then carries what still waits as well, so an
 * article handed over on Monday that nobody took is in every digest until somebody does.
 */

import type { DailyWindow, JobRunRecord } from './job-run.ts'
import { tied } from './public/typography.ts'

export const PROOFREADING_DIGEST_JOB = 'proofreading-digest'
export const PROOFREADING_DIGEST_JOB_NAME = 'Přehled pro korektory'
/* A word joiner after the hyphen, so _e-mailem_ never breaks at it (`14d`). */
export const PROOFREADING_DIGEST_SUMMARY = tied`nová a zrušená předání i čekající články e-\u2060mailem`

/** `atHour(7).everyDays(1)` in Prague: Google picks the minute within the hour (`14d`). */
export const DIGEST_WINDOW: DailyWindow = { fromHour: 7, toHour: 8 }

/**
 * An article the digest may speak of, as the database gives it: handed over in an issue that is
 * not closed and not taken by a proofreader, standing, or cancelled after a digest told of it.
 */
export type DigestCandidate = {
  /** When a confirmed digest last told the proofreaders of a handover of this article. */
  announcedAt: Temporal.Instant | null
  authors: readonly string[]
  cancelledAt: Temporal.Instant | null
  handedOverAt: Temporal.Instant
  id: number
  issueName: string
  name: string
}

/** The three parts, each the oldest handover first (`12n`). */
export type Digest = {
  cancelled: readonly DigestCandidate[]
  handedOver: readonly DigestCandidate[]
  waiting: readonly DigestCandidate[]
}

function isNewer(a: Temporal.Instant, than: Temporal.Instant | null): boolean {
  return than === null || Temporal.Instant.compare(a, than) > 0
}

/**
 * The digest to send, or `null` when nothing is new to the proofreaders: what still waits alone
 * sends nothing (`12n`). A handover newer than the last announcement is new, so one announced,
 * cancelled and handed over again stands among the new ones with its new date; a cancellation
 * counts only after a digest told of the handover, so one handed over and cancelled between two
 * digests is nowhere.
 */
export function digestOf(candidates: readonly DigestCandidate[]): Digest | null {
  let byTime = [...candidates].sort(
    (a, b) => Temporal.Instant.compare(a.handedOverAt, b.handedOverAt) || a.id - b.id,
  )
  let handedOver = byTime.filter(
    (each) => each.cancelledAt === null && isNewer(each.handedOverAt, each.announcedAt),
  )
  let waiting = byTime.filter(
    (each) => each.cancelledAt === null && !isNewer(each.handedOverAt, each.announcedAt),
  )
  let cancelled = byTime.filter((each) => each.cancelledAt !== null && each.announcedAt !== null)
  if (handedOver.length === 0 && cancelled.length === 0) return null
  return { cancelled, handedOver, waiting }
}

/** How a run of the job ended, as it is kept with the run (`job_runs.summary`). */
export type DigestRun =
  | { cancelled: number; handedOver: number; kind: 'sent'; waiting: number }
  /** Nothing new to tell, with an address or without one: nothing was to go. */
  | { kind: 'nothing' }
  /** The Mailer did not confirm the send, so nothing counts as told and the next run sends again. */
  | { kind: 'unconfirmed' }
  /** There was something to tell and nowhere to send it. */
  | { kind: 'no-address' }

export function writeDigestRun(run: DigestRun): string {
  return JSON.stringify(run)
}

export function readDigestRun(text: string | null): DigestRun | null {
  if (text === null) return null
  try {
    let value: unknown = JSON.parse(text)
    if (typeof value !== 'object' || value === null) return null
    let run = value as Record<string, unknown>
    if (
      run['kind'] === 'nothing' ||
      run['kind'] === 'unconfirmed' ||
      run['kind'] === 'no-address'
    ) {
      return { kind: run['kind'] }
    }
    if (run['kind'] !== 'sent') return null
    let count = (key: string) => (typeof run[key] === 'number' ? (run[key] as number) : 0)
    return {
      cancelled: count('cancelled'),
      handedOver: count('handedOver'),
      kind: 'sent',
      waiting: count('waiting'),
    }
  } catch {
    return null
  }
}

/** The outcome the run is recorded with: _S chybou_ for what did not go and should have. */
export function digestOutcome(run: DigestRun): 'failed' | 'ok' {
  return run.kind === 'sent' || run.kind === 'nothing' ? 'ok' : 'failed'
}

/**
 * A run in the history (`14e`). The counts have fixed labels, each only when it is not zero, so
 * no word has to change its form with the number.
 */
export function digestRunEvent(run: DigestRun): string {
  switch (run.kind) {
    case 'sent': {
      let counts = [
        run.handedOver > 0 ? `Nová předání: ${run.handedOver}` : null,
        run.cancelled > 0 ? `zrušená předání: ${run.cancelled}` : null,
        run.waiting > 0 ? `čekající články: ${run.waiting}` : null,
      ].filter((part) => part !== null)
      let line = counts.join(' · ')
      return `Přehled odeslán. ${line.charAt(0).toUpperCase()}${line.slice(1)}.`
    }
    case 'nothing':
      return tied`Bez nových nebo zrušených předání k oznámení.`
    case 'unconfirmed':
      return tied`Odeslání přehledu se nepodařilo potvrdit.`
    case 'no-address':
      return tied`Přehled neodešel. Chybí adresa korektorů.`
  }
}

/** What the tag's line adds after the last run when it failed (`14d`). */
export function digestFailureNote(run: DigestRun): string | null {
  if (run.kind === 'unconfirmed') return 'odeslání nepotvrzeno'
  if (run.kind === 'no-address') return tied`chybí adresa korektorů`
  return null
}

/**
 * The first digest the Mailer did not confirm already stands in the banner (`14i`): each missed
 * digest is a day the proofreaders heard nothing. A missing address does not: the job did not
 * fail, and the editors-in-chief see it over the articles and mend it in the app. A run that
 * stayed open past its time ended without saying whether the digest went, as an unconfirmed one.
 */
export function isDigestAlarm(record: JobRunRecord): boolean {
  if (record.finishedAt === null) return true
  if (record.outcome !== 'failed') return false
  return readDigestRun(record.summary)?.kind !== 'no-address'
}

/** The Callout over the history after a digest the Mailer did not confirm (`14e`). */
export const UNCONFIRMED_CALLOUT_TITLE = tied`Odeslání přehledu se nepodařilo potvrdit.`
/*
 * The drawing's text starts with _zvolte Spustit teď nebo_; the app has no such button yet, so
 * the sentence names only the way that exists.
 */
export const UNCONFIRMED_CALLOUT_TEXT = tied`Pro další pokus počkejte na další plánovaný běh. Přehled se sestaví podle aktuálního stavu. Pokud první e-mail odešel, některá předání se mohou objevit podruhé.`

/** The Callout's text while the job is _Neběží_, its window instead of an interval (`14e`). */
export const STOPPED_DIGEST_TEXT = tied`Úloha má běžet denně mezi 7:00 a 8:00. Dnes se úloha neohlásila.`

/** The banner's sentence (`14i`), true of an unconfirmed digest and of a silent job alike. */
export const DIGEST_BANNER = tied`Přehled pro korektory teď nemá potvrzené odeslání.`
