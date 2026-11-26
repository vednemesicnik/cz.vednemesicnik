import { describe, expect, test } from 'vitest'

import { FORM_CONFIG } from '~/config/form-config'

import { readBulkActionForm } from './read-bulk-action-form'

const INTENT_VALUE = FORM_CONFIG.intent.value

const form = (intent: string, ids: string[]) => {
  const formData = new FormData()
  formData.append(FORM_CONFIG.intent.name, intent)
  for (const id of ids) formData.append('ids', id)

  return formData
}

describe('readBulkActionForm', () => {
  test.each([
    [INTENT_VALUE.bulkPublish, 'publish'],
    [INTENT_VALUE.bulkRetract, 'retract'],
    [INTENT_VALUE.bulkArchive, 'archive'],
    [INTENT_VALUE.bulkRestore, 'restore'],
    [INTENT_VALUE.bulkDelete, 'delete'],
  ])('%s is %s', (intent, action) => {
    expect(readBulkActionForm(form(intent, ['a'])).action).toBe(action)
  })

  test('trims, drops empty and repeated ids, and keeps the order', () => {
    expect(
      readBulkActionForm(form(INTENT_VALUE.bulkArchive, [' b ', '', 'a', 'b']))
        .ids,
    ).toEqual(['b', 'a'])
  })

  test('refuses another intent', () => {
    expect(() => readBulkActionForm(form('publish', ['a']))).toThrow()
  })

  test('refuses an empty or oversized selection', () => {
    expect(() =>
      readBulkActionForm(form(INTENT_VALUE.bulkDelete, [''])),
    ).toThrow()
    expect(() =>
      readBulkActionForm(
        form(
          INTENT_VALUE.bulkDelete,
          Array.from({ length: 21 }, (_, index) => `id-${index}`),
        ),
      ),
    ).toThrow()
  })
})
