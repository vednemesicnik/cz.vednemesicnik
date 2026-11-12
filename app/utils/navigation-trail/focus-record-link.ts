import type { InputModality } from '~/utils/input-modality/input-modality-store'
import { supportsFocusVisibleOption } from '~/utils/input-modality/supports-focus-visible-option'

/**
 * Puts the keyboard focus on the link of the record the reader came back from
 * (design 30i, n3wa2ld4): the row's link in the list, the first one leading
 * to that address. The list stays where it is restored, so the focus doesn't
 * scroll. A row no longer in the list leaves the focus as after any
 * navigation.
 *
 * The ring is for the keyboard. After a mouse or touch return the focus moves
 * without it where the browser takes `focusVisible`, and stays where it is
 * elsewhere: Safari would draw the ring for any focus moved after a click.
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

  if (link === null) return

  if (modality !== 'pointer') {
    link.focus({ preventScroll: true })
    return
  }

  if (supportsFocusVisibleOption()) {
    link.focus({ focusVisible: false, preventScroll: true })
  }
}
