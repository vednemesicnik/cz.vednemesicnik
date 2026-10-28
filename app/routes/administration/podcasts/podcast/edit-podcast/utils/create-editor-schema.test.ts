import { describe, expect, test } from 'vitest'

import { createEditorSchema, TAKEN_SLUG_MESSAGE } from './create-editor-schema'

const base = { editTabId: 'tab-1', slug: 'prestavka', title: 'Přestávka' }

describe('createEditorSchema', () => {
  test('a free address is no error', () => {
    const result = createEditorSchema({ isSlugTaken: () => false }).safeParse(
      base,
    )

    expect(result.success).toBe(true)
  })

  test('a taken address is said at its field (27e)', () => {
    const result = createEditorSchema({
      isSlugTaken: (slug) => slug === 'prestavka',
    }).safeParse(base)

    expect(result.success).toBe(false)
    expect(result.error?.issues).toEqual([
      expect.objectContaining({ message: TAKEN_SLUG_MESSAGE, path: ['slug'] }),
    ])
  })

  test('an empty address is unfinished, not taken (27i)', () => {
    const result = createEditorSchema({ isSlugTaken: () => true }).safeParse({
      ...base,
      slug: '',
    })

    expect(result.success).toBe(true)
  })
})
