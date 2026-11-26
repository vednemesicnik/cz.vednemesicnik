import type {
  AnswerRecipient,
  AnswerRow,
  AnswerStore,
  AnswerTarget,
} from '../../data/answers.server.ts'
import type { PublicMailLog } from '../../data/public-mail.server.ts'
import { checkAnswer, signatureOf } from '../../domain/answer.ts'
import { reservePublicMail } from '../../drive/artworks-setup.server.ts'
import { answerEmail } from '../../mail/answer-email.server.ts'
import { isPermanentRefusal, type Mailer } from '../../mail/mailer.server.ts'

export type AnswerDependencies = {
  answers: AnswerStore
  mailer: Mailer
  mailLog: PublicMailLog
  mailPerDay: number
  now(): Temporal.Instant
}

/**
 * What sending an answer came to (`13e`). `unconfirmed` and `refused` are this attempt's own
 * outcome; `locked` is an answer to the same message already on record and unsent, an earlier
 * attempt the Mailer did not confirm or the post refused, whose `answer` the card shows instead.
 */
export type SendAnswerOutcome =
  | { kind: 'sent'; recipient: AnswerRecipient }
  | { error: string; kind: 'invalid' }
  | {
      answer: AnswerRow
      kind: 'locked' | 'refused' | 'taken' | 'unconfirmed'
      recipient: AnswerRecipient
    }
  | { kind: 'approved' | 'closed' | 'gone' | 'newer-reply'; recipient: AnswerRecipient | null }
  | { kind: 'daily-cap' }

/**
 * Asks the Mailer for an answer on record. The place under the daily cap is taken first, as for
 * every e-mail a public page or an editor starts (`02a`): the answer counts as a resent request.
 * A first attempt the cap stopped is taken off the record, so nothing of it stays; a retry keeps
 * its record, which is what holds its text.
 */
async function deliver(
  dependencies: AnswerDependencies,
  answer: AnswerRow,
  recipient: AnswerRecipient,
  isFirst: boolean,
): Promise<SendAnswerOutcome> {
  if (!(await reservePublicMail(dependencies, 'consent', 1))) {
    if (isFirst) await dependencies.answers.discard(answer.id)
    return { kind: 'daily-cap' }
  }
  let result = await dependencies.mailer(
    answerEmail({
      idempotencyKey: answer.idempotencyKey,
      kind: answer.target.kind,
      replyReceivedAt: answer.replyReceivedAt,
      replyText: answer.replyText,
      replyToMessageId: answer.inReplyToMessageId,
      signatureName: answer.signatureName,
      subject: recipient.subject,
      text: answer.text,
      to: recipient.email,
    }),
  )
  let at = dependencies.now()
  if (result.ok) {
    await dependencies.answers.mark(answer.id, 'sent', at)
    return { kind: 'sent', recipient }
  }
  let isRefused = isPermanentRefusal(result)
  await dependencies.answers.mark(answer.id, isRefused ? 'refused' : 'failed', at)
  return { answer, kind: isRefused ? 'refused' : 'unconfirmed', recipient }
}

/**
 * _Odeslat odpověď_ (`13d`): the text checked, the answer put on record with every check of the
 * card in one step, and only then the Mailer, so an e-mail goes only for an answer that stands.
 */
export async function sendAnswer(
  dependencies: AnswerDependencies,
  target: AnswerTarget,
  input: {
    editor: { displayName: string; email: string }
    messageId: string
    text: string
  },
): Promise<SendAnswerOutcome> {
  let check = checkAnswer(input.text)
  if (!check.ok) return { error: check.error, kind: 'invalid' }
  let started = await dependencies.answers.start(
    target,
    {
      editor: input.editor,
      messageId: input.messageId,
      signatureName: signatureOf(input.editor),
      text: check.text,
    },
    dependencies.now(),
  )
  if (started.kind !== 'started') return started
  return deliver(dependencies, started.answer, started.recipient, true)
}

/**
 * _Odeslat znovu_ (`13e`): the stored answer, its text and its key unchanged, while the card still
 * waits on the message it answers.
 */
export async function retryAnswer(
  dependencies: AnswerDependencies,
  target: AnswerTarget,
  answerId: number,
): Promise<SendAnswerOutcome> {
  let resumed = await dependencies.answers.resume(target, answerId, dependencies.now())
  if (resumed.kind !== 'started') return resumed
  return deliver(dependencies, resumed.answer, resumed.recipient, false)
}
