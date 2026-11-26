import { describe, expect, test } from 'vitest'

import { formatUploadingImagesSentence } from './format-uploading-images-sentence'

describe('formatUploadingImagesSentence (24b, fmsjg9oc)', () => {
  test('one image', () => {
    expect(formatUploadingImagesSentence(1)).toBe(
      'Obrázek se ještě nahrává. Po zavření se jeho nahrávání zruší.',
    )
  })

  test.each([2, 3, 4])('%i images', (count) => {
    expect(formatUploadingImagesSentence(count)).toBe(
      `${count} obrázky se ještě nahrávají. Po zavření se jejich nahrávání zruší.`,
    )
  })

  test.each([5, 12])('%i images', (count) => {
    expect(formatUploadingImagesSentence(count)).toBe(
      `${count} obrázků se ještě nahrává. Po zavření se jejich nahrávání zruší.`,
    )
  })
})
