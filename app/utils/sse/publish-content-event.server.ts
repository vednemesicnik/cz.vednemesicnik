import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import { broadcaster } from './broadcaster.server'
import type { ContentEvent } from './content-event'

/** The author behind a content event: a permission context fits. */
export type PublishingAuthor = Pick<
  AuthorPermissionContext,
  'authorId' | 'authorName'
>

/**
 * Tells every open administration stream that a piece of content changed, who
 * changed it and when. Fire-and-forget: a failure is only logged and never
 * reaches the action.
 *
 * @param event - What changed.
 * @param actor - The permission context of the author who changed it.
 */
export const publishContentEvent = (
  event: Omit<ContentEvent, 'actor' | 'occurredAt'>,
  actor: PublishingAuthor,
): void => {
  try {
    const contentEvent: ContentEvent = {
      ...event,
      actor: { authorId: actor.authorId, name: actor.authorName },
      occurredAt: new Date().toISOString(),
    }

    broadcaster.publish('admin', {
      data: JSON.stringify(contentEvent),
      event: 'content-change',
    })
  } catch (error) {
    console.error('Failed to publish a content event', error)
  }
}
