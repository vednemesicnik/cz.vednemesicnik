import { describe, expect, test } from 'vitest'

import { IMAGE_VARIANT_WIDTHS } from '~/config/image-variants-config'

import { selectVariantWidths } from './select-variant-widths'

const [smallest] = IMAGE_VARIANT_WIDTHS
const largest = IMAGE_VARIANT_WIDTHS[IMAGE_VARIANT_WIDTHS.length - 1]

describe('selectVariantWidths', () => {
  test('returns the full ladder when the image is larger than the largest step', () => {
    expect(selectVariantWidths(largest + 1000)).toEqual([
      ...IMAGE_VARIANT_WIDTHS,
    ])
  })

  test('includes a step when the intrinsic width equals it exactly', () => {
    expect(selectVariantWidths(largest)).toEqual([...IMAGE_VARIANT_WIDTHS])
    expect(selectVariantWidths(960)).toEqual([320, 640, 960])
  })

  test('truncates the ladder to widths not exceeding the intrinsic width', () => {
    expect(selectVariantWidths(1000)).toEqual([320, 640, 960])
  })

  test('keeps only the smallest step when the image barely exceeds it', () => {
    expect(selectVariantWidths(smallest)).toEqual([smallest])
    expect(selectVariantWidths(smallest + 1)).toEqual([smallest])
  })

  test('falls back to a single intrinsic-width variant when smaller than the smallest step', () => {
    expect(selectVariantWidths(200)).toEqual([200])
    expect(selectVariantWidths(smallest - 1)).toEqual([smallest - 1])
  })

  test('never returns an empty list', () => {
    expect(selectVariantWidths(1).length).toBeGreaterThan(0)
  })
})
