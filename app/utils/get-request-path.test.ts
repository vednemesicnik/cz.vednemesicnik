import { describe, expect, test } from 'vitest'

import { getRequestPath } from '~/utils/get-request-path'

const pathOf = (url: string) => getRequestPath(new Request(url))

describe('getRequestPath', () => {
  test('returns the path + query for a normal request', () => {
    expect(pathOf('https://app.test/administration/settings')).toBe(
      '/administration/settings',
    )
    expect(pathOf('https://app.test/administration/articles?tab=drafts')).toBe(
      '/administration/articles?tab=drafts',
    )
  })

  test('strips the Single Fetch .data suffix', () => {
    expect(pathOf('https://app.test/administration/settings.data')).toBe(
      '/administration/settings',
    )
  })

  test('drops the internal _routes param but keeps real query', () => {
    expect(
      pathOf(
        'https://app.test/administration/settings.data?_routes=root,routes%2Fx&tab=1',
      ),
    ).toBe('/administration/settings?tab=1')
  })

  test('maps the root index data request back to /', () => {
    expect(pathOf('https://app.test/_root.data')).toBe('/')
  })
})
