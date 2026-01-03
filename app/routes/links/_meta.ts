import { createPageSEO } from '~/utils/create-page-seo'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = ({ location }) => {
  const pageSEO = createPageSEO({
    description:
      'Všechny důležité odkazy na Vedneměsíčník přehledně na jednom místě. Sleduj nás na sociálních sítích, poslechni si nový díl podcastu, přečti si nejnovější číslo, projdi archiv nebo objev nové články.',
    keywords: 'vedneměsíčník, podcast, články, archiv, odkazy',
    ogImage: `${ENV.BASE_URL}/images/og/links-cz-vednemesicnik.jpg`,
    title: 'Odkazy',
    url: new URL(location.pathname, ENV.BASE_URL).href,
  })

  return [...pageSEO]
}
