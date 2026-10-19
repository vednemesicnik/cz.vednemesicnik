import { describe, expect, test } from 'vitest'

import { formatFailedUploadsSentence } from './format-failed-uploads-sentence'

describe('formatFailedUploadsSentence (24b, fmsjg9oc)', () => {
  test('one image', () => {
    expect(formatFailedUploadsSentence(1)).toBe('Obrázek se nepodařilo nahrát.')
  })

  test('two to four images', () => {
    expect(formatFailedUploadsSentence(3)).toBe(
      '3 obrázky se nepodařilo nahrát.',
    )
  })

  test('five and more', () => {
    expect(formatFailedUploadsSentence(5)).toBe(
      '5 obrázků se nepodařilo nahrát.',
    )
  })
})
