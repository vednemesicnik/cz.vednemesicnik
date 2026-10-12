import { describe, expect, test } from 'vitest'

import { getMissingForSubmission } from './get-missing-for-submission'

const complete = {
  authorCount: 1,
  content: 'Text článku',
  excerpt: 'Perex',
  images: [{ altText: 'Popis' }],
  slug: 'clanek',
  title: 'Článek',
}

describe('getMissingForSubmission', () => {
  test('a complete article lacks nothing', () => {
    expect(getMissingForSubmission(complete)).toEqual([])
  })

  test('a missing or blank perex is reported', () => {
    expect(getMissingForSubmission({ ...complete, excerpt: null })).toEqual([
      'Chybí perex.',
    ])
    expect(getMissingForSubmission({ ...complete, excerpt: '  ' })).toEqual([
      'Chybí perex.',
    ])
  })

  test('lists everything missing in the order of 23h', () => {
    expect(
      getMissingForSubmission({
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
      getMissingForSubmission({
        ...complete,
        images: Array.from({ length: count }, () => ({ altText: '' })),
      })

    expect(withoutAltText(2)).toEqual(['2 obrázky nemají alt text.'])
    expect(withoutAltText(5)).toEqual(['5 obrázků nemá alt text.'])
  })
})
