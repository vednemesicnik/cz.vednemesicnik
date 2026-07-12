import { describe, expect, it } from 'vitest'

import { formatRoleChangeDetail } from './format-role-change-detail'

describe('formatRoleChangeDetail', () => {
  it('formats a role change as "role: <from> → <to>"', () => {
    expect(formatRoleChangeDetail('member', 'administrator')).toBe(
      'role: member → administrator',
    )
  })

  it('formats an author role change', () => {
    expect(formatRoleChangeDetail('contributor', 'coordinator')).toBe(
      'role: contributor → coordinator',
    )
  })

  it('handles identical values without special-casing', () => {
    expect(formatRoleChangeDetail('member', 'member')).toBe(
      'role: member → member',
    )
  })
})
