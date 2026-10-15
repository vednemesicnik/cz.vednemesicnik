import { describe, expect, test } from 'vitest'

import { getHeaderActions } from './get-header-actions'

const nothingAllowed = {
  canApprove: false,
  canArchive: false,
  canChangePublishedAt: false,
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
  state: 'draft' as const,
  submission: null,
}

describe('getHeaderActions — draft', () => {
  test('own author below the Coordinator submits the draft', () => {
    expect(
      getHeaderActions({
        ...nothingAllowed,
        canDelete: true,
        canEdit: true,
        canSubmit: true,
        isOwnContent: true,
      }),
    ).toEqual({
      menu: ['delete'],
      outline: 'edit',
      primary: 'submit',
      sentence: null,
    })
  })

  test('the Coordinator publishes their own draft', () => {
    expect(
      getHeaderActions({
        ...nothingAllowed,
        canDelete: true,
        canEdit: true,
        canPublish: true,
        isOwnContent: true,
      }),
    ).toEqual({
      menu: ['delete'],
      outline: 'edit',
      primary: 'publish',
      sentence: null,
    })
  })

  test('a Coordinator publishes another Coordinator’s draft directly', () => {
    expect(
      getHeaderActions({
        ...nothingAllowed,
        canEdit: true,
        canPublish: true,
        isSubmittable: false,
      }),
    ).toEqual({
      menu: [],
      outline: 'edit',
      primary: 'publish',
      sentence: null,
    })
  })

  test('the Coordinator publishes a foreign unsubmitted draft from „⋯“', () => {
    expect(
      getHeaderActions({
        ...nothingAllowed,
        canDelete: true,
        canEdit: true,
        canPublish: true,
      }),
    ).toEqual({
      menu: ['publish', 'delete'],
      outline: 'edit',
      primary: null,
      sentence: 'not-submitted',
    })
  })

  test('the Coordinator approves, or approves and publishes, a waiting article', () => {
    expect(
      getHeaderActions({
        ...nothingAllowed,
        canApprove: true,
        canEdit: true,
        canPublish: true,
        canReturn: true,
        submission: 'pending',
      }),
    ).toEqual({
      menu: ['return', 'edit'],
      outline: 'approve',
      primary: 'approve-and-publish',
      sentence: null,
    })
  })

  test('the Coordinator publishes an approved article', () => {
    expect(
      getHeaderActions({
        ...nothingAllowed,
        canEdit: true,
        canPublish: true,
        canReturn: true,
        submission: 'approved',
      }),
    ).toEqual({
      menu: ['return', 'edit'],
      outline: null,
      primary: 'publish',
      sentence: null,
    })
  })

  test('its author takes a submitted article back', () => {
    for (const submission of ['pending', 'approved'] as const) {
      expect(
        getHeaderActions({
          ...nothingAllowed,
          canWithdraw: true,
          isOwnContent: true,
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

  test('a foreign Creator reads who can act (23d)', () => {
    const sentenceFor = (submission: 'pending' | 'approved' | null) =>
      getHeaderActions({ ...nothingAllowed, submission }).sentence

    expect(sentenceFor(null)).toBe('who-edits')
    expect(sentenceFor('pending')).toBe('who-approves')
    expect(sentenceFor('approved')).toBe('who-publishes')
  })

  test('an author who may not submit still edits', () => {
    expect(
      getHeaderActions({
        ...nothingAllowed,
        canDelete: true,
        canEdit: true,
        isOwnContent: true,
      }),
    ).toEqual({
      menu: ['delete'],
      outline: 'edit',
      primary: null,
      sentence: null,
    })
  })
})

describe('getHeaderActions — published', () => {
  test('the Coordinator changes the date, retracts or archives from „⋯“', () => {
    expect(
      getHeaderActions({
        ...nothingAllowed,
        canArchive: true,
        canChangePublishedAt: true,
        canRetract: true,
        state: 'published',
      }),
    ).toEqual({
      menu: ['change-date', 'retract', 'archive'],
      outline: 'view-on-web',
      primary: null,
      sentence: null,
    })
  })

  test('own Creator retracts or archives', () => {
    expect(
      getHeaderActions({
        ...nothingAllowed,
        canArchive: true,
        canRetract: true,
        isOwnContent: true,
        state: 'published',
      }).menu,
    ).toEqual(['retract', 'archive'])
  })

  test('anyone else only views it on the web', () => {
    expect(getHeaderActions({ ...nothingAllowed, state: 'published' })).toEqual(
      {
        menu: [],
        outline: 'view-on-web',
        primary: null,
        sentence: null,
      },
    )
  })
})

describe('getHeaderActions — archived', () => {
  test('the Coordinator restores it as a draft or deletes it', () => {
    expect(
      getHeaderActions({
        ...nothingAllowed,
        canDelete: true,
        canRestore: true,
        state: 'archived',
      }),
    ).toEqual({
      menu: ['delete'],
      outline: 'restore',
      primary: null,
      sentence: null,
    })
  })

  test('anyone else reads who can restore it', () => {
    expect(
      getHeaderActions({
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
})
