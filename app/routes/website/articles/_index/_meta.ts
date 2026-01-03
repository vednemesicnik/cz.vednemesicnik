import type { MetaFunction } from 'react-router'
import { getPageTitle } from '~/utils/get-page-title'

export const meta: MetaFunction = () => {
  const title = getPageTitle('Články')

  return [{ title }]
}
