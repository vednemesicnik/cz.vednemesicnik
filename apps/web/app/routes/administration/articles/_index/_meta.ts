import { createAdminPageTitle } from '~/utils/create-admin-page-title'

export const meta = () => {
  const title = createAdminPageTitle('Články')

  return [{ title }]
}
