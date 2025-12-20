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

    return {
      label: `Upravit pozici`,
      path: href(
        "/administration/editorial-board/positions/:positionId/edit-position",
        { positionId }
      ),
    }
  },
}
