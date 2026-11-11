type Size = {
  width: number
  height: number
}

type Offset = {
  x: number
  y: number
}

const clampAxis = (value: number, scaledLength: number, areaLength: number) => {
  const limit = Math.max(0, (scaledLength - areaLength) / 2)

  // `+ 0` turns the -0 of a zero limit into 0.
  return Math.min(limit, Math.max(-limit, value)) + 0
}

/**
 * Keeps a zoomed photo's edges outside its area while it is panned (design
 * 12b, zn43av9y). The photo is centred in the area and scaled about its
 * centre, so an offset of zero shows its middle.
 *
 * @param offset - The wanted translation of the photo's centre, in CSS pixels.
 * @param scale - The zoom, 1 for the whole photo.
 * @param photo - The photo's unscaled size.
 * @param area - The size of the area the photo stands in.
 * @returns The offset moved back within reach; on an axis where the scaled
 *   photo is no larger than the area, zero.
 */
export const clampPanOffset = (
  offset: Offset,
  scale: number,
  photo: Size,
  area: Size,
): Offset => ({
  x: clampAxis(offset.x, photo.width * scale, area.width),
  y: clampAxis(offset.y, photo.height * scale, area.height),
})
