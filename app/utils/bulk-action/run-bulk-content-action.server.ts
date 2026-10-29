import type { ContentLogEntity, ContentState } from '@generated/prisma/enums'

import type { ContentStateHandlers } from '~/utils/content-state/create-content-state-handlers.server'
import type { EditHoldColumns } from '~/utils/edit-hold/edit-hold-columns'
import { getEditHoldStatus } from '~/utils/edit-hold/get-edit-hold-status'
import { readEditHeldRefusal } from '~/utils/edit-hold/read-edit-held-refusal'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import type { ContentActionFlags } from '~/utils/permissions/author/get-content-action-flags.server'
import { getContentActionFlags } from '~/utils/permissions/author/get-content-action-flags.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'

import type { BulkActionResult } from './bulk-action-result'
import type { BulkAction } from './get-bulk-actions'
import { getBulkActions } from './get-bulk-actions'
import { getOrderedPublishDates } from './get-ordered-publish-dates'

type RoleLevel = { level: number }

/**
 * A selected record as the runner checks it again: what the permission flags
 * read, its stored publish date, and its edit hold (`null` for content
 * without one, a category or a tag).
 */
export type BulkContentRow = {
  id: string
  state: ContentState
  publishedAt: Date | null
  submittedAt: Date | null
  authors: { id: string; role: RoleLevel }[]
  reviews: { createdAt: Date; reviewer: { id: string; role: RoleLevel } }[]
  hold: EditHoldColumns | null
}

/**
 * How one list's bulk actions reach its content (design 22c, ji6n8th3).
 *
 * - `loadRows` reads the selected records; one gone since the list loaded is
 *   left out.
 * - `getRowActions` is the list's row actions for those flags, the same the
 *   list's loader shows.
 * - `publishDate` — `chosen`: the dialog's day, backdated per record
 *   (articles, episodes); `ordered`: the server's moment, spaced a second per
 *   record (podcasts); `none`: the handler's now (categories, tags, issues).
 */
export type BulkContentAdapter<Row extends BulkContentRow> = {
  entity: ContentLogEntity
  handlers: ContentStateHandlers
  loadRows: (ids: string[]) => Promise<Row[]>
  getRowActions: (
    row: Row,
    flags: ContentActionFlags,
  ) => { row: string | null; menu: readonly string[] }
  publishDate: 'chosen' | 'ordered' | 'none'
}

type Options<Row extends BulkContentRow> = {
  adapter: BulkContentAdapter<Row>
  action: BulkAction
  ids: string[]
  /** The top record's publish moment when the dialog chose a day. */
  publishBase?: Date
}

/**
 * Applies one bulk action to the selected records, in their order (design
 * 22c). Each record is checked again as its row would be: one that changed
 * since the list was loaded — or, publishing, turned out incomplete (23h), or
 * that someone else edits (22f) — is skipped and counted, never partly
 * applied. Publishing gives each record without a stored publish date its own
 * moment, the top one the base and each next a second earlier; one published
 * before keeps its date (fge4es3p).
 *
 * @param request - The action's request, for the permission checks.
 * @param options - The list's adapter, the action, the record ids in order,
 *   and the dialog's base moment.
 * @returns How many records the action changed and how many it skipped, and
 *   whether all of them were drafts (the toast then counts koncepty).
 */
export const runBulkContentAction = async <Row extends BulkContentRow>(
  request: Request,
  { adapter, action, ids, publishBase }: Options<Row>,
): Promise<BulkActionResult> => {
  const context = await getAuthorPermissionContext(request, {
    actions: [
      'view',
      'update',
      'delete',
      'publish',
      'retract',
      'archive',
      'restore',
      'review',
    ],
    entities: [adapter.entity],
  })
  const isApprover = context.roleLevel <= APPROVER_ROLE_LEVEL

  const rows = await adapter.loadRows(ids)
  const rowsById = new Map(rows.map((row) => [row.id, row]))

  // Only records never published take a place in the order.
  const orderedIds = ids.filter((id) => rowsById.get(id)?.publishedAt === null)
  const orderBase =
    adapter.publishDate === 'chosen'
      ? publishBase
      : adapter.publishDate === 'ordered'
        ? new Date()
        : undefined
  const orderedDates =
    orderBase === undefined
      ? []
      : getOrderedPublishDates(orderBase, orderedIds.length)

  const publishMoment = (id: string) => {
    const orderIndex = orderedIds.indexOf(id)
    const moment = orderIndex === -1 ? undefined : orderedDates[orderIndex]

    return adapter.publishDate === 'chosen'
      ? { publishedAt: moment }
      : { orderedAt: moment }
  }

  let processedCount = 0
  let skippedCount = 0

  // Sequential on purpose: each transition runs its own permission check and,
  // deleting, its own file cleanup.
  for (const id of ids) {
    const row = rowsById.get(id)

    if (row === undefined) {
      skippedCount += 1
      continue
    }

    const flags = getContentActionFlags(context, adapter.entity, row)
    const bulkActions = getBulkActions({
      ...adapter.getRowActions(row, flags),
      isApprover,
    })

    // Someone else edits it: the action waits (07g, 22f). A delete waits for
    // one's own other tab too (log 0036).
    const holdStatus =
      row.hold === null
        ? 'free'
        : getEditHoldStatus(row.hold, {
            authorId: context.authorId,
            now: new Date(),
          })
    const isHeld =
      action === 'delete' ? holdStatus !== 'free' : holdStatus === 'other'

    if (!bulkActions.includes(action) || isHeld) {
      skippedCount += 1
      continue
    }

    const transition = {
      id,
      target: {
        authorIds: row.authors.map((author) => author.id),
        state: row.state,
      },
    }

    // The hold taken since the check above refuses the transition's own write.
    try {
      if (action === 'publish') {
        const { missing } = await adapter.handlers.publish(request, {
          ...transition,
          ...publishMoment(id),
        })

        if (missing.length > 0) {
          skippedCount += 1
          continue
        }
      } else {
        await adapter.handlers[action](request, transition)
      }
    } catch (error) {
      if (readEditHeldRefusal(error) === null) throw error

      skippedCount += 1
      continue
    }

    processedCount += 1
  }

  return {
    action,
    onlyDrafts: rows.every((row) => row.state === 'draft'),
    processedCount,
    skippedCount,
  }
}
