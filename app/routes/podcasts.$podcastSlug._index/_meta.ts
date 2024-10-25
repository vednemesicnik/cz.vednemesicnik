import type { MetaFunction } from "@remix-run/node"

import { type loader } from "./_loader"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const podcastTitle = data?.podcast.title ?? "..."
  return [{ title: `Vedneměsíčník | Podcasty - ${podcastTitle}` }]
}
