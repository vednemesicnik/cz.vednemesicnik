import { describe, expect, test } from 'vitest'

import { getEpisodeRowActions } from './get-episode-row-actions'

const none = {
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
}

describe('getEpisodeRowActions', () => {
  test("a Coordinator's draft: Upravit, then submit, publish and delete", () => {
    expect(
      getEpisodeRowActions({
        ...none,
        canDelete: true,
        canEdit: true,
        canPublish: true,
        canSubmit: true,
        isPodcastPublished: true,
        state: 'draft',
        submission: null,
      }),
    ).toEqual({ menu: ['submit', 'publish', 'delete'], row: 'edit' })
  })

  test('a waiting episode: Schválit, the rest in „⋯“ (27b)', () => {
    expect(
      getEpisodeRowActions({
        ...none,
        canApprove: true,
        canEdit: true,
        canPublish: true,
        canReturn: true,
        isPodcastPublished: true,
        state: 'draft',
        submission: 'pending',
      }),
    ).toEqual({
      menu: ['approve-and-publish', 'return', 'edit'],
      row: 'approve',
    })
  })

  test('a published episode: no row action, its date changes on its page', () => {
    expect(
      getEpisodeRowActions({
        ...none,
        canArchive: true,
        canRetract: true,
        isPodcastPublished: true,
        state: 'published',
        submission: null,
      }),
    ).toEqual({ menu: ['view-on-web', 'retract', 'archive'], row: null })
  })

  test('an unpublished podcast offers no submit and no publish (27f)', () => {
    expect(
      getEpisodeRowActions({
        ...none,
        canDelete: true,
        canEdit: true,
        canPublish: true,
        canSubmit: true,
        isPodcastPublished: false,
        state: 'draft',
        submission: null,
      }),
    ).toEqual({ menu: ['delete'], row: 'edit' })
  })

  test('an approved episode of an unpublished podcast loses Publikovat… (27f)', () => {
    expect(
      getEpisodeRowActions({
        ...none,
        canPublish: true,
        canReturn: true,
        isPodcastPublished: false,
        state: 'draft',
        submission: 'approved',
      }),
    ).toEqual({ menu: ['return'], row: null })
  })

  test('a published episode of an unpublished podcast is not on the web', () => {
    expect(
      getEpisodeRowActions({
        ...none,
        canArchive: true,
        canRetract: true,
        isPodcastPublished: false,
        state: 'published',
        submission: null,
      }),
    ).toEqual({ menu: ['retract', 'archive'], row: null })
  })
})
