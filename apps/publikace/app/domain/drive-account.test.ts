import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import {
  connectedCardText,
  connectedToast,
  decideConnection,
  disconnectedBanner,
  disconnectedCardText,
  DRIVE_SCOPE,
  notConnectedBanner,
  refusalMessage,
  shortAccount,
} from './drive-account.ts'
import { NBSP } from './public/typography.ts'

/** The tied text as typed: `tied` keeps one-letter words with the next one. */
function plain(text: string): string {
  return text.replaceAll(NBSP, ' ')
}

const EXPECTED = 'publikace.app@vednemesicnik.test'

const GOOD = {
  email: EXPECTED,
  hasRefreshToken: true,
  isEmailVerified: true,
  scopes: ['openid', 'email', DRIVE_SCOPE],
}

describe('deciding a connection (14h)', () => {
  it('accepts the expected account with Drive and a refresh token, in any case', () => {
    assert.deepEqual(decideConnection(GOOD, EXPECTED), { ok: true })
    assert.deepEqual(
      decideConnection({ ...GOOD, email: 'Publikace.App@Vednemesicnik.test' }, EXPECTED),
      {
        ok: true,
      },
    )
  })

  it('names another account before a missing Drive permission', () => {
    assert.deepEqual(
      decideConnection(
        { ...GOOD, email: 'jan.novak@vednemesicnik.test', scopes: ['openid'] },
        EXPECTED,
      ),
      { email: 'jan.novak@vednemesicnik.test', ok: false, reason: 'wrong-account' },
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
      decideConnection(
        { ...GOOD, email: 'jan@vednemesicnik.test', isEmailVerified: false },
        EXPECTED,
      ),
      { ok: false, reason: 'failed' },
    )
  })
})

describe('the words of 14g, 14h and 14c (fxmhsx1r)', () => {
  it('says each refusal, and only that the account still is connected when it is', () => {
    assert.equal(
      refusalMessage(
        { email: 'jan.novak@vednemesicnik.test', reason: 'wrong-account' },
        EXPECTED,
        false,
      ),
      'Vyberte v\u00a0Googlu účet publikace.app@vednemesicnik.test. Účet jan.novak@vednemesicnik.test připojit nejde.',
    )
    assert.equal(
      refusalMessage({ reason: 'no-drive-scope' }, EXPECTED, false),
      'Povolte v\u00a0Googlu aplikaci pracovat se soubory na Disku. Bez tohoto povolení účet připojit nejde.',
    )
    assert.equal(
      refusalMessage({ reason: 'failed' }, EXPECTED, false),
      'Zkuste účet připojit znovu.',
    )
    assert.equal(
      refusalMessage({ reason: 'failed' }, EXPECTED, true),
      'Účet publikace.app@ už je připojený. Váš pokus o\u00a0připojení se nepodařil, ale účet zůstává připojený.',
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

  it('names the Registr on the card only when the deployment has one (14j, 14c)', () => {
    assert.equal(
      plain(connectedCardText(true)),
      'Pod tímto účtem běží úlohy na pozadí. Aplikace pod ním zakládá složky a dokumenty na sdíleném disku a zapisuje do Registru a Evidence. Soubory patří disku.',
    )
    assert.equal(
      plain(connectedCardText(false)),
      'Pod tímto účtem běží úlohy na pozadí. Aplikace pod ním zakládá složky a dokumenty na sdíleném disku a zapisuje do Evidence. Soubory patří disku.',
    )
    assert.equal(
      plain(disconnectedCardText(true)),
      'Připojte účet znovu, aby aplikace mohla pracovat se soubory na Disku. Po připojení účtu aplikace do Registru a Evidence doplní všechny čekající změny.',
    )
    assert.equal(
      plain(disconnectedCardText(false)),
      'Připojte účet znovu, aby aplikace mohla pracovat se soubory na Disku. Po připojení účtu aplikace do Evidence doplní všechny čekající změny.',
    )
  })
})
