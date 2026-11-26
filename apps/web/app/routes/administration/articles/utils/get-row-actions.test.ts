import { describe, expect, test } from 'vitest'

import { getRowActions } from './get-row-actions'

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
  state: 'draft' as const,
  submission: null,
}

describe('getRowActions — draft', () => {
  test('an own draft is edited; submitting and deleting are in „⋯“', () => {
    expect(
      getRowActions({
        ...nothingAllowed,
        canDelete: true,
        canEdit: true,
        canSubmit: true,
      }),
    ).toEqual({ menu: ['submit', 'delete'], row: 'edit' })
  })

  test('the Coordinator publishes an unsubmitted draft from „⋯“', () => {
    expect(
      getRowActions({
        ...nothingAllowed,
        canDelete: true,
        canEdit: true,
        canPublish: true,
      }),
    ).toEqual({ menu: ['publish', 'delete'], row: 'edit' })
  })

  test('a draft the role may only read has no actions', () => {
    expect(getRowActions(nothingAllowed)).toEqual({ menu: [], row: null })
  })
})

describe('getRowActions — submitted', () => {
  test('the Coordinator approves a waiting draft', () => {
    expect(
      getRowActions({
        ...nothingAllowed,
        canApprove: true,
        canEdit: true,
        canPublish: true,
        canReturn: true,
        submission: 'pending',
      }),
    ).toEqual({
      menu: ['approve-and-publish', 'return', 'edit'],
      row: 'approve',
    })
  })

  test('the Coordinator publishes an approved draft', () => {
    expect(
      getRowActions({
        ...nothingAllowed,
        canEdit: true,
        canPublish: true,
        canReturn: true,
        submission: 'approved',
      }),
    ).toEqual({ menu: ['return', 'edit'], row: 'publish' })
  })

  test('its author only takes a waiting or approved draft back', () => {
    for (const submission of ['pending', 'approved'] as const) {
      expect(
        getRowActions({ ...nothingAllowed, canWithdraw: true, submission }),
      ).toEqual({ menu: ['withdraw'], row: null })
    }
  })
})

describe('getRowActions — published and archived', () => {
  test('a published article is viewed on the web first, then the rest', () => {
    expect(
      getRowActions({
        ...nothingAllowed,
        canArchive: true,
        canChangePublishedAt: true,
        canRetract: true,
        state: 'published',
      }),
    ).toEqual({
      menu: ['view-on-web', 'change-date', 'retract', 'archive'],
      row: null,
    })
  })

  test('anyone may view a published article on the web', () => {
    expect(getRowActions({ ...nothingAllowed, state: 'published' })).toEqual({
      menu: ['view-on-web'],
      row: null,
    })
  })

  test('the Coordinator restores or deletes an archived article', () => {
    expect(
      getRowActions({
        ...nothingAllowed,
        canDelete: true,
        canRestore: true,
        state: 'archived',
      }),
    ).toEqual({ menu: ['restore', 'delete'], row: null })
  })

  test('without rights an archived row has no „⋯“', () => {
    expect(getRowActions({ ...nothingAllowed, state: 'archived' })).toEqual({
      menu: [],
      row: null,
    })
  })
})
