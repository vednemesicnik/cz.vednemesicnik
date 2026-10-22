import { describe, expect, test } from 'vitest'

import { getOwnTabDeleteRefusal } from './get-own-tab-delete-refusal'

describe('getOwnTabDeleteRefusal', () => {
  test('names the editor of the article and of the issue (rvp9ojsm)', () => {
    expect(getOwnTabDeleteRefusal('article')).toBe(
      'Před smazáním zavřete editor článku, a pokud už je zavřený, zkuste smazání za chvíli znovu.',
    )
    expect(getOwnTabDeleteRefusal('issue')).toBe(
      'Před smazáním zavřete editor čísla, a pokud už je zavřený, zkuste smazání za chvíli znovu.',
    )
  })
})
