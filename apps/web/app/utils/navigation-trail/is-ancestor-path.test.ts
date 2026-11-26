import { describe, expect, test } from 'vitest'

import { isAncestorPath } from './is-ancestor-path'

describe('isAncestorPath', () => {
  test('a parent lies above its child and deeper pages', () => {
    expect(isAncestorPath('/articles', '/articles/ples')).toBe(true)
    expect(isAncestorPath('/podcasts', '/podcasts/kabinet/1')).toBe(true)
  })

  test('a sibling, a longer name, the page itself and home do not', () => {
    expect(isAncestorPath('/articles/jiny', '/articles/ples')).toBe(false)
    expect(isAncestorPath('/articles', '/articlesx/ples')).toBe(false)
    expect(isAncestorPath('/articles', '/articles')).toBe(false)
    expect(isAncestorPath('/', '/articles')).toBe(false)
  })
})
