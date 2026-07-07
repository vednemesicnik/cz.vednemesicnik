import { describe, expect, test } from 'vitest'

import { safeRedirect } from '~/utils/safe-redirect'

describe('safeRedirect', () => {
  test('returns same-origin absolute paths unchanged', () => {
    expect(safeRedirect('/administration/articles')).toBe(
      '/administration/articles',
    )
    expect(safeRedirect('/administration?tab=1#top')).toBe(
      '/administration?tab=1#top',
    )
  })

  test('falls back for empty, null, or non-string input', () => {
    expect(safeRedirect(null)).toBe('/administration')
    expect(safeRedirect(undefined)).toBe('/administration')
    expect(safeRedirect('')).toBe('/administration')
    expect(safeRedirect('   ')).toBe('/administration')
  })

  test('rejects protocol-relative and backslash-prefixed URLs', () => {
    expect(safeRedirect('//evil.com')).toBe('/administration')
    expect(safeRedirect('/\\evil.com')).toBe('/administration')
  })

  test('rejects absolute URLs and non-path values', () => {
    expect(safeRedirect('https://evil.com')).toBe('/administration')
    expect(safeRedirect('http://evil.com')).toBe('/administration')
    expect(safeRedirect('javascript:alert(1)')).toBe('/administration')
    expect(safeRedirect('relative/path')).toBe('/administration')
  })

  test('honors a custom fallback', () => {
    expect(safeRedirect(null, '/administration/sign-in')).toBe(
      '/administration/sign-in',
    )
  })
})
