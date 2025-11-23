import { href } from "react-router"

import type { Breadcrumb, BreadcrumbMatch } from "~/types/breadcrumb"

import type { Route } from "./+types/route"

type Match = BreadcrumbMatch<
  Route.ComponentProps["loaderData"],
  Route.ComponentProps["params"]
>

export const handle = {
  breadcrumb: (match: Match): Breadcrumb => {
    const { podcastSlug, episodeSlug } = match.params
    const { title } = match.loaderData?.podcastEpisode ?? {}

    return {
      label: `${title}`,
      path: href(`/podcasts/:podcastSlug/:episodeSlug`, {
        podcastSlug,
        episodeSlug,
      }),
    }
  },
}
