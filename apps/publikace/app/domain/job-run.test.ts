import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { jobHealth, jobState } from './job-run.ts'

const START = Temporal.Instant.from('2026-11-19T08:02:00Z')
const RUN = { intervalMinutes: 30, startedAt: START }

describe('jobHealth', () => {
  it('knows nothing before the first run', () => {
    assert.deepEqual(jobHealth(null, START), { kind: 'never' })
  })

  it('estimates the next run to five minutes, after kolem', () => {
    assert.deepEqual(jobHealth(RUN, START.add({ minutes: 10 })), {
      kind: 'running',
      lastStartedAt: START,
      next: Temporal.Instant.from('2026-11-19T08:30:00Z'),
    })
  })

  it('shows no estimate once it has passed', () => {
    let health = jobHealth(RUN, START.add({ minutes: 40 }))
    assert.equal(health.kind === 'running' ? health.next : 'other', null)
  })

  it('calls a job that missed two runs stopped', () => {
    assert.equal(jobHealth(RUN, START.add({ minutes: 64 })).kind, 'running')
    assert.deepEqual(jobHealth(RUN, START.add({ minutes: 66 })), {
      kind: 'stopped',
      lastStartedAt: START,
    })
  })
})

describe('jobState', () => {
  const OPEN = { ...RUN, error: null, finishedAt: null, outcome: null }
  const OK = { ...RUN, error: null, finishedAt: START.add({ minutes: 2 }), outcome: 'ok' as const }
  const FAILED = { ...OK, error: 'Reply check failed: timeout', outcome: 'failed' as const }

  it('knows nothing before the first run', () => {
    assert.deepEqual(jobState(null, START), { kind: 'never' })
  })

  it('calls an open run running until it has been open past the time a run lasts', () => {
    assert.deepEqual(jobState(OPEN, START.add({ minutes: 10 })), {
      kind: 'running',
      startedAt: START,
    })
    assert.deepEqual(jobState(OPEN, START.add({ minutes: 11 })), {
      isUnreported: true,
      kind: 'failed',
      lastStartedAt: START,
      next: Temporal.Instant.from('2026-11-19T08:30:00Z'),
    })
  })

  it('takes the outcome of a finished run, with the estimate while it is ahead', () => {
    assert.deepEqual(jobState(OK, START.add({ minutes: 10 })), {
      kind: 'ok',
      lastStartedAt: START,
      next: Temporal.Instant.from('2026-11-19T08:30:00Z'),
    })
    assert.deepEqual(jobState(FAILED, START.add({ minutes: 40 })), {
      isUnreported: false,
      kind: 'failed',
      lastStartedAt: START,
      next: null,
    })
  })

  it('calls a job that missed two runs stopped, whatever its last run did', () => {
    for (let run of [OPEN, OK, FAILED]) {
      assert.deepEqual(jobState(run, START.add({ minutes: 66 })), {
        kind: 'stopped',
        lastStartedAt: START,
      })
    }
  })
})
