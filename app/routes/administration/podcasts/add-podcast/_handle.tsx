import { href } from 'react-router'

import type { Breadcrumb } from '~/types/breadcrumb'

export const handle = {
  breadcrumb: (): Breadcrumb => {
    return {
      label: 'Přidat podcast',
      path: href('/administration/podcasts/add-podcast'),
    }
  },
}
