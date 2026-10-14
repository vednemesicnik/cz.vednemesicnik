import { href } from 'react-router'

import type { Breadcrumb } from '~/types/breadcrumb'
import { CATEGORY_RECORD_COPY } from '../category-record-copy'

export const handle = {
  breadcrumb: (): Breadcrumb => ({
    label: CATEGORY_RECORD_COPY.newTitle,
    path: href('/administration/articles/categories/new'),
  }),
}
