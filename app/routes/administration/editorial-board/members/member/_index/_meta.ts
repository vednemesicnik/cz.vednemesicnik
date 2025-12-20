import { getPageTitle } from "~/utils/get-page-title"

import type { Route } from "./+types/route"

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const title = getPageTitle(
    `Administrace: Redakce > Členové - ${loaderData.member.fullName}`
  )

  return [{ title }]
}
