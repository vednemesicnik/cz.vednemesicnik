import { createPageSEO } from '~/utils/create-page-seo'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = () => {
  const pageSEO = createPageSEO({
    description: 'Archiv čísel Vedneměsíčníku',
    title: 'Archiv',
    url: new URL('/archive', ENV.BASE_URL).href,
  })

  return [...pageSEO]
}
