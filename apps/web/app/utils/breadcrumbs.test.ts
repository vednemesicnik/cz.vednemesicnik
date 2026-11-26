import { describe, expect, test } from 'vitest'

import { getParentBreadcrumb } from '~/utils/breadcrumbs'

const createMatch = (label: string, path: string) => ({
  handle: { breadcrumb: () => ({ label, path }) },
})

const articles = createMatch('Články', '/articles')
const categories = createMatch('Rubriky', '/articles/categories')
const category = createMatch('Kultura', '/articles/categories/kultura')

describe('getParentBreadcrumb', () => {
  test('returns undefined on a top-level page', () => {
    expect(getParentBreadcrumb([articles])).toBeUndefined()
  })

  test('returns the first breadcrumb of a two-item trail', () => {
    expect(getParentBreadcrumb([articles, categories])).toEqual({
      label: 'Články',
      path: '/articles',
    })
  })

  test('returns the middle breadcrumb of a three-item trail', () => {
    expect(getParentBreadcrumb([articles, categories, category])).toEqual({
      label: 'Rubriky',
      path: '/articles/categories',
    })
  })

  test('skips matches without a breadcrumb handle', () => {
    const root = { handle: undefined }
    const index = { handle: {} }

    expect(getParentBreadcrumb([root, articles, index, category])).toEqual({
      label: 'Články',
      path: '/articles',
    })
  })
})
