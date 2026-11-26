import {
  CONTRIBUTOR_COUNTED_QUEUES,
  COUNTED_QUEUES,
  type ContentQueue,
  type QueueCount,
} from '~/config/content-queue-config'

/**
 * Counts the work in progress for the Stav menu (design 22d): Koncepty, Ke
 * schválení and Schválené, or a Contributor's Koncepty and Odeslané. The
 * caller counts within what the role may view, whatever else is searched or
 * filtered.
 *
 * @param isContributor - Whether the viewer is a Contributor.
 * @param countQueue - Counts the records in one queue.
 * @returns The count per queue, in the menu's order.
 */
export const countContentQueues = (
  isContributor: boolean,
  countQueue: (queue: ContentQueue) => Promise<number>,
): Promise<QueueCount[]> =>
  Promise.all(
    (isContributor ? CONTRIBUTOR_COUNTED_QUEUES : COUNTED_QUEUES).map(
      async (queue) => ({ count: await countQueue(queue), queue }),
    ),
  )
