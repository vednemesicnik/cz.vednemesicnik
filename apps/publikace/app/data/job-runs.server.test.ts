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
        startedBy: null,
        summary: null,
      })

      let end = AT.add({ minutes: 2 })
      await runs.finish('artwork-replies', 'r-1', {
        at: end,
        error: 'timeout',
        outcome: 'failed',
        summary: '{"kind":"unconfirmed"}',
      })
      assert.deepEqual(await runs.latest('artwork-replies'), {
        error: 'timeout',
        finishedAt: end,
        intervalMinutes: 30,
        outcome: 'failed',
        startedAt: AT,
        startedBy: null,
        summary: '{"kind":"unconfirmed"}',
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

  it('opens one run for a start by hand, of its own job, and names who asked for it', async () => {
    let app = await createTestApp()
    try {
      let runs = createJobRunStore(app.database)
      let marie = { email: 'marie@vednemesicnik.test', name: 'Marie Horáková' }
      let since = AT.subtract({ minutes: 10 })
      let request = { at: AT, by: marie, pendingSince: since }
      await runs.start({
        at: AT.subtract({ hours: 1 }),
        intervalMinutes: 30,
        job: 'artwork-replies',
        runKey: 'r-0',
      })
      assert.equal(
        await runs.requestStart({ ...request, job: 'artwork-replies', startKey: 's-1' }),
        true,
      )
      /* One start waits at a time. */
      assert.equal(
        await runs.requestStart({ ...request, job: 'artwork-replies', startKey: 's-2' }),
        false,
      )
      assert.equal((await runs.pendingStart('artwork-replies', since))?.toString(), AT.toString())
      assert.equal(await runs.pendingStart('artwork-replies', AT.add({ minutes: 1 })), null)

      let later = AT.add({ minutes: 1 })
      let opened = { at: later, intervalMinutes: 30, startKey: 's-1' }
      assert.equal(await runs.start({ ...opened, job: 'print-handoff', runKey: 'r-x' }), false)
      assert.equal(await runs.start({ ...opened, job: 'artwork-replies', runKey: 'r-1' }), true)
      assert.equal(await runs.start({ ...opened, job: 'artwork-replies', runKey: 'r-2' }), false)
      assert.equal(
        await runs.start({ ...opened, job: 'artwork-replies', runKey: 'r-3', startKey: 'nope' }),
        false,
      )
      assert.equal(await runs.latest('print-handoff'), null)

      assert.deepEqual((await runs.latest('artwork-replies'))?.startedBy, marie)
      assert.equal(
        (await runs.latestScheduled('artwork-replies'))?.startedAt.toString(),
        AT.subtract({ hours: 1 }).toString(),
      )
      assert.equal(await runs.pendingStart('artwork-replies', since), null)
      assert.deepEqual(
        (await runs.history('artwork-replies', since)).map((run) => run.startedBy?.name ?? null),
        ['Marie Horáková'],
      )
    } finally {
      await app.close()
    }
  })

  it('lets a start the script refused wait no more, and a new one be asked for', async () => {
    let app = await createTestApp()
    try {
      let runs = createJobRunStore(app.database)
      let by = { email: 'marie@vednemesicnik.test', name: 'Marie Horáková' }
      let since = AT.subtract({ minutes: 10 })
      await runs.requestStart({
        at: AT,
        by,
        job: 'artwork-replies',
        pendingSince: since,
        startKey: 's-1',
      })
      await runs.markStartFailed('s-1', AT)
      assert.equal(await runs.pendingStart('artwork-replies', since), null)
      assert.equal(
        await runs.requestStart({
          at: AT,
          by,
          job: 'artwork-replies',
          pendingSince: since,
          startKey: 's-2',
        }),
        true,
      )
      /* A run that came after all still counts as that start's. */
      assert.equal(
        await runs.start({
          at: AT,
          intervalMinutes: 30,
          job: 'artwork-replies',
          runKey: 'r-1',
          startKey: 's-1',
        }),
        true,
      )
    } finally {
      await app.close()
    }
  })
})
