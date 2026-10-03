import { describe, expect, test } from 'vitest'

import type { UserPermissionContext } from '../context/get-user-permission-context.server'
import { checkUserPermission } from './check-user-permission.server'

type CanResult = { hasPermission: boolean; hasOwn: boolean; hasAny: boolean }

// Minimal context stub: the guard only calls `can()` and reads its result.
const makeContext = (result: CanResult) =>
  ({ can: () => result }) as unknown as UserPermissionContext

describe('checkUserPermission', () => {
  test('throws the generic 403 when denied', () => {
    const context = makeContext({
      hasAny: false,
      hasOwn: false,
      hasPermission: false,
    })

    try {
      checkUserPermission(context, { action: 'update', entity: 'user' })
      expect.unreachable('checkUserPermission should have thrown')
    } catch (error) {
      expect(error).toMatchObject({ data: null, init: { status: 403 } })
    }
  })

  test('returns hasOwn/hasAny without throwing when granted', () => {
    const context = makeContext({
      hasAny: false,
      hasOwn: true,
      hasPermission: true,
    })

    expect(
      checkUserPermission(context, { action: 'update', entity: 'user' }),
    ).toEqual({ hasAny: false, hasOwn: true })
  })
})
