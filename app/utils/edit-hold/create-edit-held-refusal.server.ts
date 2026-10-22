import { data } from 'react-router'

import type { EditHeldRefusal } from './edit-held-refusal'

/**
 * The refusal of a write on content someone holds (decision 0019), a 409
 * naming the holder. Thrown from inside a transition, so nothing after the
 * write (history, event) runs; the action turns it back into a result.
 *
 * @param refusal - The holder's name, for „Článek právě upravuje …“ (23g),
 *   and whether it is the acting author's own other tab (a delete, 0036).
 */
export const createEditHeldRefusal = (refusal: EditHeldRefusal) =>
  data(refusal, { status: 409 })
