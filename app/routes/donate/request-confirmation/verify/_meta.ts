import { createPageTitle } from '~/utils/create-page-title'

import type { Route } from './+types/route'

export const meta: Route.MetaFunction = () => [
  { title: createPageTitle('Ověření e-mailu') },
  { content: 'noindex, nofollow', name: 'robots' },
]
