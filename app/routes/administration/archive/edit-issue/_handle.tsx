import { Link } from "react-router"

import { type CustomUIMatch } from "~/routes/types"

import type { Info } from "./+types/route"

type Match = CustomUIMatch<Info["params"], Info["loaderData"]>

export const handle = {
  breadcrumb: (match: Match) => {
    const { issueId } = match.params
    const { label } = match.data.issue

    return (
      <Link to={`/administration/archive/edit-issue/${issueId}`}>
        Upravit výtisk [{label}]
      </Link>
    )
  },
}
