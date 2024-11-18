import { Link, type UIMatch } from "@remix-run/react"
import type { ParamParseKey } from "@remix-run/router"

import { type loader } from "./_loader"

type RouteParams = Record<ParamParseKey<"/podcasts/:podcastSlug">, string>

export const handle = {
  breadcrumb: (match: UIMatch<typeof loader>) => {
    const { podcastSlug } = match.params as RouteParams
    const { title } = match.data.podcast

    return <Link to={`/podcasts/${podcastSlug}`}>{title}</Link>
  },
}
