import { describe, expect, test } from 'vitest'

import { getTaxonomyRowActions } from './get-taxonomy-row-actions'

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

describe('getTaxonomyRowActions', () => {
  test('a published one has no publish date to change', () => {
    expect(
      getTaxonomyRowActions({ ...everythingAllowed, state: 'published' }),
    ).toEqual({ menu: ['view-on-web', 'retract', 'archive'], row: null })
  })

  test('a waiting one is approved from the row', () => {
    expect(
      getTaxonomyRowActions({
        ...everythingAllowed,
        state: 'draft',
        submission: 'pending',
      }),
    ).toEqual({
      menu: ['approve-and-publish', 'return', 'edit', 'withdraw'],
      row: 'approve',
    })
  })
})
