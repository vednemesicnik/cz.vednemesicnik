import { describe, expect, test } from 'vitest'

import type { ContentActionFlags } from '~/utils/permissions/author/get-content-action-flags.server'

import { getHeldActionFlags } from './get-held-action-flags'

const everything: ContentActionFlags = {
  canApprove: true,
  canArchive: true,
  canChangePublishedAt: true,
  canDelete: true,
  canEdit: true,
  canPublish: true,
  canRestore: true,
  canRetract: true,
  canReturn: true,
  canSubmit: true,
  canWithdraw: true,
  isOwnContent: false,
  isSubmittable: true,
  submission: null,
}

describe('getHeldActionFlags', () => {
  test('a free article keeps its flags', () => {
    expect(
      getHeldActionFlags(everything, {
        isApprover: true,
        isHeldByOther: false,
      }),
    ).toEqual({ ...everything, canTakeOver: false })
  })

  test('the edit and every state change wait while someone else edits (07g)', () => {
    expect(
      getHeldActionFlags(everything, {
        isApprover: false,
        isHeldByOther: true,
      }),
    ).toMatchObject({
      canApprove: false,
      canDelete: false,
      canEdit: false,
      canPublish: false,
      canReturn: false,
      canSubmit: false,
      canTakeOver: false,
      canWithdraw: false,
    })
  })

  test('the Coordinator may take it over (24g)', () => {
    expect(
      getHeldActionFlags(everything, { isApprover: true, isHeldByOther: true })
        .canTakeOver,
    ).toBe(true)
  })
})
