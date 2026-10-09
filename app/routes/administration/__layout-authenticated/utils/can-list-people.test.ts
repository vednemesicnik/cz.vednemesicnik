import { describe, expect, test } from 'vitest'

import { getUserRights } from '~/utils/permissions/core/get-user-rights'

import { canListPeople } from './can-list-people'

const userId = 'user-1'

// Context stub that evaluates `can()` the way the real context does: against the
// role's permission rows, with no target (the sidebar asks about the section).
const makeContext = (
  permissions: { access: string; action: string; entity: string }[],
) => ({
  can: (config: { action: string; entity: string; targetUserId?: string }) => {
    const { hasAny, hasOwn } = getUserRights(permissions, {
      action: config.action,
      entity: config.entity,
      ownId: userId,
      targetId: config.targetUserId,
    })
    return { hasAny, hasOwn, hasPermission: hasAny || hasOwn }
  },
})

describe('canListPeople', () => {
  test('a member with own-only access sees neither section', () => {
    const member = makeContext([
      { access: 'own', action: 'view', entity: 'user' },
      { access: 'own', action: 'view', entity: 'author' },
    ])

    expect(canListPeople(member, 'user')).toBe(false)
    expect(canListPeople(member, 'author')).toBe(false)
  })

  test('an administrator with any access sees both sections', () => {
    const administrator = makeContext([
      { access: 'any', action: 'view', entity: 'user' },
      { access: 'any', action: 'view', entity: 'author' },
    ])

    expect(canListPeople(administrator, 'user')).toBe(true)
    expect(canListPeople(administrator, 'author')).toBe(true)
  })
})
