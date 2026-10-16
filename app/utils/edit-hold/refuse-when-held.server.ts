import { createEditHeldRefusal } from './create-edit-held-refusal.server'
import { isRecordNotFoundError } from './is-record-not-found-error.server'

/**
 * Runs a write whose `where` repeats "not held by someone else" (decision
 * 0019). When it matches no row because someone holds the content, it throws
 * the held refusal naming the holder. When the hold ended before it could ask
 * who held it, the write runs once more; any other failure goes on as it was.
 *
 * @param write - The conditional `update` or `delete`; it must be safe to run
 *   twice.
 * @param findHeldByName - Who else holds the content now, or `null`.
 * @returns What the write returned.
 */
export const refuseWhenHeld = async <Result>(
  write: () => Promise<Result>,
  findHeldByName: () => Promise<string | null>,
  isRetry = false,
): Promise<Result> => {
  try {
    return await write()
  } catch (error) {
    if (!isRecordNotFoundError(error)) throw error

    const heldByName = await findHeldByName()

    if (heldByName !== null) throw createEditHeldRefusal(heldByName)

    if (isRetry) throw error

    return refuseWhenHeld(write, findHeldByName, true)
  }
}
