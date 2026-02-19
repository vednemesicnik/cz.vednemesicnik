import { href } from 'react-router'
import { createPageSEO } from '~/utils/create-page-seo'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = () => {
  const pageSeo = createPageSEO({
    description: 'Archiv čísel Vedneměsíčníku',
    title: 'Archiv',
    url: new URL(href('/archive'), ENV.BASE_URL).href,
  })

  return [...pageSeo]
}
