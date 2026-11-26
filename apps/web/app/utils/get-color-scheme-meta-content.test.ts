import { describe, expect, test } from 'vitest'

import { getColorSchemeMetaContent } from './get-color-scheme-meta-content'

describe('getColorSchemeMetaContent', () => {
  test('follows the device for system', () => {
    expect(getColorSchemeMetaContent('system')).toBe('light dark')
  })

  test('pins light', () => {
    expect(getColorSchemeMetaContent('light')).toBe('light')
  })

  test('pins dark', () => {
    expect(getColorSchemeMetaContent('dark')).toBe('dark')
  })
})
