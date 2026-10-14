import { describe, expect, test } from 'vitest'

import { loader as addCategoryLoader } from '../../add-category/route'
import { loader as editCategoryLoader } from './route'

const catchResponse = (load: () => unknown) => {
  try {
    load()
  } catch (response) {
    return response as Response
  }

  throw new Error('The loader did not redirect.')
}

describe('old category addresses', () => {
  test('add-category redirects to /new for good, with the query', () => {
    const response = catchResponse(() =>
      addCategoryLoader({
        url: new URL(
          'https://test.local/administration/articles/categories/add-category?q=x',
        ),
      } as Parameters<typeof addCategoryLoader>[0]),
    )

    expect(response.status).toBe(301)
    expect(response.headers.get('Location')).toBe(
      '/administration/articles/categories/new?q=x',
    )
  })

  test('edit-category redirects to /edit for good, with the query', () => {
    const response = catchResponse(() =>
      editCategoryLoader({
        params: { categoryId: 'c1' },
        url: new URL(
          'https://test.local/administration/articles/categories/c1/edit-category?q=x',
        ),
      } as unknown as Parameters<typeof editCategoryLoader>[0]),
    )

    expect(response.status).toBe(301)
    expect(response.headers.get('Location')).toBe(
      '/administration/articles/categories/c1/edit?q=x',
    )
  })
})
