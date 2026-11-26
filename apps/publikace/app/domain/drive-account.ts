/**
 * Connecting the account the app acts as on Drive, and the words `14g`, `14h` and `14c` give it.
 * The wording went through the copywriter (`fxmhsx1r`).
 *
 * Pure, so the decision and the sentences are tested here rather than through Google.
 */

import { normalizeEmail } from './access.ts'
import { tied } from './public/typography.ts'

/** The scope the app asks for. Anything narrower cannot create in a folder it did not create. */
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive'

/** What came back from Google, as far as the decision needs it. */
export type ConnectionAttempt = {
  email: string
  hasRefreshToken: boolean
  /** Google's `email_verified`. An address Google does not vouch for names nobody. */
  isEmailVerified: boolean
  scopes: readonly string[]
}

export type ConnectionRefusal =
  | { email: string; reason: 'wrong-account' }
  | { reason: 'failed' }
  | { reason: 'no-drive-scope' }

export type ConnectionDecision = ({ ok: false } & ConnectionRefusal) | { ok: true }

/**
 * Whether a return from Google may become the app's account on Drive.
 *
 * Another account is said first: the Drive permission of the wrong account would not help, and
 * the address it names is what the person has to change (`14h`). A missing refresh token cannot
 * happen with `prompt=consent`; if it does, there is nothing to store and nothing to tell but to
 * try again. Neither can an address Google does not vouch for, which is not named back.
 */
export function decideConnection(
  attempt: ConnectionAttempt,
  expectedEmail: string,
): ConnectionDecision {
  if (!attempt.isEmailVerified) return { ok: false, reason: 'failed' }
  let email = normalizeEmail(attempt.email)
  if (email !== normalizeEmail(expectedEmail)) return { email, ok: false, reason: 'wrong-account' }
  if (!attempt.scopes.includes(DRIVE_SCOPE)) return { ok: false, reason: 'no-drive-scope' }
  if (!attempt.hasRefreshToken) return { ok: false, reason: 'failed' }
  return { ok: true }
}

/** `publikace.app@`: the account as the shorter sentences name it. */
export function shortAccount(email: string): string {
  let at = email.indexOf('@')
  return at === -1 ? email : email.slice(0, at + 1)
}

/** The domain part, for the meta line under the name on the card. */
export function accountDomain(email: string): string {
  let at = email.indexOf('@')
  return at === -1 ? '' : email.slice(at + 1)
}

export const NOT_CONNECTED_CARD_TEXT = tied`Připojte účet, aby aplikace mohla zakládat vydání a pracovat se soubory na Disku.`

/*
 * The two cards that name the record follow whether the deployment has a Registr, as Soubory na
 * Disku above them does, so one page never says both (`14j`, `14c`).
 */

export function connectedCardText(hasRegistry: boolean): string {
  return hasRegistry
    ? tied`Pod tímto účtem běží úlohy na pozadí. Aplikace pod ním zakládá složky a dokumenty na sdíleném disku a zapisuje do Registru a Evidence. Soubory patří disku.`
    : tied`Pod tímto účtem běží úlohy na pozadí. Aplikace pod ním zakládá složky a dokumenty na sdíleném disku a zapisuje do Evidence. Soubory patří disku.`
}

export function disconnectedCardText(hasRegistry: boolean): string {
  return hasRegistry
    ? tied`Připojte účet znovu, aby aplikace mohla pracovat se soubory na Disku. Po připojení účtu aplikace do Registru a Evidence doplní všechny čekající změny.`
    : tied`Připojte účet znovu, aby aplikace mohla pracovat se soubory na Disku. Po připojení účtu aplikace do Evidence doplní všechny čekající změny.`
}

export const MAILBOX_CARD_TEXT = tied`Schránka pro uvítání, žádosti o souhlas, připomínky a odpovědi. Aplikace zadává odeslání a dostává výsledky kontroly odpovědí; ke schránce se nepřihlašuje ani ji nečte.`

/** Under the button in _Nepřipojeno_ and _Odpojeno_. */
export function connectHint(expectedEmail: string): string {
  return tied`V Googlu vyberte účet ${expectedEmail} a povolte aplikaci pracovat se soubory na Disku.`
}

export function notConnectedBanner(expectedEmail: string): string {
  return `Připojte účet ${shortAccount(expectedEmail)}. Bez připojení nejde zakládat vydání ani pracovat se soubory na Disku.`
}

export function disconnectedBanner(expectedEmail: string): string {
  return `Účet ${shortAccount(expectedEmail)} je odpojený. Akce se soubory na Disku teď nejsou dostupné.`
}

export function connectedToast(expectedEmail: string): string {
  return `Účet ${shortAccount(expectedEmail)} je připojený.`
}

/**
 * The Callout after a refused return (`14h`). While the account is connected — somebody else
 * connected it meanwhile — every refusal gets the one sentence that says it still is.
 */
export function refusalMessage(
  refusal: ConnectionRefusal,
  expectedEmail: string,
  isConnected: boolean,
): string {
  if (isConnected) {
    return tied`Účet ${shortAccount(expectedEmail)} už je připojený. Váš pokus o připojení se nepodařil, ale účet zůstává připojený.`
  }

  switch (refusal.reason) {
    case 'wrong-account':
      return tied`Vyberte v Googlu účet ${expectedEmail}. Účet ${refusal.email} připojit nejde.`
    case 'no-drive-scope':
      return tied`Povolte v Googlu aplikaci pracovat se soubory na Disku. Bez tohoto povolení účet připojit nejde.`
    case 'failed':
      return 'Zkuste účet připojit znovu.'
  }
}
