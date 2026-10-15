import { describe, expect, test } from 'vitest'

import { getTaxonomyHeaderActions } from './get-taxonomy-header-actions'

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

describe('getTaxonomyHeaderActions', () => {
  test('a published one shows it on the web, with no Upravit and no date to change (25b)', () => {
    expect(
      getTaxonomyHeaderActions({
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

  test('the Coordinator publishes their own draft', () => {
    expect(
      getTaxonomyHeaderActions({
        ...nothingAllowed,
        canDelete: true,
        canEdit: true,
        canPublish: true,
        isOwnContent: true,
        state: 'draft',
      }),
    ).toEqual({
      menu: ['delete'],
      outline: 'edit',
      primary: 'publish',
      sentence: null,
    })
  })

  test('a Creator submits their own draft', () => {
    expect(
      getTaxonomyHeaderActions({
        ...nothingAllowed,
        canDelete: true,
        canEdit: true,
        canSubmit: true,
        isOwnContent: true,
        state: 'draft',
      }),
    ).toEqual({
      menu: ['delete'],
      outline: 'edit',
      primary: 'submit',
      sentence: null,
    })
  })

  test('the Coordinator approves a waiting one, or approves and publishes it', () => {
    expect(
      getTaxonomyHeaderActions({
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

  test('an approved one has only Publikovat, as the article (23b, gbsczekj)', () => {
    expect(
      getTaxonomyHeaderActions({
        ...nothingAllowed,
        canEdit: true,
        canPublish: true,
        canReturn: true,
        state: 'draft',
        submission: 'approved',
      }),
    ).toEqual({
      menu: ['return', 'edit'],
      outline: null,
      primary: 'publish',
      sentence: null,
    })
  })

  test('someone else’s archived one says who restores it', () => {
    expect(
      getTaxonomyHeaderActions({ ...nothingAllowed, state: 'archived' }),
    ).toEqual({
      menu: [],
      outline: null,
      primary: null,
      sentence: 'who-restores',
    })
  })
})
