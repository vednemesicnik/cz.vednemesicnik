import { describe, expect, it } from 'vitest'
import { resolveOgImageUrl } from './resolve-og-image-url'

describe('resolveOgImageUrl', () => {
  it('makes a root-relative path absolute', () => {
    expect(
      resolveOgImageUrl(
        '/resources/podcast-cover/abc/v1/1280.jpeg',
        'https://vednemesicnik.cz',
      ),
    ).toBe('https://vednemesicnik.cz/resources/podcast-cover/abc/v1/1280.jpeg')
  })

  it.each([null, undefined])(
    'falls back to the default share image for %s',
    (path) => {
      expect(resolveOgImageUrl(path, 'https://vednemesicnik.cz')).toBe(
        'https://vednemesicnik.cz/images/og/default.jpg',
      )
    },
  )
})
