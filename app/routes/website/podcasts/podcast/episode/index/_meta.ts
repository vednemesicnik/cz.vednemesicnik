import type { Route } from "./+types/route"

export const meta: Route.MetaFunction = ({ data }) => {
  const podcastTitle = data?.episode.podcast.title ?? "..."
  const episodeTitle = data?.episode.title ?? "..."
  return [
    {
      title: `Vedneměsíčník | Podcasty - ${podcastTitle}: ${episodeTitle}`,
    },
  ]
}
