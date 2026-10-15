import { createAdminPageTitle } from '~/utils/create-admin-page-title'
import { CATEGORY_RECORD_COPY } from '../category-record-copy'

export const meta = () => [
  { title: createAdminPageTitle(CATEGORY_RECORD_COPY.newTitle) },
]
