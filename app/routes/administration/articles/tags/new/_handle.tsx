import { href } from 'react-router'

import type { Breadcrumb } from '~/types/breadcrumb'
import { TAG_RECORD_COPY } from '../tag-record-copy'

export const handle = {
  breadcrumb: (): Breadcrumb => ({
    label: TAG_RECORD_COPY.newTitle,
    path: href('/administration/articles/tags/new'),
  }),
}
