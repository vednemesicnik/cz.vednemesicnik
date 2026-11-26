import { createEditHeldRefusal } from './create-edit-held-refusal.server'
import type { EditHeldRefusal } from './edit-held-refusal'
import { isRecordNotFoundError } from './is-record-not-found-error.server'

/**
 * Runs a write whose `where` repeats the hold condition: "not held by someone
 * else" (log 0019), or "free" for a delete (0036). When it matches no row
 * because the content is held, it throws the held refusal naming the holder.
 * When the hold ended before it could ask who held it, the write runs once
 * more; any other failure goes on as it was.
 *
 * @param write - The conditional `update` or `delete`; it must be safe to run
 *   twice.
 * @param findRefusal - Whose hold stops the write now, or `null`.
 * @returns What the write returned.
 */
export const refuseWhenHeld = async <Result>(
  write: () => Promise<Result>,
  findRefusal: () => Promise<EditHeldRefusal | null>,
  isRetry = false,
): Promise<Result> => {
  try {
    return await write()
  } catch (error) {
    if (!isRecordNotFoundError(error)) throw error

    const refusal = await findRefusal()

    if (refusal !== null) throw createEditHeldRefusal(refusal)

    if (isRetry) throw error

    return refuseWhenHeld(write, findRefusal, true)
  }
}
