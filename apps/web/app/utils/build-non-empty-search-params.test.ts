import { describe, expect, test } from 'vitest'

import { buildNonEmptySearchParams } from '~/utils/build-non-empty-search-params'

const formDataOf = (entries: [string, string | Blob][]) => {
  const formData = new FormData()

  for (const [name, value] of entries) {
    formData.append(name, value)
  }

  return formData
}

describe('buildNonEmptySearchParams', () => {
  test('should drop empty and whitespace-only values', () => {
    const formData = formDataOf([
      ['q', ''],
      ['category', '   '],
      ['sort', 'title'],
    ])

    expect(buildNonEmptySearchParams(formData).toString()).toBe('sort=title')
  })

  test('should keep repeated keys in their order', () => {
    const formData = formDataOf([
      ['tag', 'skola'],
      ['q', 'ples'],
      ['tag', 'kultura'],
    ])

    expect(buildNonEmptySearchParams(formData).toString()).toBe(
      'tag=skola&q=ples&tag=kultura',
    )
  })

  test('should keep a value with surrounding spaces as it is', () => {
    const formData = formDataOf([['q', 'ahoj ']])

    expect(buildNonEmptySearchParams(formData).get('q')).toBe('ahoj ')
  })

  test('should ignore file entries', () => {
    const formData = formDataOf([
      ['file', new Blob(['x'])],
      ['q', 'ples'],
    ])

    expect(buildNonEmptySearchParams(formData).toString()).toBe('q=ples')
  })

  test('should return empty params for an empty form', () => {
    expect(buildNonEmptySearchParams(new FormData()).toString()).toBe('')
  })
})
