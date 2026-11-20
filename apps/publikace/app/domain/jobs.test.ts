import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import type { JobRunRecord, JobState } from './job-run.ts'
import {
  failedCalloutText,
  historyEvent,
  historyTime,
  jobByKey,
  jobTag,
  type JobTag,
  JOBS,
  scheduleText,
  settingsSummary,
} from './jobs.ts'

/* 9:00 and 9:13 in Prague. */
const LAST = Temporal.Instant.from('2026-11-19T08:00:00Z')
const NEXT = Temporal.Instant.from('2026-11-19T08:30:00Z')
const TODAY = Temporal.Instant.from('2026-11-19T08:13:00Z')
const JOB = JOBS[0]!

/** The lines keep their parts whole with no-break spaces; the assertions read them as spaces. */
function spaced(tag: JobTag): JobTag {
  return tag.detail === undefined ? tag : { ...tag, detail: tag.detail.replaceAll('\u00a0', ' ') }
}

describe('the jobs that report', () => {
  it('finds a job by its key and nothing else', () => {
    assert.equal(jobByKey('artwork-replies')?.name, 'Odpovědi k obrazovým dílům')
    assert.equal(jobByKey('approval-send'), null)
    assert.equal(jobByKey(undefined), null)
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
      label: 'V pořádku',
    })
    let passed = spaced(jobTag({ kind: 'ok', lastStartedAt: LAST, next: null }, TODAY))
    assert.deepEqual(passed, { detail: 'Poslední běh v 9:00', label: 'V pořádku' })
  })

  it('breaks the line only between its parts', () => {
    let tag = jobTag({ kind: 'ok', lastStartedAt: LAST, next: NEXT }, TODAY)
    assert.equal(tag.detail, 'Poslední běh v\u00a09:00\u00a0· další\u00a0kolem\u00a09:30')
  })

  it('names the day of a last run that was not today', () => {
    let stopped: JobState = { kind: 'stopped', lastStartedAt: LAST }
    assert.deepEqual(spaced(jobTag(stopped, TODAY.add({ hours: 48 }))), {
      detail: 'Poslední běh 19. 11. v 9:00',
      label: 'Neběží',
    })
    let nextYear = spaced(jobTag(stopped, Temporal.Instant.from('2027-01-02T08:00:00Z')))
    assert.equal(nextYear.detail, 'Poslední běh 19. 11. 2026 v 9:00')
  })

  it('draws the other three tags', () => {
    assert.deepEqual(spaced(jobTag({ kind: 'running', startedAt: TODAY }, TODAY)), {
      detail: 'spuštěno v 9:13',
      label: 'Běží',
    })
    let failed: JobState = { isUnreported: false, kind: 'failed', lastStartedAt: LAST, next: null }
    assert.deepEqual(spaced(jobTag(failed, TODAY)), {
      detail: 'Poslední běh v 9:00',
      label: 'S chybou',
    })
    assert.deepEqual(jobTag({ kind: 'never' }, TODAY), { label: 'Zatím se neohlásila' })
  })

  it('sums the one job up in Settings by its name and tag', () => {
    assert.equal(
      settingsSummary(JOB, { kind: 'never' }, TODAY),
      'Odpovědi k obrazovým dílům · Zatím se neohlásila',
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
  }

  it('says how each run ended, or that it never said', () => {
    let finished = { ...RUN, finishedAt: LAST.add({ minutes: 2 }) }
    assert.equal(historyEvent(JOB, { ...finished, outcome: 'ok' }, TODAY), 'Skončila bez chyby')
    assert.equal(
      historyEvent(JOB, { ...finished, outcome: 'failed' }, TODAY),
      'Skončila s chybou, na dílech se nic nezměnilo',
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
      'Úloha skončila s chybou. Na dílech se nic nezměnilo. Další běh proběhne kolem 9:30. Pokud se to opakuje, obraťte se na toho, kdo má úlohu na starosti.',
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
})
