import { describe, expect, it } from 'vitest'

import { getPasskeyName } from './get-passkey-name'

describe('getPasskeyName', () => {
  it.each([
    [
      'iPhone, Safari',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
    ],
    [
      'iPhone, Chrome',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.7339.101 Mobile/15E148 Safari/604.1',
    ],
    [
      'Mac, Safari',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
    ],
    [
      'Mac, Chrome',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    ],
    [
      'Windows, Edge',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
    ],
    [
      'Windows, Firefox',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0',
    ],
    [
      'Android, Chrome',
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
    ],
    [
      'Android, Samsung Internet',
      'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Mobile Safari/537.36',
    ],
    [
      'Linux, Firefox',
      'Mozilla/5.0 (X11; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0',
    ],
  ])('names %s', (name, userAgent) => {
    expect(getPasskeyName(userAgent)).toBe(name)
  })

  it('names an iPad a Mac, since iPadOS Safari sends the Mac User-Agent', () => {
    expect(
      getPasskeyName(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15',
      ),
    ).toBe('Mac, Safari')
  })

  it('keeps what it recognises when only one part is known', () => {
    expect(getPasskeyName('Mozilla/5.0 (Windows NT 10.0) Unknown/1.0')).toBe(
      'Windows',
    )
  })

  it('returns null for an unrecognised User-Agent', () => {
    expect(getPasskeyName('curl/8.7.1')).toBeNull()
  })

  it('returns null without a User-Agent', () => {
    expect(getPasskeyName(null)).toBeNull()
  })
})
