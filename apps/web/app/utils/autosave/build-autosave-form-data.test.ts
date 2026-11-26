import { describe, expect, test } from 'vitest'

import { buildAutosaveFormData } from './build-autosave-form-data'

describe('buildAutosaveFormData', () => {
  test('keeps every field and a file no save has stored yet', () => {
    const file = new File(['image'], 'image.png', { type: 'image/png' })
    const formData = new FormData()
    formData.append('title', 'Deset knih')
    formData.append('images[0].file', file)

    const payload = buildAutosaveFormData(formData, new WeakSet())

    expect(payload.get('title')).toBe('Deset knih')
    expect(payload.get('images[0].file')).toBe(file)
  })

  test('leaves out a file an earlier save carried', () => {
    const file = new File(['image'], 'image.png', { type: 'image/png' })
    const formData = new FormData()
    formData.append('images[0].file', file)

    const payload = buildAutosaveFormData(formData, new WeakSet([file]))

    expect(payload.has('images[0].file')).toBe(false)
  })

  test('leaves out an empty file input', () => {
    const formData = new FormData()
    formData.append('images[0].file', new File([], ''))

    expect(
      buildAutosaveFormData(formData, new WeakSet()).has('images[0].file'),
    ).toBe(false)
  })
})
