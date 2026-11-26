import type { AuthorRoleName } from '@generated/prisma/enums'
import { describe, expect, test } from 'vitest'

import { getAuthorRoleChangeWarning } from './get-author-role-change-warning'

const TO_COORDINATOR =
  'Role Koordinátor umožňuje schvalovat a publikovat veškerý obsah.'

describe('getAuthorRoleChangeWarning', () => {
  test.each<[AuthorRoleName, AuthorRoleName, string | null]>([
    ['contributor', 'contributor', null],
    ['creator', 'creator', null],
    ['coordinator', 'coordinator', null],
    ['contributor', 'creator', null],
    ['contributor', 'coordinator', TO_COORDINATOR],
    ['creator', 'coordinator', TO_COORDINATOR],
    [
      'coordinator',
      'creator',
      'Role Tvůrce neumožňuje schvalovat ani publikovat obsah.',
    ],
    [
      'creator',
      'contributor',
      'Role Přispěvatel neumožňuje prohlížet cizí koncepty.',
    ],
    [
      'coordinator',
      'contributor',
      'Role Přispěvatel neumožňuje schvalovat ani publikovat obsah ani prohlížet cizí koncepty.',
    ],
  ])('%s → %s', (storedRole, chosenRole, warning) => {
    expect(getAuthorRoleChangeWarning(storedRole, chosenRole)).toBe(warning)
  })
})
