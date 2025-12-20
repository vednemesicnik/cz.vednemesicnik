import { getPageTitle } from "~/utils/get-page-title"

import type { Route } from "./+types/route"

export const meta: Route.MetaFunction = ({ data }) => {
  const title = data?.episode?.title
    ? getPageTitle(`Administrace: ${data.episode.title}`)
    : getPageTitle("Administrace: Epizoda")

  return [{ title }]
}
