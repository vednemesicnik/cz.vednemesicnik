import { Link, type UIMatch } from "react-router"

import type { Route } from "./+types/route"

interface RouteMatch extends UIMatch {
  params: Route.ComponentProps["params"]
  data: Route.ComponentProps["loaderData"]
}

export const handle = {
  breadcrumb: (match: RouteMatch) => {
    const { podcastSlug, episodeSlug } = match.params
    const { title } = match.data.podcastEpisode

    return <Link to={`/podcasts/${podcastSlug}/${episodeSlug}`}>{title}</Link>
  },
}
