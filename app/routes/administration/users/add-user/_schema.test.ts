import { describe, expect, test } from 'vitest'

import { schema } from './_schema'

const validUser = {
  authorMode: 'new',
  email: 'jakub.novak@vednemesicnik.cz',
  name: 'Jakub Novák',
  roleId: 'role-id',
}

describe('add-user schema', () => {
  test('accepts an address on the organisation domain', () => {
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
      email: 'jakub.novak@priklad.cz',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Zadejte adresu s doménou @vednemesicnik.cz.',
    ])
  })

  test('refuses a domain that only ends like the organisation one', () => {
    expect(
      schema.safeParse({ ...validUser, email: 'jakub@notvednemesicnik.cz' })
        .success,
    ).toBe(false)
  })

  test('asks for no password', () => {
    expect(Object.keys(schema.options[0].shape)).not.toContain('password')
  })
})
