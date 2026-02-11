import type { PageSEODataObject } from '~~/types/page-seo-data-object'

export const pagesSEOData = [
  {
    description: 'Archiv čísel Vedneměsíčníku',
    pathname: '/archive',
    state: 'published',
    title: 'Archiv',
  } as const,
] satisfies PageSEODataObject[]
