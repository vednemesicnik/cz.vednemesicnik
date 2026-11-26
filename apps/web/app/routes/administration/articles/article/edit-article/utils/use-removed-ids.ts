import { useEffect, useState } from 'react'

/**
 * The links the editor removed: every one it had at open or picked since,
 * and no longer has. A save sends them, so the server drops only these and
 * keeps an archived link the editor never showed (log 0025).
 *
 * @param initialIds - The links at open.
 * @param selectedIds - The links picked now.
 * @returns The ids to send as removed.
 */
export const useRemovedIds = (
  initialIds: string[],
  selectedIds: string[],
): string[] => {
  const [knownIds, setKnownIds] = useState(initialIds)
  const selectedKey = selectedIds.join('\n')

  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed by value, not by array identity
  useEffect(() => {
    setKnownIds((current) => [
      ...current,
      ...selectedIds.filter((id) => !current.includes(id)),
    ])
  }, [selectedKey])

  return knownIds.filter((id) => !selectedIds.includes(id))
}
