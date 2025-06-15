import type { Route } from "./+types/route"

export const links: Route.LinksFunction = () => {
  const baseUrl = ENV.BASE_URL

  return [{ rel: "canonical", href: baseUrl }]
}
