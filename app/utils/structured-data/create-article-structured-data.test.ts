import { describe, expect, test } from 'vitest'

import { createArticleStructuredData } from '~/utils/structured-data/create-article-structured-data'

const baseUrl = 'https://vednemesicnik.cz'

const fullOptions = {
  authors: [{ name: 'Jana Nováková' }, { name: 'Petr Svoboda' }],
  baseUrl,
  categories: [{ name: 'Kultura' }, { name: 'Názory' }],
  dateModified: '2026-10-05T08:00:00.000Z',
  datePublished: '2026-10-01T08:00:00.000Z',
  description: 'Perex článku.',
  imageUrl: 'https://vednemesicnik.cz/resources/article-image/og.jpg',
  tags: [{ name: 'divadlo' }, { name: 'Brno' }],
  title: 'Název článku',
  url: 'https://vednemesicnik.cz/articles/nazev-clanku',
}

describe('createArticleStructuredData', () => {
  test('emits every field when the article has data for it', () => {
    expect(createArticleStructuredData(fullOptions)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Article',
      articleSection: ['Kultura', 'Názory'],
      author: [
        { '@type': 'Person', name: 'Jana Nováková' },
        { '@type': 'Person', name: 'Petr Svoboda' },
      ],
      dateModified: '2026-10-05T08:00:00.000Z',
      datePublished: '2026-10-01T08:00:00.000Z',
      description: 'Perex článku.',
      headline: 'Název článku',
      image: 'https://vednemesicnik.cz/resources/article-image/og.jpg',
      inLanguage: 'cs',
      keywords: 'divadlo, Brno',
      mainEntityOfPage: 'https://vednemesicnik.cz/articles/nazev-clanku',
      publisher: {
        '@type': 'Organization',
        logo: {
          '@type': 'ImageObject',
          url: 'https://vednemesicnik.cz/images/logo.png',
        },
        name: 'Vedneměsíčník',
        url: 'https://vednemesicnik.cz/',
      },
    })
  })

  test('leaves out fields without data instead of emitting null or empty', () => {
    const article = createArticleStructuredData({
      ...fullOptions,
      categories: [],
      datePublished: null,
      description: null,
      imageUrl: null,
      tags: [],
    })

    expect(article).not.toHaveProperty('articleSection')
    expect(article).not.toHaveProperty('datePublished')
    expect(article).not.toHaveProperty('description')
    expect(article).not.toHaveProperty('image')
    expect(article).not.toHaveProperty('keywords')
    expect(article.dateModified).toBe('2026-10-05T08:00:00.000Z')
  })
})
