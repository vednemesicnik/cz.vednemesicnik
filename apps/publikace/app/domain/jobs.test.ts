import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import type { JobRunRecord, JobState } from './job-run.ts'
import { PROOFREADING_DIGEST_JOB, writeDigestRun } from './proofreading-digest.ts'
import {
  canStartFromList,
  canStartFromPage,
  failedCalloutText,
  failingJobsBanner,
  historyEvent,
  historyWho,
  historyTime,
  jobByKey,
  jobTag,
  type JobTag,
  JOBS,
  scheduleText,
  settingsSummary,
  STOPPED_CALLOUT_TITLE,
  stoppedCalloutText,
} from './jobs.ts'

/* 9:00 and 9:13 in Prague. */
const LAST = Temporal.Instant.from('2026-11-19T08:00:00Z')
const NEXT = Temporal.Instant.from('2026-11-19T08:30:00Z')
const TODAY = Temporal.Instant.from('2026-11-19T08:13:00Z')
const JOB = JOBS.find((job) => job.key === 'artwork-replies')!

/** The lines keep their parts whole with no-break spaces; the assertions read them as spaces. */
function spaced(tag: JobTag): JobTag {
  return tag.detail === undefined ? tag : { ...tag, detail: tag.detail.replaceAll('\u00a0', ' ') }
}

describe('the jobs that report', () => {
  it('finds a job by its key and nothing else', () => {
    assert.equal(jobByKey('artwork-replies')?.name, 'Odpovědi k\u00a0obrazovým dílům')
    assert.equal(jobByKey('approval-send')?.name, 'Žádosti a\u00a0odpovědi u\u00a0článků')
    assert.equal(jobByKey('comment-digest'), null)
    assert.equal(jobByKey(undefined), null)
  })

  it('says the sentence of the one failing job, and one shared by several', () => {
    assert.equal(
      failingJobsBanner([JOB]),
      'Odpovědi k\u00a0obrazovým dílům se teď v\u00a0aplikaci nepromítají do stavu děl.',
    )
    assert.equal(
      failingJobsBanner([JOB, { ...JOB, key: 'other' }]),
      'U\u00a0několika úloh na pozadí chybí potvrzení, že proběhly v\u00a0pořádku.',
    )
  })

  it('writes the schedule from the interval', () => {
    assert.equal(scheduleText(30), 'každých 30 min')
    assert.equal(scheduleText(360), 'každých 6 h')
    assert.equal(scheduleText(60), 'každou hodinu')
  })
})

describe('the tag of a job (14d)', () => {
  it('says the last run with its preposition and the next one after kolem', () => {
    let ahead = spaced(jobTag({ kind: 'ok', lastStartedAt: LAST, next: NEXT }, TODAY))
    assert.deepEqual(ahead, {
      detail: 'Poslední běh v 9:00 · další kolem 9:30',
      label: 'V\u00a0pořádku',
    })
    let passed = spaced(jobTag({ kind: 'ok', lastStartedAt: LAST, next: null }, TODAY))
    assert.deepEqual(passed, { detail: 'Poslední běh v 9:00', label: 'V\u00a0pořádku' })
  })

  it('breaks the line only between its parts', () => {
    let tag = jobTag({ kind: 'ok', lastStartedAt: LAST, next: NEXT }, TODAY)
    assert.equal(tag.detail, 'Poslední běh v\u00a09:00\u00a0· další\u00a0kolem\u00a09:30')
  })

  it('names the day of a last run that was not today', () => {
    let stopped: JobState = { kind: 'stopped', lastStartedAt: LAST }
    assert.deepEqual(spaced(jobTag(stopped, TODAY.add({ hours: 48 }))), {
      detail: 'Poslední běh podle plánu 19. 11. v 9:00',
      label: 'Neběží',
    })
    let nextYear = spaced(jobTag(stopped, Temporal.Instant.from('2027-01-02T08:00:00Z')))
    assert.equal(nextYear.detail, 'Poslední běh podle plánu 19. 11. 2026 v 9:00')
  })

  it('draws the other three tags', () => {
    assert.deepEqual(spaced(jobTag({ kind: 'running', startedAt: TODAY }, TODAY)), {
      detail: 'spuštěno v 9:13',
      label: 'Běží',
    })
    let failed: JobState = { isUnreported: false, kind: 'failed', lastStartedAt: LAST, next: null }
    assert.deepEqual(spaced(jobTag(failed, TODAY)), {
      detail: 'Poslední běh v 9:00',
      label: 'S\u00a0chybou',
    })
    assert.deepEqual(jobTag({ kind: 'never' }, TODAY), { label: 'Zatím se neohlásila' })
  })

  it('sums the one job up in Settings by its name and tag', () => {
    assert.equal(
      settingsSummary(JOB, { kind: 'never' }, TODAY),
      'Odpovědi k\u00a0obrazovým dílům · Zatím se neohlásila',
    )
  })
})

