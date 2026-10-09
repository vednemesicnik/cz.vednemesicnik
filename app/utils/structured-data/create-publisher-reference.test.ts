import { describe, expect, test } from 'vitest'

import { createPublisherReference } from '~/utils/structured-data/create-publisher-reference'

describe('createPublisherReference', () => {
  test('nests without @context and wraps the logo in an ImageObject', () => {
    const publisher = createPublisherReference('https://vednemesicnik.cz')

    expect(publisher).not.toHaveProperty('@context')
    expect(publisher.logo).toEqual({
      '@type': 'ImageObject',
      url: 'https://vednemesicnik.cz/images/logo.png',
    })
  })
})
