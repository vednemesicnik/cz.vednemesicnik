import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'
import { Session } from 'remix/session'

import type { SignedInUntilCookie } from '../../auth/session.server.ts'
import type { ProofreadingOutcome, QueueArticle } from '../../data/articles.server.ts'
import { articleStateTag, documentUrl } from '../../domain/article.ts'
import {
  authorsMeta,
  CANCEL_FAILED_TOAST,
  cancelledToast,
  cancelRefusalToast,
  cardActions,
  closedArticleCallout,
  EMPTY_TEXT_EDITOR,
  EMPTY_TEXT_PROOFREADER,
  issueKind,
  NO_LONGER_PROOFREADER_TOAST,
  NOTHING_WAITING,
  PART_ORDER,
  PART_TITLES,
  queueLead,
  type QueuePart,
  type QueueRefusal,
  queueParts,
  type QueueViewer,
  TAKE_FAILED_TOAST,
  TAKEN_TOAST,
  takeRefusalToast,
  writingNote,
} from '../../domain/proofreading-queue.ts'
import { UNDO_LABEL } from '../../domain/review.ts'
import { now, parseStamp, stamp } from '../../domain/time.ts'
import { Articles, type ArticlesContext } from '../../middleware/articles.server.ts'
import { type Person, requireProofreading } from '../../middleware/auth.server.ts'
import { flashToast, Toasts } from '../../middleware/toasts.server.ts'
import { routes } from '../../routes.ts'
import type { ToastMessage } from '../../ui/toast/component.tsx'
import { driveView, type PageContext } from '../issues/render.tsx'
import {
  type ProofreadingCardView,
  ProofreadingPage,
  type ProofreadingPartView,
} from './queue-page.tsx'

/*
 * The card just taken or cancelled, kept for one load in the part it was in, so the next card's
 * button does not move under the hand while a proofreader takes several in a row (`15d`, as
 * `13b`). By the article's ID, with that part and where its _Vrátit_ posts, and taken once.
 */
const SETTLED_SESSION_KEY = 'proofreadingSettled'

type SettledCard = { id: number; part: QueuePart; undo: string }

const PARTS = new Set<string>(PART_ORDER)

function flashSettled(
  context: { get(key: typeof Session): Session | undefined },
  card: SettledCard,
) {
  context.get(Session)?.flash(SETTLED_SESSION_KEY, card)
}

function takeSettled(session: Session | undefined): SettledCard | null {
  let value = session?.get(SETTLED_SESSION_KEY)
  if (value === undefined) return null
  session?.unset(SETTLED_SESSION_KEY)
  if (typeof value !== 'object' || value === null) return null
  let { id, part, undo } = value as Record<string, unknown>
  if (typeof id !== 'number' || typeof part !== 'string' || !PARTS.has(part)) return null
  if (typeof undo !== 'string') return null
  return { id, part: part as QueuePart, undo }
}

/** The page at the card, so a page drawn without script lands on it (`15d`, `15e`). */
function cardHref(id: number): string {
  return `${routes.proofreading.index.href()}#article-${id}`
}

function viewerOf(person: Person): QueueViewer {
  return { email: person.email, isEditor: person.isEditor, isProofreader: person.isProofreader }
}

function cancelHref(id: number, takenAt: Temporal.Instant, isUndo = false): string {
  let take = encodeURIComponent(stamp(takenAt))
  return `${routes.proofreading.cancel.href({ id: String(id) })}?take=${take}${isUndo ? '&undo=1' : ''}`
}

function restoreHref(id: number, cancelledAt: Temporal.Instant): string {
  let cancelled = encodeURIComponent(stamp(cancelledAt))
  return `${routes.proofreading.restore.href({ id: String(id) })}?cancelled=${cancelled}`
}

function cardOf(
  article: QueueArticle,
  viewer: QueueViewer,
  settled: SettledCard | null,
): ProofreadingCardView {
  let isSettled = settled?.id === article.id
  let { canCancel, canTake } = cardActions(article, viewer)
  let ids = { id: String(article.id) }
  let tag = articleStateTag(article)
  return {
    cancelAction:
      isSettled || !canCancel || article.proofreading === null
        ? null
        : cancelHref(article.id, article.proofreading.at),
    documentUrl: documentUrl(article.docId),
    id: article.id,
    isSettled,
    kind: issueKind(article.issueName),
    meta: authorsMeta(article.authors),
    tag,
    take:
      isSettled || !canTake
        ? null
        : {
            action: routes.proofreading.take.href(ids),
            isPrimary: article.handover !== null,
            shown: article.handover === null ? 'writing' : 'handedOver',
          },
    title: article.name,
    undoAction: isSettled ? (settled?.undo ?? null) : null,
  }
}

