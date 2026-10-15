import { createEditHeldRefusal } from './create-edit-held-refusal.server'
import { isRecordNotFoundError } from './is-record-not-found-error.server'

/**
 * Runs a write whose `where` repeats "not held by someone else" (decision
 * 0019). When it matches no row because someone holds the content, it throws
 * the held refusal naming the holder; any other failure goes on as it was.
 *
 * @param write - The conditional `update` or `delete`.
 * @param findHeldByName - Who else holds the content now, or `null`.
 * @returns What the write returned.
 */
export const refuseWhenHeld = async <Result>(
  write: () => Promise<Result>,
  findHeldByName: () => Promise<string | null>,
): Promise<Result> => {
  try {
    return await write()
  } catch (error) {
    if (!isRecordNotFoundError(error)) throw error

    const heldByName = await findHeldByName()

    if (heldByName === null) throw error

    throw createEditHeldRefusal(heldByName)
  }
}
