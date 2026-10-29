import { describe, expect, test } from 'vitest'

import { getArticleFixTarget } from './get-article-fix-target'

const complete = {
  authorCount: 1,
  content: 'Text článku',
  images: [{ altText: 'Popis', id: 'image-1' }],
  isSlugTaken: false,
  perex: 'Perex',
  slug: 'clanek',
  title: 'Článek',
}

describe('getArticleFixTarget', () => {
  test('a complete article has nothing to fix', () => {
    expect(getArticleFixTarget(complete)).toBeNull()
  })

  test('each missing item maps to its field', () => {
    expect(getArticleFixTarget({ ...complete, title: ' ' })).toEqual({
      field: 'title',
    })
    expect(getArticleFixTarget({ ...complete, slug: null })).toEqual({
      field: 'slug',
    })
    expect(getArticleFixTarget({ ...complete, content: '' })).toEqual({
      field: 'content',
    })
    expect(getArticleFixTarget({ ...complete, perex: null })).toEqual({
      field: 'perex',
    })
    expect(getArticleFixTarget({ ...complete, authorCount: 0 })).toEqual({
      field: 'authors',
    })
  })

  test('a missing alt text is the first such image in the gallery', () => {
    expect(
      getArticleFixTarget({
        ...complete,
        images: [
          { altText: 'Popis', id: 'image-1' },
          { altText: '', id: 'image-2' },
          { altText: '', id: 'image-3' },
        ],
      }),
    ).toEqual({ field: 'imageAlt', imageId: 'image-2' })
  })

  test('the first missing item wins, in the order of 23h', () => {
    expect(
      getArticleFixTarget({
        ...complete,
        authorCount: 0,
        content: '',
        perex: null,
      }),
    ).toEqual({ field: 'content' })
  })

  test('a taken address opens Adresa only when nothing is missing', () => {
    expect(getArticleFixTarget({ ...complete, isSlugTaken: true })).toEqual({
      field: 'slug',
    })
    expect(
      getArticleFixTarget({ ...complete, isSlugTaken: true, perex: '' }),
    ).toEqual({ field: 'perex' })
  })
})
