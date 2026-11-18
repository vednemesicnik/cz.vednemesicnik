import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import {
  connectedToast,
  decideConnection,
  disconnectedBanner,
  DRIVE_SCOPE,
  notConnectedBanner,
  refusalMessage,
  shortAccount,
} from './drive-account.ts'

const EXPECTED = 'publikace.app@priklad.cz'

const GOOD = {
  email: EXPECTED,
  hasRefreshToken: true,
  isEmailVerified: true,
  scopes: ['openid', 'email', DRIVE_SCOPE],
}

describe('deciding a connection (14h)', () => {
  it('accepts the expected account with Drive and a refresh token, in any case', () => {
    assert.deepEqual(decideConnection(GOOD, EXPECTED), { ok: true })
    assert.deepEqual(decideConnection({ ...GOOD, email: 'Publikace.App@Priklad.cz' }, EXPECTED), {
      ok: true,
    })
  })

  it('names another account before a missing Drive permission', () => {
    assert.deepEqual(
      decideConnection({ ...GOOD, email: 'jan.novak@priklad.cz', scopes: ['openid'] }, EXPECTED),
      { email: 'jan.novak@priklad.cz', ok: false, reason: 'wrong-account' },
    )
  })

  it('refuses the account without Drive', () => {
    assert.deepEqual(decideConnection({ ...GOOD, scopes: ['openid', 'email'] }, EXPECTED), {
      ok: false,
      reason: 'no-drive-scope',
    })
  })

  it('cannot store anything without a refresh token or name an unverified address', () => {
    assert.deepEqual(decideConnection({ ...GOOD, hasRefreshToken: false }, EXPECTED), {
      ok: false,
      reason: 'failed',
    })
    assert.deepEqual(
      decideConnection({ ...GOOD, email: 'jan@priklad.cz', isEmailVerified: false }, EXPECTED),
      { ok: false, reason: 'failed' },
    )
  })
})

describe('the words of 14g, 14h and 14c (fxmhsx1r)', () => {
  it('says each refusal, and only that the account still is connected when it is', () => {
    assert.equal(
      refusalMessage({ email: 'jan.novak@priklad.cz', reason: 'wrong-account' }, EXPECTED, false),
      'Vyberte v Googlu účet publikace.app@priklad.cz. Účet jan.novak@priklad.cz připojit nejde.',
    )
    assert.equal(
      refusalMessage({ reason: 'no-drive-scope' }, EXPECTED, false),
      'Povolte v Googlu aplikaci pracovat se soubory na Disku. Bez tohoto povolení účet připojit nejde.',
    )
    assert.equal(
      refusalMessage({ reason: 'failed' }, EXPECTED, false),
      'Zkuste účet připojit znovu.',
    )
    assert.equal(
      refusalMessage({ reason: 'failed' }, EXPECTED, true),
      'Účet publikace.app@ už je připojený. Váš pokus o připojení se nepodařil, ale účet zůstává připojený.',
    )
  })

  it('names the account short in the banners and the toast', () => {
    assert.equal(shortAccount(EXPECTED), 'publikace.app@')
    assert.equal(
      notConnectedBanner(EXPECTED),
      'Připojte účet publikace.app@. Bez připojení nejde zakládat vydání ani pracovat se soubory na Disku.',
    )
    assert.equal(
      disconnectedBanner(EXPECTED),
      'Účet publikace.app@ je odpojený. Akce se soubory na Disku teď nejsou dostupné.',
    )
    assert.equal(connectedToast(EXPECTED), 'Účet publikace.app@ je připojený.')
  })
})
