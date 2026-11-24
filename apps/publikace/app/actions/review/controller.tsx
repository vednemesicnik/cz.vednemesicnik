import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'
import { Session } from 'remix/session'

import type { SignedInUntilCookie } from '../../auth/session.server.ts'
import type { AnswerRow, AnswerStore, AnswerTarget } from '../../data/answers.server.ts'
import type { ArticleStore, QueuedClause } from '../../data/articles.server.ts'
import type { ArtworkStore, QueuedBatch } from '../../data/artworks.server.ts'
import type { JobRunStore } from '../../data/job-runs.server.ts'
import type { PublicMailLog } from '../../data/public-mail.server.ts'
import {
  answerCallout,
  type AnswerKind,
  answerSentToast,
  signatureOf,
  UNSENT_ANSWER_NOTE,
  UNSENT_ANSWER_TITLE,
  unsentAnswerLine,
} from '../../domain/answer.ts'
import { answeredLine, APPROVAL_SEND_JOB, WAITING_CLAUSE_LABEL } from '../../domain/approvals.ts'
import { ARTWORK_STATE_LABELS, batchStateDetail, replyExcerpt } from '../../domain/artwork.ts'
import { alreadyReplacedToast } from '../../domain/final-version-replacement.ts'
import { type JobHealth, jobHealth, jobState } from '../../domain/job-run.ts'
import { REPLY_CHECK_JOB } from '../../domain/reply-check.ts'
import {
  ARCHIVE_FAILED_TAG,
  ARCHIVE_STOPPED_TITLE,
  archiveFailedText,
  ARTICLE_ARCHIVE_STOPPED_TITLE,
  articleKindLine,
  discardedBatchText,
  isLongReply,
  kindLine,
  readLines,
  receivedLine,
  replyMenuLabel,
  type ReviewKind,
  reviewKindOf,
  settledLine,
  SHOW_ARTWORKS_LABEL,
  UNDO_LABEL,
  VERIFIED_TAG,
  verifiedLine,
  verifiedTagDetail,
  verifiedToast,
} from '../../domain/review.ts'
import { now } from '../../domain/time.ts'
import type { Mailer } from '../../mail/mailer.server.ts'
import { requireEditor } from '../../middleware/auth.server.ts'
import { flashToast, Toasts } from '../../middleware/toasts.server.ts'
import { routes } from '../../routes.ts'
import type { ToastMessage } from '../../ui/toast/component.tsx'
import { driveView } from '../issues/render.tsx'
import { retryAnswer, sendAnswer, type SendAnswerOutcome } from './answer.server.ts'
import {
  answerFormOf,
  answersListOf,
  type AnswerViewInput,
  type ComposeFlash,
  composeFlashOf,
  takenFormOf,
} from './answer-view.ts'
import type { QueueCardView } from './queue-card.tsx'
import { ReviewPage, type UnsentAnswer } from './review-page.tsx'

export type ReviewDependencies = {
  answers: AnswerStore
  articles: ArticleStore
  artworks: ArtworkStore
  mailer: Mailer
  mailLog: PublicMailLog
  mailPerDay: number
  runs: JobRunStore
}

/*
 * The card just decided or answered, kept for one load so it stays where it was and the queue
 * does not move under the hand (`13b`, `13e`). By the card's anchor, which says the kind, and
 * taken once.
 */
const SETTLED_SESSION_KEY = 'reviewSettled'

/* The answer's form coming back from a send that did not go, once (`13e`). */
const COMPOSE_SESSION_KEY = 'reviewCompose'

/*
 * An answer whose card left the queue meanwhile, with the text the editor typed, shown once above
 * the queue: nothing stores the text (`gjovqe1p`).
 */
const UNSENT_SESSION_KEY = 'reviewUnsent'

function takeSettled(session: Session | undefined): string | null {
  let value = session?.get(SETTLED_SESSION_KEY)
  if (value === undefined) return null
  session?.unset(SETTLED_SESSION_KEY)
  if (typeof value === 'number') return String(value)
  return typeof value === 'string' ? value : null
}

function takeCompose(session: Session | undefined): ComposeFlash | null {
  let value = session?.get(COMPOSE_SESSION_KEY)
  if (value === undefined) return null
  session?.unset(COMPOSE_SESSION_KEY)
  return composeFlashOf(value)
}

