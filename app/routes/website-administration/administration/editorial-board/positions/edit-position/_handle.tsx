import { href } from "react-router"

import type { Breadcrumb, BreadcrumbMatch } from "~/types/breadcrumb"

import type { Route } from "./+types/route"

type Match = BreadcrumbMatch<
  Route.ComponentProps["loaderData"],
  Route.ComponentProps["params"]
>

export const handle = {
  breadcrumb: (match: Match): Breadcrumb => {
    const { positionId } = match.params
    const { key } = match.loaderData?.editorialBoardPosition ?? {}

    return {
      label: `Upravit pozici [${key}]`,
      path: href(
        "/administration/editorial-board/positions/edit-position/:positionId",
        { positionId }
      ),
    }
  },
}
