import { href } from "react-router"

import type { Breadcrumb, BreadcrumbMatch } from "~/types/breadcrumb"

import type { Route } from "./+types/route"

type Match = BreadcrumbMatch<
  Route.ComponentProps["loaderData"],
  Route.ComponentProps["params"]
>

export const handle = {
  breadcrumb: (match: Match): Breadcrumb => {
    const { userId } = match.params
    const { name } = match.loaderData?.user ?? {}

    return {
      label: `Upravit uživatele [${name}]`,
      path: href(`/administration/users/edit-user/:userId`, { userId }),
    }
  },
}
