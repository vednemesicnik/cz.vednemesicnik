import { describe, expect, test } from 'vitest'

import { getMissingArticleContent } from './get-missing-article-content'

const complete = {
  authorCount: 1,
  content: 'Text článku',
  excerpt: 'Perex',
  images: [{ altText: 'Popis' }],
  slug: 'clanek',
  title: 'Článek',
}

describe('getMissingArticleContent', () => {
  test('a complete article lacks nothing', () => {
    expect(getMissingArticleContent(complete)).toEqual([])
  })

  test('a missing or blank perex is reported', () => {
    expect(getMissingArticleContent({ ...complete, excerpt: null })).toEqual([
      'Chybí perex.',
    ])
    expect(getMissingArticleContent({ ...complete, excerpt: '  ' })).toEqual([
      'Chybí perex.',
    ])
  })

  test('lists everything missing in the order of 23h', () => {
    expect(
      getMissingArticleContent({
        authorCount: 0,
        content: '',
        excerpt: null,
        images: [{ altText: '' }],
        slug: '',
        title: '',
      }),
    ).toEqual([
      'Chybí název.',
      'Chybí adresa.',
      'Chybí text.',
      'Chybí perex.',
      'Článek nemá autora.',
      '1 obrázek nemá alt text.',
    ])
  })

  test('counts images without alt text in the Czech plural', () => {
    const withoutAltText = (count: number) =>
      getMissingArticleContent({
        ...complete,
        images: Array.from({ length: count }, () => ({ altText: '' })),
      })

    expect(withoutAltText(2)).toEqual(['2 obrázky nemají alt text.'])
    expect(withoutAltText(5)).toEqual(['5 obrázků nemá alt text.'])
  })
})
