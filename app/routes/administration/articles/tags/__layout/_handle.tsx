import { href } from 'react-router'

import type { Breadcrumb } from '~/types/breadcrumb'

export const handle = {
  breadcrumb: (): Breadcrumb => {
    return {
      label: 'Štítky',
      path: href('/administration/articles/tags'),
    }
  },
  // A tag's trail is „Štítky / …“, without Články, as a category's (25b).
  breadcrumbStartsTrail: true,
}
