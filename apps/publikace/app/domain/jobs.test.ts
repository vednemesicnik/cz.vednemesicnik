import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { writeCommentDigestRun } from './article-comments.ts'
import type { JobRunRecord, JobState } from './job-run.ts'
import { PROOFREADING_DIGEST_JOB, writeDigestRun } from './proofreading-digest.ts'
import { NBSP } from './public/typography.ts'
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
  type SummaryPart,
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
})

describe('the summary in Settings (14a)', () => {
  const OK: JobState = { kind: 'ok', lastStartedAt: LAST, next: null }
  const FAILED: JobState = { isUnreported: false, kind: 'failed', lastStartedAt: LAST, next: null }
  const STOPPED: JobState = { kind: 'stopped', lastStartedAt: LAST }
  const NEVER: JobState = { kind: 'never' }
  const RUNNING: JobState = { kind: 'running', startedAt: TODAY }
  const RUN: JobRunRecord = {
    error: null,
    finishedAt: LAST.add({ minutes: 2 }),
    intervalMinutes: 180,
    outcome: 'failed',
    startedAt: LAST,
    summary: null,
  }
  const NO_ADDRESS: JobRunRecord = { ...RUN, summary: writeDigestRun({ kind: 'no-address' }) }

  /** The sentence as a reader sees it: names in underscores, the no-break characters plain. */
  function read(parts: readonly SummaryPart[]): string {
    return parts
      .map((part) => (part.isName ? `_${part.text}_` : part.text))
      .join('')
      .replaceAll(NBSP, ' ')
      .replaceAll(String.fromCodePoint(0x2060), '')
  }

  /** The five jobs in the order of `14d`, each in the state its key is given, else _V pořádku_. */
  function summary(
    states: Readonly<Record<string, JobState>>,
    latest: Readonly<Record<string, JobRunRecord>> = {},
  ): string {
    let rows = JOBS.map((job) => ({
      job,
      latest: latest[job.key] ?? null,
      state: states[job.key] ?? OK,
    }))
    return read(settingsSummary(rows, TODAY))
  }

  /** A comment digest run that left this many authors' e-mails unconfirmed. */
  function unconfirmed(count: number): JobRunRecord {
    let emails = Array.from({ length: count }, (_, index) => ({
      articleName: `Článek ${index + 1}`,
      email: `autor${index + 1}@external.test`,
    }))
    return {
      ...RUN,
      summary: writeCommentDigestRun({ hasFailed: false, sent: 0, unconfirmed: emails }),
    }
  }

  it('says all is well in one word', () => {
    assert.equal(summary({}), '5 úloh · všechny v pořádku.')
  })

  it('names the one job that is not, by its tag or its note', () => {
    assert.equal(
      summary({ 'print-handoff': FAILED }),
      '5 úloh · _Podklady pro tisk_: S chybou · ostatní v pořádku.',
    )
    assert.equal(
      summary({ 'artwork-replies': STOPPED }),
      '5 úloh · _Odpovědi k obrazovým dílům_: Neběží · ostatní v pořádku.',
    )
    assert.equal(
      summary({ 'artwork-replies': NEVER }),
      '5 úloh · _Odpovědi k obrazovým dílům_: Zatím se neohlásila · ostatní v pořádku.',
    )
    assert.equal(
      summary({ 'artwork-replies': RUNNING }),
      '5 úloh · _Odpovědi k obrazovým dílům_: Běží · ostatní v pořádku.',
    )
    for (let [count, note] of [
      [1, '1 e-mail'],
      [2, '2 e-maily'],
      [5, '5 e-mailů'],
    ] as const) {
      assert.equal(
        summary({ 'article-comments': FAILED }, { 'article-comments': unconfirmed(count) }),
        `5 úloh · _Připomínky ke článkům_: ${note} bez potvrzení · ostatní v pořádku.`,
      )
    }
    assert.equal(
      summary({ [PROOFREADING_DIGEST_JOB]: FAILED }, { [PROOFREADING_DIGEST_JOB]: NO_ADDRESS }),
      '5 úloh · _Přehled pro korektory_: chybí adresa korektorů · ostatní v pořádku.',
    )
  })

  it('says a shared state once, the names joined by commas, the groups in the order of 14d', () => {
    assert.equal(
      summary({ 'approval-send': FAILED, 'print-handoff': FAILED }),
      '5 úloh · _Žádosti a odpovědi u článků_, _Podklady pro tisk_: S chybou · ostatní v pořádku.',
    )
    assert.equal(
      summary(
        { 'article-comments': FAILED, 'artwork-replies': STOPPED },
        { 'article-comments': unconfirmed(2) },
      ),
      '5 úloh · _Odpovědi k obrazovým dílům_: Neběží · _Připomínky ke článkům_: 2 e-maily bez potvrzení · ostatní v pořádku.',
    )
  })

  it('lists every job when none is well, without the ending', () => {
    assert.equal(
      summary(
        {
          'approval-send': FAILED,
          'article-comments': FAILED,
          'artwork-replies': STOPPED,
          'print-handoff': NEVER,
          [PROOFREADING_DIGEST_JOB]: FAILED,
        },
        { 'article-comments': unconfirmed(5), [PROOFREADING_DIGEST_JOB]: NO_ADDRESS },
      ),
      '5 úloh · _Žádosti a odpovědi u článků_: S chybou · _Odpovědi k obrazovým dílům_: Neběží · _Podklady pro tisk_: Zatím se neohlásila · _Připomínky ke článkům_: 5 e-mailů bez potvrzení · _Přehled pro korektory_: chybí adresa korektorů.',
    )
  })

  it('gives a state all the jobs share as společný stav', () => {
    let every = (state: JobState) => Object.fromEntries(JOBS.map((job) => [job.key, state]))
    assert.equal(summary(every(NEVER)), '5 úloh · společný stav: Zatím se neohlásila.')
    assert.equal(summary(every(FAILED)), '5 úloh · společný stav: S chybou.')
  })

  it('counts one and two jobs in their own forms', () => {
    let first = (count: number, state: JobState) =>
      read(
        settingsSummary(
          JOBS.slice(0, count).map((job) => ({ job, latest: null, state })),
          TODAY,
        ),
      )
    assert.equal(first(1, OK), '1 úloha · v pořádku.')
    assert.equal(first(1, FAILED), '1 úloha · _Žádosti a odpovědi u článků_: S chybou.')
    assert.equal(first(2, OK), '2 úlohy · obě v pořádku.')
    assert.equal(first(2, STOPPED), '2 úlohy · společný stav: Neběží.')
  })

  it('keeps the one-letter words, the dot and the state on their lines', () => {
    let one = settingsSummary([{ job: JOBS[0]!, latest: null, state: OK }], TODAY)
    assert.equal(one[0]?.text, `1 úloha${NBSP}· v${NBSP}pořádku.`)
    let parts = settingsSummary(
      JOBS.map((job) => ({ job, latest: null, state: job.key === 'print-handoff' ? NEVER : OK })),
      TODAY,
    )
    assert.ok(parts.some((part) => part.text === `: Zatím${NBSP}se${NBSP}neohlásila`))
    assert.equal(parts.at(-1)?.text, `${NBSP}· ostatní v${NBSP}pořádku.`)
    let comments = settingsSummary(
      JOBS.map((job) => ({
        job,
        latest: job.key === 'article-comments' ? unconfirmed(1) : null,
        state: job.key === 'article-comments' ? FAILED : OK,
      })),
      TODAY,
    )
    let joiner = String.fromCodePoint(0x2060)
    assert.ok(
      comments.some((part) => part.text === `: 1${NBSP}e-${joiner}mail${NBSP}bez${NBSP}potvrzení`),
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
    assert.equal(historyEvent(JOB, byHand, TODAY), 'Spuštěno ručně. Skončila bez chyby')
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
