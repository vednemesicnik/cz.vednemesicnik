import { describe, expect, test } from 'vitest'

import { EPISODE_COVER_CONFIG } from '~/config/episode-cover-config'

import { getRejectedEpisodeCoverSentence } from './get-rejected-episode-cover-sentence'

const fileOfSize = (bytes: number, name: string, type: string) =>
  new File([new Uint8Array(bytes)], name, { type })

describe('getRejectedEpisodeCoverSentence', () => {
  test('lets an image within 5 MB go', () => {
    expect(
      getRejectedEpisodeCoverSentence(
        fileOfSize(
          EPISODE_COVER_CONFIG.maxFileBytes,
          'obalka.jpg',
          'image/jpeg',
        ),
      ),
    ).toBeNull()
  })

  test('refuses a file that is not an image', () => {
    expect(
      getRejectedEpisodeCoverSentence(
        fileOfSize(10, 'obalka.pdf', 'application/pdf'),
      ),
    ).toBe('Vyberte obrázek — obalka.pdf není obrázek.')
  })

  test('refuses an image over 5 MB, rounding its size up', () => {
    expect(
      getRejectedEpisodeCoverSentence(
        fileOfSize(
          EPISODE_COVER_CONFIG.maxFileBytes + 1,
          'obalka.jpg',
          'image/jpeg',
        ),
      ),
    ).toBe('Vyberte obrázek do 5 MB — obalka.jpg má 5,1 MB.')
  })
})
