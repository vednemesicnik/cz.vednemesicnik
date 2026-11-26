import { createSharedEventSource } from './create-shared-event-source'

// One per browser tab; the connection opens only on the first subscription.
export const adminEventSource = createSharedEventSource(
  '/resources/admin-events',
)
