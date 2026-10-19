import { describe, expect, it } from 'vitest'

import { createOneAtATimeQueue } from './create-one-at-a-time-queue'

describe('createOneAtATimeQueue', () => {
  it('starts a job only after the one before settled', async () => {
    const queue = createOneAtATimeQueue()
    const events: string[] = []
    let finishFirst = () => {}

    const first = queue.run(
      () =>
        new Promise<string>((resolve) => {
          events.push('first started')
          finishFirst = () => {
            events.push('first finished')
            resolve('first')
          }
        }),
    )
    const second = queue.run(async () => {
      events.push('second started')
      return 'second'
    })

    await Promise.resolve()
    expect(events).toEqual(['first started'])

    finishFirst()
    await expect(Promise.all([first, second])).resolves.toEqual([
      'first',
      'second',
    ])
    expect(events).toEqual([
      'first started',
      'first finished',
      'second started',
    ])
  })

  it('runs the next job after one fails', async () => {
    const queue = createOneAtATimeQueue()

    const failed = queue.run(async () => {
      throw new Error('broken')
    })
    const next = queue.run(async () => 'done')

    await expect(failed).rejects.toThrow('broken')
    await expect(next).resolves.toBe('done')
  })
})
