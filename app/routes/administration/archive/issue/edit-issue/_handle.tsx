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

    const label = "Upravit číslo"
    const path = href("/administration/archive/:issueId/edit-issue", {
      issueId,
    })

    return { label, path }
  },
}
