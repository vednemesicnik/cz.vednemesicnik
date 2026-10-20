import { describe, expect, test } from 'vitest'

import {
  getIssueNumberConflictMessage,
  type IssueNumberConflict,
} from './get-issue-number-conflict-message'

const holder = {
  id: 'issue-3',
  name: null,
  order: 3,
  supplement: null,
  year: 2026,
}

const sentence = ({ before, holder, after }: IssueNumberConflict) =>
  `${before}${holder.label}${after}`

describe('getIssueNumberConflictMessage', () => {
  test('names a holder with a name', () => {
    const conflict = getIssueNumberConflictMessage({ ...holder, name: 'září' })

    expect(conflict.field).toBe('order')
    expect(conflict.holder).toEqual({ id: 'issue-3', label: 'září 2026' })
    expect(sentence(conflict)).toBe(
      'Zvolte jiné pořadí — 3/2026 už má číslo září 2026.',
    )
  })

  test('names a holder without a name only once', () => {
    const conflict = getIssueNumberConflictMessage(holder)

    expect(conflict.holder).toEqual({ id: 'issue-3', label: '3/2026' })
    expect(sentence(conflict)).toBe(
      'Zvolte jiné pořadí — číslo 3/2026 už existuje.',
    )
  })

  test('puts a taken supplement under the supplement', () => {
    const conflict = getIssueNumberConflictMessage({
      ...holder,
      order: 2,
      supplement: 'Maturitní ples',
    })

    expect(conflict.field).toBe('supplement')
    expect(conflict.holder).toEqual({ id: 'issue-3', label: 'Maturitní ples' })
    expect(sentence(conflict)).toBe(
      'Zkontrolujte rok, pořadí a název doplňku — doplněk Maturitní ples pro 2/2026 už existuje.',
    )
  })

  test('does not link a holder the viewer may not see', () => {
    expect(
      getIssueNumberConflictMessage({ ...holder, id: null }).holder,
    ).toEqual({ id: null, label: '3/2026' })
  })
})
