import { describe, expect, test } from 'vitest'

import { socialSitesConfig } from '~/config/social-sites-config'
import { createOrganizationStructuredData } from '~/utils/structured-data/create-organization-structured-data'

const baseUrl = 'https://vednemesicnik.cz'

describe('createOrganizationStructuredData', () => {
  test('uses absolute URLs for the logo and the site', () => {
    const organization = createOrganizationStructuredData(baseUrl)

    expect(organization.logo).toBe('https://vednemesicnik.cz/images/logo.png')
    expect(organization.url).toBe('https://vednemesicnik.cz/')
  })

  test('lists the social profiles from the shared config', () => {
    expect(createOrganizationStructuredData(baseUrl).sameAs).toEqual([
      socialSitesConfig.instagram.href,
      socialSitesConfig.facebook.href,
    ])
  })
})
