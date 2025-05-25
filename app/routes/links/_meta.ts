import { getPageTitle } from "~/utils/get-page-title"

import type { Route } from "./+types/route"

export const meta: Route.MetaFunction = () => {
  const pageTitle = getPageTitle("Odkazy")
  const pageDescription =
    "Všechny důležité odkazy na Vedneměsíčník přehledně na jednom místě. Sleduj nás na sociálních sítích, poslechni si nový díl podcastu, přečti si nejnovější číslo, projdi archiv nebo objev nové články."
  const pageKeywords = "vedneměsíčník, podcast, články, archiv, odkazy"

  return [
    { title: pageTitle },
    { name: "description", content: pageDescription },
    { name: "keywords", content: pageKeywords },

    // Open Graph
    { property: "og:title", content: pageTitle },
    { property: "og:description", content: pageDescription },
    { property: "og:url", content: "https://vednemesicnik.cz/links" },
    { property: "og:type", content: "website" },
    {
      property: "og:image",
      content: "https://vednemesicnik.cz/images/og/links-cz-vednemesicnik.jpg",
    },
  ]
}
