import type { ContentLogEntity, ContentState } from '@generated/prisma/enums'
import { data } from 'react-router'

import { EDIT_HOLD_CONFIG } from '~/config/edit-hold-config'
import { recordContentLog } from '~/utils/content-log/record-content-log.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'
import { publishContentEvent } from '~/utils/sse/publish-content-event.server'

import type { EditHoldCondition } from './build-hold-condition-where'
import type { EditHoldColumns, EditHoldTab } from './edit-hold-columns'
import type { EditHolder, EditHoldResult } from './edit-hold-result'
import { getEditHoldStatus } from './get-edit-hold-status'

/** The row a hold operation reads first. */
export type EditHoldRow = EditHoldColumns & {
  authorIds: string[]
  heldByName: string | null
  /** An empty draft is deleted when its hold ends (decision 0020). */
  isEmpty: boolean
  state: ContentState
  submittedAt: Date | null
  updatedAt: Date
}

/** The columns a hold write sets; `updatedAt` goes back as it was read. */
export type EditHoldWrite = EditHoldColumns & {
  updatedAt: Date
}

type EditHoldHandlersConfig = {
  entity: ContentLogEntity
  /** The row, or `null` when it does not exist. */
  findHold: (id: string) => Promise<EditHoldRow | null>
  /** A conditional write; resolves to the number of rows written (0 or 1). */
  writeHold: (
    id: string,
    condition: EditHoldCondition,
    data: EditHoldWrite,
  ) => Promise<number>
  /** Deletes the empty row only while the tab holds it. */
  deleteEmpty: (id: string, tab: EditHoldTab) => Promise<number>
}

type HoldOptions = {
  id: string
  tabId: string
}

type ReleaseOptions = HoldOptions & {
  /** Keep an empty draft and let its hold expire (the page may be reloading). */
  keepEmpty?: boolean
}

type TakeOptions = HoldOptions & {
  /** Take only if the content was not saved since the editor loaded it (24i). */
  expectedUpdatedAt?: Date
}

const holdUntil = (now: Date) =>
  new Date(now.getTime() + EDIT_HOLD_CONFIG.durationMilliseconds)

const toHolder = (row: EditHoldRow): EditHolder | null =>
  row.heldByName === null || row.heldSince === null
    ? null
    : {
        lastSavedAt: row.updatedAt.toISOString(),
        name: row.heldByName,
        since: row.heldSince.toISOString(),
      }

// Whoever holds it instead of this tab, for an editor that may not write (24i).
const toOtherHolder = (
  row: EditHoldRow,
  viewer: EditHoldTab & { now: Date },
) => {
  const status = getEditHoldStatus(row, viewer)

  return status === 'other' || status === 'own-other-tab' ? toHolder(row) : null
}

/**
 * Builds the edit hold's operations for one content type (design 07g, 24g,
 * decision 0019): take, renew, release and take over. The entity's callbacks
 * carry the Prisma work; the factory owns the permission, the rules and the
 * events.
 *
 * A hold write moves only the hold columns and sends back the `updatedAt` it
 * read, in its `where` too, so it never passes for a save (decision 0021). A
 * save landing between the read and the write fails that condition; the
 * operation reads again and tries once more.
 *
 * Taking, taking over and releasing are content events (decision 0012); a
 * renewal and an expiry are not. Only a takeover of someone else's valid hold
 * goes into the history (07f).
 */
