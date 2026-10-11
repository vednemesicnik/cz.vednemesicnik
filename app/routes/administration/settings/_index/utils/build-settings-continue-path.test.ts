import { describe, expect, it } from 'vitest'

import { buildSettingsContinuePath } from './build-settings-continue-path'
import { parseSettingsContinue } from './parse-settings-continue'

describe('buildSettingsContinuePath', () => {
  it('returns the bare settings page without a dialog', () => {
    expect(buildSettingsContinuePath(null)).toBe('/administration/settings')
  })

  it('names the dialog', () => {
    expect(buildSettingsContinuePath({ dialog: 'change-password' })).toBe(
      '/administration/settings?continue=change-password',
    )
  })

  it('round-trips a passkey removal through parseSettingsContinue', () => {
    const path = buildSettingsContinuePath({
      dialog: 'remove-passkey',
      passkeyId: 'a1',
    })
    const search = new URL(path, 'https://priklad.cz').searchParams

    expect(parseSettingsContinue(search, ['a1'])).toEqual({
      dialog: 'remove-passkey',
      passkeyId: 'a1',
    })
  })
})
