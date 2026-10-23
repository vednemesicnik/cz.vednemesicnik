import { createAdminPageTitle } from '~/utils/create-admin-page-title'
import { USER_RECORD_COPY } from '../user-record-copy'

export const meta = () => [
  { title: createAdminPageTitle(USER_RECORD_COPY.newTitle) },
]
