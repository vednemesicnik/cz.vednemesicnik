import { href } from 'react-router'

import type { SettingsContinue } from './parse-settings-continue'

/**
 * Builds the address the identity check returns to: the settings page with a
 * one-shot hint naming the dialog to reopen (read by `parseSettingsContinue`).
 *
 * @param settingsContinue - The dialog to reopen, or `null` for the bare page.
 * @returns The settings path with its search string.
 */
export const buildSettingsContinuePath = (
  settingsContinue: SettingsContinue | null,
) => {
  const path = href('/administration/settings')

  if (settingsContinue === null) {
    return path
  }

  const search = new URLSearchParams({ continue: settingsContinue.dialog })

  if (settingsContinue.dialog === 'remove-passkey') {
    search.set('passkeyId', settingsContinue.passkeyId)
  }

  return `${path}?${search}`
}
