import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import {
  type ClauseDetail,
  clauseKey,
  clauseRowTag,
  clauseState,
  type ClauseStatus,
  countClauses,
  isResendable,
  resendClosedToast,
  resendLabel,
  resentClausesToast,
  sendKey,
} from './approvals.ts'
import type { JobHealth } from './job-run.ts'

const AT = Temporal.Instant.from('2026-11-21T08:12:00Z')
const SENT: ClauseStatus = {
  answeredAt: null,
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

  it('puts the author on the move again once the latest reply was answered from the queue', () => {
    assert.equal(clauseState({ ...SENT, answeredAt: AT, replyMessageId: 'm' }), 'waiting')
    let exact = { ...SENT, answeredAt: AT, isExactConsent: true, replyMessageId: 'm' }
    assert.equal(clauseState(exact), 'verified')
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

const TODAY = Temporal.Instant.from('2026-11-21T09:05:00Z')
const NEXT = Temporal.Instant.from('2026-11-21T08:30:00Z')
const RUNNING: JobHealth = { kind: 'running', lastStartedAt: AT, next: NEXT }
const DETAIL: ClauseDetail = {
  answeredAt: null,
  approvedAt: null,
  archiveError: null,
  authorEmail: 'ondrej.benes@external.test',
  authorName: 'Ondřej Beneš',
  error: null,
  id: 7,
  replyReceivedAt: null,
  replyText: null,
  sentAt: Temporal.Instant.from('2026-11-12T15:30:00Z'),
  signature: 'Ondřej Beneš',
  state: 'waiting',
}

describe('sending a clause again', () => {
  it('keeps the clause’s key for the first sending and gives every later one its own', () => {
    assert.equal(sendKey('clause_12_2_1', 1), 'clause_12_2_1')
    assert.equal(sendKey('clause_12_2_1', 2), 'clause_12_2_1_2')
  })

  it('takes a clause nobody answered and one the Mailer did not confirm, never a failed archive', () => {
    assert.deepEqual(
      (
        ['approved', 'pending', 'review', 'unarchived', 'unsent', 'verified', 'waiting'] as const
      ).filter(isResendable),
      ['unsent', 'waiting'],
    )
  })

  it('counts its recipients only on an article with more than one author', () => {
    assert.equal(resendLabel(1, 1), 'Poslat žádost znovu')
    assert.equal(resendLabel(1, 2), 'Poslat žádost znovu 1 autorovi')
    assert.equal(resendLabel(3, 5), 'Poslat žádost znovu 3 autorům')
    assert.equal(resentClausesToast(1), 'Žádost čeká na odeslání.')
    assert.equal(resentClausesToast(2), 'Žádosti čekají na odeslání.')
    assert.equal(
      resendClosedToast('VDM_2026_5'),
      'Vydání VDM_2026_5 je uzavřené. Žádost už nelze poslat znovu.',
    )
  })
})

describe('an author’s line in the open row', () => {
  it('gives the next run only while the job has an estimate', () => {
    let pending = { ...DETAIL, sentAt: null, state: 'pending' as const }
    assert.equal(clauseRowTag(pending, RUNNING, TODAY).detail, 'další běh kolem 9:30')
    assert.equal(
      clauseRowTag(pending, { kind: 'stopped', lastStartedAt: AT }, TODAY).detail,
      'úloha teď neběží',
    )
    assert.equal(clauseRowTag(pending, { ...RUNNING, next: null }, TODAY).detail, null)
    assert.equal(clauseRowTag(pending, { kind: 'never' }, TODAY).detail, null)
    assert.equal(clauseRowTag(pending, RUNNING, TODAY).label, 'Čeká na odeslání')
  })

  it('reads every state as the table under 12b names it', () => {
    let row = (detail: Partial<ClauseDetail>) =>
      clauseRowTag({ ...DETAIL, ...detail }, RUNNING, TODAY)
    assert.deepEqual(row({}), {
      detail: 'od 12. 11.',
      error: null,
      label: 'Čeká na odpověď',
      link: null,
      quote: null,
      tone: 'running',
    })
    let answered = row({ answeredAt: Temporal.Instant.from('2026-11-19T08:41:00Z') })
    assert.equal(answered.detail, 'odpověď odeslána 19. 11.')
    assert.deepEqual(row({ replyText: 'Ještě jedna oprava', state: 'review' }), {
      detail: null,
      error: null,
      label: 'Ke kontrole',
      link: 'review',
      quote: 'Ještě jedna oprava',
      tone: 'waiting',
    })
    assert.equal(row({ state: 'verified' }).label, 'Souhlas zaznamenán')
    let approved = row({
      approvedAt: TODAY,
      replyReceivedAt: Temporal.Instant.from('2026-11-13T17:04:00Z'),
      state: 'approved',
    })
    assert.equal(approved.label, 'Souhlasí')
    assert.equal(approved.detail, '13. 11. v\u00a018:04')
    /* The line says only what the app knows; the job's text waits under Zobrazit podrobnosti. */
    assert.deepEqual(row({ error: 'Mailer answered 503', state: 'unsent' }), {
      detail: 'chybí potvrzení o\u00a0odeslání žádosti',
      error: 'Mailer answered 503',
      label: 'Chyba',
      link: 'jobs',
      quote: null,
      tone: 'problem',
    })
    let unarchived = row({ archiveError: 'Licence is gone', state: 'unarchived' })
    assert.equal(unarchived.detail, 'konverzace se neuložila')
    assert.equal(unarchived.error, 'Licence is gone')
  })
})
