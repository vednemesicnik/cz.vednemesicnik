import { describe, expect, test } from 'vitest'

import { getRefererPath } from './get-referer-path'

const request = (referer?: string) =>
  new Request('http://localhost/administration/filters', {
    headers: referer === undefined ? {} : { Referer: referer },
  })

describe('getRefererPath', () => {
  test('keeps the path and search of an administration page', () => {
    expect(
      getRefererPath(
        request('https://example.test/administration/articles?page=2'),
      ),
    ).toBe('/administration/articles?page=2')
  })

  test.each([
    ['no header', undefined],
    ['an address outside the administration', 'https://example.test/articles'],
    ['an unparseable header', 'not a url'],
  ])('%s gives nothing', (_label, referer) => {
    expect(getRefererPath(request(referer))).toBeUndefined()
  })
})
