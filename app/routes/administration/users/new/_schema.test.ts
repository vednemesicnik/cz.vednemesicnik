import { describe, expect, test } from 'vitest'

import { schema } from './_schema'

const newAuthor = {
  authorMode: 'new',
  authorRoleId: 'contributor-id',
  email: 'jakub.novak@vednemesicnik.cz',
  name: 'Jakub Novák',
}

const existingAuthor = {
  authorMode: 'existing',
  email: 'pavel.riha@vednemesicnik.cz',
  existingAuthorId: 'pavel',
}

const messagesOf = (input: unknown) =>
  schema.safeParse(input).error?.issues.map((issue) => issue.message)

describe('Nový uživatel schema (design 28f)', () => {
  test('accepts a new author with its role', () => {
    expect(schema.safeParse(newAuthor).success).toBe(true)
  })

  test('accepts an existing author without a name', () => {
    expect(schema.safeParse(existingAuthor).success).toBe(true)
  })

  test('is a Člen unless the box is ticked', () => {
    const result = schema.safeParse(newAuthor)

    expect(result.success && result.data.isAdministrator).toBe(false)
    expect(
      schema.safeParse({ ...newAuthor, isAdministrator: true }).data
        ?.isAdministrator,
    ).toBe(true)
  })

  test('takes no user role', () => {
    const result = schema.safeParse({ ...newAuthor, roleId: 'owner-id' })

    expect(result.success && 'roleId' in result.data).toBe(false)
  })

  test('lower-cases the address', () => {
    const result = schema.safeParse({
      ...newAuthor,
      email: 'Jakub.Novak@Vednemesicnik.CZ',
    })

    expect(result.success && result.data.email).toBe(
      'jakub.novak@vednemesicnik.cz',
    )
  })

  test('refuses another domain with the 28f message', () => {
    expect(
      messagesOf({ ...newAuthor, email: 'jakub.novak@priklad.cz' }),
    ).toEqual(['Zadejte adresu s doménou @vednemesicnik.cz.'])
  })

  test('refuses a domain that only ends like the organisation one', () => {
    expect(
      schema.safeParse({ ...newAuthor, email: 'jakub@notvednemesicnik.cz' })
        .success,
    ).toBe(false)
  })

  test('asks for the missing @', () => {
    expect(messagesOf({ ...newAuthor, email: 'jakub.novak' })).toEqual([
      'Doplňte do e-mailu zavináč.',
    ])
  })

  test("names a new author with the author's rules (copy C)", () => {
    expect(messagesOf({ ...newAuthor, name: 'J' })).toEqual([
      'Zadejte jméno alespoň o 2 znacích.',
    ])
  })

  test('asks for an author without an account (copy dn09cn6e)', () => {
    const { existingAuthorId: _, ...withoutAuthor } = existingAuthor

    expect(messagesOf(withoutAuthor)).toEqual(['Vyberte autora bez účtu.'])
  })

  test('asks for no password', () => {
    expect(Object.keys(schema.options[0].shape)).not.toContain('password')
  })
})
