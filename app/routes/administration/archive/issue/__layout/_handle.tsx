import { href } from "react-router"

import type { Breadcrumb, BreadcrumbMatch } from "~/types/breadcrumb"

import type { Route } from "./+types/route"

type Match = BreadcrumbMatch<
  Route.ComponentProps["loaderData"],
  Route.ComponentProps["params"]
>

export const handle = {
  breadcrumb: (match: Match): Breadcrumb => {
    const { issueId } = match.params

    const label = match.loaderData?.issue?.label ?? "Neznámé číslo"
    const path = href(`/administration/archive/:issueId`, { issueId })

    return { label, path }
  },
}
