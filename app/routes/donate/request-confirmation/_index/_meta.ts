import { createPageTitle } from '~/utils/create-page-title'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = () => {
  return [
    { title: createPageTitle('Žádost o potvrzení o daru') },
    { content: 'noindex, nofollow', name: 'robots' },
  ]
}
