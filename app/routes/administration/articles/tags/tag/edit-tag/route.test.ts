import { describe, expect, test } from 'vitest'

import { loader as addTagLoader } from '../../add-tag/route'
import { loader as editTagLoader } from './route'

const catchResponse = (load: () => unknown) => {
  try {
    load()
  } catch (response) {
    return response as Response
  }

  throw new Error('The loader did not redirect.')
}

describe('old tag addresses', () => {
  test('add-tag redirects to /new for good, with the query', () => {
    const response = catchResponse(() =>
      addTagLoader({
        url: new URL(
          'https://test.local/administration/articles/tags/add-tag?q=x',
        ),
      } as Parameters<typeof addTagLoader>[0]),
    )

    expect(response.status).toBe(301)
    expect(response.headers.get('Location')).toBe(
      '/administration/articles/tags/new?q=x',
    )
  })

  test('edit-tag redirects to /edit for good, with the query', () => {
    const response = catchResponse(() =>
      editTagLoader({
        params: { tagId: 't1' },
        url: new URL(
          'https://test.local/administration/articles/tags/t1/edit-tag?q=x',
        ),
      } as unknown as Parameters<typeof editTagLoader>[0]),
    )

    expect(response.status).toBe(301)
    expect(response.headers.get('Location')).toBe(
      '/administration/articles/tags/t1/edit?q=x',
    )
  })
})
