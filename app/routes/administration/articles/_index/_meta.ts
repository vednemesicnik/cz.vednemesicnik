import { getPageTitle } from '~/utils/get-page-title'

export const meta = () => {
  const title = getPageTitle('Administrace - Články')

  return [{ title }]
}
