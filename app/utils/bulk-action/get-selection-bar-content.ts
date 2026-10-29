import type { BulkNoun, NumberSentences } from '~/config/bulk-noun-config'

import type { BulkAction } from './get-bulk-actions'
import { getCommonBulkActions } from './get-common-bulk-actions'

type SelectedRecord = {
  bulkActions: BulkAction[]
  isIncomplete: boolean
  isHeldByOther: boolean
  state?: string
}

type Options = {
  isParentUnpublished?: boolean
}

// Not yet published: a record publishing would take to the web (07c).
const UNPUBLISHED_STATES = new Set(['draft', 'pending', 'approved'])

const NO_COMMON_ACTION = 'Pro tento výběr není společná akce.'

/**
 * What the selection bar offers (design 22c): the actions valid for every
 * selected record, or one sentence when none is left. An action skips a
 * record someone else edits (22f), so it is not offered when it would only
 * skip — every selected record is held, or, publishing, incomplete or held
 * (23h, copy bhmem1jc).
 *
 * @param selected - The selected records' bulk actions, completeness, hold
 *   and state.
 * @param noun - The list's bulk noun, for the sentences.
 * @param options - Whether what holds the records isn't published, so none of
 *   them can be (an episode's podcast, 27b, 27f).
 * @returns `actions` in the bar's order, and `message` in their place when
 *   there are none, else `null`: „Všechny vybrané články se právě upravují.“
 *   when every one is held, „Vybrané články nelze publikovat — jsou neúplné.“
 *   when publishing was all there was, „Epizody nelze publikovat — podcast
 *   není publikovaný.“ when only that stands in its way, else „Pro tento výběr
 *   není společná akce.“
 */
export const getSelectionBarContent = (
  selected: SelectedRecord[],
  noun: BulkNoun,
  { isParentUnpublished = false }: Options = {},
) => {
  const isAllHeld =
    selected.length > 0 && selected.every((record) => record.isHeldByOther)
  const common = getCommonBulkActions(
    selected.map((record) => record.bulkActions),
  )
  const isAllIncomplete =
    selected.length > 0 && selected.every((record) => record.isIncomplete)
  const isNoneToPublish = selected.every(
    (record) => record.isIncomplete || record.isHeldByOther,
  )
  const actions = isAllHeld
    ? []
    : isNoneToPublish
      ? common.filter((action) => action !== 'publish')
      : common

  if (actions.length > 0) return { actions, message: null }

  const byCount = (sentences: NumberSentences | null) =>
    sentences === null
      ? NO_COMMON_ACTION
      : selected.length === 1
        ? sentences.one
        : sentences.many

  // Nothing is left and every record waits for publishing its parent blocks.
  const isBlockedByParent =
    isParentUnpublished &&
    selected.length > 0 &&
    selected.every(
      (record) =>
        record.state !== undefined && UNPUBLISHED_STATES.has(record.state),
    )

  const message =
    isAllHeld && common.length > 0
      ? byCount(noun.allHeld)
      : isAllIncomplete && common.includes('publish')
        ? byCount(noun.allIncomplete)
        : isBlockedByParent
          ? byCount(noun.unpublishedParent)
          : NO_COMMON_ACTION

  return { actions, message }
}
