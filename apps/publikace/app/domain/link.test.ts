import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import {
  absoluteUrl,
  articleLinkPath,
  isLinkKey,
  linkState,
  shareText,
  shownUrl,
  usageLine,
} from './link.ts'

const TODAY = Temporal.Instant.from('2026-11-18T10:00:00Z')
const COMPLETE = { closedAt: null, completedAt: TODAY }

describe('isLinkKey', () => {
  it('takes twelve letters and digits, and nothing a messenger cut short', () => {
    assert.equal(isLinkKey('k7Qm2xR4pT9a'), true)
    assert.equal(isLinkKey('k7Qm2xR4pT9'), false)
    assert.equal(isLinkKey('k7Qm2xR4pT9a1'), false)
    assert.equal(isLinkKey('k7Qm2xR4-T9a'), false)
  })
})

describe('linkState', () => {
  it('is valid for a link of an active issue', () => {
    assert.equal(linkState({ revokedAt: null }, COMPLETE), 'valid')
  })

  it('is gone once replaced or once the issue is closed', () => {
    assert.equal(linkState({ revokedAt: TODAY }, COMPLETE), 'gone')
    assert.equal(linkState({ revokedAt: null }, { closedAt: TODAY, completedAt: TODAY }), 'gone')
  })

  it('is gone once the issue is removed, whatever state it was in', () => {
    assert.equal(linkState({ revokedAt: null }, { ...COMPLETE, removedAt: TODAY }), 'gone')
  })

  it('is unknown without a link, or for an issue that never finished', () => {
    assert.equal(linkState(null, COMPLETE), 'unknown')
    assert.equal(linkState({ revokedAt: null }, { closedAt: null, completedAt: null }), 'unknown')
  })
})

describe('usageLine', () => {
  it('says nothing has come through a fresh link', () => {
    assert.equal(usageLine({ count: 0, lastAt: null }, TODAY), 'Zatím nepoužit')
  })

  it('counts the articles and drops the year within the current one', () => {
    let last = Temporal.Instant.from('2026-11-10T08:00:00Z')
    assert.equal(usageLine({ count: 5, lastAt: last }, TODAY), 'Použit 5×, naposledy 10. 11.')
  })

  it('keeps the year from another one', () => {
    let last = Temporal.Instant.from('2025-12-30T08:00:00Z')
    assert.equal(usageLine({ count: 1, lastAt: last }, TODAY), 'Použit 1×, naposledy 30. 12. 2025')
  })
})

describe('the link as it is shown and shared', () => {
  it('stands alone in a message', () => {
    let url = absoluteUrl('https://publikace.vednemesicnik.cz', articleLinkPath('k7Qm2xR4pT9a'))
    assert.equal(url, 'https://publikace.vednemesicnik.cz/l/k7Qm2xR4pT9a/article')
    assert.equal(
      shareText('VDM_2026_5', url),
      'Nový článek do vydání VDM_2026_5 založíte tady: https://publikace.vednemesicnik.cz/l/k7Qm2xR4pT9a/article',
    )
    assert.equal(shownUrl(url), 'publikace.vednemesicnik.cz/l/k7Qm2xR4pT9a/article')
  })
})
