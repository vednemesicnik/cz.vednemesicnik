import type { Prisma } from '@generated/prisma/client'
import { data } from 'react-router'
import { canChooseRecordAuthor } from '~/routes/administration/articles/utils/can-choose-record-author'
import { findPublishedSlugConflict } from '~/routes/administration/articles/utils/find-published-slug-conflict.server'
import { ASSOCIATION_AUTHOR_WHERE } from '~/utils/association-author-where'
import { recordEditLog } from '~/utils/content-log/record-edit-log.server'
import { prisma } from '~/utils/db.server'
import { buildHeldByTabWhere } from '~/utils/edit-hold/build-held-by-tab-where'
import type { EditHoldColumns } from '~/utils/edit-hold/edit-hold-columns'
import { getEditHoldStatus } from '~/utils/edit-hold/get-edit-hold-status'
import { isRecordNotFoundError } from '~/utils/edit-hold/is-record-not-found-error.server'
import { mergeLinkedIds } from '~/utils/merge-linked-ids'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'

type Options = {
  articleId: string
  authorIds: string[]
  categoryIds?: string[]
  content: string
  perex?: string
  /**
   * The gallery's alt texts and captions; the images themselves save on their
   * own (log 0027).
   */
  images?: Array<{
    id: string
    altText: string
    description?: string
  }>
  /** Links the editor removed; any other stored one stays (log 0025). */
  removedCategoryIds?: string[]
  removedTagIds?: string[]
  slug: string
  tagIds?: string[]
  title: string
  /** The editor's tab, which must hold the edit hold (log 0019). */
  tabId: string
  /** The last save of a page going away also ends its hold. */
  releaseHold?: boolean
}

type UpdateArticleResult =
  /**
   * `takenSlug` is the saved address when another article holds it as
   * published, with `slugSuggestion` a free one to offer (design 24d, log
   * 0039); both `null` when it is free.
   */
  | {
      status: 'saved'
      updatedAt: Date
      takenSlug: string | null
      slugSuggestion: string | null
    }
  /** The tab does not hold the article; `heldByName` is who does, if anyone. */
  | { status: 'not-held'; heldByName: string | null }
  /** The article is gone: deleted meanwhile, or swept as an empty draft (0036). */
  | { status: 'deleted' }

type StoredHold = EditHoldColumns & {
  heldByAuthor: { name: string } | null
}

const RELEASED_HOLD = {
  heldByAuthorId: null,
  heldByTabId: null,
  heldSince: null,
  heldUntil: null,
}

/**
 * Saves the editor's whole article, as autosave sends it (design 24e, decision
 * 0022). The permission is checked against the stored authors and state, never
 * against the ones the form sends, and the new authors must be ones the editor
 * may set; only the Coordinator adds the association (log 0026). An edit
 * never changes the state. Only the tab holding the edit hold
 * saves, checked again in the save's own write (log 0019), and the save
 * keeps the hold unless `releaseHold` asks for the end. A draft saves
 * incomplete, and its address saves as typed even when another article holds
 * it as published; the answer says so (24d, log 0039). A category or a tag goes only when the editor sends it as removed,
 * so an archived one stays (log 0025). Of the gallery only the alt texts
 * and captions go with it; every image change saves on its own (decision
 * 0027). The history gets one *Upraveno* per hold (07f). The caller has
 * checked the session (`requireCSRF`).
 *
 * @param request - The action's request.
 * @param options - The article id, the editor's tab and the edited fields.
 * @returns `saved` with the new `updatedAt`, and a taken address with a free one,
 *   or `not-held` with the holder's name when another tab or someone else holds
 *   the article (nothing is written), or `deleted` when it is gone (0036).
 * @throws A 403 response for a denied edit, a locked submission or authors
 *   the editor may not set (the association included).
 */
