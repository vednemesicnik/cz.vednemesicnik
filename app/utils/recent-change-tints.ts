import type { TableRowTint } from '~/components/admin/admin-table'

// The 22f tint's 3 s hold and 300 ms fade; past them the row shows nothing.
const TINT_DURATION_MS = 3300

const createRecentChangeTints = () => {
  const tintsById = new Map<string, TableRowTint>()

  return {
    /**
     * The tint of a row changed moments ago, or `undefined` once it is over.
     *
     * @param id - The record's id.
     */
    get: (id: string): TableRowTint | undefined => {
      const tint = tintsById.get(id)

      if (tint === undefined) return undefined

      if (performance.now() - tint.startedAt > TINT_DURATION_MS) {
        tintsById.delete(id)
        return undefined
      }

      return tint
    },

    /**
     * Starts the tint of a record one has just saved, so its row is tinted
     * once the list shows it.
     *
     * @param id - The record's id.
     */
    mark: (id: string) => {
      const sequence = (tintsById.get(id)?.sequence ?? 0) + 1
      tintsById.set(id, { sequence, startedAt: performance.now() })
    },
  }
}

/**
 * Rows one has just saved (design 30c, 39aqwklv): the add or edit page marks
 * the record before it leaves, and the list's row reads its tint (22f). Kept in
 * the tab's memory, so a reload doesn't replay the tint.
 */
export const recentChangeTints = createRecentChangeTints()
