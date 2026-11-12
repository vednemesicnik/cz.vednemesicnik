type Options = {
  /** The image's box in the window. */
  rect: Pick<DOMRect, 'top' | 'bottom' | 'height'>
  /** Where the window's open part starts: the header's bottom edge, or 0. */
  top: number
  /** Where it ends: the window's height. */
  bottom: number
}

/**
 * Whether at least half of an image is in the open part of the window, below
 * the header. Less than that and it would fly in from behind an edge (design
 * 18d, u6r1pxsx); the header counts as an edge, since it hides what is under
 * it just as well.
 */
export const isHalfVisibleBelow = ({ rect, top, bottom }: Options) => {
  if (rect.height <= 0) return false

  const visibleHeight = Math.min(rect.bottom, bottom) - Math.max(rect.top, top)

  return visibleHeight >= rect.height / 2
}
