import { href } from "react-router"

import type { Breadcrumb, BreadcrumbMatch } from "~/types/breadcrumb"

import type { Route } from "./+types/route"

type Match = BreadcrumbMatch<
  Route.ComponentProps["loaderData"],
  Route.ComponentProps["params"]
>

export const handle = {
  breadcrumb: (match: Match): Breadcrumb => {
    const { memberId } = match.params
    const { fullName } = match.loaderData?.editorialBoardMember ?? {}

    return {
      label: `Upravit člena [${fullName}]`,
      path: href(
        `/administration/editorial-board/members/edit-member/:memberId`,
        { memberId }
      ),
    }
  },
}
