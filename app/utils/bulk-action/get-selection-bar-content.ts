import type { BulkNoun, NumberSentences } from '~/config/bulk-noun-config'

import type { BulkAction } from './get-bulk-actions'
import { getCommonBulkActions } from './get-common-bulk-actions'

type SelectedRecord = {
  bulkActions: BulkAction[]
  isIncomplete: boolean
  isHeldByOther: boolean
}

const NO_COMMON_ACTION = 'Pro tento výběr není společná akce.'

/**
 * What the selection bar offers (design 22c): the actions valid for every
 * selected record, or one sentence when none is left. An action skips a
 * record someone else edits (22f), so it is not offered when it would only
 * skip — every selected record is held, or, publishing, incomplete or held
 * (23h, copy bhmem1jc).
 *
 * @param selected - The selected records' bulk actions, completeness and hold.
 * @param noun - The list's bulk noun, for the sentences.
 * @returns `actions` in the bar's order, and `message` in their place when
 *   there are none, else `null`: „Všechny vybrané články se právě upravují.“
 *   when every one is held, „Vybrané články nelze publikovat — jsou neúplné.“
 *   when publishing was all there was, else „Pro tento výběr není společná
 *   akce.“
 */
export const getSelectionBarContent = (
  selected: SelectedRecord[],
  noun: BulkNoun,
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

  const message =
    isAllHeld && common.length > 0
      ? byCount(noun.allHeld)
      : isAllIncomplete && common.includes('publish')
        ? byCount(noun.allIncomplete)
        : NO_COMMON_ACTION

  return { actions, message }
}
