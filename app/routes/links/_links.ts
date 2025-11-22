import { href } from "react-router"

import type { Route } from "./+types/route"

export const links: Route.LinksFunction = () => {
  const baseUrl = "https://vednemesicnik.cz"

  return [{ rel: "canonical", href: `${baseUrl}${href("/links")}` }]
}
