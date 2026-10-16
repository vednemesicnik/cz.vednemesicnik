import { data } from 'react-router'

/**
 * The refusal of a write on content someone else holds (decision 0019), a 409
 * naming the holder. Thrown from inside a transition, so nothing after the
 * write (history, event) runs; the action turns it back into a result.
 *
 * @param heldByName - The holder's name, for „Článek právě upravuje …“ (23g).
 */
export const createEditHeldRefusal = (heldByName: string) =>
  data({ heldByName }, { status: 409 })
