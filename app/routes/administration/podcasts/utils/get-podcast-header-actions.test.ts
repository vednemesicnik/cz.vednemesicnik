import { describe, expect, test } from 'vitest'

import { getPodcastHeaderActions } from './get-podcast-header-actions'

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

describe('getPodcastHeaderActions', () => {
  test("a Creator's own draft: Upravit, then Odeslat ke schválení as the primary (27i)", () => {
    expect(
      getPodcastHeaderActions({
        ...nothingAllowed,
        canDelete: true,
        canEdit: true,
        canSubmit: true,
        isOwnContent: true,
        state: 'draft',
      }),
    ).toEqual({
      menu: ['history', 'delete'],
      outline: 'edit',
      primary: 'submit',
    })
  })

  test("the Coordinator's own draft is published from the header (07c)", () => {
    expect(
      getPodcastHeaderActions({
        ...nothingAllowed,
        canDelete: true,
        canEdit: true,
        canPublish: true,
        isOwnContent: true,
        isSubmittable: false,
        state: 'draft',
      }),
    ).toEqual({
      menu: ['history', 'delete'],
      outline: 'edit',
      primary: 'publish',
    })
  })

  test('the Coordinator approves a waiting draft, or approves and publishes it (07c)', () => {
    expect(
      getPodcastHeaderActions({
        ...nothingAllowed,
        canApprove: true,
        canEdit: true,
        canPublish: true,
        canReturn: true,
        state: 'draft',
        submission: 'pending',
      }),
    ).toEqual({
      menu: ['history', 'return', 'edit'],
      outline: 'approve',
      primary: 'approve-and-publish',
    })
  })

  test('its author takes a waiting draft back (07c)', () => {
    expect(
      getPodcastHeaderActions({
        ...nothingAllowed,
        canWithdraw: true,
        isOwnContent: true,
        state: 'draft',
        submission: 'pending',
      }),
    ).toEqual({ menu: ['history'], outline: 'withdraw', primary: null })
  })

  test('a published podcast: Zobrazit na webu, and its state actions in „⋯“ (27b)', () => {
    expect(
      getPodcastHeaderActions({
        ...nothingAllowed,
        canArchive: true,
        canRetract: true,
        state: 'published',
      }),
    ).toEqual({
      menu: ['history', 'retract', 'archive'],
      outline: 'view-on-web',
      primary: null,
    })
  })

  test('the Coordinator restores an archived podcast (07c)', () => {
    expect(
      getPodcastHeaderActions({
        ...nothingAllowed,
        canDelete: true,
        canRestore: true,
        state: 'archived',
      }),
    ).toEqual({
      menu: ['history', 'delete'],
      outline: 'restore',
      primary: null,
    })
  })

  // As the loader masks the flags while held, with the takeover as canEdit.
  const heldForCoordinator = {
    ...nothingAllowed,
    canEdit: true,
    canTakeOver: true,
    isHeldByOther: true,
    state: 'draft' as const,
  }

  test('a draft someone else edits keeps only Upravit for the Coordinator (07g, 24g)', () => {
    expect(getPodcastHeaderActions(heldForCoordinator)).toEqual({
      menu: ['history'],
      outline: 'edit',
      primary: null,
    })
  })

  test('a waiting draft someone else edits keeps Upravit for the Coordinator too (24g)', () => {
    expect(
      getPodcastHeaderActions({
        ...heldForCoordinator,
        submission: 'pending',
      }),
    ).toEqual({ menu: ['history'], outline: 'edit', primary: null })
  })

  test('a draft someone else edits leaves the others nothing but Historie (07g)', () => {
    expect(
      getPodcastHeaderActions({
        ...nothingAllowed,
        isHeldByOther: true,
        state: 'draft',
      }),
    ).toEqual({ menu: ['history'], outline: null, primary: null })
  })

  test('Historie stands even when the role may do nothing else (27j)', () => {
    expect(
      getPodcastHeaderActions({ ...nothingAllowed, state: 'draft' }),
    ).toEqual({ menu: ['history'], outline: null, primary: null })
  })
})
