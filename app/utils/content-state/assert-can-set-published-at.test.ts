import { describe, expect, test } from 'vitest'

import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'

import { assertCanSetPublishedAt } from './assert-can-set-published-at'

const contextWithLevel = (roleLevel: number) =>
  ({ roleLevel }) as AuthorPermissionContext

const rejection = (run: () => void) => {
  try {
    run()
  } catch (error) {
    return error as Response
  }
  throw new Error('Expected a rejection')
}

describe('assertCanSetPublishedAt', () => {
  test('lets the Coordinator set a past date', () => {
    expect(() =>
      assertCanSetPublishedAt(
        contextWithLevel(APPROVER_ROLE_LEVEL),
        new Date(Date.now() - 60_000),
      ),
    ).not.toThrow()
  })

  test('refuses an author below the Coordinator', async () => {
    const response = rejection(() =>
      assertCanSetPublishedAt(
        contextWithLevel(APPROVER_ROLE_LEVEL + 1),
        new Date(Date.now() - 60_000),
      ),
    )

    expect(response.status).toBe(403)
    expect(await response.text()).toBe(
      'Nemáte oprávnění nastavit datum publikace.',
    )
  })

  test('refuses a future moment with what to do (23f)', async () => {
    const response = rejection(() =>
      assertCanSetPublishedAt(
        contextWithLevel(APPROVER_ROLE_LEVEL),
        new Date(Date.now() + 60_000),
      ),
    )

    expect(response.status).toBe(400)
    expect(await response.text()).toBe(
      'Zadejte datum a čas, které nejsou v budoucnosti.',
    )
  })
})
