import type { BulkAction } from './get-bulk-actions'
import { getCommonBulkActions } from './get-common-bulk-actions'

type SelectedArticle = {
  bulkActions: BulkAction[]
  isIncomplete: boolean
  isHeldByOther: boolean
}

/**
 * What the selection bar offers (design 22c): the actions valid for every
 * selected article, or one sentence when none is left. An action skips an
 * article someone else edits (22f), so it is not offered when it would only
 * skip — every selected article is held, or, publishing, incomplete or held
 * (23h, copy bhmem1jc).
 *
 * @param selected - The selected articles' bulk actions, completeness and hold.
 * @returns `actions` in the bar's order, and `message` in their place when
 *   there are none, else `null`.
 */
export const getSelectionBarContent = (selected: SelectedArticle[]) => {
  const isAllHeld =
    selected.length > 0 && selected.every((article) => article.isHeldByOther)
  const common = isAllHeld
    ? []
    : getCommonBulkActions(selected.map((article) => article.bulkActions))
  const isAllIncomplete =
    selected.length > 0 && selected.every((article) => article.isIncomplete)
  const isNoneToPublish = selected.every(
    (article) => article.isIncomplete || article.isHeldByOther,
  )
  const actions = isNoneToPublish
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
