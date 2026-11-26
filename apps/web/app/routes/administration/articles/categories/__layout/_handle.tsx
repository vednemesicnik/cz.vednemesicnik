import { href } from 'react-router'

import type { Breadcrumb } from '~/types/breadcrumb'

export const handle = {
  breadcrumb: (): Breadcrumb => {
    return {
      label: 'Rubriky',
      path: href('/administration/articles/categories'),
    }
  },
  // A category's trail is „Rubriky / Kultura“, without Články (25b).
  breadcrumbStartsTrail: true,
}
