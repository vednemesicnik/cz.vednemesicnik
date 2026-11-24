import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { type ClauseDetail, type ClauseState, countClauses } from './approvals.ts'
import {
  alreadyReplacedToast,
  isReplaceable,
  replacedClauseTag,
  replacedMarkedLine,
  restoredToast,
} from './final-version-replacement.ts'

const AT = Temporal.Instant.from('2026-11-21T08:12:00Z')
const TODAY = Temporal.Instant.from('2026-11-22T10:00:00Z')

/** The words without the non-breaking spaces `tied` puts after one-letter words. */
function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value).replaceAll('\u00a0', ' ')) as T
}

function clause(state: ClauseState, extra: Partial<ClauseDetail> = {}): ClauseDetail {
  return {
    answeredAt: null,
    approvedAt: null,
    archiveError: null,
    authorEmail: 'tereza.vlkova@external.test',
    authorName: 'Tereza Vlková',
    error: null,
    id: 1,
    replyReceivedAt: null,
    replyText: null,
    sentAt: null,
    signature: 'Tereza Vlková',
    state,
    ...extra,
  }
}

function counts(approved: number, total: number) {
  let sent = { answeredAt: null, approvedAt: null, archiveFailedAt: null, consentVerifiedAt: null }
  let all = Array.from({ length: total }, (_, index) => ({
    ...sent,
    approvedAt: index < approved ? AT : null,
    isExactConsent: false,
    replyMessageId: null,
    state: 'sent' as const,
  }))
  return countClauses(all)
}

describe('a new final version (12r)', () => {
  it('is offered once a run took a clause and while not every author agreed', () => {
    assert.equal(isReplaceable({ clauses: counts(0, 2), isCancellable: true }), false)
    assert.equal(isReplaceable({ clauses: counts(1, 2), isCancellable: false }), true)
    assert.equal(isReplaceable({ clauses: counts(2, 2), isCancellable: false }), false)
  })

  it('says which version stands after a cancel and after a race', () => {
    assert.equal(plain(restoredToast(AT, TODAY)), 'Znovu platí finální verze z 21. 11. v 9:12.')
    let toast = alreadyReplacedToast(
      { at: AT, email: 'marie@vednemesicnik.test', name: null },
      TODAY,
    )
    assert.equal(plain(toast.message), 'Finální verze už je nahrazená.')
    assert.equal(plain(toast.detail), 'Platná verze: 21. 11. v 9:12 · marie@vednemesicnik.test')
  })
})

describe('a replaced version in the open row (12s)', () => {
  it('names who marked it and when it was replaced', () => {
    let line = replacedMarkedLine(
      { email: 'lenka.svobodova@vednemesicnik.test', name: 'Lenka Svobodová', replacedAt: AT },
      TODAY,
    )
    assert.equal(plain(line), 'Označení: Lenka Svobodová · nahrazena 21. 11. v 9:12')
  })

  it('shows each clause as a record that promises nothing', () => {
    let reply = { replyReceivedAt: AT, replyText: 'Jinak souhlasím.' }
    assert.deepEqual(plain(replacedClauseTag(clause('waiting', { sentAt: AT }), TODAY)), {
      detail: 'Žádost odeslána 21. 11.',
      label: 'Bez odpovědi',
      quote: null,
    })
    assert.deepEqual(plain(replacedClauseTag(clause('review', reply), TODAY)), {
      detail: '21. 11. v 9:12',
      label: 'Jiná odpověď',
      quote: 'Jinak souhlasím.',
    })
    assert.equal(replacedClauseTag(clause('pending'), TODAY).label, 'Neodesláno')
    assert.deepEqual(plain(replacedClauseTag(clause('unsent', { error: 'Mailer: 550' }), TODAY)), {
      detail: null,
      label: 'Bez potvrzení odeslání',
      quote: null,
    })
    assert.deepEqual(plain(replacedClauseTag(clause('unarchived', reply), TODAY)), {
      detail: '21. 11. v 9:12 · konverzace se neuložila do složky Licence',
      label: 'Souhlasí',
      quote: null,
    })
    assert.equal(replacedClauseTag(clause('verified'), TODAY).label, 'Souhlas zaznamenán')
    assert.equal(replacedClauseTag(clause('approved', { approvedAt: AT }), TODAY).label, 'Souhlasí')
  })
})
