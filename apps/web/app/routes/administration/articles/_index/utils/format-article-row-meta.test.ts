import { describe, expect, test } from 'vitest'

import { formatArticleRowMeta } from './format-article-row-meta'

describe('formatArticleRowMeta', () => {
  test('joins all authors and the first category with the rest counted', () => {
    expect(
      formatArticleRowMeta({
        authorNames: ['Anna Dvořáková', 'Jakub Novák'],
        categoryNames: ['Rozhovor', 'Škola'],
        showAuthor: true,
      }),
    ).toBe('Anna Dvořáková, Jakub Novák · Rozhovor +1')
  })

  test('shows a single category without a count', () => {
    expect(
      formatArticleRowMeta({
        authorNames: ['Tereza Malá'],
        categoryNames: ['Reportáž'],
        showAuthor: true,
      }),
    ).toBe('Tereza Malá · Reportáž')
  })

  test('leaves the authors out for a Contributor', () => {
    expect(
      formatArticleRowMeta({
        authorNames: ['Tereza Malá'],
        categoryNames: ['Kultura', 'Škola', 'Sport'],
        showAuthor: false,
      }),
    ).toBe('Kultura +2')
  })

  test('shows only the authors without a category', () => {
    expect(
      formatArticleRowMeta({
        authorNames: ['Jakub Novák'],
        categoryNames: [],
        showAuthor: true,
      }),
    ).toBe('Jakub Novák')
  })

  test('is null with nothing to show', () => {
    expect(
      formatArticleRowMeta({
        authorNames: ['Jakub Novák'],
        categoryNames: [],
        showAuthor: false,
      }),
    ).toBeNull()
  })
})
