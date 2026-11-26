import { describe, expect, test } from 'vitest'

import { countContentQueues } from './count-content-queues.server'

describe('countContentQueues', () => {
  test('counts the work in progress, in the menu order', async () => {
    const counts = { approved: 3, draft: 1, pending: 2 }

    expect(
      await countContentQueues(false, async (queue) =>
        queue in counts ? counts[queue as keyof typeof counts] : -1,
      ),
    ).toEqual([
      { count: 1, queue: 'draft' },
      { count: 2, queue: 'pending' },
      { count: 3, queue: 'approved' },
    ])
  })

  test('counts the drafts and Odeslané of a Contributor', async () => {
    expect(
      (await countContentQueues(true, async () => 0)).map(
        (entry) => entry.queue,
      ),
    ).toEqual(['draft', 'submitted'])
  })
})
