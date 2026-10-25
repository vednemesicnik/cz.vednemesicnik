import { describe, expect, test } from 'vitest'

import { loader } from './route'

const catchResponse = (load: () => unknown) => {
  try {
    load()
  } catch (response) {
    return response as Response
  }

  throw new Error('The loader did not redirect.')
}

describe('the old edit address', () => {
  test('edit-user redirects to /edit for good', () => {
    const response = catchResponse(() =>
      loader({
        params: { userId: 'u1' },
        url: new URL('https://test.local/administration/users/u1/edit-user'),
      } as unknown as Parameters<typeof loader>[0]),
    )

    expect(response.status).toBe(301)
    expect(response.headers.get('Location')).toBe(
      '/administration/users/u1/edit',
    )
  })
})
