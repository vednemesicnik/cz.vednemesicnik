import type { FormatEnum, Sharp } from 'sharp'
import * as serverSharp from 'sharp'

export const sharp = serverSharp.default

type Options = {
  width: number | null
  height: number | null
  quality: number | null
  format: keyof FormatEnum | null
}

/**
 * Converts an image to the specified format, dimensions, and quality and returns a stream.
 *
 * @param {Uint8Array | File} image - The image to be converted. Can be a Uint8Array or a File.
 * @param {Object} options - The options for the conversion.
 * @param {number | null} options.width - The desired width of the converted image. If null, the original width is used.
 * @param {number | null} options.height - The desired height of the converted image. If null, the original height is used.
 * @param {number | null} options.quality - The quality of the converted image. If null, defaults to 100.
 * @param {keyof FormatEnum | null} options.format - The format of the converted image. Can be "avif", "webp", "png", or "jpeg". Defaults to "jpeg".
 * @returns {Promise<{stream: Sharp, contentType: string}>} - A promise that resolves to an object containing the image stream and its content type.
 */
export const getConvertedImageStream = async (
  image: Uint8Array | File,
  options: Options,
): Promise<{ stream: Sharp; contentType: string }> => {
  // Convert input to buffer if needed
  const imageBuffer = image instanceof File ? await image.bytes() : image

  // Create sharp instance
  const sharpImage = sharp(imageBuffer)

  // Get metadata for default dimensions
  const metadata = await sharpImage.metadata()

  // Set options with defaults
  const width = options.width || metadata.width
  const height = options.height || null
  const quality = options.quality || 100
  const format = options.format || 'jpeg'

  // Create transformation pipeline
  let pipeline = sharpImage.resize({
    fit: height ? 'cover' : undefined,
    height: height || undefined,
    width,
  })

  // Set format and quality
  pipeline = pipeline.toFormat(format, { quality })

  // Determine content type
  const contentType = `image/${format}`

  // Return stream and content type
  return {
    contentType,
    stream: pipeline,
  }
}
