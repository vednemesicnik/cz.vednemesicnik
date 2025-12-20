import { href } from "react-router"

import type { Breadcrumb, BreadcrumbMatch } from "~/types/breadcrumb"

import type { Route } from "./+types/route"

type Match = BreadcrumbMatch<
  Route.ComponentProps["loaderData"],
  Route.ComponentProps["params"]
>

export const handle = {
  breadcrumb: (match: Match): Breadcrumb => {
    const { podcastSlug } = match.params
    const { title } = match.loaderData?.podcast ?? {}

    return {
      label: `${title}`,
      path: href(`/podcasts/:podcastSlug`, {
        podcastSlug,
      }),
    }
  },
}
