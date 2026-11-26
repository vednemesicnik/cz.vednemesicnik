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

describe('the old add address', () => {
  test('add-category redirects to /new for good, with the query', () => {
    const response = catchResponse(() =>
      loader({
        url: new URL(
          'https://test.local/administration/articles/categories/add-category?q=x',
        ),
      } as Parameters<typeof loader>[0]),
    )

    expect(response.status).toBe(301)
    expect(response.headers.get('Location')).toBe(
      '/administration/articles/categories/new?q=x',
    )
  })
})
