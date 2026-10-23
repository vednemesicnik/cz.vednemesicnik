import { describe, expect, test } from 'vitest'

import { schema } from './_schema'

const validUser = {
  email: 'jakub.novak@vednemesicnik.cz',
  isAdministrator: true,
  loadedRoleId: 'administrator-id',
}

describe('Upravit uživatele schema (design 28f)', () => {
  test('accepts the e-mail, the box and the loaded role', () => {
    expect(schema.safeParse(validUser).success).toBe(true)
  })

  test("accepts the Owner's form, which sends no role", () => {
    const result = schema.safeParse({ email: validUser.email })

    expect(result.success && result.data).toEqual({
      email: validUser.email,
      isAdministrator: false,
    })
  })

  test('lower-cases the address', () => {
    const result = schema.safeParse({
      ...validUser,
      email: 'Jakub.Novak@Vednemesicnik.CZ',
    })

    expect(result.success && result.data.email).toBe(
      'jakub.novak@vednemesicnik.cz',
    )
  })

  test('refuses another domain with the 28f message', () => {
    const result = schema.safeParse({
      ...validUser,
      email: 'jakub.novak@local.dev',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Zadejte adresu s doménou @vednemesicnik.cz.',
    ])
  })

  test('drops a submitted name, password, role and user (design 28f)', () => {
    const result = schema.safeParse({
      ...validUser,
      name: 'Jakub Novák',
      password: 'heslo-heslo',
      passwordConfirmation: 'heslo-heslo',
      roleId: 'owner-id',
      userId: 'someone-else',
    })

    expect(result.success && result.data).toEqual(validUser)
  })
})
