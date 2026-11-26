/** An error a state write throws when it finds what blocks the publish (23h). */
export type MissingContentError = Error & { missing: string[] }

/**
 * The error an entity's `applyState` throws when its publish write meets a
 * value another record holds since the check before it (log 0039); the
 * publish answers it as missing content instead of failing.
 *
 * @param missing - The sentences of the missing-content dialog.
 * @returns The error to throw.
 */
export const createMissingContentError = (
  missing: string[],
): MissingContentError =>
  Object.assign(new Error('Missing content'), { missing })
