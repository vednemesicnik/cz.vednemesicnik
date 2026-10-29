import { describe, expect, test } from 'vitest'

import { parsePinnedRowIds } from './parse-pinned-row-ids'

describe('parsePinnedRowIds', () => {
  test('is undefined for an ordinary load', () => {
    expect(
      parsePinnedRowIds(new URL('http://localhost/list?page=2'), 20),
    ).toBeUndefined()
  })

  test('reads the ids on screen in their order', () => {
    expect(
      parsePinnedRowIds(new URL('http://localhost/list?pinned=b,a,c'), 20),
    ).toEqual(['b', 'a', 'c'])
  })

  test('asks for no more than a page', () => {
    expect(
      parsePinnedRowIds(new URL('http://localhost/list?pinned=a,b,c'), 2),
    ).toEqual(['a', 'b'])
  })

  test('skips empty ids, so an empty list asks for none', () => {
    expect(
      parsePinnedRowIds(new URL('http://localhost/list?pinned='), 20),
    ).toEqual([])
  })
})
