import { broadcaster } from './broadcaster.server'
import type { ContentEvent } from './content-event'

/**
 * Tells every open administration stream that a piece of content changed.
 * Fire-and-forget: a failure is only logged and never reaches the action.
 */
export const publishContentEvent = (event: ContentEvent): void => {
  try {
    broadcaster.publish('admin', {
      data: JSON.stringify(event),
      event: 'content-change',
    })
  } catch (error) {
    console.error('Failed to publish a content event', error)
  }
}
