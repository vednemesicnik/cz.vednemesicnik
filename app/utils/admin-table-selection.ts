// Pure selection logic for admin-table row selection. Kept framework-free so it
// can be unit-tested directly; `useAdminTableSelection` wraps it with React state.

// Intersection of the current selection with the ids currently selectable on the
// page. This is what prunes stale ids automatically: after pagination, search, or
// a revalidation that removes rows, ids no longer present simply drop out.
export const getSelectedIds = (
  selected: ReadonlySet<string>,
  selectableIds: string[],
): string[] => selectableIds.filter((id) => selected.has(id))

// Add or remove a single id, returning a new Set (never mutating the input).
export const toggleSelection = (
  selected: ReadonlySet<string>,
  id: string,
): Set<string> => {
  const next = new Set(selected)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  return next
}

// Select every selectable id, or clear them when all are already selected.
// Only the selectable ids are touched so this stays consistent with the pruning
// done by getSelectedIds.
export const toggleAllSelection = (
  selected: ReadonlySet<string>,
  selectableIds: string[],
): Set<string> => {
  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id))

  const next = new Set(selected)
  if (allSelected) {
    for (const id of selectableIds) next.delete(id)
  } else {
    for (const id of selectableIds) next.add(id)
  }
  return next
}
