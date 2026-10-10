import { describe, expect, it } from 'vitest'

import { parseSettingsContinue } from './parse-settings-continue'

const parse = (search: string, passkeyIds: string[] = []) =>
  parseSettingsContinue(new URLSearchParams(search), passkeyIds)

describe('parseSettingsContinue', () => {
  it('returns null without a hint', () => {
    expect(parse('')).toBeNull()
  })

  it('reads the dialogs without a target', () => {
    expect(parse('continue=change-password')).toEqual({
      dialog: 'change-password',
    })
    expect(parse('continue=enable-two-factor')).toEqual({
      dialog: 'enable-two-factor',
    })
    expect(parse('continue=disable-two-factor')).toEqual({
      dialog: 'disable-two-factor',
    })
  })

  it('reads a passkey removal for an own passkey', () => {
    expect(parse('continue=remove-passkey&passkeyId=a1', ['a1'])).toEqual({
      dialog: 'remove-passkey',
      passkeyId: 'a1',
    })
  })

  it('ignores a passkey removal for a passkey the user does not have', () => {
    expect(parse('continue=remove-passkey&passkeyId=b2', ['a1'])).toBeNull()
    expect(parse('continue=remove-passkey', ['a1'])).toBeNull()
  })

  it('ignores an unknown dialog', () => {
    expect(parse('continue=delete-account')).toBeNull()
  })
})
