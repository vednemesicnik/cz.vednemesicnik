import type { ContentQueue } from '~/config/content-queue-config'
import { buildContentQueueWhere } from '~/utils/build-content-queue-where'

import type { DashboardType } from '../dashboard-types'

/** Which content a dashboard section shows; `keys` reloads rows already on screen (22f). */
export type DashboardSelection =
  | { queues: ContentQueue[]; publishedSince?: Date; ownOnly: boolean }
  | { keys: string[] }

/**
 * A dashboard section's condition for one type (design 21a, 21b), to AND with
 * the type's permission `where`. *Rozepsané* and *Odeslané* hold one's own
 * content only: the permission `where` alone lets the Coordinator and the
 * Creator view others' drafts too (log 0051).
 *
 * @param selection - The section's queues, whether only one's own, and since
 *   when it keeps published content; or the `type:id` keys of the rows on
 *   screen, which the client only sends for rows it was given.
 * @param type - The type the condition is for.
 * @param own - The type's "mine": `{ authorId }`, or an article's authors.
 * @returns The condition, or `null` when the section holds none of the type.
 */
export const buildDashboardSectionWhere = (
  selection: DashboardSelection,
  type: DashboardType,
  own: object,
) => {
  if ('keys' in selection) {
    const ids = selection.keys.flatMap((key) => {
      const [keyType, id] = key.split(':')
      return keyType === type && id !== undefined && id !== '' ? [id] : []
    })

    return ids.length === 0 ? null : { id: { in: ids } }
  }

  return {
    AND: [
      selection.ownOnly ? own : {},
      {
        OR: [
          ...selection.queues.map(buildContentQueueWhere),
          ...(selection.publishedSince === undefined
            ? []
            : [
                {
                  publishedAt: { gte: selection.publishedSince },
                  state: 'published' as const,
                },
              ]),
        ],
      },
    ],
  }
}
