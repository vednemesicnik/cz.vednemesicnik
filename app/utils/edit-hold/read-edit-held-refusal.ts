import type { EditHeldRefusal } from './edit-held-refusal'

/**
 * Tells the refusal of {@link createEditHeldRefusal} apart from anything else a
 * transition throws.
 *
 * @param error - What the transition threw.
 * @returns The holder's name and whether it is one's own other tab, or `null`
 *   when it is something else.
 */
export const readEditHeldRefusal = (error: unknown): EditHeldRefusal | null => {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('data' in error) ||
    !('init' in error)
  ) {
    return null
  }

  const { data, init } = error as {
    data: unknown
    init: ResponseInit | null
  }

  if (
    init?.status !== 409 ||
    typeof data !== 'object' ||
    data === null ||
    !('heldByName' in data) ||
    typeof data.heldByName !== 'string'
  ) {
    return null
  }

  return {
    heldByName: data.heldByName,
    isOwnOtherTab: 'isOwnOtherTab' in data && data.isOwnOtherTab === true,
  }
}
