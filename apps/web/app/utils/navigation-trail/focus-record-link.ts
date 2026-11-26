import { focusAfterInput } from '~/utils/input-modality/focus-after-input'
import type { InputModality } from '~/utils/input-modality/input-modality-store'

/**
 * Puts the keyboard focus on the link of the record the reader came back from
 * (design 30i, n3wa2ld4): the row's link in the list, the first one leading
 * to that address. The list stays where it is restored, so the focus doesn't
 * scroll, and the ring shows only after the keyboard (`focusAfterInput`). A
 * row no longer in the list leaves the focus as after any navigation.
 *
 * @param path - The record's address.
 * @param modality - How the reader last acted, `null` when not known.
 */
export const focusRecordLink = (
  path: string,
  modality: InputModality | null,
) => {
  const link = document.querySelector<HTMLAnchorElement>(
    `a[href="${CSS.escape(path)}"]`,
  )

  if (link !== null) focusAfterInput(link, modality)
}
