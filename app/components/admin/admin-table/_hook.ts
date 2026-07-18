import { useCallback, useState } from 'react'

import {
  getSelectedIds,
  toggleAllSelection,
  toggleSelection,
} from '~/utils/admin-table-selection'

// Row-selection state for an AdminTable. `selectableIds` is the set of ids that
// may be selected on the current page (e.g. only rows the user can delete).
// Selection is pruned automatically: `selectedIds` is derived on render as the
// intersection with `selectableIds`, so ids that disappear after pagination,
// search, or a revalidation drop out without any effect.
export const useAdminTableSelection = (selectableIds: string[]) => {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const selectedIds = getSelectedIds(selected, selectableIds)
  const selectedIdSet = new Set(selectedIds)

  const allSelected =
    selectedIds.length > 0 && selectedIds.length === selectableIds.length
  const someSelected = selectedIds.length > 0 && !allSelected

  const toggle = useCallback((id: string) => {
    setSelected((current) => toggleSelection(current, id))
  }, [])

  const toggleAll = useCallback(() => {
    setSelected((current) => toggleAllSelection(current, selectableIds))
  }, [selectableIds])

  const clear = useCallback(() => {
    setSelected(new Set())
  }, [])

  // Reflect the pruned selection, not the raw set: a rendered-but-non-selectable
  // row (e.g. canDelete flipped false) must not show as checked.
  const isSelected = (id: string) => selectedIdSet.has(id)

  return {
    allSelected,
    clear,
    isSelected,
    selectedIds,
    someSelected,
    toggle,
    toggleAll,
  }
}