export const createEditHoldHandlers = (config: EditHoldHandlersConfig) => {
  const { entity } = config

  const loadRow = async (id: string) => {
    const row = await config.findHold(id)

    if (row === null) throw data(null, { status: 404 })

    return row
  }

  // Runs one attempt and, when its write found the row changed, one more on a
  // fresh read.
  const retryOnce = async <Result>(
    id: string,
    firstRow: EditHoldRow,
    attempt: (row: EditHoldRow) => Promise<Result | null>,
  ): Promise<Result> => {
    const result = await attempt(firstRow)

    if (result !== null) return result

    const secondResult = await attempt(await loadRow(id))

    if (secondResult === null) throw data(null, { status: 409 })

    return secondResult
  }

  const withEditPermission = async <Result>(
    request: Request,
    id: string,
    execute: (
      context: AuthorPermissionContext,
      row: EditHoldRow,
    ) => Promise<Result>,
  ) => {
    const row = await loadRow(id)

    return withAuthorPermission(request, {
      action: 'update',
      entity,
      execute: (context) => execute(context, row),
      target: { authorIds: row.authorIds, state: row.state },
    })
  }

  // Only an editable draft is held; a submitted one stays with the Coordinator
  // (07d).
  const assertEditable = (
    context: AuthorPermissionContext,
    row: EditHoldRow,
  ) => {
    if (
      row.state !== 'draft' ||
      isLockedBySubmission({
        roleLevel: context.roleLevel,
        submittedAt: row.submittedAt,
      })
    ) {
      throw data(null, { status: 403 })
    }
  }

  const announce = (id: string, context: AuthorPermissionContext) =>
    publishContentEvent({ change: 'hold', entity, entityId: id }, context)

  const take = (
    request: Request,
    { id, tabId, expectedUpdatedAt }: TakeOptions,
  ): Promise<EditHoldResult> =>
    withEditPermission(request, id, (context, firstRow) => {
      assertEditable(context, firstRow)
      const tab = { authorId: context.authorId, tabId }

      return retryOnce<EditHoldResult>(id, firstRow, async (row) => {
        const now = new Date()

        if (
          expectedUpdatedAt !== undefined &&
          row.updatedAt.getTime() !== expectedUpdatedAt.getTime()
        ) {
          return {
            holder: toOtherHolder(row, { ...tab, now }),
            isEditable: true,
            status: 'changed',
          }
        }

        const status = getEditHoldStatus(row, { ...tab, now })

        if (status === 'own-other-tab') return { status: 'own-other-tab' }

        if (status === 'other') {
          const holder = toHolder(row)
          return holder === null ? null : { holder, status: 'held-by-other' }
        }

        const count = await config.writeHold(
          id,
          {
            holder: status === 'own-tab' ? tab : 'free',
            now,
            updatedAt: row.updatedAt,
          },
          {
            heldByAuthorId: tab.authorId,
            heldByTabId: tab.tabId,
            heldSince: status === 'own-tab' ? row.heldSince : now,
            heldUntil: holdUntil(now),
            updatedAt: row.updatedAt,
          },
        )

        if (count === 0) return null

        if (status === 'free') announce(id, context)

        return { status: 'holding' }
      })
    })

  const renew = (
    request: Request,
    { id, tabId }: HoldOptions,
  ): Promise<EditHoldResult> =>
    withEditPermission(request, id, (context, firstRow) => {
      const tab = { authorId: context.authorId, tabId }

      return retryOnce<EditHoldResult>(id, firstRow, async (row) => {
        const now = new Date()

        // Published, archived or sent for review meanwhile: this editor may
        // not write any more (07d, 07g).
        if (
          row.state !== 'draft' ||
          isLockedBySubmission({
            roleLevel: context.roleLevel,
            submittedAt: row.submittedAt,
          })
        ) {
          return { holder: null, isEditable: false, status: 'changed' }
        }

        if (
          row.heldByAuthorId !== tab.authorId ||
          row.heldByTabId !== tab.tabId
        ) {
          return {
            holder:
              getEditHoldStatus(row, { ...tab, now }) === 'free'
                ? null
                : toHolder(row),
            status: 'lost',
          }
        }

        const count = await config.writeHold(
          id,
          { holder: tab, now, updatedAt: row.updatedAt },
          {
            heldByAuthorId: tab.authorId,
            heldByTabId: tab.tabId,
            heldSince: row.heldSince,
            heldUntil: holdUntil(now),
            updatedAt: row.updatedAt,
          },
        )

        return count === 0 ? null : { status: 'holding' }
      })
    })

  const release = (
    request: Request,
    { id, tabId, keepEmpty = false }: ReleaseOptions,
  ): Promise<EditHoldResult> =>
    withEditPermission(request, id, async (context, firstRow) => {
      const tab = { authorId: context.authorId, tabId }

      // An empty draft goes with its hold, unlogged and unannounced: nobody
      // saw it (0020). A page going away may be a reload, so then the hold
      // only expires, and the sweep on Nový článek deletes the draft.
      if (firstRow.isEmpty) {
        if (!keepEmpty) {
          await config.deleteEmpty(id, tab)
          return { status: 'released' }
        }

        return retryOnce<EditHoldResult>(id, firstRow, async (row) => {
          if (
            row.heldByAuthorId !== tab.authorId ||
            row.heldByTabId !== tab.tabId
          ) {
            return { status: 'released' }
          }

          const now = new Date()
          const count = await config.writeHold(
            id,
            { holder: tab, now, updatedAt: row.updatedAt },
            {
              heldByAuthorId: row.heldByAuthorId,
              heldByTabId: row.heldByTabId,
              heldSince: row.heldSince,
              heldUntil: now,
              updatedAt: row.updatedAt,
            },
          )

          return count === 0 ? null : { status: 'released' }
        })
      }

      return retryOnce<EditHoldResult>(id, firstRow, async (row) => {
        if (
          row.heldByAuthorId !== tab.authorId ||
          row.heldByTabId !== tab.tabId
        ) {
          return { status: 'released' }
        }

        const count = await config.writeHold(
          id,
          { holder: tab, now: new Date(), updatedAt: row.updatedAt },
          {
            heldByAuthorId: null,
            heldByTabId: null,
            heldSince: null,
            heldUntil: null,
            updatedAt: row.updatedAt,
          },
        )

        if (count === 0) return null

        announce(id, context)

        return { status: 'released' }
      })
    })

  const takeOver = (
    request: Request,
    { id, tabId, expectedUpdatedAt }: TakeOptions,
  ): Promise<EditHoldResult> =>
    withEditPermission(request, id, (context, firstRow) => {
      assertEditable(context, firstRow)
      const tab = { authorId: context.authorId, tabId }

      return retryOnce<EditHoldResult>(id, firstRow, async (row) => {
        const now = new Date()

        // Saved since this editor loaded: taking it would edit old text.
        if (
          expectedUpdatedAt !== undefined &&
          row.updatedAt.getTime() !== expectedUpdatedAt.getTime()
        ) {
          return {
            holder: toOtherHolder(row, { ...tab, now }),
            isEditable: true,
            status: 'changed',
          }
        }

        const status = getEditHoldStatus(row, { ...tab, now })

        // Only the Coordinator takes someone else's hold; one's own, from
        // another tab, anyone (24g).
        if (status === 'other' && context.roleLevel > APPROVER_ROLE_LEVEL) {
          throw data(null, { status: 403 })
        }

        // The write repeats the holder it read: a hold taken in between fails
        // it, and the next read applies the role check to the new holder.
        const count = await config.writeHold(
          id,
          {
            holder:
              status === 'free' ||
              row.heldByAuthorId === null ||
              row.heldByTabId === null
                ? 'free'
                : { authorId: row.heldByAuthorId, tabId: row.heldByTabId },
            now,
            updatedAt: row.updatedAt,
          },
          {
            heldByAuthorId: tab.authorId,
            heldByTabId: tab.tabId,
            heldSince: now,
            heldUntil: holdUntil(now),
            updatedAt: row.updatedAt,
          },
        )

        if (count === 0) return null

        // An empty draft leaves no history (0020).
        if (status === 'other' && !row.isEmpty) {
          await recordContentLog(
            { entity, entityId: id, events: ['take_over'] },
            context,
          )
        }

        announce(id, context)

        return { status: 'holding' }
      })
    })

  return { release, renew, take, takeOver }
}

export type EditHoldHandlers = ReturnType<typeof createEditHoldHandlers>
