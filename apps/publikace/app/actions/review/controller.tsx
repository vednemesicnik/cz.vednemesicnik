import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'
import { Session } from 'remix/session'

import type { SignedInUntilCookie } from '../../auth/session.server.ts'
import type { ArticleStore, QueuedClause } from '../../data/articles.server.ts'
import type { ArtworkStore, QueuedBatch } from '../../data/artworks.server.ts'
import type { JobRunStore } from '../../data/job-runs.server.ts'
import { APPROVAL_SEND_JOB } from '../../domain/approvals.ts'
import { batchStateDetail, replyExcerpt } from '../../domain/artwork.ts'
import { alreadyReplacedToast } from '../../domain/final-version-replacement.ts'
import { type JobHealth, jobHealth } from '../../domain/job-run.ts'
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
  readLine,
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
import { requireEditor } from '../../middleware/auth.server.ts'
import { flashToast, Toasts } from '../../middleware/toasts.server.ts'
import { routes } from '../../routes.ts'
import type { ToastMessage } from '../../ui/toast/component.tsx'
import { driveView } from '../issues/render.tsx'
import type { QueueCardView } from './queue-card.tsx'
import { ReviewPage } from './review-page.tsx'

export type ReviewDependencies = {
  articles: ArticleStore
  artworks: ArtworkStore
  runs: JobRunStore
}

/*
 * The card just decided, kept for one load so it stays where it was and the queue does not move
 * under the hand (`13b`). By the card's anchor, which says the kind, and taken once.
 */
const SETTLED_SESSION_KEY = 'reviewSettled'

function takeSettled(session: Session | undefined): string | null {
  let value = session?.get(SETTLED_SESSION_KEY)
  if (value === undefined) return null
  session?.unset(SETTLED_SESSION_KEY)
  if (typeof value === 'number') return String(value)
  return typeof value === 'string' ? value : null
}

/** A batch's card is its number, an article's clause `clause-{number}`. */
function clauseAnchor(id: number): string {
  return `clause-${id}`
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
 */
function reviewHref(
  kind: ReviewKind,
  options: { anchor?: string | null; whole?: string } = {},
): string {
  let query = new URLSearchParams()
  if (options.whole !== undefined) query.set('whole', options.whole)
  if (kind !== 'all') query.set('kind', kind)
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

function cardOf(
  batch: QueuedBatch,
  options: {
    health: JobHealth
    isSettled: boolean
    isWhole: boolean
    kind: ReviewKind
    today: Temporal.Instant
  },
): QueueCardView {
  let { health, kind, today } = options
  let base = {
    id: String(batch.id),
    kind: kindLine(batch.artworks.length, batch.issueName),
    title: batch.articleName,
  }
  let ids = { id: String(batch.id) }

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
  return {
    ...base,
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
function clauseCardOf(
  clause: QueuedClause,
  options: {
    health: JobHealth
    isSettled: boolean
    isWhole: boolean
    kind: ReviewKind
    today: Temporal.Instant
  },
): QueueCardView {
  let { health, kind, today } = options
  let anchor = clauseAnchor(clause.id)
  let ids = { id: String(clause.id) }
  let base = {
    id: anchor,
    kind: articleKindLine(clause.issueName),
    menu: null,
    title: clause.articleName,
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
 * `/review`, _Ke kontrole_ (`13a`–`13c`): every reply a reply check did not take for a consent,
 * of artworks and of articles' final versions, from every issue that is not closed, the oldest
 * first, and every consent whose archive failed. _Je to souhlas_ records the decision at once and
 * the job archives it on its next run; _Vrátit_ takes it back until then. Both answer back at the
 * card, so the queue does not move (`13b`). Each kind's card speaks of its own job.
 */
export default function createReviewController(
  signedInUntil: SignedInUntilCookie,
  dependencies: ReviewDependencies,
) {
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
  ): Promise<void> {
    let standing = await dependencies.articles.replacingVersionOf(clauseId)
    if (standing === null) return
    let toast = alreadyReplacedToast(standing, now())
    flashToast(context, toast.message, 'neutral', undefined, toast.detail)
  }

  return createController(routes.review, {
    middleware: [requireEditor(signedInUntil)],
    actions: {
      async index(context) {
        let settled = takeSettled(context.get(Session))
        let kind = kindOf(context)
        let whole = context.url.searchParams.get('whole')
        let [batches, clauses, artworksHealth, articlesHealth, driveAccount] = await Promise.all([
          dependencies.artworks.reviewQueue(settledIdOf(settled, 'batch')),
          dependencies.articles.reviewQueue(settledIdOf(settled, 'clause')),
          healthOf(REPLY_CHECK_JOB),
          healthOf(APPROVAL_SEND_JOB),
          driveView(context),
        ])
        let today = now()
        let items = [
          ...batches.map((batch) => {
            let isSettled = String(batch.id) === settled
            return {
              at: cardTime(batch),
              card: cardOf(batch, {
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
        /* The card just decided stays where it was but no longer waits, so it counts nowhere, as
           in the panel (`13b`). */
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
            readLine={readLine({ articles: articlesHealth, artworks: artworksHealth }, today)}
            toasts={context.get(Toasts) as readonly ToastMessage[]}
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
    },
  })
}
