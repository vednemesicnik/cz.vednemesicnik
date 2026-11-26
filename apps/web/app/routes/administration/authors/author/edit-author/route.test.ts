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
  test('edit-author redirects to /edit for good, with the query', () => {
    const response = catchResponse(() =>
      loader({
        params: { authorId: 'a1' },
        url: new URL(
          'https://test.local/administration/authors/a1/edit-author?q=x',
        ),
      } as unknown as Parameters<typeof loader>[0]),
    )

    expect(response.status).toBe(301)
    expect(response.headers.get('Location')).toBe(
      '/administration/authors/a1/edit?q=x',
    )
  })
})