function takeUnsent(session: Session | undefined): UnsentAnswer | null {
  let value = session?.get(UNSENT_SESSION_KEY)
  if (value === undefined) return null
  session?.unset(UNSENT_SESSION_KEY)
  if (typeof value !== 'object' || value === null) return null
  let { line, note, text, title, tone } = value as Record<string, unknown>
  if (
    typeof line !== 'string' ||
    typeof note !== 'string' ||
    typeof text !== 'string' ||
    typeof title !== 'string' ||
    (tone !== 'error' && tone !== 'info' && tone !== 'success')
  ) {
    return null
  }
  return { line, note, text, title, tone }
}

/** A batch's card is its number, an article's clause `clause-{number}`. */
function clauseAnchor(id: number): string {
  return `clause-${id}`
}

function anchorOf(target: AnswerTarget): string {
  return target.kind === 'articles' ? clauseAnchor(target.id) : String(target.id)
}

/** The ID of the batch or the clause a settled anchor names, of that kind only. */
function settledIdOf(anchor: string | null, kind: 'batch' | 'clause'): number | undefined {
  if (anchor === null) return undefined
  let match = kind === 'clause' ? /^clause-(\d+)$/.exec(anchor) : /^(\d+)$/.exec(anchor)
  return match?.[1] === undefined ? undefined : Number(match[1])
}

/**
 * The queue under its filter (`13a`), at the card when one is named, so a page drawn without
 * script does not jump to the top. _Vše_ is the bare address, as `?artworks=` omits it.
 * `reply` opens the answer on that card (`13d`).
 */
function reviewHref(
  kind: ReviewKind,
  options: { anchor?: string | null; reply?: string; whole?: string } = {},
): string {
  let query = new URLSearchParams()
  if (options.whole !== undefined) query.set('whole', options.whole)
  if (kind !== 'all') query.set('kind', kind)
  if (options.reply !== undefined) query.set('reply', options.reply)
  let search = query.size === 0 ? '' : `?${query}`
  let hash =
    options.anchor === undefined || options.anchor === null ? '' : `#reply-${options.anchor}`
  return `${routes.review.index.href()}${search}${hash}`
}

/** An action on a card, carrying the filter so its redirect comes back under it. */
function withKind(href: string, kind: ReviewKind): string {
  return kind === 'all' ? href : `${href}?kind=${kind}`
}

function kindOf(context: { url: URL }): ReviewKind {
  return reviewKindOf(context.url.searchParams.get('kind'))
}

/** The time a card orders by: when the reply arrived, or when its archive failed. */
function cardTime(item: {
  archiveFailedAt: Temporal.Instant | null
  replyReceivedAt: Temporal.Instant | null
}): Temporal.Instant {
  return item.replyReceivedAt ?? item.archiveFailedAt ?? Temporal.Instant.fromEpochMilliseconds(0)
}

/** The issue's detail with its artworks filtered to _Ke kontrole_ (`12a`). */
function artworksHref(batch: QueuedBatch): string {
  return `${routes.issues.show.href({ name: batch.issueName })}?artworks=review`
}

/** What every card needs to draw its answer. */
type AnswerContext = {
  answers: readonly AnswerRow[]
  flash: ComposeFlash | null
  requested: string | null
  signatureName: string | null
}

type CardOptions = {
  answer: AnswerContext
  health: JobHealth
  isSettled: boolean
  isWhole: boolean
  kind: ReviewKind
  today: Temporal.Instant
}

function answerInput(
  target: AnswerTarget,
  card: { email: string; issueName: string; messageId: string | null },
  options: CardOptions,
): AnswerViewInput | null {
  if (card.messageId === null) return null
  let anchor = anchorOf(target)
  let ids = { id: String(target.id) }
  let isArticle = target.kind === 'articles'
  let flash = options.answer.flash?.anchor === anchor ? options.answer.flash : null
  return {
    actions: {
      retry: withKind(
        (isArticle ? routes.review.clauseReplyRetry : routes.review.replyRetry).href(ids),
        options.kind,
      ),
      send: withKind(
        (isArticle ? routes.review.clauseReply : routes.review.reply).href(ids),
        options.kind,
      ),
    },
    anchor,
    answers: options.answer.answers,
    closeHref: reviewHref(options.kind, { anchor }),
    email: card.email,
    flash,
    isRequested: options.answer.requested === anchor,
    issueName: card.issueName,
    kind: target.kind,
    messageId: card.messageId,
    openHref: reviewHref(options.kind, { anchor, reply: anchor }),
    signatureName: options.answer.signatureName,
    today: options.today,
  }
}

