/**
 * Puts the keyboard focus on the link of the record the reader came back from
 * (design 30i, n3wa2ld4): the row's link in the list, the first one leading
 * to that address. The list stays where it is restored, so the focus doesn't
 * scroll, and the ring shows only to someone using the keyboard
 * (`:focus-visible`). A row no longer in the list leaves the focus as after
 * any navigation.
 *
 * @param path - The record's address.
 */
export const focusRecordLink = (path: string) => {
  const link = document.querySelector<HTMLAnchorElement>(
    `a[href="${CSS.escape(path)}"]`,
  )

  link?.focus({ preventScroll: true })
}
