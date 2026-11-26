import { describe, expect, test } from 'vitest'

import { createWebSiteStructuredData } from '~/utils/structured-data/create-web-site-structured-data'

describe('createWebSiteStructuredData', () => {
  test('describes the Czech site at its absolute URL', () => {
    expect(createWebSiteStructuredData('https://vednemesicnik.cz')).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      inLanguage: 'cs',
      name: 'Vedneměsíčník',
      url: 'https://vednemesicnik.cz/',
    })
  })
})
