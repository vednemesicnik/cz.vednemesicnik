type Options = {
  /** The links the record has now. */
  storedIds: string[]
  /** The links the editor sends as picked. */
  sentIds: string[]
  /** The links the editor sends as removed. */
  removedIds: string[]
}

/**
 * The links a save leaves on a record: every stored one the editor did not
 * send as removed, and every one it sends as picked (log 0025). A link
 * the editor never showed, such as an archived category, survives the save
 * (design 24a, iq3nur0e).
 *
 * @returns The ids, stored first, each once.
 */
export const mergeLinkedIds = ({
  storedIds,
  sentIds,
  removedIds,
}: Options): string[] => {
  const removed = new Set(removedIds)

  return [
    ...new Set([...storedIds.filter((id) => !removed.has(id)), ...sentIds]),
  ]
}
