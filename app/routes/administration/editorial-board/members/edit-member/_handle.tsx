import { Link } from "react-router"

import { type CustomUIMatch } from "~/routes/types"

import type { Info } from "./+types/route"

type Match = CustomUIMatch<Info["params"], Info["loaderData"]>

export const handle = {
  breadcrumb: (match: Match) => {
    const { memberId } = match.params
    const { fullName } = match.data.editorialBoardMember

    return (
      <Link
        to={`/administration/editorial-board/members/edit-member/${memberId}`}
      >
        Upravit člena [{fullName}]
      </Link>
    )
  },
}
