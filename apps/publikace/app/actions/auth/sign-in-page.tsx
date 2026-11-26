import type { Handle } from 'remix/component'
import { css } from 'remix/component'

import { routes } from '../../routes.ts'
import { Callout } from '../../ui/callout/component.tsx'
import { SignInCard } from '../../ui/sign-in-card/component.tsx'
import { Document } from '../document.tsx'
import { tied } from '../../domain/public/typography.ts'

/** The refusals `10a` has a sentence for, as they come in `?error=`. */
export type SignInError = 'domain' | 'expired' | 'notlisted' | 'oauth' | 'unavailable'

export const SIGN_IN_ERRORS: readonly SignInError[] = [
  'domain',
  'expired',
  'notlisted',
  'oauth',
  'unavailable',
]

/*
 * The way to Google is a whole-page navigation (`data-rmx-document`): the client runtime would
 * otherwise fetch it within the page, and the browser refuses to follow that fetch to
 * accounts.google.com.
 *
 * Google's own sign-out, the only way to end the Google session this app never held. Shown on
 * `10b` for a shared computer.
 */
const GOOGLE_SIGN_OUT_URL = 'https://accounts.google.com/Logout'

/*
 * The card in the middle of the window from 768 px, on the secondary ground the drawing stands
 * it on; below, the card's own media query drops its frame and the column starts near the top
 * (`10c`).
 */
const pageStyle = css({
  alignItems: 'center',
  background: 'var(--bg-secondary)',
  boxSizing: 'border-box',
  display: 'flex',
  justifyContent: 'center',
  minHeight: '100dvh',
  padding: '48px 24px',
  '@media (max-width: 767.98px)': {
    alignItems: 'flex-start',
    background: 'var(--bg-primary)',
    padding: '32px 20px',
  },
})

export type SignInPageProps = {
  /** Without the `@`. */
  domain: string
  error?: SignInError
  redirectTo?: string
  /** The address `notlisted` names: the account the person just tried. */
  refusedEmail?: string
  /** `10b`: the same page after _Odhlásit se_. */
  signedOut: boolean
  /** `ve 14:38`, from a message read once, so a reload keeps the state and loses the time. */
  signedOutAt?: string
}

function errorMessage(error: SignInError, domain: string, refusedEmail: string | undefined) {
  switch (error) {
    case 'domain':
      return tied`Vyberte účet Google s adresou @${domain} — jinou adresou se přihlásit nelze.`
    case 'expired':
      return tied`Přihlášení vypršelo. Přihlaste se znovu a pokračujte tam, kde jste skončili.`
    case 'notlisted':
      return refusedEmail === undefined
        ? tied`Požádejte šéfredakci o kontakt na správce Publikace. Účet nemá přístup.`
        : tied`Požádejte šéfredakci o kontakt na správce Publikace. Účet ${refusedEmail} nemá přístup.`
    case 'oauth':
      return 'Zkuste přihlášení přes Google znovu.'
    case 'unavailable':
      return 'Zkuste se přihlásit za chvíli znovu. Přístup se teď nepodařilo ověřit.'
  }
}

/** `10a`, `10b` and `10c`: one page, the way in and the state after leaving. */
export function SignInPage(handle: Handle<SignInPageProps>) {
  return () => {
    let { domain, error, redirectTo, refusedEmail, signedOut, signedOutAt } = handle.props

    let start =
      redirectTo === undefined
        ? routes.auth.google.start.href()
        : `${routes.auth.google.start.href()}?${new URLSearchParams({ redirectTo })}`

    if (signedOut) {
      let note = tied`Na sdíleném počítači se ještě odhlaste z účtu Google.`

      return (
        <Document title="Odhlášeno">
          <div mix={pageStyle}>
            <SignInCard title="Jste odhlášeni">
              <p class="vdm-signin__text">
                {signedOutAt === undefined ? note : `Odhlášeno ${signedOutAt}. ${note}`}
              </p>
              <a class="vdm-btn vdm-btn--primary" data-rmx-document href={start}>
                Přihlásit se znovu
              </a>
              <a class="vdm-btn vdm-btn--ghost" href={GOOGLE_SIGN_OUT_URL}>
                {tied`Odhlásit i účet Google`}
              </a>
            </SignInCard>
          </div>
        </Document>
      )
    }

    return (
      <Document title="Přihlášení">
        <div mix={pageStyle}>
          <SignInCard hasWordmark title="Přihlášení do Publikace">
            {error === undefined ? null : (
              <Callout tone={error === 'expired' ? 'info' : 'error'}>
                {errorMessage(error, domain, refusedEmail)}
              </Callout>
            )}
            <a class="vdm-btn vdm-btn--primary" data-rmx-document href={start}>
              Přihlásit se přes Google
            </a>
            <p class="vdm-signin__note vdm-signin__note--quiet">
              {tied`S účtem @${domain}, který má přístup do Publikace.`}
            </p>
          </SignInCard>
        </div>
      </Document>
    )
  }
}
