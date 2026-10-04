import { describe, expect, test } from 'vitest'

import { escapeXml } from '~/utils/escape-xml'

describe('escapeXml', () => {
  test('should escape all five reserved characters', () => {
    expect(escapeXml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&apos;')
  })

  test('should escape ampersands before the entities it adds', () => {
    expect(escapeXml('<a>')).toBe('&lt;a&gt;')
  })

  test('should escape an existing entity as plain text', () => {
    expect(escapeXml('&amp;')).toBe('&amp;amp;')
  })

  test('should leave text without reserved characters unchanged', () => {
    expect(escapeXml('Vedneměsíčník 2026')).toBe('Vedneměsíčník 2026')
  })
})
