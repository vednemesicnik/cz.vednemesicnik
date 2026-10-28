import { describe, expect, test } from 'vitest'

import { PODCAST_COVER_CONFIG } from '~/config/podcast-cover-config'

import { getRejectedCoverSentence } from './get-rejected-cover-sentence'

const fileOfSize = (bytes: number, name: string, type: string) =>
  new File([new Uint8Array(bytes)], name, { type })

describe('getRejectedCoverSentence', () => {
  test('lets an image within 5 MB go', () => {
    expect(
      getRejectedCoverSentence(
        fileOfSize(
          PODCAST_COVER_CONFIG.maxFileBytes,
          'obalka.jpg',
          'image/jpeg',
        ),
      ),
    ).toBeNull()
  })

  test('refuses a file that is not an image', () => {
    expect(
      getRejectedCoverSentence(fileOfSize(10, 'obalka.pdf', 'application/pdf')),
    ).toBe('Vyberte obrázek — obalka.pdf není obrázek.')
  })

  test('refuses an image over 5 MB, rounding its size up', () => {
    expect(
      getRejectedCoverSentence(
        fileOfSize(
          PODCAST_COVER_CONFIG.maxFileBytes + 1,
          'obalka.jpg',
          'image/jpeg',
        ),
      ),
    ).toBe('Vyberte obrázek do 5 MB — obalka.jpg má 5,1 MB.')
  })
})
