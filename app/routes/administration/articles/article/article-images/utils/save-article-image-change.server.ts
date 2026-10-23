import type { Prisma } from '@generated/prisma/client'
import { data } from 'react-router'

import { recordEditLog } from '~/utils/content-log/record-edit-log.server'
import { prisma } from '~/utils/db.server'
import { buildHeldByTabWhere } from '~/utils/edit-hold/build-held-by-tab-where'
import type { EditHoldColumns } from '~/utils/edit-hold/edit-hold-columns'
import { getEditHoldStatus } from '~/utils/edit-hold/get-edit-hold-status'
import { isRecordNotFoundError } from '~/utils/edit-hold/is-record-not-found-error.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'

/** What an image operation reads of the stored article. */
export type ImageChangeArticle = {
  featuredImageId: string | null
  slug: string | null
}

/** One image operation, ready to commit with the hold check. */
export type PreparedImageChange<Answer extends object> = {
  writes: Prisma.PrismaPromise<unknown>[]
  /** Set on the article in the same conditional write, e.g. the main image. */
  articleData?: Prisma.ArticleUncheckedUpdateInput
  /** The change adds an image: the empty draft's first content (0020). */
  addsContent?: boolean
  /** Runs once the writes committed: drops files the change made obsolete. */
  onCommitted?: () => Promise<void>
  /** Runs when the writes did not commit: drops files the change stored. */
  onRefused?: () => Promise<void>
  /**
   * Runs when a cancellable change was cancelled after its writes committed,
   * before `onCommitted`: puts back what the change replaced (bxy8xxqs).
   */
  onCancelled?: () => Promise<void>
  /** Added to the `saved` answer. */
  answer: Answer
}

/**
 * The file could not be processed; nothing was stored (24b). An image over
 * the pixel budget says so, for the tile's sentence (4al3quzt).
 */
export type ImageChangeFailure = {
  status: 'failed'
  reason?: 'over-pixel-budget'
}

/** How an image operation ended, as the editor's gallery reads it. */
export type ImageChangeResult<Answer extends object> =
  | ({ status: 'saved'; updatedAt: Date } & Answer)
  /** The tab does not hold the article; `heldByName` is who does, if anyone. */
  | { status: 'not-held'; heldByName: string | null }
  | ImageChangeFailure
  /** The editor cancelled the upload; nothing stays stored (bxy8xxqs). */
  | { status: 'cancelled' }

type Options<Answer extends object> = {
  articleId: string
  /** The editor's tab, which must hold the edit hold (log 0019). */
  tabId: string
  /**
   * An upload already on its way still lands when the hold was released
   * meanwhile (it expired, or the leave went without the cancel), never over
   * someone else's.
   */
  landsWithoutHold?: boolean
  /**
   * An upload the editor can cancel until it saves (bxy8xxqs): the aborted
   * request is checked before the files are stored, right before the commit,
   * and once more after it, where `onCancelled` puts things back.
   */
  isCancellable?: boolean
  prepare: (
    context: AuthorPermissionContext,
    article: ImageChangeArticle,
  ) => Promise<PreparedImageChange<Answer> | ImageChangeFailure>
}

type StoredHold = EditHoldColumns & {
  heldByAuthor: { name: string } | null
  state: string
  submittedAt: Date | null
}

// The hold, and what an upload landing without it checks besides.
const HOLD_SELECT = {
  heldByAuthor: { select: { name: true } },
  heldByAuthorId: true,
  heldByTabId: true,
  heldSince: true,
  heldUntil: true,
  state: true,
  submittedAt: true,
} as const

/**
 * Saves one change of the article's gallery on its own (design 24b, decision
 * 0027): an upload, a removal, the main image or the order. The permission is
 * checked against the stored authors and state, and only the tab holding the
 * edit hold saves, checked again in the change's own conditional write
 * (log 0019), which also moves the article's `updatedAt`. The history gets
 * the creation or one *Upraveno* per hold (07f). The caller has checked the
 * session (`requireCSRF`).
 *
 * @param request - The action's request.
 * @param options - The article, the editor's tab, whether the change lands
 *   without the hold, and `prepare`, which checks the input, stores any files
 *   and returns the writes.
 * @returns `saved` with the new `updatedAt` and the change's answer,
 *   `not-held` with the holder's name (nothing is written), `failed` for a
 *   file that could not be processed, or `cancelled` for a cancellable change
 *   whose request was aborted.
 * @throws A 404 response for a missing article, a 403 response for a denied
 *   edit or a locked submission, and whatever `prepare` throws.
 */
