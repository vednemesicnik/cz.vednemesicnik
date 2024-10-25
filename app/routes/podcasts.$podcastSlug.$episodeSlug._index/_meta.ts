import type { MetaFunction } from "@remix-run/node"

import { type loader } from "./_loader"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const podcastTitle = data?.episode.podcast.title ?? "..."
  const episodeTitle = data?.episode.title ?? "..."
  return [
    {
      title: `Vedneměsíčník | Podcasty - ${podcastTitle}: ${episodeTitle}`,
    },
  ]
}
