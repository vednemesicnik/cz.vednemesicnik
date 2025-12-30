import { href } from 'react-router'
import type { Breadcrumb } from '~/types/breadcrumb'

export const handle = {
  breadcrumb: (): Breadcrumb => {
    return {
      label: 'Přidat článek',
      path: href('/administration/articles/add-article'),
    }
  },
}
