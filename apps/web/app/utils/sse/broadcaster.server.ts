import { remember } from '@epic-web/remember'

import { createBroadcaster } from './create-broadcaster.server'

// In memory, so events reach only the clients of this instance: fine while Fly
// runs one machine (fly.toml), not across several.
export const broadcaster = remember('serverSentEventBroadcaster', () =>
  createBroadcaster(),
)
