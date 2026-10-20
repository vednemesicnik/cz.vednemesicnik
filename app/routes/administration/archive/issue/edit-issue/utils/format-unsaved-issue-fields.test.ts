import { describe, expect, test } from 'vitest'

import { formatUnsavedIssueFields } from './format-unsaved-issue-fields'

describe('formatUnsavedIssueFields', () => {
  test('lists the labels in one sentence', () => {
    expect(formatUnsavedIssueFields(['Název', 'Doplněk'])).toBe(
      'Neuložené změny: Název, Doplněk.',
    )
  })
})
