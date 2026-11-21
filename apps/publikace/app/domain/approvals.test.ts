import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { clauseKey, clauseState, type ClauseStatus, countClauses } from './approvals.ts'

const AT = Temporal.Instant.from('2026-11-21T08:12:00Z')
const SENT: ClauseStatus = {
  approvedAt: null,
  archiveFailedAt: null,
  consentVerifiedAt: null,
  isExactConsent: false,
  replyMessageId: null,
  state: 'sent',
}

describe('an author’s clause', () => {
  it('has a key with no address, unique for the article, the author and the marking', () => {
    assert.equal(clauseKey(12, 2, AT), 'clause_12_2_20261121081200000')
  })

  it('reads its state the way the Evidence names it, by who is on the move', () => {
    assert.equal(clauseState({ ...SENT, state: 'pending' }), 'pending')
    assert.equal(clauseState(SENT), 'waiting')
    assert.equal(clauseState({ ...SENT, state: 'failed' }), 'unsent')
    assert.equal(clauseState({ ...SENT, replyMessageId: 'm' }), 'review')
    assert.equal(clauseState({ ...SENT, isExactConsent: true, replyMessageId: 'm' }), 'verified')
    assert.equal(clauseState({ ...SENT, consentVerifiedAt: AT, replyMessageId: 'm' }), 'verified')
    assert.equal(clauseState({ ...SENT, archiveFailedAt: AT, replyMessageId: 'm' }), 'unarchived')
    assert.equal(clauseState({ ...SENT, approvedAt: AT, archiveFailedAt: AT }), 'approved')
  })

  it('lets a reply beat an e-mail the Mailer did not confirm', () => {
    assert.equal(clauseState({ ...SENT, replyMessageId: 'm', state: 'failed' }), 'review')
  })

  it('counts the clauses of one final version by state', () => {
    let counts = countClauses([SENT, { ...SENT, approvedAt: AT }, { ...SENT, state: 'pending' }])
    assert.deepEqual(counts, {
      approved: 1,
      pending: 1,
      review: 0,
      total: 3,
      unarchived: 0,
      unsent: 0,
      verified: 0,
      waiting: 1,
    })
  })
})
