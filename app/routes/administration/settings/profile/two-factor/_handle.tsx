import { href } from 'react-router'

import type { Breadcrumb } from '~/types/breadcrumb'

export const handle = {
  breadcrumb: (): Breadcrumb => {
    return {
      label: 'Dvoufázové ověření',
      path: href('/administration/settings/profile/two-factor'),
    }
  },
}
