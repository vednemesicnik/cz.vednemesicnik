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

    const label = match.loaderData?.position?.pluralLabel ?? "Neznámá pozice"
    const path = href("/administration/editorial-board/positions/:positionId", {
      positionId,
    })

    return { label, path }
  },
}