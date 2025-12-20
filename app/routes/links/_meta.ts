import { getPageTitle } from '~/utils/get-page-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = () => {
  const pageTitle = getPageTitle('Odkazy')
  const pageDescription =
    'Všechny důležité odkazy na Vedneměsíčník přehledně na jednom místě. Sleduj nás na sociálních sítích, poslechni si nový díl podcastu, přečti si nejnovější číslo, projdi archiv nebo objev nové články.'
  const pageKeywords = 'vedneměsíčník, podcast, články, archiv, odkazy'

  return [
    { title: pageTitle },
    { content: pageDescription, name: 'description' },
    { content: pageKeywords, name: 'keywords' },

    // Open Graph
    { content: pageTitle, property: 'og:title' },
    { content: pageDescription, property: 'og:description' },
    { content: 'https://vednemesicnik.cz/links', property: 'og:url' },
    { content: 'website', property: 'og:type' },
    {
      content: 'https://vednemesicnik.cz/images/og/links-cz-vednemesicnik.jpg',
      property: 'og:image',
    },
  ]
}
