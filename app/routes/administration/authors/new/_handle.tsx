import { href } from 'react-router'

import type { Breadcrumb } from '~/types/breadcrumb'
import { AUTHOR_RECORD_COPY } from '../author-record-copy'

export const handle = {
  breadcrumb: (): Breadcrumb => ({
    label: AUTHOR_RECORD_COPY.newTitle,
    path: href('/administration/authors/new'),
  }),
}
