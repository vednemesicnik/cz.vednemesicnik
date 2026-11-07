import { describe, expect, test, vi } from 'vitest'

import { isForeignOriginCheckError } from './is-foreign-origin-check-error.server'

vi.stubEnv('BASE_URL', 'https://vednemesicnik.cz')

const ORIGIN_CHECK_ERROR = new Error(
  'The `request.url` origin does not match `origin` header from a forwarded action request. Aborting the action.',
)

const CHROME_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const buildRequest = (url: string, origin?: string) =>
  new Request(url, {
    headers: {
      'User-Agent': CHROME_USER_AGENT,
      ...(origin === undefined ? {} : { Origin: origin }),
    },
    method: 'POST',
  })

describe('isForeignOriginCheckError', () => {
  test('should skip a www origin, whatever the user agent', () => {
    const request = buildRequest(
      'http://www.vednemesicnik.cz/v1/graphql',
      'https://www.vednemesicnik.cz',
    )

    expect(isForeignOriginCheckError(ORIGIN_CHECK_ERROR, request)).toBe(true)
  })

  test('should skip an origin from another domain', () => {
    const request = buildRequest(
      'http://vednemesicnik.cz/administration/sign-out',
      'https://example.com',
    )

    expect(isForeignOriginCheckError(ORIGIN_CHECK_ERROR, request)).toBe(true)
  })

  test('should report our own origin behind a scheme mismatch (#406)', () => {
    const request = buildRequest(
      'http://vednemesicnik.cz/administration/sign-out',
      'https://vednemesicnik.cz',
    )

    expect(isForeignOriginCheckError(ORIGIN_CHECK_ERROR, request)).toBe(false)
  })

  test('should report a request without an origin', () => {
    const request = buildRequest('http://www.vednemesicnik.cz/v1/graphql')

    expect(isForeignOriginCheckError(ORIGIN_CHECK_ERROR, request)).toBe(false)
  })

  test('should report another error', () => {
    const request = buildRequest(
      'http://www.vednemesicnik.cz/v1/graphql',
      'https://www.vednemesicnik.cz',
    )

    expect(isForeignOriginCheckError(new Error('Boom'), request)).toBe(false)
    expect(isForeignOriginCheckError('Boom', request)).toBe(false)
  })
})
