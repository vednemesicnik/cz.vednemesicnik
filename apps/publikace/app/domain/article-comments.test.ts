import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import {
  ARTICLE_COMMENTS_JOB,
  ARTICLE_COMMENTS_WINDOWS,
  type CommentDigestRun,
  commentDigestFailureNote,
  commentDigestOutcome,
  commentDigestRunEvent,
  readCommentDigestRun,
  recipientGroups,
  unconfirmedCalloutTitle,
  writeCommentDigestRun,
} from './article-comments.ts'
import { jobHealth, type JobRunRecord, nextHourlyWindow } from './job-run.ts'
import {
  failedCalloutText,
  isJobInBanner,
  jobByKey,
  jobTag,
  scheduleText,
  stateOfJob,
  stoppedCalloutText,
} from './jobs.ts'

/* 20 November 2026, Prague is UTC+1: the run at 9:12 falls in the window of 9:00. */
const RUN_AT = Temporal.Instant.from('2026-11-20T08:12:00Z')
const AFTER = Temporal.Instant.from('2026-11-20T08:20:00Z')

const KRALOVA = 'l.kralova@external.test'
const NOVOTNY = 'j.novotny@external.test'

function digest(fields: Partial<CommentDigestRun> = {}): CommentDigestRun {
  return { hasFailed: false, sent: 0, unconfirmed: [], ...fields }
}

function run(summary: CommentDigestRun | null, startedAt = RUN_AT): JobRunRecord {
  return {
    error: null,
    finishedAt: startedAt.add({ seconds: 40 }),
    intervalMinutes: 180,
    outcome: summary === null ? 'failed' : commentDigestOutcome(summary),
    startedAt,
    summary: summary === null ? null : writeCommentDigestRun(summary),
  }
}

function plain(text: string | null | undefined): string | undefined {
  return text?.replaceAll(' ', ' ').replaceAll('⁠', '')
}

describe('the run of Připomínky ke článkům (14e)', () => {
  it('keeps its summary with the run, and reads nothing it does not know', () => {
    let kept = digest({ sent: 3, unconfirmed: [{ articleName: 'Noční autobusy', email: KRALOVA }] })
    assert.deepEqual(readCommentDigestRun(writeCommentDigestRun(kept)), kept)
    assert.equal(readCommentDigestRun(null), null)
    assert.equal(readCommentDigestRun('{"kind":"sent"}'), null)
    assert.equal(readCommentDigestRun('nope'), null)
  })

  it('is S chybou when the job failed or an e-mail went unconfirmed', () => {
    assert.equal(commentDigestOutcome(digest({ sent: 4 })), 'ok')
    assert.equal(commentDigestOutcome(digest({ hasFailed: true })), 'failed')
    assert.equal(
      commentDigestOutcome(digest({ unconfirmed: [{ articleName: 'A', email: KRALOVA }] })),
      'failed',
    )
  })

  it('counts e-mails in the history, one per address, in the form the number takes', () => {
    let one = (email: string, articleName = 'A') => ({ articleName, email })
    assert.equal(plain(commentDigestRunEvent(digest())), 'Nic nového k poslání')
    assert.equal(commentDigestRunEvent(digest({ sent: 1 })), 'Poslala 1 e-mail')
    assert.equal(commentDigestRunEvent(digest({ sent: 3 })), 'Poslala 3 e-maily')
    assert.equal(commentDigestRunEvent(digest({ sent: 5 })), 'Poslala 5 e-mailů')
    assert.equal(
      plain(commentDigestRunEvent(digest({ sent: 3, unconfirmed: [one(KRALOVA)] }))),
      'Poslala 3 e-maily · u 1 e-mailu chybí potvrzení odeslání',
    )
    /* Two articles of one author are one e-mail. */
    assert.equal(
      plain(
        commentDigestRunEvent(
          digest({ unconfirmed: [one(KRALOVA, 'A'), one(KRALOVA, 'B'), one(NOVOTNY)] }),
        ),
      ),
      'U 2 e-mailů chybí potvrzení odeslání',
    )
    assert.equal(commentDigestRunEvent(digest({ hasFailed: true, sent: 2 })), null)
    assert.equal(
      commentDigestFailureNote(digest({ unconfirmed: [one(KRALOVA), one(NOVOTNY)] })),
      '2 e-maily bez potvrzení',
    )
    assert.equal(commentDigestFailureNote(digest({ hasFailed: true })), null)
  })

  it('lists the unconfirmed e-mails by address, each with its articles by name', () => {
    let run = digest({
      unconfirmed: [
        { articleName: 'Sbor, který zkouší v kotelně', email: NOVOTNY },
        { articleName: 'Proč nechodíme volit', email: KRALOVA },
        { articleName: 'Rozhovor s varhaníkem z Kostelce', email: NOVOTNY },
      ],
    })
    assert.deepEqual(recipientGroups(run), [
      {
        articles: ['Rozhovor s varhaníkem z Kostelce', 'Sbor, který zkouší v kotelně'],
        lead: `E-mail pro ${NOVOTNY}⁠:`,
      },
      { articles: ['Proč nechodíme volit'], lead: `E-mail pro ${KRALOVA}⁠:` },
    ])
    assert.equal(unconfirmedCalloutTitle(run), 'Odeslání 2 e-mailů se nepodařilo potvrdit.')
    assert.equal(
      unconfirmedCalloutTitle(digest({ unconfirmed: [{ articleName: 'A', email: KRALOVA }] })),
      'Odeslání 1 e-mailu se nepodařilo potvrdit.',
    )
  })
})

