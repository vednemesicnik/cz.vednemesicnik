import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { createTestApp } from '../test-app.server.ts'
import { createJobRunStore } from './job-runs.server.ts'

const AT = Temporal.Instant.from('2026-11-19T08:00:00Z')

describe('the job run store', () => {
  it('reads the latest run with how it ended, and an open one as open', async () => {
    let app = await createTestApp()
    try {
      let runs = createJobRunStore(app.database)
      assert.equal(await runs.latest('artwork-replies'), null)

      await runs.start({ at: AT, intervalMinutes: 30, job: 'artwork-replies', runKey: 'r-1' })
      assert.deepEqual(await runs.latest('artwork-replies'), {
        error: null,
        finishedAt: null,
        intervalMinutes: 30,
        outcome: null,
        startedAt: AT,
      })

      let end = AT.add({ minutes: 2 })
      await runs.finish('artwork-replies', 'r-1', { at: end, error: 'timeout', outcome: 'failed' })
      assert.deepEqual(await runs.latest('artwork-replies'), {
        error: 'timeout',
        finishedAt: end,
        intervalMinutes: 30,
        outcome: 'failed',
        startedAt: AT,
      })
    } finally {
      await app.close()
    }
  })

  it('gives the history since a moment, the newest first, and only of that job', async () => {
    let app = await createTestApp()
    try {
      let runs = createJobRunStore(app.database)
      let old = AT.subtract({ hours: 24 * 31 })
      await runs.start({ at: old, intervalMinutes: 30, job: 'artwork-replies', runKey: 'r-0' })
      await runs.start({ at: AT, intervalMinutes: 30, job: 'artwork-replies', runKey: 'r-1' })
      let later = AT.add({ minutes: 30 })
      await runs.start({ at: later, intervalMinutes: 30, job: 'artwork-replies', runKey: 'r-2' })
      await runs.start({ at: later, intervalMinutes: 60, job: 'other', runKey: 'r-3' })

      let history = await runs.history('artwork-replies', AT.subtract({ hours: 24 * 30 }))
      assert.deepEqual(
        history.map((run) => run.startedAt),
        [later, AT],
      )
    } finally {
      await app.close()
    }
  })

  it('gives the latest runs up to a limit, the newest first, and only of that job', async () => {
    let app = await createTestApp()
    try {
      let runs = createJobRunStore(app.database)
      assert.deepEqual(await runs.latestRuns('artwork-replies', 3), [])
      let starts = [0, 30, 60, 90].map((minutes) => AT.add({ minutes }))
      for (let [index, at] of starts.entries()) {
        await runs.start({ at, intervalMinutes: 30, job: 'artwork-replies', runKey: `r-${index}` })
      }
      await runs.start({
        at: AT.add({ minutes: 120 }),
        intervalMinutes: 60,
        job: 'other',
        runKey: 'r-9',
      })

      let latest = await runs.latestRuns('artwork-replies', 3)
      assert.deepEqual(
        latest.map((run) => run.startedAt),
        [starts[3], starts[2], starts[1]],
      )
    } finally {
      await app.close()
    }
  })
})
