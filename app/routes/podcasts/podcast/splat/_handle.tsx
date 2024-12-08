import { Link } from "react-router"

import { type CustomUIMatch } from "~/routes/types"

import type { Info } from "./+types/route"

type Match = CustomUIMatch<Info["params"], Info["loaderData"]>

export const handle = {
  breadcrumb: (match: Match) => {
    const { podcastSlug } = match.params
    const { title } = match.data.podcast

    return <Link to={`/podcasts/${podcastSlug}`}>{title}</Link>
  },
}
