import { Link } from "react-router"

import { type CustomUIMatch } from "~/routes/types"

import type { Info } from "./+types/route"

type Match = CustomUIMatch<Info["params"], Info["loaderData"]>

export const handle = {
  breadcrumb: (match: Match) => {
    const { podcastId, episodeId } = match.params

    return (
      <Link
        to={`/administration/podcasts/${podcastId}/edit-episode/${episodeId}`}
      >
        Upavit epizodu
      </Link>
    )
  },
}
