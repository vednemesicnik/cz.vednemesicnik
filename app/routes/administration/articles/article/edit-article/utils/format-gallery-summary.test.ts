import { describe, expect, test } from 'vitest'

import { formatGallerySummary } from './format-gallery-summary'

describe('formatGallerySummary (design 24b, 24f)', () => {
  test('a dash without images', () => {
    expect(formatGallerySummary(0, 0)).toBe('—')
  })

  test('the count alone when nothing uploads', () => {
    expect(formatGallerySummary(3, 0)).toBe('3')
  })

  test('the count and what is uploading', () => {
    expect(formatGallerySummary(4, 2)).toBe('4 · nahrává se: 2')
  })
})
