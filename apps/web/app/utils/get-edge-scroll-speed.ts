type Options = {
  /** The pointer's position along the scrolling axis. */
  pointer: number
  /** The scroll box's start edge on that axis. */
  start: number
  /** The scroll box's end edge on that axis. */
  end: number
  /** How deep the band along each edge is. */
  edge: number
  /** The most it scrolls in one frame. */
  max: number
}

/**
 * How far a drag scrolls its box in one frame: near the box's start or end
 * edge, faster the closer the pointer gets, up to `max`.
 *
 * @returns Pixels, negative towards the start; `0` outside both bands.
 */
export const getEdgeScrollSpeed = ({
  pointer,
  start,
  end,
  edge,
  max,
}: Options) => {
  const intoStart = start + edge - pointer
  const intoEnd = pointer - (end - edge)

  if (intoStart > 0) return -Math.min(max, (intoStart / edge) * max)
  if (intoEnd > 0) return Math.min(max, (intoEnd / edge) * max)
  return 0
}
