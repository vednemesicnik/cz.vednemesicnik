import { describe, expect, test } from 'vitest'

import { isExternalHref } from '~/utils/is-external-href'

describe('isExternalHref', () => {
  test('treats another domain as external', () => {
    expect(isExternalHref('https://example.com/page')).toBe(true)
    expect(isExternalHref('http://example.com')).toBe(true)
  })

  test('treats the site domain as internal', () => {
    expect(isExternalHref('https://vednemesicnik.cz/articles/x')).toBe(false)
    expect(isExternalHref('https://www.vednemesicnik.cz/')).toBe(false)
  })

  test('does not mistake a lookalike domain for the site', () => {
    expect(isExternalHref('https://vednemesicnik.cz.example.com')).toBe(true)
    expect(isExternalHref('https://notvednemesicnik.cz')).toBe(true)
  })

  test('treats relative addresses and anchors as internal', () => {
    expect(isExternalHref('/articles/x')).toBe(false)
    expect(isExternalHref('articles/x')).toBe(false)
    expect(isExternalHref('#section')).toBe(false)
  })

  test('treats mailto and tel as internal', () => {
    expect(isExternalHref('mailto:redakce@vednemesicnik.cz')).toBe(false)
    expect(isExternalHref('tel:+420123456789')).toBe(false)
  })

  test('treats a missing address as internal', () => {
    expect(isExternalHref('')).toBe(false)
    expect(isExternalHref(null)).toBe(false)
    expect(isExternalHref(undefined)).toBe(false)
  })
})
