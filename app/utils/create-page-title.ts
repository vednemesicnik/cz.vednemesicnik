import { SITE_NAME } from '~/config/site-config'

export const createPageTitle = (title?: string): string => {
  if (title === undefined || title === '') {
    return SITE_NAME
  }

  return `${title} | ${SITE_NAME}`
}
