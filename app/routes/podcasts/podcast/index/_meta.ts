import type { Route } from "./+types/route"

export const meta: Route.MetaFunction = ({ data }) => {
  const podcastTitle = data?.podcast.title ?? "..."
  return [{ title: `Vedneměsíčník | Podcasty - ${podcastTitle}` }]
}
