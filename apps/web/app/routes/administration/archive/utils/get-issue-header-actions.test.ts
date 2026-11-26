import { describe, expect, test } from 'vitest'

import { getIssueHeaderActions } from './get-issue-header-actions'

const nothingAllowed = {
  canApprove: false,
  canArchive: false,
  canDelete: false,
  canEdit: false,
  canPublish: false,
  canRestore: false,
  canRetract: false,
  canReturn: false,
  canSubmit: false,
  canWithdraw: false,
  isOwnContent: false,
  isSubmittable: true,
  submission: null,
}

describe('getIssueHeaderActions', () => {
  test('a published issue shows the archive on the web, with no Upravit and no date to change (26b)', () => {
    expect(
      getIssueHeaderActions({
        ...nothingAllowed,
        canArchive: true,
        canRetract: true,
        state: 'published',
      }),
    ).toEqual({
      menu: ['retract', 'archive'],
      outline: 'view-on-web',
      primary: null,
      sentence: null,
    })
  })

  test("the Coordinator publishes someone else's unsubmitted draft from „⋯“ (26g)", () => {
    expect(
      getIssueHeaderActions({
        ...nothingAllowed,
        canDelete: true,
        canEdit: true,
        canPublish: true,
        state: 'draft',
      }),
    ).toEqual({
      menu: ['publish', 'delete'],
      outline: 'edit',
      primary: null,
      sentence: 'not-submitted',
    })
  })

  test("a Creator only reads someone else's draft (26g)", () => {
    expect(
      getIssueHeaderActions({ ...nothingAllowed, state: 'draft' }),
    ).toEqual({ menu: [], outline: null, primary: null, sentence: 'who-edits' })
  })

  test('a Creator withdraws their own waiting or approved issue (26g)', () => {
    for (const submission of ['pending', 'approved'] as const) {
      expect(
        getIssueHeaderActions({
          ...nothingAllowed,
          canWithdraw: true,
          isOwnContent: true,
          state: 'draft',
          submission,
        }),
      ).toEqual({
        menu: [],
        outline: 'withdraw',
        primary: null,
        sentence: null,
      })
    }
  })

  test("a Creator is told who approves or publishes someone else's issue (26g)", () => {
    expect(
      getIssueHeaderActions({
        ...nothingAllowed,
        state: 'draft',
        submission: 'pending',
      }).sentence,
    ).toBe('who-approves')
    expect(
      getIssueHeaderActions({
        ...nothingAllowed,
        state: 'draft',
        submission: 'approved',
      }).sentence,
    ).toBe('who-publishes')
  })

  test('a Creator is told who restores their archived issue (26g)', () => {
    expect(
      getIssueHeaderActions({
        ...nothingAllowed,
        isOwnContent: true,
        state: 'archived',
      }),
    ).toEqual({
      menu: [],
      outline: null,
      primary: null,
      sentence: 'who-restores',
    })
  })

  test('the Coordinator approves a waiting issue, or approves and publishes it', () => {
    expect(
      getIssueHeaderActions({
        ...nothingAllowed,
        canApprove: true,
        canEdit: true,
        canPublish: true,
        canReturn: true,
        state: 'draft',
        submission: 'pending',
      }),
    ).toEqual({
      menu: ['return', 'edit'],
      outline: 'approve',
      primary: 'approve-and-publish',
      sentence: null,
    })
  })

  test('while someone else edits it, only the Coordinator takes the edit over (26i)', () => {
    expect(
      getIssueHeaderActions({
        ...nothingAllowed,
        canTakeOver: true,
        isHeldByOther: true,
        state: 'draft',
      }),
    ).toEqual({ menu: [], outline: 'take-over', primary: null, sentence: null })
  })
})