function cardOf(batch: QueuedBatch, options: CardOptions): QueueCardView {
  let { health, kind, today } = options
  let base = {
    answer: null,
    answers: null,
    id: String(batch.id),
    kind: kindLine(batch.artworks.length, batch.issueName),
    title: batch.articleName,
  }
  let ids = { id: String(batch.id) }
  let target: AnswerTarget = { id: batch.id, kind: 'artworks' }
  let input = answerInput(
    target,
    { email: batch.providerEmail, issueName: batch.issueName, messageId: batch.replyMessageId },
    options,
  )

  /* The card just answered: the provider is on the move, the answer shows what went (`13e`), and
     an answer that did not go because another one did stands in the form to be copied. */
  if (options.isSettled && batch.answeredAt !== null && input !== null) {
    return {
      ...base,
      answer: input.flash?.refusal === 'taken' ? takenFormOf(input) : null,
      answers: answersListOf(options.answer.answers, {
        isJustAnswered: true,
        messageId: input.messageId,
        today,
      }),
      callout: null,
      consentAction: null,
      consentReplyId: null,
      isSettled: true,
      jobsHref: null,
      menu: null,
      meta: receivedLine(
        batch.providerName,
        batch.providerEmail,
        batch.replyReceivedAt ?? today,
        today,
      ),
      quote: { isClamped: false, moreHref: null, text: batch.replyText ?? '' },
      tag: {
        detail: batchStateDetail(batch),
        label: ARTWORK_STATE_LABELS.provider,
        tone: 'running',
      },
      titleHref: null,
      undoAction: null,
    }
  }

  /* The card just decided, while the decision can still be taken back: an archive that failed in
     between draws the card of `13c` instead. */
  if (options.isSettled && batch.consentVerifiedAt !== null && batch.archiveFailedAt === null) {
    return {
      ...base,
      callout: null,
      consentAction: null,
      consentReplyId: null,
      isSettled: true,
      jobsHref: null,
      menu: null,
      meta: settledLine(batch.providerName, replyExcerpt(batch.replyText ?? '')),
      quote: null,
      tag: { detail: verifiedTagDetail(health), label: VERIFIED_TAG, tone: 'running' },
      titleHref: null,
      undoAction: withKind(routes.review.undo.href(ids), kind),
    }
  }

  if (batch.archiveFailedAt !== null) {
    let isStopped = health.kind === 'stopped'
    return {
      ...base,
      callout: {
        text: archiveFailedText(health),
        title: isStopped ? ARCHIVE_STOPPED_TITLE : null,
        tone: 'error',
      },
      consentAction: null,
      consentReplyId: null,
      isSettled: false,
      jobsHref: routes.settings.jobs.index.href(),
      menu: null,
      meta:
        batch.consentVerifiedAt === null
          ? receivedLine(
              batch.providerName,
              batch.providerEmail,
              batch.replyReceivedAt ?? batch.archiveFailedAt,
              today,
            )
          : verifiedLine(batch.providerName, batch.consentVerifiedAt, today),
      quote: null,
      tag: { detail: batchStateDetail(batch), label: ARCHIVE_FAILED_TAG, tone: 'problem' },
      titleHref: null,
      undoAction: null,
    }
  }

  let text = batch.replyText ?? ''
  let isClamped = !options.isWhole && isLongReply(text)
  let isDiscarded = batch.discardedAt !== null
  let answer = input === null ? null : answerFormOf(input)
  return {
    ...base,
    answer,
    answers:
      input === null
        ? null
        : answersListOf(options.answer.answers, {
            isJustAnswered: false,
            messageId: input.messageId,
            today,
          }),
    callout:
      batch.discardedAt === null
        ? null
        : { text: discardedBatchText(batch.discardedAt, today), title: null, tone: 'info' },
    consentAction: withKind(routes.review.verify.href(ids), kind),
    consentReplyId: batch.replyMessageId,
    isSettled: false,
    jobsHref: null,
    /* A discarded batch has nothing to show in the issue and no request to send again. */
    menu: isDiscarded
      ? null
      : {
          items: [{ href: artworksHref(batch), isSameTab: true, label: SHOW_ARTWORKS_LABEL }],
          label: replyMenuLabel(batch.providerName),
        },
    meta: receivedLine(
      batch.providerName,
      batch.providerEmail,
      batch.replyReceivedAt ?? today,
      today,
    ),
    quote: {
      isClamped,
      moreHref: isClamped
        ? reviewHref(kind, { anchor: String(batch.id), whole: String(batch.id) })
        : null,
      text,
    },
    tag: {
      detail: isDiscarded ? batchStateDetail(batch) : undefined,
      label: 'Ke kontrole',
      tone: 'waiting',
    },
    titleHref: isDiscarded ? null : artworksHref(batch),
    undoAction: null,
  }
}