function partsOf(
  articles: readonly QueueArticle[],
  viewer: QueueViewer,
  settled: SettledCard | null,
): ProofreadingPartView[] {
  let parts = queueParts(articles, viewer, settled)
  return PART_ORDER.flatMap((part) => {
    let cards = parts[part].map((article) => cardOf(article, viewer, settled))
    if (cards.length === 0 && part !== 'waiting') return []
    let note =
      part === 'waiting'
        ? cards.length === 0
          ? NOTHING_WAITING
          : null
        : part === 'writing'
          ? writingNote(viewer.isProofreader)
          : null
    return [{ cards, note, title: PART_TITLES[part] }]
  })
}

/** What stood in the way, for the toast; `null` for an article that is gone. */
function refusalOf(
  outcome: Exclude<ProofreadingOutcome, { kind: 'done' }>,
  shown?: 'handedOver' | 'writing',
): QueueRefusal | null {
  switch (outcome.kind) {
    case 'closed':
      return { issueName: outcome.issueName, kind: 'closed' }
    case 'proofreading':
      return { kind: 'proofreading', step: outcome.step }
    case 'not-proofreading':
      return shown === 'handedOver' ? { kind: 'handover-cancelled' } : { kind: 'not-proofreading' }
    case 'gone':
      return null
  }
}

function notFound(): Response {
  return new Response('Not Found', { status: 404 })
}

function articlesOf(context: PageContext): ArticlesContext {
  return context.get(Articles) as ArticlesContext
}

/**
 * `/proofreading`, _Korektura_ (`15a`–`15e`): every article of every open issue, the steps a
 * proofreader takes on it, and the same page for the editors-in-chief with the steps of their
 * role. _Vzít si korekturu_ and _Zrušit korekturu_ act at once, with no dialog, because both can
 * be taken back and nothing is sent: the toast's _Vrátit_ stands where a confirmation would
 * (`15d`). Only a proofreader takes; a proofreader cancels their own take, an editor-in-chief
 * anyone's.
 */
