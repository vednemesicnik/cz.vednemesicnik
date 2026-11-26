import { createAdminPageTitle } from '~/utils/create-admin-page-title'
import { AUTHOR_RECORD_COPY } from '../author-record-copy'

export const meta = () => [
  { title: createAdminPageTitle(AUTHOR_RECORD_COPY.newTitle) },
]
