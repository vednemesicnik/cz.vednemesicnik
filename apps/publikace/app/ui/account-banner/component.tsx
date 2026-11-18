import type { Handle } from 'remix/component'

import { disconnectedBanner, notConnectedBanner } from '../../domain/drive-account.ts'
import { routes } from '../../routes.ts'
import { Callout } from '../callout/component.tsx'

export type AccountBannerProps = {
  /** `publikace.app@…`: the account the sentence names. */
  expectedEmail: string
  /** On Settings the action jumps to the card instead of opening the page it is already on. */
  isOnSettings: boolean
  status: 'connected' | 'disconnected' | 'not-connected'
}

/**
 * The banner over every screen of the editors-in-chief while the app cannot act on Drive
 * (`14g`, `14c`). Warning while the account was never connected, because it waits for you and
 * nothing went wrong; error once Google stopped accepting it. No close: it lasts as long as the
 * state does.
 */
export function AccountBanner(handle: Handle<AccountBannerProps>) {
  return () => {
    let { expectedEmail, isOnSettings, status } = handle.props
    if (status === 'connected') return null

    let href = isOnSettings ? '#accounts' : `${routes.settings.index.href()}#accounts`

    return (
      <Callout tone={status === 'not-connected' ? 'warning' : 'error'}>
        <p style={{ margin: '0 0 8px' }}>
          {status === 'not-connected'
            ? notConnectedBanner(expectedEmail)
            : disconnectedBanner(expectedEmail)}
        </p>
        <div class="vdm-callout__actions">
          {/* A whole page, so the browser itself jumps to the card. */}
          <a class="vdm-btn vdm-btn--outline vdm-btn--sm" data-rmx-document href={href}>
            {isOnSettings ? 'Přejít k účtu' : 'Do Nastavení'}
          </a>
        </div>
      </Callout>
    )
  }
}
