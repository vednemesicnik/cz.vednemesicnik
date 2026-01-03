export const createPageTitle = (title?: string): string => {
  const siteName = 'Vedneměsíčník'

  if (title === undefined || title === '') {
    return siteName
  }

  return `${title} | ${siteName}`
}
