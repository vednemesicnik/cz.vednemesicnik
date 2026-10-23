import { parseWithZod } from '@conform-to/zod/v4'
import { describe, expect, test } from 'vitest'

import { createEditorSchema } from './create-editor-schema'

const buildFormData = (fields: Record<string, string>) => {
  const formData = new FormData()
  formData.set('editTabId', 'tab-1')
  for (const [name, value] of Object.entries(fields)) {
    formData.set(name, value)
  }
  return formData
}

const TAKEN = new Set(['2026-3', '2026-2-maturitni-ples'])
const isNumberTaken = (number: string) => TAKEN.has(number)

describe('createEditorSchema', () => {
  test('says a taken number at the order when nothing else changed', () => {
    const submission = parseWithZod(
      buildFormData({ order: '3', year: '2026' }),
      { schema: createEditorSchema(isNumberTaken, 'order') },
    )

    expect(submission.reply().error).toEqual({
      order: ['Zadejte jiné pořadí — číslo 3/2026 je obsazené.'],
    })
  })

  test('says it at the year after the year changed', () => {
    const submission = parseWithZod(
      buildFormData({ order: '3', year: '2026' }),
      { schema: createEditorSchema(isNumberTaken, 'year') },
    )

    expect(submission.reply().error).toEqual({
      year: ['Zadejte jiný rok nebo pořadí — číslo 3/2026 je obsazené.'],
    })
  })

  test("names a supplement's name by its slug", () => {
    const submission = parseWithZod(
      buildFormData({ order: '2', supplement: 'Maturitní ples', year: '2026' }),
      { schema: createEditorSchema(isNumberTaken, 'supplement') },
    )

    expect(submission.reply().error).toEqual({
      supplement: [
        'Zkontrolujte rok, pořadí a název doplňku — název „Maturitní ples“ je pro číslo 2/2026 obsazený.',
      ],
    })
  })

  test("says a supplement's at Doplněk when nothing changed (6dlnv2de)", () => {
    const submission = parseWithZod(
      buildFormData({ order: '2', supplement: 'Maturitní ples', year: '2026' }),
      { schema: createEditorSchema(isNumberTaken, 'supplement') },
    )

    expect(Object.keys(submission.reply().error ?? {})).toEqual(['supplement'])
  })

  test.each([
    { order: '4', year: '2026' },
    { order: '2', year: '2026' },
    { order: '3', year: '' },
  ])('says nothing for a free or incomplete number (%o)', (fields) => {
    const submission = parseWithZod(buildFormData(fields), {
      schema: createEditorSchema(isNumberTaken, 'order'),
    })

    expect(submission.status).toBe('success')
  })
})