export default function createProofreadingController(signedInUntil: SignedInUntilCookie) {
  return createController(routes.proofreading, {
    middleware: [requireProofreading(signedInUntil)],
    actions: {
      async index(context) {
        let person = context.auth.identity
        let viewer = viewerOf(person)
        let { articles } = articlesOf(context)
        let queue = await articles.listForQueue()

        /* A link from the digest carries `?article=`, which survives the way through Google's
           sign-in where an anchor would not (`15a`); the anchor is added here. */
        let linked = Number(context.url.searchParams.get('article'))
        let callout: { text: string; title: string } | null = null
        if (context.url.searchParams.has('article') && Number.isSafeInteger(linked)) {
          if (queue.some((article) => article.id === linked)) {
            return redirect(cardHref(linked), 303)
          }
          let found = await articles.findForQueue(linked)
          if (found?.isIssueClosed === true)
            callout = closedArticleCallout(found.name, found.issueName)
        }

        let settled = takeSettled(context.get(Session) as Session | undefined)
        let isEmpty = queue.length === 0
        return context.render(
          <ProofreadingPage
            callout={callout}
            driveAccount={await driveView(context)}
            empty={
              isEmpty
                ? {
                    hasAction: person.isEditor,
                    text: person.isProofreader ? EMPTY_TEXT_PROOFREADER : EMPTY_TEXT_EDITOR,
                  }
                : null
            }
            lead={queueLead(person.isProofreader)}
            parts={isEmpty ? [] : partsOf(queue, viewer, settled)}
            person={person}
            toasts={context.get(Toasts) as readonly ToastMessage[]}
          />,
        )
      },

      /*
       * _Vzít si korekturu_, recorded under the signed-in account. `shown` is the state the card
       * showed, so a take over a handover cancelled meanwhile writes nothing (`15d`).
       */
      async take(context) {
        let id = Number(context.params.id)
        if (!Number.isSafeInteger(id)) return notFound()
        let person = context.auth.identity
        let back = () => redirect(cardHref(id), 303)
        if (!person.isProofreader) {
          flashToast(context, NO_LONGER_PROOFREADER_TOAST)
          return back()
        }
        let shownValue = (context.get(FormData) as FormData).get('shown')
        let shown: 'handedOver' | 'writing' = shownValue === 'writing' ? 'writing' : 'handedOver'

        let outcome: ProofreadingOutcome
        try {
          outcome = await articlesOf(context).articles.takeProofreading(
            id,
            { email: person.email, name: person.displayName || null },
            now(),
            shown,
          )
        } catch {
          flashToast(context, TAKE_FAILED_TOAST, 'error')
          return back()
        }
        if (outcome.kind === 'done') {
          let undo = cancelHref(id, outcome.at, true)
          flashSettled(context, { id, part: shown === 'handedOver' ? 'waiting' : 'writing', undo })
          flashToast(context, TAKEN_TOAST, 'neutral', { action: undo, label: UNDO_LABEL })
          return back()
        }
        let refusal = refusalOf(outcome, shown)
        if (refusal === null) return notFound()
        let toast = takeRefusalToast(refusal)
        flashToast(context, toast.message, 'neutral', undefined, toast.detail)
        return back()
      },

      /*
       * _Zrušit korekturu_ of the take the card showed (`?take=`). The article returns to
       * _Dopsáno_ or to _Píše se_, and the toast's _Vrátit_ gives the take back whole. With
       * `&undo=1` it is the _Vrátit_ after a take, and answers with the card where it now stands.
       */
      async cancel(context) {
        let id = Number(context.params.id)
        let takenAt = parseStamp(context.url.searchParams.get('take'))
        if (!Number.isSafeInteger(id) || takenAt === null) return notFound()
        let person = context.auth.identity
        let isUndo = context.url.searchParams.get('undo') === '1'
        let back = () => redirect(cardHref(id), 303)
        let { articles } = articlesOf(context)

        let outcome: ProofreadingOutcome
        try {
          outcome = await articles.cancelProofreading(id, now(), {
            owner: person.isEditor ? undefined : person.email,
            proofreadAt: takenAt,
          })
        } catch {
          flashToast(context, CANCEL_FAILED_TOAST, 'error')
          return back()
        }
        if (outcome.kind === 'done') {
          if (isUndo) return back()
          /* The card stays in the part its take gave it: the viewer's own, or somebody else's. */
          let cancelled = (await articles.findById(id))?.cancelledProofreading ?? null
          let isOwn = person.isProofreader && cancelled?.email === person.email
          let undo = restoreHref(id, outcome.at)
          flashSettled(context, { id, part: isOwn ? 'mine' : 'others', undo })
          flashToast(context, cancelledToast(outcome.isHandedOver), 'neutral', {
            action: undo,
            label: UNDO_LABEL,
          })
          return back()
        }
        let refusal = refusalOf(outcome)
        if (refusal === null) return notFound()
        let toast = cancelRefusalToast(refusal)
        flashToast(context, toast.message, 'neutral', undefined, toast.detail)
        return back()
      },

      /*
       * The _Vrátit_ after a cancellation: the cancelled take stands again for whoever had it,
       * with its own time (`15d`), and the card stands where that puts it.
       */
      async restore(context) {
        let id = Number(context.params.id)
        let cancelledAt = parseStamp(context.url.searchParams.get('cancelled'))
        if (!Number.isSafeInteger(id) || cancelledAt === null) return notFound()
        let person = context.auth.identity
        let back = () => redirect(cardHref(id), 303)

        let outcome: ProofreadingOutcome
        try {
          outcome = await articlesOf(context).articles.restoreProofreading(id, cancelledAt, {
            owner: person.isEditor ? undefined : person.email,
          })
        } catch {
          flashToast(context, TAKE_FAILED_TOAST, 'error')
          return back()
        }
        if (outcome.kind === 'done') return back()
        let refusal = refusalOf(outcome)
        if (refusal === null) return notFound()
        let toast = takeRefusalToast(refusal)
        flashToast(context, toast.message, 'neutral', undefined, toast.detail)
        return back()
      },
    },
  })
}