export async function saveArticleImageChange<Answer extends object>(
  request: Request,
  {
    articleId,
    tabId,
    landsWithoutHold = false,
    isCancellable = false,
    prepare,
  }: Options<Answer>,
): Promise<ImageChangeResult<Answer>> {
  const isCancelled = () => isCancellable && request.signal.aborted

  const storedArticle = await prisma.article.findUnique({
    select: {
      authors: { select: { id: true } },
      featuredImageId: true,
      firstContentAt: true,
      ...HOLD_SELECT,
      slug: true,
    },
    where: { id: articleId },
  })

  if (storedArticle === null) {
    throw data(null, { status: 404 })
  }

  return withAuthorPermission(request, {
    action: 'update',
    entity: 'article',
    execute: async (context): Promise<ImageChangeResult<Answer>> => {
      // A submitted article is locked for its authors (design 07d).
      if (
        isLockedBySubmission({
          roleLevel: context.roleLevel,
          submittedAt: storedArticle.submittedAt,
        })
      ) {
        throw data(null, { status: 403 })
      }

      const tab = { authorId: context.authorId, tabId }

      // Who holds it instead of this tab (another tab of one's own included).
      const toNotHeld = (
        hold: StoredHold | null,
      ): ImageChangeResult<Answer> => ({
        heldByName:
          hold === null ||
          getEditHoldStatus(hold, { ...tab, now: new Date() }) === 'free'
            ? null
            : (hold.heldByAuthor?.name ?? null),
        status: 'not-held',
      })

      // A text its authors submitted meanwhile stays theirs to edit only
      // after they take it back; the approver edits it anyway (07d).
      const isApprover = context.roleLevel <= APPROVER_ROLE_LEVEL
      const isHeldByTab = (hold: StoredHold | null) =>
        hold?.heldByAuthorId === tab.authorId && hold.heldByTabId === tab.tabId
      // Released while the upload was on its way: a draft nobody holds, not
      // submitted since. Leaving the draft clears the hold too (0021).
      const isFreeDraft = (hold: StoredHold | null) =>
        hold?.heldByTabId === null &&
        hold.state === 'draft' &&
        (isApprover || hold.submittedAt === null)
      const isAllowedHold = (hold: StoredHold | null) =>
        isHeldByTab(hold) || (landsWithoutHold && isFreeDraft(hold))

      // Checked before any file is stored, so a refused change stores
      // nothing; the change's own write checks it again.
      if (!isAllowedHold(storedArticle)) {
        return toNotHeld(storedArticle)
      }

      // Cancelled before any file is stored.
      if (isCancelled()) return { status: 'cancelled' }

      const prepared = await prepare(context, {
        featuredImageId: storedArticle.featuredImageId,
        slug: storedArticle.slug,
      })

      if ('status' in prepared) return prepared

      // Cancelled while the files were stored: they go, nothing commits.
      if (isCancelled()) {
        await prepared.onRefused?.()
        return { status: 'cancelled' }
      }

      const holdWhere = landsWithoutHold
        ? {
            OR: [
              buildHeldByTabWhere(tab),
              {
                heldByTabId: null,
                ...(isApprover ? {} : { submittedAt: null }),
              },
            ],
          }
        : buildHeldByTabWhere(tab)

      const articleWrite = prisma.article.update({
        data: { ...prepared.articleData, updatedAt: new Date() },
        select: { updatedAt: true },
        // Only the holding tab changes a draft (log 0019); otherwise
        // the whole transaction rolls back.
        where: { id: articleId, state: 'draft', ...holdWhere },
      })

      const firstContentWrite = prepared.addsContent
        ? [
            // Conditional, so of two first saves only one is the creation.
            prisma.article.updateMany({
              data: { firstContentAt: new Date() },
              where: { firstContentAt: null, id: articleId },
            }),
          ]
        : []

      // The article's `updatedAt` before this commit, read in it, for a
      // cancel to put back.
      const previousRead = isCancellable
        ? [
            prisma.article.findUniqueOrThrow({
              select: { updatedAt: true },
              where: { id: articleId },
            }),
          ]
        : []

      let results: unknown[]

      try {
        results = await prisma.$transaction([
          ...previousRead,
          ...firstContentWrite,
          ...prepared.writes,
          articleWrite,
        ])
      } catch (error) {
        await prepared.onRefused?.()

        if (!isRecordNotFoundError(error)) throw error

        const currentHold = await prisma.article.findUnique({
          select: HOLD_SELECT,
          where: { id: articleId },
        })

        // Still allowed: another row was missing (the image, say), not the
        // hold, so the change failed.
        if (isAllowedHold(currentHold)) throw error

        // The hold moved between the check and the write.
        return toNotHeld(currentHold)
      }

      const isCreation =
        firstContentWrite.length > 0 &&
        (results[previousRead.length] as Prisma.BatchPayload).count === 1

      const { updatedAt } = results.at(-1) as { updatedAt: Date }

      // Cancelled during the commit: put back what it replaced. Unless
      // another change saved since, the article is as it was: the editor's
      // `updatedAt` holds again, and the empty draft it would have filled
      // stays empty (0020).
      if (isCancelled() && prepared.onCancelled) {
        const { updatedAt: previousUpdatedAt } = results[0] as {
          updatedAt: Date
        }
        try {
          await prepared.onCancelled()
          await prisma.article.updateMany({
            data: {
              updatedAt: previousUpdatedAt,
              ...(isCreation ? { firstContentAt: null } : {}),
            },
            where: { id: articleId, updatedAt },
          })
        } catch (error) {
          console.error('Article image change left after a cancel', error)
        }
        return { status: 'cancelled' }
      }

      // The change is saved; files it left behind are only litter.
      try {
        await prepared.onCommitted?.()
      } catch (error) {
        console.error('Article image files left after a saved change', error)
      }

      // An empty draft's history starts with its first content (0020).
      if (isCreation || storedArticle.firstContentAt !== null) {
        await recordEditLog(context, {
          entity: 'article',
          entityId: articleId,
          heldSince: storedArticle.heldSince,
          isCreation,
        })
      }

      return { ...prepared.answer, status: 'saved', updatedAt }
    },
    target: {
      authorIds: storedArticle.authors.map((author) => author.id),
      state: storedArticle.state,
    },
  })
}
