import { describe, expect, test } from 'vitest'

import { schema } from './_schema'

const validUser = {
  email: 'jakub.novak@vednemesicnik.cz',
  roleId: 'role-id',
  userId: 'user-id',
}

describe('edit-user schema', () => {
  test('accepts the e-mail, role and user', () => {
    expect(schema.safeParse(validUser).success).toBe(true)
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
      email: 'jakub.novak@example.com',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Zadejte adresu s doménou @vednemesicnik.cz.',
    ])
  })

  test('drops a submitted name and password (design 28f)', () => {
    const result = schema.safeParse({
      ...validUser,
      name: 'Jakub Novák',
      password: 'heslo-heslo',
      passwordConfirmation: 'heslo-heslo',
    })

    expect(result.success && result.data).toEqual(validUser)
  })
})