export async function updateArticle(
  request: Request,
  {
    articleId,
    authorIds,
    categoryIds,
    content,
    perex,
    images = [],
    removedCategoryIds = [],
    removedTagIds = [],
    slug,
    tagIds,
    tabId,
    title,
    releaseHold = false,
  }: Options,
): Promise<UpdateArticleResult> {
  const storedArticle = await prisma.article.findUnique({
    select: {
      authors: { select: { id: true } },
      categories: { select: { id: true } },
      firstContentAt: true,
      heldByAuthor: { select: { name: true } },
      heldByAuthorId: true,
      heldByTabId: true,
      heldSince: true,
      heldUntil: true,
      state: true,
      submittedAt: true,
      tags: { select: { id: true } },
    },
    where: { id: articleId },
  })

  // Nothing is checked first, so it says no more than a 404 would (0036).
  if (storedArticle === null) return { status: 'deleted' }

  const { state } = storedArticle

  return withAuthorPermission(request, {
    action: 'update',
    entity: 'article',
    execute: async (context): Promise<UpdateArticleResult> => {
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
      const toNotHeld = (hold: StoredHold | null): UpdateArticleResult => ({
        heldByName:
          hold === null ||
          getEditHoldStatus(hold, { ...tab, now: new Date() }) === 'free'
            ? null
            : (hold.heldByAuthor?.name ?? null),
        status: 'not-held',
      })

      // Checked before anything is read for the save; the save's own write
      // checks it again.
      if (
        storedArticle.heldByAuthorId !== tab.authorId ||
        storedArticle.heldByTabId !== tab.tabId
      ) {
        return toNotHeld(storedArticle)
      }

      // Setting the authors needs the permission for the new ones too, so an
      // author who may only edit their own cannot leave themselves out (24j).
      checkAuthorPermission(context, {
        action: 'update',
        entity: 'article',
        state,
        targetAuthorIds: authorIds,
      })

      // Only the Coordinator adds the association; one already stored stays
      // on anyone's save (log 0026).
      const storedAuthorIds = storedArticle.authors.map(({ id }) => id)
      const addedAuthorIds = authorIds.filter(
        (id) => !storedAuthorIds.includes(id),
      )
      if (
        addedAuthorIds.length > 0 &&
        !canChooseRecordAuthor(context.roleLevel) &&
        (await prisma.author.count({
          where: { ...ASSOCIATION_AUTHOR_WHERE, id: { in: addedAuthorIds } },
        })) > 0
      ) {
        throw data(null, { status: 403 })
      }

      // 1. The gallery's images save on their own (log 0027); the form
      // carries only their alt texts and captions.
      const storedImageCount = await prisma.articleImage.count({
        where: { articleId },
      })

      // 2. The address saves as typed; whether another article holds it as
      // published is only reported (24d, log 0039).
      const savedSlug = slug === '' ? null : slug
      const slugConflict = await findPublishedSlugConflict({
        articleId,
        slug: savedSlug,
      })

      // 3. A save removes a category or a tag only when the editor sends it
      // as removed, so an archived one it never offered stays (decision
      // 0025, design 24a). An id that names nothing is left out.
      const [existingCategories, existingTags] = await Promise.all([
        prisma.articleCategory.findMany({
          select: { id: true },
          where: { id: { in: categoryIds ?? [] } },
        }),
        prisma.articleTag.findMany({
          select: { id: true },
          where: { id: { in: tagIds ?? [] } },
        }),
      ])
      const linkedCategoryIds = mergeLinkedIds({
        removedIds: removedCategoryIds,
        sentIds: existingCategories.map(({ id }) => id),
        storedIds: storedArticle.categories.map(({ id }) => id),
      })
      const linkedTagIds = mergeLinkedIds({
        removedIds: removedTagIds,
        sentIds: existingTags.map(({ id }) => id),
        storedIds: storedArticle.tags.map(({ id }) => id),
      })

      // The first save with a title, text or image ends the empty draft and
      // is its creation in the history (log 0020, design 07f).
      const hasContent = title !== '' || content !== '' || storedImageCount > 0

      // 4. In one transaction: the alt texts and captions and the article. A
      // draft has no PageSEO record; publish writes it (log 0039).
      const saveInTransaction = async () => {
        const articleWrite = prisma.article.update({
          data: {
            authors: {
              set: authorIds.map((id) => ({ id })),
            },
            categories: {
              set: linkedCategoryIds.map((id) => ({ id })),
            },
            content,
            perex: perex || null,
            slug: savedSlug,
            tags: {
              set: linkedTagIds.map((id) => ({ id })),
            },
            title,
            // Autosave keeps the hold; the save of a page going away ends it.
            ...(releaseHold ? RELEASED_HOLD : {}),
          },
          select: { id: true, updatedAt: true },
          // Only the holding tab saves a draft (log 0019); otherwise
          // the whole transaction rolls back.
          where: {
            id: articleId,
            state: 'draft',
            ...buildHeldByTabWhere(tab),
          },
        })

        const writes = [
          // Conditional, so of two first saves only one is the creation.
          prisma.article.updateMany({
            data: { firstContentAt: hasContent ? new Date() : null },
            where: { firstContentAt: null, id: articleId },
          }),
          // An image not stored yet (still processing) or another article's
          // changes nothing.
          ...images.map(({ id, altText, description }) =>
            prisma.articleImage.updateMany({
              data: { altText, description: description || null },
              where: { articleId, id },
            }),
          ),
          articleWrite,
        ]
        const articleWriteIndex = writes.indexOf(articleWrite)

        const results = (await prisma.$transaction(writes)) as unknown[]

        return {
          firstContent: results[0] as Prisma.BatchPayload,
          savedArticle: results[articleWriteIndex] as { updatedAt: Date },
        }
      }

      let saved: Awaited<ReturnType<typeof saveInTransaction>>

      try {
        saved = await saveInTransaction()
      } catch (error) {
        if (!isRecordNotFoundError(error)) throw error

        const currentHold = await prisma.article.findUnique({
          select: {
            heldByAuthor: { select: { name: true } },
            heldByAuthorId: true,
            heldByTabId: true,
            heldSince: true,
            heldUntil: true,
          },
          where: { id: articleId },
        })

        // Still this tab's: another row was missing (an author, say), not the
        // hold, so the save failed.
        if (
          currentHold?.heldByAuthorId === tab.authorId &&
          currentHold.heldByTabId === tab.tabId
        ) {
          throw error
        }

        // Deleted between the check and the write (0036).
        if (currentHold === null) return { status: 'deleted' }

        // The hold moved between the check and the write.
        return toNotHeld(currentHold)
      }

      const savedResult = {
        slugSuggestion: slugConflict?.freeSlug ?? null,
        status: 'saved',
        takenSlug: slugConflict === null ? null : savedSlug,
        updatedAt: saved.savedArticle.updatedAt,
      } as const

      // A save that leaves a draft empty stays out of its history (0020).
      if (!hasContent && storedArticle.firstContentAt === null) {
        return savedResult
      }

      // One *Upraveno* per hold, however often it saves (07f, 24e).
      await recordEditLog(context, {
        entity: 'article',
        entityId: articleId,
        heldSince: storedArticle.heldSince,
        isCreation: hasContent && saved.firstContent.count === 1,
      })

      return savedResult
    },
    target: {
      authorIds: storedArticle.authors.map((author) => author.id),
      state,
    },
  })
}
