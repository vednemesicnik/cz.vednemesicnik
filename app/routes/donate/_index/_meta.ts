import { href } from 'react-router'
import { createPageSEO } from '~/utils/create-page-seo'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = () => {
  return createPageSEO({
    description:
      'Podpořte vydávání Vedneměsíčníku finančním darem. Každý dar pomáhá studentům, kteří chtějí psát, tvořit a být slyšet.',
    title: 'Darovat',
    url: new URL(href('/donate'), ENV.BASE_URL).href,
  })
}
