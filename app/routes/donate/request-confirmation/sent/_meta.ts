import { createPageTitle } from '~/utils/create-page-title'
import type { Route } from './+types/route'

export const meta: Route.MetaFunction = () => {
  return [
    { title: createPageTitle('Žádost odeslána') },
    { content: 'noindex, nofollow', name: 'robots' },
  ]
}
