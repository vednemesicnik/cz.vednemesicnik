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

    const label = match.loaderData?.member?.fullName ?? "Neznámý člen"
    const path = href("/administration/editorial-board/members/:memberId", {
      memberId,
    })

    return { label, path }
  },
}