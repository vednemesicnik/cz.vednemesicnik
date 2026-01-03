import { createPageTitle } from '~/utils/create-page-title'

export const meta = () => {
  const title = createPageTitle('Administrace - Články')

  return [{ title }]
}
