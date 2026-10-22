import { describe, expect, test } from 'vitest'

import { getOwnOtherTabDeleteRefusal } from './get-own-other-tab-delete-refusal'

describe('getOwnOtherTabDeleteRefusal', () => {
  test('names the editor of the article and of the issue (rvp9ojsm)', () => {
    expect(getOwnOtherTabDeleteRefusal('article')).toBe(
      'Před smazáním zavřete editor článku, a pokud už je zavřený, zkuste smazání za chvíli znovu.',
    )
    expect(getOwnOtherTabDeleteRefusal('issue')).toBe(
      'Před smazáním zavřete editor čísla, a pokud už je zavřený, zkuste smazání za chvíli znovu.',
    )
  })
})
