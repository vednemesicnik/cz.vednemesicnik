import { describe, expect, test } from 'vitest'

import type { AuthorPermissionContext } from '../context/get-author-permission-context.server'
import { checkAuthorPermission } from './check-author-permission.server'

type CanResult = { hasPermission: boolean; hasOwn: boolean; hasAny: boolean }

// Minimal context stub: the guard only calls `can()` and reads its result.
const makeContext = (result: CanResult) =>
  ({ can: () => result }) as unknown as AuthorPermissionContext

describe('checkAuthorPermission', () => {
  test('throws the generic 403 when denied', () => {
    const context = makeContext({
      hasAny: false,
      hasOwn: false,
      hasPermission: false,
    })

    try {
      checkAuthorPermission(context, { action: 'update', entity: 'article' })
      expect.unreachable('checkAuthorPermission should have thrown')
    } catch (error) {
      expect(error).toMatchObject({ data: null, init: { status: 403 } })
    }
  })

  test('returns hasOwn/hasAny without throwing when granted', () => {
    const context = makeContext({
      hasAny: true,
      hasOwn: false,
      hasPermission: true,
    })

    expect(
      checkAuthorPermission(context, { action: 'update', entity: 'article' }),
    ).toEqual({ hasAny: true, hasOwn: false })
  })
})
