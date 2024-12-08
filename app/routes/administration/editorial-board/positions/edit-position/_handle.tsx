import { Link } from "react-router"

import { type CustomUIMatch } from "~/routes/types"

import type { Info } from "./+types/route"

type Match = CustomUIMatch<Info["params"], Info["loaderData"]>

export const handle = {
  breadcrumb: (match: Match) => {
    const { positionId } = match.params
    const { key } = match.data.editorialBoardPosition

    return (
      <Link
        to={`/administration/editorial-board/positions/edit-position/${positionId}`}
      >
        Upravit pozici [{key}]
      </Link>
    )
  },
}
