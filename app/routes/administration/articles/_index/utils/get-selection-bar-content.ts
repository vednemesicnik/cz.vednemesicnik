import type { BulkAction } from './get-bulk-actions'
import { getCommonBulkActions } from './get-common-bulk-actions'

type SelectedArticle = {
  bulkActions: BulkAction[]
  isIncomplete: boolean
}

/**
 * What the selection bar offers (design 22c): the actions valid for every
 * selected article, or one sentence when none is left. Publishing is not
 * offered when it would only skip — every selected article is incomplete
 * (23h, copy bhmem1jc).
 *
 * @param selected - The selected articles' bulk actions and completeness.
 * @returns `actions` in the bar's order, and `message` in their place when
 *   there are none, else `null`.
 */
export const getSelectionBarContent = (selected: SelectedArticle[]) => {
  const common = getCommonBulkActions(
    selected.map((article) => article.bulkActions),
  )
  const isAllIncomplete =
    selected.length > 0 && selected.every((article) => article.isIncomplete)
  const actions = isAllIncomplete
    ? common.filter((action) => action !== 'publish')
    : common

  if (actions.length > 0) return { actions, message: null }

  const message =
    isAllIncomplete && common.includes('publish')
      ? selected.length === 1
        ? 'Vybraný článek nelze publikovat — je neúplný.'
        : 'Vybrané články nelze publikovat — jsou neúplné.'
      : 'Pro tento výběr není společná akce.'

  return { actions, message }
}
