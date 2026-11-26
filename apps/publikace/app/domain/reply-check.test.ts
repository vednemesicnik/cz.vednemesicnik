import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import type { BatchStatus } from './artwork.ts'
import { decideReport, NO_CONVERSATION_ERROR, type ReportedReply } from './reply-check.ts'

const AT = Temporal.Instant.from('2026-11-19T08:00:00Z')

const WAITING: BatchStatus = {
  answeredAt: null,
  approvedAt: null,
  archiveFailedAt: null,
  consentVerifiedAt: null,
  discardedAt: null,
  isExactConsent: false,
  mailRefusedAt: null,
  mailSentAt: Temporal.Instant.from('2026-11-18T12:45:00Z'),
  replyMessageId: null,
  replyText: null,
}

const REPLY: ReportedReply = {
  messageId: 'm-2',
  receivedAt: Temporal.Instant.from('2026-11-19T07:12:00Z'),
  text: 'ok, souhlas',
  threadId: 't-1',
}

describe('decideReport', () => {
  it('only notes a failed check, and changes nothing on a batch already approved', () => {
    assert.deepEqual(decideReport(WAITING, { state: 'failed' }, AT), {
      answer: 'accepted',
      patch: { checkedAt: AT },
    })
    let approved = { ...WAITING, approvedAt: AT }
    assert.deepEqual(
      decideReport(approved, { archive: null, reply: REPLY, state: 'other_reply' }, AT),
      { answer: 'accepted', patch: {} },
    )
  })

  it('only notes the check when nobody replied', () => {
    assert.deepEqual(decideReport(WAITING, { state: 'no_reply' }, AT), {
      answer: 'accepted',
      patch: { checkedAt: AT },
    })
  })

  it('fails the archive of a decided consent when the conversation is not found', () => {
    let verified = { ...WAITING, consentVerifiedAt: AT, replyMessageId: 'm-1' }
    assert.deepEqual(decideReport(verified, { state: 'no_reply' }, AT).patch.archiveFailed, {
      at: AT,
      error: NO_CONVERSATION_ERROR,
    })
  })

  it('keeps another reply for Ke kontrole and ignores an archive it may not have made', () => {
    let decision = decideReport(
      WAITING,
      { archive: { error: 'nope' }, reply: REPLY, state: 'other_reply' },
      AT,
    )
    assert.deepEqual(decision, {
      answer: 'accepted',
      patch: { checkedAt: AT, reply: { ...REPLY, isExactConsent: false } },
    })
  })

  it('approves an exact „Souhlasím“ with the archived PDF', () => {
    let decision = decideReport(
      WAITING,
      { archive: { fileId: 'pdf-1' }, reply: REPLY, state: 'reply_matches' },
      AT,
    )
    assert.equal(decision.answer, 'accepted')
    assert.deepEqual(decision.patch.approved, { at: AT, fileId: 'pdf-1' })
    assert.equal(decision.patch.reply?.isExactConsent, true)
  })

  it('records a failed archive of an exact „Souhlasím“', () => {
    let decision = decideReport(
      WAITING,
      { archive: { error: 'Drive' }, reply: REPLY, state: 'reply_matches' },
      AT,
    )
    assert.deepEqual(decision.patch.archiveFailed, { at: AT, error: 'Drive' })
  })

  it('supersedes an archive of a discarded batch’s „Souhlasím“ nobody decided', () => {
    let discarded = { ...WAITING, discardedAt: AT }
    let decision = decideReport(
      discarded,
      { archive: { fileId: 'pdf-1' }, reply: REPLY, state: 'reply_matches' },
      AT,
    )
    assert.equal(decision.answer, 'superseded')
    assert.equal(decision.patch.approved, undefined)
  })

  it('supersedes an archive once Je to souhlas was taken back, and approves one that stands', () => {
    let report = {
      archive: { fileId: 'pdf-1' },
      reply: REPLY,
      state: 'other_reply' as const,
    }
    assert.equal(decideReport(WAITING, report, AT).answer, 'superseded')
    let verified = { ...WAITING, consentVerifiedAt: AT, replyMessageId: 'm-2' }
    assert.deepEqual(decideReport(verified, report, AT).patch.approved, { at: AT, fileId: 'pdf-1' })
  })

  it('drops a decision when a newer reply arrives, and archives nothing on its strength', () => {
    let verified = { ...WAITING, consentVerifiedAt: AT, replyMessageId: 'm-1' }
    let decision = decideReport(
      verified,
      {
        archive: { fileId: 'pdf-1' },
        reply: { ...REPLY, text: 'Ne, beru zpět.' },
        state: 'other_reply',
      },
      AT,
    )
    assert.equal(decision.answer, 'superseded')
    assert.equal(decision.patch.isDecisionReset, true)
    assert.equal(decision.patch.approved, undefined)
  })

  it('lets a newer reply out of a failed archive, back to Ke kontrole', () => {
    let failed = { ...WAITING, archiveFailedAt: AT, isExactConsent: true, replyMessageId: 'm-1' }
    let decision = decideReport(failed, { archive: null, reply: REPLY, state: 'other_reply' }, AT)
    assert.equal(decision.patch.isDecisionReset, true)
    assert.equal(decision.patch.archiveFailed, undefined)
  })

  it('keeps the decision for the same reply read again', () => {
    let verified = { ...WAITING, consentVerifiedAt: AT, replyMessageId: REPLY.messageId }
    let decision = decideReport(verified, { archive: null, reply: REPLY, state: 'other_reply' }, AT)
    assert.equal(decision.patch.isDecisionReset, undefined)
  })
})
