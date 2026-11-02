import type { ErrorEvent } from '@sentry/react-router'
import { describe, expect, test } from 'vitest'

import { scrubSentryEvent } from './scrub-sentry-event'

const SIGN_IN_LINK =
  'https://test.local/administration/sign-in/magic-link/verify?token=secret-token&email=owner%40local.dev'

const scrub = (event: Partial<ErrorEvent>) =>
  scrubSentryEvent({ type: undefined, ...event })

describe('scrubSentryEvent', () => {
  test('drops the body, cookies and query string of the request', () => {
    const { request } = scrub({
      request: {
        cookies: { session: 'secret-session' },
        data: 'email=owner%40local.dev&password=secret-password',
        method: 'POST',
        query_string: 'token=secret-token',
        url: SIGN_IN_LINK,
      },
    })

    expect(request).toEqual({
      method: 'POST',
      url: 'https://test.local/administration/sign-in/magic-link/verify',
    })
  })

  test('drops secret headers in any case and the query of the referer', () => {
    const { request } = scrub({
      request: {
        headers: {
          Authorization: 'Bearer secret',
          cookie: 'session=secret',
          referer: SIGN_IN_LINK,
          'user-agent': 'probe',
          'X-Origin-Secret': 'secret',
        },
      },
    })

    expect(request?.headers).toEqual({
      referer: 'https://test.local/administration/sign-in/magic-link/verify',
      'user-agent': 'probe',
    })
  })

  test('removes query strings from breadcrumbs', () => {
    const { breadcrumbs } = scrub({
      breadcrumbs: [
        {
          category: 'navigation',
          data: { from: SIGN_IN_LINK, to: '/administration?page=2#top' },
        },
        {
          category: 'fetch',
          data: {
            'http.fragment': 'secret-fragment',
            'http.query': 'token=secret-token',
            method: 'POST',
            status_code: 200,
            url: '/administration/sign-in/magic-link/verify.data?token=secret-token',
          },
        },
        { category: 'console', message: 'no data' },
      ],
    })

    expect(breadcrumbs).toEqual([
      {
        category: 'navigation',
        data: {
          from: 'https://test.local/administration/sign-in/magic-link/verify',
          to: '/administration',
        },
      },
      {
        category: 'fetch',
        data: {
          method: 'POST',
          status_code: 200,
          url: '/administration/sign-in/magic-link/verify.data',
        },
      },
      { category: 'console', message: 'no data' },
    ])
  })

  test('leaves an event without a request or breadcrumbs as it is', () => {
    const event = { message: 'probe', type: undefined }

    expect(scrubSentryEvent(event)).toEqual({ message: 'probe' })
  })
})
