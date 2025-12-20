import { href } from 'react-router'

import type { Breadcrumb } from '~/types/breadcrumb'

export const handle = {
  breadcrumb: (): Breadcrumb => {
    return {
      label: 'Přidat člena',
      path: href('/administration/editorial-board/members/add-member'),
    }
  },
}