describe('the history of a job (14e)', () => {
  const RUN: JobRunRecord = {
    error: null,
    finishedAt: null,
    intervalMinutes: 30,
    outcome: null,
    startedAt: LAST,
    summary: null,
  }

  it('says how each run ended, or that it never said', () => {
    let finished = { ...RUN, finishedAt: LAST.add({ minutes: 2 }) }
    assert.equal(historyEvent(JOB, { ...finished, outcome: 'ok' }, TODAY), 'Skončila bez chyby')
    assert.equal(
      historyEvent(JOB, { ...finished, outcome: 'failed' }, TODAY),
      'Skončila s\u00a0chybou, na dílech se nic nezměnilo',
    )
    assert.equal(historyEvent(JOB, RUN, LAST.add({ minutes: 5 })), 'Právě běží')
    assert.equal(historyEvent(JOB, RUN, TODAY), 'Neohlásila výsledek')
  })

  it('dates a run with its year and without v', () => {
    assert.equal(historyTime(LAST), '19. 11. 2026 9:00')
  })

  it('tells a reported failure from a run that never said how it ended', () => {
    assert.equal(
      failedCalloutText(JOB, {
        isUnreported: false,
        kind: 'failed',
        lastStartedAt: LAST,
        next: NEXT,
      }),
      'Úloha skončila s\u00a0chybou. Na dílech se nic nezměnilo. Další běh proběhne kolem 9:30. Pokud se to opakuje, obraťte se na toho, kdo má úlohu na starosti.',
    )
    assert.equal(
      failedCalloutText(JOB, {
        isUnreported: true,
        kind: 'failed',
        lastStartedAt: LAST,
        next: null,
      }),
      'Úloha neohlásila, jak poslední běh skončil. Pokud se to opakuje, obraťte se na toho, kdo má úlohu na starosti.',
    )
    assert.equal(failedCalloutText(JOB, { kind: 'stopped', lastStartedAt: LAST }), null)
  })

  it('says of a job that went quiet how often it should run and when it last reported', () => {
    let stopped: JobState = { kind: 'stopped', lastStartedAt: LAST }
    assert.equal(STOPPED_CALLOUT_TITLE, 'Dejte vědět tomu, kdo má úlohu na starosti.')
    assert.equal(
      stoppedCalloutText(stopped, 30, TODAY.add({ hours: 2 })),
      'Úloha má běžet každých 30 min. Z\u00a0běhu podle plánu se naposledy ohlásila v\u00a09:00. Příčinu aplikace nezná.',
    )
    let afternoon: JobState = { kind: 'stopped', lastStartedAt: LAST.add({ hours: 5 }) }
    assert.match(
      stoppedCalloutText(afternoon, 60, TODAY.add({ hours: 7 })) ?? '',
      /^Úloha má běžet každou hodinu\. Z\u00a0běhu podle plánu se naposledy ohlásila ve\u00a014:00\./,
    )
    assert.match(
      stoppedCalloutText(stopped, 30, TODAY.add({ hours: 48 })) ?? '',
      /Z\u00a0běhu podle plánu se naposledy ohlásila 19\. 11\. v\u00a09:00\./,
    )
    assert.match(
      stoppedCalloutText(stopped, 30, Temporal.Instant.from('2027-01-02T08:00:00Z')) ?? '',
      /Z\u00a0běhu podle plánu se naposledy ohlásila 19\. 11\. 2026 v\u00a09:00\./,
    )
  })

  it('has no Neběží Callout for any other tag', () => {
    let others: JobState[] = [
      { kind: 'never' },
      { kind: 'running', startedAt: TODAY },
      { isUnreported: false, kind: 'failed', lastStartedAt: LAST, next: null },
      { kind: 'ok', lastStartedAt: LAST, next: NEXT },
    ]
    for (let state of others) assert.equal(stoppedCalloutText(state, 30, TODAY), null)
  })
})

describe('Spustit teď (14d, 14e)', () => {
  const MARIE = { email: 'marie@vednemesicnik.test', name: 'Marie Horáková' }
  const RUN: JobRunRecord = {
    error: null,
    finishedAt: LAST.add({ minutes: 2 }),
    intervalMinutes: 30,
    outcome: 'ok',
    startedAt: LAST,
    summary: null,
  }

  it('stands in the list only on a job that runs well or never reported, and on its page but while it runs', () => {
    let states: JobState[] = [
      { kind: 'never' },
      { kind: 'ok', lastStartedAt: LAST, next: null },
      { isUnreported: false, kind: 'failed', lastStartedAt: LAST, next: null },
      { kind: 'stopped', lastStartedAt: LAST },
      { kind: 'running', startedAt: LAST },
    ]
    assert.deepEqual(states.map(canStartFromList), [true, true, false, false, false])
    assert.deepEqual(states.map(canStartFromPage), [true, true, true, true, false])
  })

  it('says a run started by hand so before its result, and names who started it', () => {
    let byHand = { ...RUN, startedBy: MARIE }
    assert.equal(historyEvent(JOB, byHand, TODAY), 'Spuštěna ručně, skončila bez chyby')
    assert.equal(historyWho(byHand), 'Marie Horáková')
    assert.equal(historyWho(RUN), 'systém')
    assert.equal(historyWho({ ...RUN, startedBy: null }), 'systém')
  })

  it('gives the digest started by hand its own sentence before the result', () => {
    let digest = JOBS.find((job) => job.key === PROOFREADING_DIGEST_JOB)!
    let sent = {
      ...RUN,
      startedBy: MARIE,
      summary: writeDigestRun({ cancelled: 0, handedOver: 1, kind: 'sent', waiting: 0 }),
    }
    assert.match(historyEvent(digest, sent, TODAY), /^Spuštěno ručně\. Přehled odeslán\./)
  })

  it('offers Spustit teď in the Callout of an unconfirmed digest only where the page has it', () => {
    let digest = JOBS.find((job) => job.key === PROOFREADING_DIGEST_JOB)!
    let failed = {
      ...RUN,
      outcome: 'failed' as const,
      summary: writeDigestRun({ kind: 'unconfirmed' }),
    }
    assert.match(
      digest.failedCalloutOf?.(failed, '', true)?.text ?? '',
      /^Pro další pokus zvolte Spustit teď nebo počkejte/,
    )
    assert.match(
      digest.failedCalloutOf?.(failed, '', false)?.text ?? '',
      /^Pro další pokus počkejte/,
    )
  })
})
