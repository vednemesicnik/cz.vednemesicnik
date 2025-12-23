import { href } from 'react-router'
import type { Breadcrumb } from '~/types/breadcrumb'

export const handle = {
  breadcrumb: (): Breadcrumb => {
    return {
      label: 'Přidat tag',
      path: href('/administration/articles/tags/add-tag'),
    }
  },
}
