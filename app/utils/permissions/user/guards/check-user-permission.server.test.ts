import { describe, expect, test } from 'vitest'

import type { UserPermissionContext } from '../context/get-user-permission-context.server'
import { checkUserPermission } from './check-user-permission.server'

type CanResult = { hasPermission: boolean; hasOwn: boolean; hasAny: boolean }

// Minimal context stub: the guard only calls `can()` and reads its result.
const makeContext = (result: CanResult) =>
  ({ can: () => result }) as unknown as UserPermissionContext

describe('checkUserPermission', () => {
  test('throws a 403 Response with a Czech message when denied', async () => {
    const context = makeContext({
      hasAny: false,
      hasOwn: false,
      hasPermission: false,
    })

    try {
      checkUserPermission(context, { action: 'update', entity: 'user' })
      expect.unreachable('checkUserPermission should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(Response)
      const response = error as Response
      expect(response.status).toBe(403)
      expect(await response.text()).toBe('Nemáte oprávnění k této akci.')
    }
  })

  test('uses a custom error message when provided', async () => {
    const context = makeContext({
      hasAny: false,
      hasOwn: false,
      hasPermission: false,
    })

    try {
      checkUserPermission(context, {
        action: 'update',
        entity: 'user',
        errorMessage: 'Roli Owner nelze přiřadit.',
      })
      expect.unreachable('checkUserPermission should have thrown')
    } catch (error) {
      const response = error as Response
      expect(response.status).toBe(403)
      expect(await response.text()).toBe('Roli Owner nelze přiřadit.')
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
