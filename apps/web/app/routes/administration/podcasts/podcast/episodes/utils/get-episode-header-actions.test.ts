import { describe, expect, test } from 'vitest'

import { getEpisodeHeaderActions } from './get-episode-header-actions'

const none = {
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
  isOnWeb: true,
  isOwnContent: false,
  isPodcastPublished: true,
  isPodcastUnpublishedShown: false,
  isSubmittable: true,
}

describe('getEpisodeHeaderActions', () => {
  test('a published episode for the Coordinator: its date in „⋯“, Zobrazit na webu (27c)', () => {
    expect(
      getEpisodeHeaderActions({
        ...none,
        canArchive: true,
        canChangePublishedAt: true,
        canRetract: true,
        state: 'published',
        submission: null,
      }),
    ).toEqual({
      menu: ['change-date', 'retract', 'archive'],
      outline: 'view-on-web',
      primary: null,
      sentence: null,
    })
  })

  test('no Zobrazit na webu where the web would not open it (tly4a163)', () => {
    expect(
      getEpisodeHeaderActions({
        ...none,
        isOnWeb: false,
        state: 'published',
        submission: null,
      }).outline,
    ).toBeNull()
  })

  test('a waiting episode: Schválit a publikovat…, Schválit beside it (07c)', () => {
    expect(
      getEpisodeHeaderActions({
        ...none,
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

  test('an unpublished podcast keeps Schválit, Vrátit and Upravit for a waiting episode (27f, log 0047)', () => {
    expect(
      getEpisodeHeaderActions({
        ...none,
        canApprove: true,
        canEdit: true,
        canPublish: true,
        canReturn: true,
        isPodcastPublished: false,
        isPodcastUnpublishedShown: true,
        state: 'draft',
        submission: 'pending',
      }),
    ).toEqual({
      menu: ['return', 'edit'],
      outline: null,
      primary: 'approve',
      sentence: null,
    })
  })

  test('an unpublished podcast leaves no submit and no publish on a draft (27f)', () => {
    expect(
      getEpisodeHeaderActions({
        ...none,
        canDelete: true,
        canEdit: true,
        canPublish: true,
        isOwnContent: true,
        isPodcastPublished: false,
        isPodcastUnpublishedShown: true,
        state: 'draft',
        submission: null,
      }),
    ).toEqual({
      menu: ['delete'],
      outline: 'edit',
      primary: null,
      sentence: null,
    })
  })

  test('the podcast’s sentence stands in place of the role’s (27f)', () => {
    expect(
      getEpisodeHeaderActions({
        ...none,
        isPodcastUnpublishedShown: true,
        state: 'draft',
        submission: 'pending',
      }).sentence,
    ).toBeNull()
  })

  test("someone else's edit: only Převzít úpravu… for the Coordinator (07g)", () => {
    expect(
      getEpisodeHeaderActions({
        ...none,
        canTakeOver: true,
        isHeldByOther: true,
        state: 'draft',
        submission: null,
      }),
    ).toEqual({ menu: [], outline: 'take-over', primary: null, sentence: null })
  })
})
