import { describe, expect, test } from 'vitest'

import { isTileUploading } from './is-tile-uploading'
import type { GalleryTile } from './use-article-gallery'

const tile: GalleryTile = {
  fileName: 'regal.jpg',
  hasReplaceFailed: false,
  isOverPixelBudget: false,
  isRemoving: false,
  isUnconfirmed: false,
  previewUrl: '/preview.jpg',
  replaced: null,
  status: 'stored',
}

describe('isTileUploading', () => {
  test('a new image on its way uploads', () => {
    expect(isTileUploading({ ...tile, status: 'uploading' })).toBe(true)
  })

  test('a stored image whose new file is on its way uploads', () => {
    expect(
      isTileUploading({
        ...tile,
        replaced: { fileName: 'stary.jpg', previewUrl: '/old.jpg' },
      }),
    ).toBe(true)
  })

  test('a stored or failed image does not', () => {
    expect(isTileUploading(tile)).toBe(false)
    expect(isTileUploading({ ...tile, status: 'failed' })).toBe(false)
  })
})
