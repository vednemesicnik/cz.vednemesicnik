/**
 * Tells the refusal of {@link createEditHeldRefusal} apart from anything else a
 * transition throws.
 *
 * @param error - What the transition threw.
 * @returns The holder's name, or `null` when it is something else.
 */
export const readEditHeldRefusal = (error: unknown): string | null => {
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

  return init?.status === 409 &&
    typeof data === 'object' &&
    data !== null &&
    'heldByName' in data &&
    typeof data.heldByName === 'string'
    ? data.heldByName
    : null
}
