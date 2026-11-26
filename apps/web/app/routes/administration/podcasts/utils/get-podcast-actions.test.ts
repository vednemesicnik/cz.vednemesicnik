import { describe, expect, test } from 'vitest'

import { getPodcastActions } from './get-podcast-actions'

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

describe('getPodcastActions', () => {
  test("a Coordinator's draft: Upravit leads, then submit, publish and delete", () => {
    expect(
      getPodcastActions({
        ...none,
        canDelete: true,
        canEdit: true,
        canPublish: true,
        canSubmit: true,
        state: 'draft',
        submission: null,
      }),
    ).toEqual(['edit', 'submit', 'publish', 'delete'])
  })

  test('a waiting podcast: Schválit leads for the Coordinator', () => {
    expect(
      getPodcastActions({
        ...none,
        canApprove: true,
        canEdit: true,
        canPublish: true,
        canReturn: true,
        state: 'draft',
        submission: 'pending',
      }),
    ).toEqual(['approve', 'approve-and-publish', 'return', 'edit'])
  })

  test('a published podcast: web, retract and archive', () => {
    expect(
      getPodcastActions({
        ...none,
        canArchive: true,
        canRetract: true,
        state: 'published',
        submission: null,
      }),
    ).toEqual(['view-on-web', 'retract', 'archive'])
  })

  test('an archived podcast: restore and delete for the Coordinator', () => {
    expect(
      getPodcastActions({
        ...none,
        canDelete: true,
        canRestore: true,
        state: 'archived',
        submission: null,
      }),
    ).toEqual(['restore', 'delete'])
  })

  test('leaves out what the role may not do', () => {
    expect(
      getPodcastActions({ ...none, state: 'archived', submission: null }),
    ).toEqual([])
  })
})
