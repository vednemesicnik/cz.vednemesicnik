import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import type { JobRunRecord } from './job-run.ts'
import { jobHealth } from './job-run.ts'
import { isJobInBanner, jobByKey, jobTag, scheduleText, stateOfJob } from './jobs.ts'
import {
  DIGEST_WINDOW,
  type DigestCandidate,
  digestOf,
  digestRunEvent,
  isDigestAlarm,
  PROOFREADING_DIGEST_JOB,
  readDigestRun,
  writeDigestRun,
} from './proofreading-digest.ts'

/* 20 November 2026, Prague is UTC+1. */
const MONDAY = Temporal.Instant.from('2026-11-16T09:00:00Z')
const THURSDAY = Temporal.Instant.from('2026-11-19T15:00:00Z')
const DIGEST = Temporal.Instant.from('2026-11-20T06:12:00Z')
const AFTER = Temporal.Instant.from('2026-11-20T09:00:00Z')

function candidate(id: number, extra: Partial<DigestCandidate> = {}): DigestCandidate {
  return {
    announcedAt: null,
    authors: ['Tereza Vlková'],
    cancelledAt: null,
    handedOverAt: THURSDAY,
    id,
    issueName: 'VDM_2026_5',
    name: `Článek ${id}`,
    ...extra,
  }
}

const ids = (list: readonly DigestCandidate[]) => list.map((each) => each.id)

describe('the morning digest (12n)', () => {
  it('sends nothing when only waiting articles are left, and nothing with nothing at all', () => {
    assert.equal(digestOf([]), null)
    assert.equal(digestOf([candidate(1, { announcedAt: DIGEST, handedOverAt: MONDAY })]), null)
  })

  it('puts a new handover first, with what still waits beside it, the oldest first', () => {
    let digest = digestOf([
      candidate(1),
      candidate(2, { announcedAt: DIGEST, handedOverAt: THURSDAY }),
      candidate(3, { announcedAt: DIGEST, handedOverAt: MONDAY }),
    ])
    assert.deepEqual(ids(digest?.handedOver ?? []), [1])
    assert.deepEqual(ids(digest?.waiting ?? []), [3, 2])
    assert.deepEqual(ids(digest?.cancelled ?? []), [])
  })

  it('tells of a cancellation only once a digest had told of the handover', () => {
    let told = candidate(1, { announcedAt: DIGEST, cancelledAt: AFTER })
    assert.deepEqual(ids(digestOf([told])?.cancelled ?? []), [1])
    assert.equal(digestOf([candidate(2, { cancelledAt: AFTER })]), null)
  })

  it('takes a handover newer than the announcement for a new one, with its new date', () => {
    let again = candidate(1, { announcedAt: DIGEST, handedOverAt: AFTER })
    assert.deepEqual(ids(digestOf([again])?.handedOver ?? []), [1])
  })
})

describe('a run of the digest job (14e)', () => {
  it('keeps what came of it, and reads back only what it wrote', () => {
    let sent = { cancelled: 1, handedOver: 2, kind: 'sent', waiting: 3 } as const
    assert.deepEqual(readDigestRun(writeDigestRun(sent)), sent)
    assert.deepEqual(readDigestRun('{"kind":"no-address"}'), { kind: 'no-address' })
    assert.equal(readDigestRun('not json'), null)
    assert.equal(readDigestRun(null), null)
  })

  it('says each count only when it is not zero, under fixed labels', () => {
    assert.equal(
      digestRunEvent({ cancelled: 1, handedOver: 2, kind: 'sent', waiting: 3 }),
      'Přehled odeslán. Nová předání: 2 · zrušená předání: 1 · čekající články: 3.',
    )
    assert.equal(
      digestRunEvent({ cancelled: 1, handedOver: 0, kind: 'sent', waiting: 0 }),
      'Přehled odeslán. Zrušená předání: 1.',
    )
    assert.equal(
      digestRunEvent({ kind: 'nothing' }),
      'Bez nových nebo zrušených předání k oznámení.',
    )
  })
})

function run(startedAt: Temporal.Instant, summary: string, isOk: boolean): JobRunRecord {
  return {
    error: null,
    finishedAt: startedAt.add({ seconds: 5 }),
    intervalMinutes: 1440,
    outcome: isOk ? 'ok' : 'failed',
    startedAt,
    summary,
  }
}

describe('the digest among the jobs (14d, 14i)', () => {
  let job = jobByKey(PROOFREADING_DIGEST_JOB)!

  it('runs in a window, which is its schedule', () => {
    assert.equal(scheduleText(1440, DIGEST_WINDOW), 'denně 7:00–8:00')
  })

  it('expects the next run tomorrow in the window, and stops after one morning without one', () => {
    let latest = run(DIGEST, writeDigestRun({ kind: 'nothing' }), true)
    let tag = jobTag(stateOfJob(job, latest, AFTER), AFTER, job, latest)
    assert.equal(
      tag.detail?.replaceAll(' ', ' '),
      'Poslední běh v 7:12 · další se očekává zítra mezi 7:00 a 8:00',
    )
    let nextMorning = Temporal.Instant.from('2026-11-21T05:30:00Z')
    assert.equal(
      jobTag(stateOfJob(job, latest, nextMorning), nextMorning, job, latest).detail?.replaceAll(
        ' ',
        ' ',
      ),
      'Poslední běh 20. 11. v 7:12 · další se očekává mezi 7:00 a 8:00',
    )
    let missed = Temporal.Instant.from('2026-11-21T07:06:00Z')
    assert.equal(jobHealth(latest, missed, DIGEST_WINDOW).kind, 'stopped')
    assert.equal(isJobInBanner(job, [latest], missed), true)
  })

  it('stands in the banner from the first unconfirmed digest, never for a missing address', () => {
    let unconfirmed = run(DIGEST, writeDigestRun({ kind: 'unconfirmed' }), false)
    let noAddress = run(DIGEST, writeDigestRun({ kind: 'no-address' }), false)
    assert.equal(isDigestAlarm(unconfirmed), true)
    assert.equal(isJobInBanner(job, [unconfirmed], AFTER), true)
    assert.equal(isJobInBanner(job, [noAddress, noAddress], AFTER), false)
    assert.equal(
      jobTag(stateOfJob(job, noAddress, AFTER), AFTER, job, noAddress).detail?.replaceAll(' ', ' '),
      'Poslední běh v 7:12 · chybí adresa korektorů',
    )
  })
})
