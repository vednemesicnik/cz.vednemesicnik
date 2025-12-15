import { getPageTitle } from "~/utils/get-page-title"

import type { Route } from "./+types/route"

export const meta: Route.MetaFunction = () => {
  const title = getPageTitle("Administrace: Přidat epizodu")

  return [{ title }]
}