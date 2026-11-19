import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'
import { Session } from 'remix/session'

import type { SignedInUntilCookie } from '../../auth/session.server.ts'
import type { ArtworkStore, QueuedBatch } from '../../data/artworks.server.ts'
import type { JobRunStore } from '../../data/job-runs.server.ts'
import { batchStateDetail, replyExcerpt } from '../../domain/artwork.ts'
import { type JobHealth, jobHealth } from '../../domain/job-run.ts'
import { REPLY_CHECK_JOB } from '../../domain/reply-check.ts'
import {
  ARCHIVE_FAILED_TAG,
  ARCHIVE_STOPPED_TITLE,
  archiveFailedText,
  discardedBatchText,
  isLongReply,
  kindLine,
  readLine,
  receivedLine,
  replyMenuLabel,
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
  artworks: ArtworkStore
  runs: JobRunStore
}

/*
 * The card just decided, kept for one load so it stays where it was and the queue does not move
 * under the hand (`13b`). By the batch's ID, and taken once.
 */
const SETTLED_SESSION_KEY = 'reviewSettled'

function takeSettled(session: Session | undefined): number | null {
  let value = session?.get(SETTLED_SESSION_KEY)
  if (value === undefined) return null
  session?.unset(SETTLED_SESSION_KEY)
  return typeof value === 'number' ? value : null
}

/** The queue at the card, so a page drawn without script does not jump to the top. */
function cardHref(id: number): string {
  return Number.isSafeInteger(id)
    ? `${routes.review.index.href()}#reply-${id}`
    : routes.review.index.href()
}

/** The issue's detail with its artworks filtered to _Ke kontrole_ (`12a`). */
function artworksHref(batch: QueuedBatch): string {
  return `${routes.issues.show.href({ name: batch.issueName })}?artworks=review`
}

function cardOf(
  batch: QueuedBatch,
  options: { health: JobHealth; isSettled: boolean; isWhole: boolean; today: Temporal.Instant },
): QueueCardView {
  let { health, today } = options
  let base = {
    id: batch.id,
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
      menu: null,
      meta: settledLine(batch.providerName, replyExcerpt(batch.replyText ?? '')),
      quote: null,
      tag: { detail: verifiedTagDetail(health), label: VERIFIED_TAG, tone: 'running' },
      titleHref: null,
      undoAction: routes.review.undo.href(ids),
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
    consentAction: routes.review.verify.href(ids),
    consentReplyId: batch.replyMessageId,
    isSettled: false,
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
        ? `${routes.review.index.href()}?whole=${batch.id}#reply-${batch.id}`
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
 * `/review`, _Ke kontrole_ (`13a`–`13c`): every reply the reply check did not take for a consent,
 * from every issue that is not closed, the oldest first, and every consent whose archive failed.
 * _Je to souhlas_ records the decision at once and the job archives it on its next run; _Vrátit_
 * takes it back until then. Both answer back at the card, so the queue does not move (`13b`).
 */
export default function createReviewController(
  signedInUntil: SignedInUntilCookie,
  dependencies: ReviewDependencies,
) {
  async function healthNow(): Promise<JobHealth> {
    return jobHealth(await dependencies.runs.latest(REPLY_CHECK_JOB), now())
  }

  return createController(routes.review, {
    middleware: [requireEditor(signedInUntil)],
    actions: {
      async index(context) {
        let settledId = takeSettled(context.get(Session))
        let whole = Number(context.url.searchParams.get('whole'))
        let [batches, health, driveAccount] = await Promise.all([
          dependencies.artworks.reviewQueue(settledId ?? undefined),
          healthNow(),
          driveView(context),
        ])
        let today = now()
        let cards = batches.map((batch) =>
          cardOf(batch, {
            health,
            isSettled: batch.id === settledId,
            isWhole: batch.id === whole,
            today,
          }),
        )
        return context.render(
          <ReviewPage
            cards={cards}
            driveAccount={driveAccount}
            person={context.auth.identity}
            readLine={readLine(health, today)}
            toasts={context.get(Toasts) as readonly ToastMessage[]}
          />,
        )
      },

      async verify(context) {
        let id = Number(context.params.id)
        let reply = (context.get(FormData) as FormData).get('reply')
        let isRecorded =
          Number.isSafeInteger(id) &&
          typeof reply === 'string' &&
          (await dependencies.artworks.verifyConsent(id, reply, context.auth.identity, now()))
        if (isRecorded) {
          context.get(Session)?.flash(SETTLED_SESSION_KEY, id)
          flashToast(context, verifiedToast(await healthNow()), 'neutral', {
            action: routes.review.undo.href({ id: String(id) }),
            label: UNDO_LABEL,
          })
        }
        return redirect(cardHref(id), 303)
      },

      async undo(context) {
        let id = Number(context.params.id)
        if (Number.isSafeInteger(id)) await dependencies.artworks.undoVerification(id)
        return redirect(cardHref(id), 303)
      },
    },
  })
}
