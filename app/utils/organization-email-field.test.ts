import { describe, expect, test } from 'vitest'

import { organizationEmailField } from './organization-email-field'

const getMessages = (email: unknown) =>
  organizationEmailField
    .safeParse(email)
    .error?.issues.map((issue) => issue.message)

describe('organizationEmailField', () => {
  test('trims and lower-cases an address on the organisation domain', () => {
    expect(organizationEmailField.parse(' Jakub.Novak@Vednemesicnik.CZ ')).toBe(
      'jakub.novak@vednemesicnik.cz',
    )
  })

  test('asks for the @ when it is missing', () => {
    expect(getMessages('jakub.novak')).toEqual(['Doplňte do e-mailu zavináč.'])
  })

  test('refuses a malformed address with the format message only', () => {
    expect(getMessages('jakub@')).toEqual(['Neplatný formát e-mailu'])
  })

  test('refuses another domain with the 28f message', () => {
    expect(getMessages('jakub.novak@local.dev')).toEqual([
      'Zadejte adresu s doménou @vednemesicnik.cz.',
    ])
  })

  test('refuses a domain that only ends like the organisation one', () => {
    expect(getMessages('jakub@notvednemesicnik.cz')).toEqual([
      'Zadejte adresu s doménou @vednemesicnik.cz.',
    ])
  })

  test('requires a value', () => {
    expect(getMessages(undefined)).toEqual(['E-mail je povinný'])
  })
})
