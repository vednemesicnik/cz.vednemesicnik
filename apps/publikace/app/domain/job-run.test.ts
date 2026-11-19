import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { jobHealth } from './job-run.ts'

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
