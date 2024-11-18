import { Link, type UIMatch } from "@remix-run/react"
import type { ParamParseKey } from "@remix-run/router"

import { type loader } from "./_loader"

type RouteParams = Record<
  ParamParseKey<"/podcasts/:podcastSlug/:episodeSlug">,
  string
>

export const handle = {
  breadcrumb: (match: UIMatch<typeof loader>) => {
    const { podcastSlug, episodeSlug } = match.params as RouteParams
    const { title } = match.data.podcastEpisode

    return <Link to={`/podcasts/${podcastSlug}/${episodeSlug}`}>{title}</Link>
  },
}