/**
 * An author's clause as its card (`13a`–`13c`): the article's final version, the author and the
 * reply. Unlike a batch it has no „⋯“: `13a` draws none for an article, whose clauses the issue's
 * detail shows (`12b`), and the title leads there.
 */
function clauseCardOf(clause: QueuedClause, options: CardOptions): QueueCardView {
  let { health, kind, today } = options
  let anchor = clauseAnchor(clause.id)
  let ids = { id: String(clause.id) }
  let base = {
    answer: null,
    answers: null,
    id: anchor,
    kind: articleKindLine(clause.issueName),
    menu: null,
    title: clause.articleName,
  }
  let input = answerInput(
    { id: clause.id, kind: 'articles' },
    { email: clause.authorEmail, issueName: clause.issueName, messageId: clause.replyMessageId },
    options,
  )

  /* The card just answered, as for a batch; the author's row in `12b` says the same (`0kwr8vpl`). */
  if (options.isSettled && clause.answeredAt !== null && input !== null) {
    return {
      ...base,
      answer: input.flash?.refusal === 'taken' ? takenFormOf(input) : null,
      answers: answersListOf(options.answer.answers, {
        isJustAnswered: true,
        messageId: input.messageId,
        today,
      }),
      callout: null,
      consentAction: null,
      consentReplyId: null,
      isSettled: true,
      jobsHref: null,
      meta: receivedLine(
        clause.authorName,
        clause.authorEmail,
        clause.replyReceivedAt ?? today,
        today,
      ),
      quote: { isClamped: false, moreHref: null, text: clause.replyText ?? '' },
      tag: {
        detail: answeredLine(clause.answeredAt),
        label: WAITING_CLAUSE_LABEL,
        tone: 'running',
      },
      titleHref: null,
      undoAction: null,
    }
  }

  if (options.isSettled && clause.consentVerifiedAt !== null && clause.archiveFailedAt === null) {
    return {
      ...base,
      callout: null,
      consentAction: null,
      consentReplyId: null,
      isSettled: true,
      jobsHref: null,
      meta: settledLine(clause.authorName, replyExcerpt(clause.replyText ?? '')),
      quote: null,
      tag: { detail: verifiedTagDetail(health), label: VERIFIED_TAG, tone: 'running' },
      titleHref: null,
      undoAction: withKind(routes.review.clauseUndo.href(ids), kind),
    }
  }

  if (clause.archiveFailedAt !== null) {
    return {
      ...base,
      callout: {
        text: archiveFailedText(health),
        title: health.kind === 'stopped' ? ARTICLE_ARCHIVE_STOPPED_TITLE : null,
        tone: 'error',
      },
      consentAction: null,
      consentReplyId: null,
      isSettled: false,
      jobsHref: routes.settings.jobs.index.href(),
      meta:
        clause.consentVerifiedAt === null
          ? receivedLine(
              clause.authorName,
              clause.authorEmail,
              clause.replyReceivedAt ?? clause.archiveFailedAt,
              today,
            )
          : verifiedLine(clause.authorName, clause.consentVerifiedAt, today),
      quote: null,
      tag: { detail: 'konverzace se neuložila', label: ARCHIVE_FAILED_TAG, tone: 'problem' },
      titleHref: null,
      undoAction: null,
    }
  }

  let text = clause.replyText ?? ''
  let isClamped = !options.isWhole && isLongReply(text)
  return {
    ...base,
    answer: input === null ? null : answerFormOf(input),
    answers:
      input === null
        ? null
        : answersListOf(options.answer.answers, {
            isJustAnswered: false,
            messageId: input.messageId,
            today,
          }),
    callout: null,
    consentAction: withKind(routes.review.clauseVerify.href(ids), kind),
    consentReplyId: clause.replyMessageId,
    isSettled: false,
    jobsHref: null,
    meta: receivedLine(
      clause.authorName,
      clause.authorEmail,
      clause.replyReceivedAt ?? today,
      today,
    ),
    quote: {
      isClamped,
      moreHref: isClamped ? reviewHref(kind, { anchor, whole: anchor }) : null,
      text,
    },
    tag: { label: 'Ke kontrole', tone: 'waiting' },
    titleHref: routes.issues.show.href({ name: clause.issueName }),
    undoAction: null,
  }
}

