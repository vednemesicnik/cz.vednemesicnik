import { Link } from "react-router"

import { type CustomUIMatch } from "~/routes/types"

import type { Info } from "./+types/route"

type Match = CustomUIMatch<Info["params"], Info["loaderData"]>

export const handle = {
  breadcrumb: (match: Match) => {
    const { userId } = match.params
    const { name } = match.data.user

    return (
      <Link to={`/administration/users/edit-user/${userId}`}>
        Upravit uživatele [{name}]
      </Link>
    )
  },
}
