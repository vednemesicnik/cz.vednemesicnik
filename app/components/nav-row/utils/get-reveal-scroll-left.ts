type Options = {
  clientWidth: number
  itemEnd: number
  itemStart: number
  padding: number
  scrollLeft: number
}

/**
 * Where a sideways-scrolling row has to scroll so that one of its items is in
 * view with some room beside it.
 *
 * @param options.itemStart - The item's start edge within the row's content
 * @param options.itemEnd - The item's end edge within the row's content
 * @param options.scrollLeft - The row's current scroll position
 * @param options.clientWidth - The row's visible width
 * @param options.padding - The room to leave between the item and the row's edge
 * @returns The row's new scroll position, or `null` when the item is in view
 */
export const getRevealScrollLeft = ({
  clientWidth,
  itemEnd,
  itemStart,
  padding,
  scrollLeft,
}: Options): number | null => {
  if (itemStart - padding < scrollLeft) {
    return Math.max(0, itemStart - padding)
  }

  if (itemEnd + padding > scrollLeft + clientWidth) {
    return itemEnd + padding - clientWidth
  }

  return null
}