/**
 * `/review`, _Ke kontrole_ (`13a`–`13h`): every reply a reply check did not take for a consent,
 * of artworks and of articles' final versions, from every issue that is not closed, the oldest
 * first, and every consent whose archive failed. _Je to souhlas_ records the decision at once and
 * the job archives it on its next run; _Vrátit_ takes it back until then. _Odpovědět_ writes back
 * to the provider or the author inside the thread of the request (`13d`). Each step answers back
 * at the card, so the queue does not move (`13b`, `13e`). Each kind's card speaks of its own job.
 */
export default function createReviewController(
  signedInUntil: SignedInUntilCookie,
  dependencies: ReviewDependencies,
) {
  let answering = { ...dependencies, now }

  async function healthOf(job: string): Promise<JobHealth> {
    return jobHealth(await dependencies.runs.latest(job), now())
  }

  /**
   * A step on the card of a version a newer one replaced writes nothing and stays in the queue,
   * where the editor-in-chief was, with which version stands now (`12s`, `13a`).
   */
  async function flashIfReplaced(
    context: Parameters<typeof flashToast>[0],
    clauseId: number,
  ): Promise<boolean> {
    let standing = await dependencies.articles.replacingVersionOf(clauseId)
    if (standing === null) return false
    let toast = alreadyReplacedToast(standing, now())
    flashToast(context, toast.message, 'neutral', undefined, toast.detail)
    return true
  }

  /**
   * Where an answer came back to, by what came of it (`13e`). Every outcome but a sent one leaves
   * the text where the editor can still use it: in the form when the card is still in the queue,
   * above the queue once it left (`gjovqe1p`).
   */
  async function afterAnswer(
    context: Parameters<typeof flashToast>[0] & { get(key: typeof Session): Session | undefined },
    target: AnswerTarget,
    outcome: SendAnswerOutcome,
    typed: string,
    kind: ReviewKind,
  ): Promise<Response> {
    let session = context.get(Session)
    let anchor = anchorOf(target)
    let back = reviewHref(kind, { anchor })
    let reopen = reviewHref(kind, { anchor, reply: anchor })
    let compose = (flash: Omit<ComposeFlash, 'anchor'>) =>
      session?.flash(COMPOSE_SESSION_KEY, { anchor, ...flash })

    switch (outcome.kind) {
      case 'sent':
        session?.flash(SETTLED_SESSION_KEY, anchor)
        flashToast(context, answerSentToast(outcome.recipient.email))
        return redirect(back, 303)
      case 'invalid':
        compose({ error: outcome.error, text: typed })
        return redirect(reopen, 303)
      case 'daily-cap':
      case 'newer-reply':
        compose({ refusal: outcome.kind, text: typed })
        return redirect(reopen, 303)
      case 'taken':
        session?.flash(SETTLED_SESSION_KEY, anchor)
        compose({ refusal: 'taken', text: typed })
        return redirect(back, 303)
      /* The answer on record holds the text and says what came of it. An answer on record that
         is not this editor's, another's attempt or one still on its way, would hide what this
         one typed, so that text comes back above the queue to be copied. */
      case 'locked':
      case 'refused':
      case 'unconfirmed':
        if (typed.trim() !== '' && typed.trim() !== outcome.answer.text) {
          session?.flash(UNSENT_SESSION_KEY, {
            line: unsentAnswerLine(outcome.recipient.name, outcome.recipient.email),
            note: UNSENT_ANSWER_NOTE,
            text: typed,
            title: UNSENT_ANSWER_TITLE,
            tone: 'info',
          } satisfies UnsentAnswer)
        }
        compose({})
        return redirect(reopen, 303)
      case 'approved':
      case 'closed':
      case 'gone': {
        let recipient = outcome.recipient
        let isReplaced =
          outcome.kind === 'gone' &&
          target.kind === 'articles' &&
          (await flashIfReplaced(context, target.id))
        let callout =
          outcome.kind === 'gone'
            ? null
            : answerCallout(outcome.kind, {
                email: recipient?.email ?? '',
                issueName: recipient?.issueName ?? '',
                kind: target.kind,
              })
        if (typed.trim() !== '') {
          let unsent: UnsentAnswer = {
            line: recipient === null ? '' : unsentAnswerLine(recipient.name, recipient.email),
            note: UNSENT_ANSWER_NOTE,
            text: typed,
            title: callout === null ? UNSENT_ANSWER_TITLE : `${callout.title} ${callout.text}`,
            tone:
              isReplaced || callout === null
                ? 'info'
                : callout.tone === 'success'
                  ? 'success'
                  : 'error',
          }
          session?.flash(UNSENT_SESSION_KEY, unsent)
        }
        return redirect(back, 303)
      }
    }
  }

  async function answer(
    context: Parameters<typeof afterAnswer>[0] & {
      auth: { identity: { displayName: string; email: string } }
      get(key: typeof FormData): unknown
      params: { id?: string }
      url: URL
    },
    answerKind: AnswerKind,
    isRetry: boolean,
  ): Promise<Response> {
    let kind = kindOf(context)
    let id = Number(context.params.id)
    if (!Number.isSafeInteger(id)) return redirect(reviewHref(kind), 303)
    let target: AnswerTarget = { id, kind: answerKind }
    let form = context.get(FormData) as FormData
    let field = (name: string) => {
      let value = form.get(name)
      return typeof value === 'string' ? value : ''
    }
    let typed = field('text')
    let outcome = isRetry
      ? await retryAnswer(answering, target, Number(field('answer')))
      : await sendAnswer(answering, target, {
          editor: context.auth.identity,
          messageId: field('reply'),
          text: typed,
        })
    return afterAnswer(context, target, outcome, typed, kind)
  }

  return createController(routes.review, {
    middleware: [requireEditor(signedInUntil)],
    actions: {
      async index(context) {
        let session = context.get(Session)
        let settled = takeSettled(session)
        let flash = takeCompose(session)
        let unsent = takeUnsent(session)
        let kind = kindOf(context)
        let whole = context.url.searchParams.get('whole')
        let requested = context.url.searchParams.get('reply')
        let [batches, clauses, artworksRun, articlesRun, driveAccount] = await Promise.all([
          dependencies.artworks.reviewQueue(settledIdOf(settled, 'batch')),
          dependencies.articles.reviewQueue(settledIdOf(settled, 'clause')),
          dependencies.runs.latest(REPLY_CHECK_JOB),
          dependencies.runs.latest(APPROVAL_SEND_JOB),
          driveView(context),
        ])
        /* The cards ask whether a job still runs; the header, how its last read ended (`13i`). */
        let at = now()
        let artworksHealth = jobHealth(artworksRun, at)
        let articlesHealth = jobHealth(articlesRun, at)
        let [batchAnswers, clauseAnswers] = await Promise.all([
          dependencies.answers.answersOf(
            'artworks',
            batches.map((batch) => batch.id),
          ),
          dependencies.answers.answersOf(
            'articles',
            clauses.map((clause) => clause.id),
          ),
        ])
        let signatureName = signatureOf(context.auth.identity)
        let answerOf = (answers: readonly AnswerRow[] | undefined): AnswerContext => ({
          answers: answers ?? [],
          flash,
          requested,
          signatureName,
        })
        let today = now()
        let items = [
          ...batches.map((batch) => {
            let isSettled = String(batch.id) === settled
            return {
              at: cardTime(batch),
              card: cardOf(batch, {
                answer: answerOf(batchAnswers.get(batch.id)),
                health: artworksHealth,
                isSettled,
                isWhole: String(batch.id) === whole,
                kind,
                today,
              }),
              isSettled,
              kind: 'artworks' as const,
            }
          }),
          ...clauses.map((clause) => {
            let isSettled = clauseAnchor(clause.id) === settled
            return {
              at: cardTime(clause),
              card: clauseCardOf(clause, {
                answer: answerOf(clauseAnswers.get(clause.id)),
                health: articlesHealth,
                isSettled,
                isWhole: clauseAnchor(clause.id) === whole,
                kind,
                today,
              }),
              isSettled,
              kind: 'articles' as const,
            }
          }),
        ]
        /* Stable, so each kind keeps its own order where two replies came at the same moment. */
        items.sort((a, b) => Temporal.Instant.compare(a.at, b.at))
        /* The card just decided or answered stays where it was but no longer waits, so it counts
           nowhere, as in the panel (`13b`, `13e`). */
        let waiting = items.filter((item) => !item.isSettled)
        let counts: Record<ReviewKind, number> = {
          all: waiting.length,
          articles: waiting.filter((item) => item.kind === 'articles').length,
          artworks: waiting.filter((item) => item.kind === 'artworks').length,
        }
        let shown = kind === 'all' ? items : items.filter((item) => item.kind === kind)
        return context.render(
          <ReviewPage
            cards={shown.map((item) => item.card)}
            counts={counts}
            hasCards={items.length > 0}
            hrefOf={(value) => reviewHref(value)}
            kind={kind}
            driveAccount={driveAccount}
            person={context.auth.identity}
            readLines={readLines(
              { articles: jobState(articlesRun, at), artworks: jobState(artworksRun, at) },
              kind,
              today,
            )}
            toasts={context.get(Toasts) as readonly ToastMessage[]}
            unsent={unsent}
          />,
        )
      },

      async verify(context) {
        let id = Number(context.params.id)
        let kind = kindOf(context)
        let reply = (context.get(FormData) as FormData).get('reply')
        let isRecorded =
          Number.isSafeInteger(id) &&
          typeof reply === 'string' &&
          (await dependencies.artworks.verifyConsent(id, reply, context.auth.identity, now()))
        if (isRecorded) {
          context.get(Session)?.flash(SETTLED_SESSION_KEY, String(id))
          flashToast(context, verifiedToast(await healthOf(REPLY_CHECK_JOB)), 'neutral', {
            action: withKind(routes.review.undo.href({ id: String(id) }), kind),
            label: UNDO_LABEL,
          })
        }
        return redirect(
          reviewHref(kind, { anchor: Number.isSafeInteger(id) ? String(id) : null }),
          303,
        )
      },

      async undo(context) {
        let id = Number(context.params.id)
        if (Number.isSafeInteger(id)) await dependencies.artworks.undoVerification(id)
        return redirect(
          reviewHref(kindOf(context), { anchor: Number.isSafeInteger(id) ? String(id) : null }),
          303,
        )
      },

      reply(context) {
        return answer(context, 'artworks', false)
      },

      replyRetry(context) {
        return answer(context, 'artworks', true)
      },

      async clauseVerify(context) {
        let id = Number(context.params.id)
        let kind = kindOf(context)
        let reply = (context.get(FormData) as FormData).get('reply')
        let isRecorded =
          Number.isSafeInteger(id) &&
          typeof reply === 'string' &&
          (await dependencies.articles.verifyClause(id, reply, context.auth.identity, now()))
        if (isRecorded) {
          context.get(Session)?.flash(SETTLED_SESSION_KEY, clauseAnchor(id))
          flashToast(context, verifiedToast(await healthOf(APPROVAL_SEND_JOB)), 'neutral', {
            action: withKind(routes.review.clauseUndo.href({ id: String(id) }), kind),
            label: UNDO_LABEL,
          })
        } else if (Number.isSafeInteger(id)) {
          await flashIfReplaced(context, id)
        }
        return redirect(
          reviewHref(kind, { anchor: Number.isSafeInteger(id) ? clauseAnchor(id) : null }),
          303,
        )
      },

      async clauseUndo(context) {
        let id = Number(context.params.id)
        if (Number.isSafeInteger(id) && !(await dependencies.articles.undoClauseVerification(id))) {
          await flashIfReplaced(context, id)
        }
        return redirect(
          reviewHref(kindOf(context), {
            anchor: Number.isSafeInteger(id) ? clauseAnchor(id) : null,
          }),
          303,
        )
      },

      clauseReply(context) {
        return answer(context, 'articles', false)
      },

      clauseReplyRetry(context) {
        return answer(context, 'articles', true)
      },
    },
  })
}
