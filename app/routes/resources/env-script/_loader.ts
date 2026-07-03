import { getContentHash } from '~/utils/hash.server'

import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const script = `window.ENV = ${JSON.stringify(ENV)};`
  const etag = `"${getContentHash(script)}"`

  const headers = {
    // Stable URL: `immutable`/long max-age would let a changed window.ENV go stale.
    // `no-cache` = may be stored, but must revalidate via ETag before use.
    'Cache-Control': 'public, no-cache',
    'Content-Type': 'application/javascript',
    ETag: etag,
  }

  // Cheap 304 when the client's cached copy still matches.
  if (request.headers.get('If-None-Match') === etag) {
    return new Response(null, { headers, status: 304 })
  }

  return new Response(script, { headers })
}
