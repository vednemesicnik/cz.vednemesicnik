import { describe, expect, test } from 'vitest'

import {
  IMAGE_CONTENT_TYPE,
  IMAGE_VARIANT_FORMATS,
  IMAGE_VARIANT_WIDTHS,
} from '~/config/image-variants-config'

import {
  OG_VARIANT_NAME,
  buildImagePrefix,
  buildKeyFromVariant,
  buildOgKey,
  buildVariantKey,
  buildVersionPrefix,
  getVariantContentType,
  isValidVariantName,
} from './image-key'

const id = 'abcdef123456'
const version = 'v1'

describe('buildVersionPrefix', () => {
  test('shards on the first two chars of the id and ends with a trailing slash', () => {
    expect(buildVersionPrefix(id, version)).toBe('ab/abcdef123456/v1/')
  })
})

describe('buildImagePrefix', () => {
  test('shards on the first two chars of the id and ends with a trailing slash', () => {
    expect(buildImagePrefix(id)).toBe('ab/abcdef123456/')
  })

  test('is a prefix of every version prefix for the same id', () => {
    expect(
      buildVersionPrefix(id, version).startsWith(buildImagePrefix(id)),
    ).toBe(true)
  })
})

describe('buildVariantKey', () => {
  test('appends "<width>.<format>" to the version prefix', () => {
    expect(buildVariantKey(id, version, 960, 'avif')).toBe(
      'ab/abcdef123456/v1/960.avif',
    )
    expect(buildVariantKey(id, version, 640, 'jpeg')).toBe(
      'ab/abcdef123456/v1/640.jpeg',
    )
  })
})

describe('buildOgKey', () => {
  test('appends the OG variant name to the version prefix', () => {
    expect(buildOgKey(id, version)).toBe('ab/abcdef123456/v1/og.jpeg')
  })
})

describe('buildKeyFromVariant', () => {
  test('appends a raw variant name to the version prefix', () => {
    expect(buildKeyFromVariant(id, version, '1280.avif')).toBe(
      'ab/abcdef123456/v1/1280.avif',
    )
  })

  test('agrees with buildVariantKey for a matrix variant', () => {
    expect(buildKeyFromVariant(id, version, '960.jpeg')).toBe(
      buildVariantKey(id, version, 960, 'jpeg'),
    )
  })
})

describe('isValidVariantName', () => {
  test('accepts the OG variant name', () => {
    expect(isValidVariantName(OG_VARIANT_NAME)).toBe(true)
  })

  test('accepts every "<width>.<format>" from the canonical matrix', () => {
    for (const width of IMAGE_VARIANT_WIDTHS) {
      for (const format of IMAGE_VARIANT_FORMATS) {
        expect(isValidVariantName(`${width}.${format}`)).toBe(true)
      }
    }
  })

  test('rejects widths outside the ladder', () => {
    expect(isValidVariantName('500.avif')).toBe(false)
  })

  test('rejects unknown formats', () => {
    expect(isValidVariantName('960.webp')).toBe(false)
    expect(isValidVariantName('960.png')).toBe(false)
  })

  test('rejects traversal and malformed names', () => {
    expect(isValidVariantName('../secret')).toBe(false)
    expect(isValidVariantName('960')).toBe(false)
    expect(isValidVariantName('')).toBe(false)
    expect(isValidVariantName('og.avif')).toBe(false)
  })
})

describe('getVariantContentType', () => {
  test('maps .avif to the AVIF content type', () => {
    expect(getVariantContentType('960.avif')).toBe(IMAGE_CONTENT_TYPE.avif)
  })

  test('maps everything else to the JPEG content type', () => {
    expect(getVariantContentType('960.jpeg')).toBe(IMAGE_CONTENT_TYPE.jpeg)
    expect(getVariantContentType(OG_VARIANT_NAME)).toBe(IMAGE_CONTENT_TYPE.jpeg)
  })
})
