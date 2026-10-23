import { href } from 'react-router'

import type { Breadcrumb } from '~/types/breadcrumb'
import { USER_RECORD_COPY } from '../user-record-copy'

export const handle = {
  breadcrumb: (): Breadcrumb => ({
    label: USER_RECORD_COPY.newTitle,
    path: href('/administration/users/new'),
  }),
}
