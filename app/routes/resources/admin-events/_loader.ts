import { getAuthentication } from '~/utils/auth.server'
import { createEventStreamResponse } from '~/utils/sse/create-event-stream-response.server'

import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  // 401, not a sign-in redirect: EventSource would fetch the sign-in page and
  // retry forever, while a non-200 stops it. The events are hints (ids, who
  // and when); data access stays with each page's loader.
  const { isAuthenticated } = await getAuthentication(request)

  if (!isAuthenticated) {
    return new Response(null, { status: 401 })
  }

  return createEventStreamResponse(request, { topic: 'admin' })
}
