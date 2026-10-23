import { parseWithZod } from '@conform-to/zod/v4'
import { describe, expect, test } from 'vitest'

import { createEditorSchema } from './create-editor-schema'

const formDataWith = (slug: string) => {
  const formData = new FormData()
  formData.set('authorIds[0]', 'author-1')
  formData.set('editTabId', 'tab-1')
  formData.set('slug', slug)
  return formData
}

const parse = (slug: string, takenSlugs: string[]) =>
  parseWithZod(formDataWith(slug), {
    schema: createEditorSchema((value) => takenSlugs.includes(value)),
  }).reply()

describe('createEditorSchema (design 24d, log 0039)', () => {
  test('a taken address is the field’s error', () => {
    expect(parse('deset-knih', ['deset-knih']).error).toEqual({
      slug: ['Zadejte jinou adresu — tato je obsazená.'],
    })
  })

  test('a free address passes', () => {
    expect(parse('deset-knih-2', ['deset-knih']).error).toBeUndefined()
  })

  test('compares the address as it saves', () => {
    expect(parse('Deset knih', ['deset-knih']).error).toHaveProperty('slug')
  })

  test('an empty address is no conflict', () => {
    expect(parse('', ['']).error).toBeUndefined()
  })
})
