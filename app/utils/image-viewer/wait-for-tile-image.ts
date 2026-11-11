// The longest an opening waits for the tile's image to decode, so a tap
// always answers at once.
const DECODE_TIMEOUT = 150

/**
 * Waits until the tile's image in the viewer's frame can be painted, so the
 * photo's flight starts sharp (design 12b, l18gjrxu). It never waits for the
 * large photo, nor longer than {@link DECODE_TIMEOUT}.
 *
 * Uses a timeout, not `requestAnimationFrame`: during a view transition's
 * update the page doesn't render, so a frame never comes.
 *
 * @param frame - The viewer's photo frame.
 */
export const waitForTileImage = async (frame: Element | null) => {
  const image = frame?.querySelector('img[data-tile-image]')

  if (!(image instanceof HTMLImageElement)) return

  await Promise.race([
    image.decode().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, DECODE_TIMEOUT)),
  ])
}
