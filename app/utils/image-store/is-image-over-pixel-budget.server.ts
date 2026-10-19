import { MAX_IMAGE_PIXELS } from '~/config/image-variants-config'
import { sharp } from '~/utils/sharp.server'

/**
 * Whether an upload has more pixels than Sharp may decode, read from its
 * header alone, so a route can refuse it with a sentence before anything is
 * stored. A file Sharp cannot read is not over the budget here; storing it
 * fails as before.
 *
 * @param file - The uploaded image.
 * @returns `true` when width × height is over `MAX_IMAGE_PIXELS`.
 */
export async function isImageOverPixelBudget(file: File): Promise<boolean> {
  try {
    const { width, height } = await sharp(
      new Uint8Array(await file.arrayBuffer()),
      { failOn: 'none', limitInputPixels: false },
    ).metadata()
    return width * height > MAX_IMAGE_PIXELS
  } catch {
    return false
  }
}
