import { href } from "react-router"

import type { Breadcrumb, BreadcrumbMatch } from "~/types/breadcrumb"

import type { Route } from "./+types/route"

type Match = BreadcrumbMatch<
  Route.ComponentProps["loaderData"],
  Route.ComponentProps["params"]
>

export const handle = {
  breadcrumb: (match: Match): Breadcrumb => {
    const { authorId } = match.params

    const label = match.loaderData?.author.name ?? "Neznámý autor"
    const path = href(`/administration/authors/:authorId`, { authorId })

    return { label, path }
  },
}
