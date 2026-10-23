import { describe, expect, test } from 'vitest'

import { getMissingArticleContent } from './get-missing-article-content'

const complete = {
  authorCount: 1,
  content: 'Text článku',
  images: [{ altText: 'Popis' }],
  isSlugTaken: false,
  perex: 'Perex',
  slug: 'clanek',
  title: 'Článek',
}

describe('getMissingArticleContent', () => {
  test('a complete article lacks nothing', () => {
    expect(getMissingArticleContent(complete)).toEqual([])
  })

  test('a missing or blank perex is reported', () => {
    expect(getMissingArticleContent({ ...complete, perex: null })).toEqual([
      'Chybí perex.',
    ])
    expect(getMissingArticleContent({ ...complete, perex: '  ' })).toEqual([
      'Chybí perex.',
    ])
  })

  test('lists everything missing in the order of 23h', () => {
    expect(
      getMissingArticleContent({
        authorCount: 0,
        content: '',
        images: [{ altText: '' }],
        isSlugTaken: false,
        perex: null,
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

  test('an address another article holds is the last item (log 0039)', () => {
    expect(
      getMissingArticleContent({ ...complete, isSlugTaken: true, perex: null }),
    ).toEqual(['Chybí perex.', 'Adresa je obsazená.'])
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
