import { href } from 'react-router'

import type { Breadcrumb } from '~/types/breadcrumb'

export const handle = {
  breadcrumb: (): Breadcrumb => {
    return {
      label: 'Nový uživatel',
      path: href('/administration/users/add-user'),
    }
  },
}
