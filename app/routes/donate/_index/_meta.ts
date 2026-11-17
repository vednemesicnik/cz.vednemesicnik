import { href } from 'react-router'
import { createPageSEO } from '~/utils/create-page-seo'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = () => {
  return createPageSEO({
    description:
      'Podpořte Vedneměsíčník, který tvoří studentská redakce. Dary pomáhají platit tisk časopisu a provoz webu.',
    title: 'Darovat',
    url: new URL(href('/donate'), ENV.BASE_URL).href,
  })
}
