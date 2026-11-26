type Point = { x: number; y: number }

type Options = {
  /** The pointer. */
  pointer: Point
  /** Where the pointer took hold of the tile, from the tile's corner. */
  grab: Point
  /** The tile's place in the grid as laid out. */
  slot: { left: number; top: number; width: number; height: number }
  /** The grid, which the lifted tile never leaves. */
  bounds: { left: number; top: number; right: number; bottom: number }
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max))

/**
 * How far a lifted tile is shifted from its place so that it stays under the
 * pointer where it was taken hold of, kept inside the grid. All positions are
 * in the same coordinates (the viewport's).
 *
 * @returns The shift in pixels.
 */
export const getDraggedTileOffset = ({
  pointer,
  grab,
  slot,
  bounds,
}: Options): Point => {
  const left = clamp(
    pointer.x - grab.x,
    bounds.left,
    Math.max(bounds.left, bounds.right - slot.width),
  )
  const top = clamp(
    pointer.y - grab.y,
    bounds.top,
    Math.max(bounds.top, bounds.bottom - slot.height),
  )

  return { x: left - slot.left, y: top - slot.top }
}
