import { describe, expect, test } from 'vitest'

import { getIssueRowActions } from './get-issue-row-actions'

const everythingAllowed = {
  canApprove: true,
  canArchive: true,
  canDelete: true,
  canEdit: true,
  canPublish: true,
  canRestore: true,
  canRetract: true,
  canReturn: true,
  canSubmit: true,
  canWithdraw: true,
  submission: null,
}

describe('getIssueRowActions', () => {
  test('a draft is edited from the row (26a)', () => {
    expect(
      getIssueRowActions({ ...everythingAllowed, state: 'draft' }),
    ).toEqual({ menu: ['submit', 'publish', 'delete'], row: 'edit' })
  })

  test('a waiting one is approved from the row (26a)', () => {
    expect(
      getIssueRowActions({
        ...everythingAllowed,
        state: 'draft',
        submission: 'pending',
      }),
    ).toEqual({
      menu: ['approve-and-publish', 'return', 'edit', 'withdraw'],
      row: 'approve',
    })
  })

  test('a published one has „⋯“ only, with no publish date to change (26h)', () => {
    expect(
      getIssueRowActions({ ...everythingAllowed, state: 'published' }),
    ).toEqual({ menu: ['view-on-web', 'retract', 'archive'], row: null })
  })
})