describe('Připomínky ke článkům among the jobs (14d, 14e, 14i)', () => {
  let job = jobByKey(ARTICLE_COMMENTS_JOB)!

  it('runs every three hours from midnight, which is its schedule', () => {
    assert.equal(scheduleText(180, job.window, job.windows), 'každé 3 h od 0:00')
    let ok = run(digest({ sent: 2 }))
    assert.equal(
      plain(jobTag(stateOfJob(job, ok, AFTER), AFTER, job, ok).detail),
      'Poslední běh v 9:12 · další mezi 12:00 a 13:00',
    )
  })

  it('says the unconfirmed e-mails in the tag, and puts two such runs in the banner', () => {
    let unconfirmed = run(digest({ unconfirmed: [{ articleName: 'A', email: KRALOVA }] }))
    assert.equal(
      plain(jobTag(stateOfJob(job, unconfirmed, AFTER), AFTER, job, unconfirmed).detail),
      'Poslední běh v 9:12 · 1 e-mail bez potvrzení',
    )
    assert.equal(isJobInBanner(job, [unconfirmed], AFTER), false)
    assert.equal(isJobInBanner(job, [unconfirmed, unconfirmed], AFTER), true)
  })

  it('promises the window in the Callout of a failed run, and the address lines under it', () => {
    let failed = run(
      digest({ hasFailed: true, unconfirmed: [{ articleName: 'A', email: KRALOVA }] }),
    )
    let state = stateOfJob(job, failed, AFTER)
    let generic = failedCalloutText(job, state)
    assert.equal(
      plain(generic),
      'Úloha skončila s chybou. Některá upozornění na připomínky možná neodešla. Další běh se očekává mezi 12:00 a 13:00. Pokud se to opakuje, obraťte se na toho, kdo má úlohu na starosti.',
    )
    let own = job.failedCalloutOf?.(failed, generic ?? '')
    assert.equal(own?.title, null)
    assert.equal(own?.text, generic)
    assert.equal(own?.groups?.length, 1)
    /* Once the window passed without a run, the sentence about it goes. */
    let late = Temporal.Instant.from('2026-11-20T12:30:00Z')
    assert.doesNotMatch(failedCalloutText(job, stateOfJob(job, failed, late)) ?? '', /Další běh/)
  })

  it('is Neběží after two windows without a run, in words of hours', () => {
    let ok = run(digest())
    let secondWindowEnds = Temporal.Instant.from('2026-11-20T15:00:00Z')
    assert.equal(stateOfJob(job, ok, secondWindowEnds).kind, 'ok')
    let past = secondWindowEnds.add({ minutes: 6 })
    let state = stateOfJob(job, ok, past)
    assert.equal(state.kind, 'stopped')
    assert.equal(isJobInBanner(job, [ok], past), true)
    assert.equal(
      plain(stoppedCalloutText(state, 180, past, job)),
      'Úloha má běžet každé 3 hodiny. Naposledy se ohlásila v 9:12. Příčinu aplikace nezná.',
    )
  })
})

describe('hourly windows', () => {
  let prague = (instant: Temporal.Instant) =>
    instant.toZonedDateTimeISO('Europe/Prague').toPlainDateTime().toString()

  it('finds the next window across midnight', () => {
    let late = Temporal.Instant.from('2026-11-20T20:30:00Z')
    let next = nextHourlyWindow(ARTICLE_COMMENTS_WINDOWS, late)
    assert.equal(prague(next.start), '2026-11-21T00:00:00')
    assert.equal(prague(next.end), '2026-11-21T01:00:00')
  })

  it('keeps Prague hours over the change to and from summer time', () => {
    /* 29 March 2026: 2:00 becomes 3:00, so midnight's window is followed by 3:00, two hours on. */
    let spring = nextHourlyWindow(
      ARTICLE_COMMENTS_WINDOWS,
      Temporal.Instant.from('2026-03-28T23:30:00Z'),
    )
    assert.equal(prague(spring.start), '2026-03-29T03:00:00')
    assert.equal(spring.start.toString(), '2026-03-29T01:00:00Z')
    /* 25 October 2026: 3:00 becomes 2:00 again, so 3:00 comes four hours after midnight. */
    let autumn = nextHourlyWindow(
      ARTICLE_COMMENTS_WINDOWS,
      Temporal.Instant.from('2026-10-24T22:30:00Z'),
    )
    assert.equal(prague(autumn.start), '2026-10-25T03:00:00')
    assert.equal(autumn.start.toString(), '2026-10-25T02:00:00Z')
  })

  it('counts two windows from the run before calling the job Neběží', () => {
    let latest = run(digest(), Temporal.Instant.from('2026-11-20T20:10:00Z'))
    /* 21:10 in Prague: the next windows are 0:00 and 3:00, the second ending at 4:00. */
    assert.equal(
      jobHealth(latest, Temporal.Instant.from('2026-11-21T03:04:00Z'), ARTICLE_COMMENTS_WINDOWS)
        .kind,
      'running',
    )
    assert.equal(
      jobHealth(latest, Temporal.Instant.from('2026-11-21T03:06:00Z'), ARTICLE_COMMENTS_WINDOWS)
        .kind,
      'stopped',
    )
  })
})
