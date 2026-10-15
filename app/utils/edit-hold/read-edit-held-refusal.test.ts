import { describe, expect, test } from 'vitest'

import { createEditHeldRefusal } from './create-edit-held-refusal.server'
import { readEditHeldRefusal } from './read-edit-held-refusal'

describe('readEditHeldRefusal', () => {
  test('reads the holder from a held refusal', () => {
    expect(readEditHeldRefusal(createEditHeldRefusal('Jakub Novák'))).toBe(
      'Jakub Novák',
    )
  })

  test('ignores what is not a held refusal', () => {
    expect(readEditHeldRefusal(new Error('x'))).toBeNull()
    expect(
      readEditHeldRefusal({ data: null, init: { status: 403 } }),
    ).toBeNull()
    expect(readEditHeldRefusal(new Response(null, { status: 409 }))).toBeNull()
  })
})
