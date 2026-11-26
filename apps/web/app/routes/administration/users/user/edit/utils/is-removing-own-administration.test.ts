import { describe, expect, test } from 'vitest'

import { isRemovingOwnAdministration } from './is-removing-own-administration'

describe('isRemovingOwnAdministration (design 28g)', () => {
  test('asks when one unticks the box on one’s own account', () => {
    expect(
      isRemovingOwnAdministration({
        isAdministratorChecked: false,
        isLoadedAdministrator: true,
        isOwnAccount: true,
      }),
    ).toBe(true)
  })

  test('does not ask for another account', () => {
    expect(
      isRemovingOwnAdministration({
        isAdministratorChecked: false,
        isLoadedAdministrator: true,
        isOwnAccount: false,
      }),
    ).toBe(false)
  })

  test('does not ask while the box stays ticked', () => {
    expect(
      isRemovingOwnAdministration({
        isAdministratorChecked: true,
        isLoadedAdministrator: true,
        isOwnAccount: true,
      }),
    ).toBe(false)
  })

  test('does not ask when the account was no Administrator', () => {
    expect(
      isRemovingOwnAdministration({
        isAdministratorChecked: false,
        isLoadedAdministrator: false,
        isOwnAccount: true,
      }),
    ).toBe(false)
  })
})
