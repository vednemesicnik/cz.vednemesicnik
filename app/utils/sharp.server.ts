import * as serverSharp from "sharp"

export const sharp = serverSharp.default

type Options = {
  width: string | null
  height: string | null
  quality: string | null
  format: string | null
}

/**
 * Converts an image to the specified format, dimensions, and quality.
 *
 * @param {Uint8Array | File} image - The image to be converted. Can be a Uint8Array or a File.
 * @param {Object} options - The options for the conversion.
 * @param {string | null} options.width - The desired width of the converted image. If null, the original width is used.
 * @param {string | null} options.height - The desired height of the converted image. If null, the original height is used.
 * @param {string | null} options.quality - The quality of the converted image. If null, defaults to 100.
 * @param {string | null} options.format - The format of the converted image. Can be "avif", "webp", "png", or "jpeg". Defaults to "jpeg".
 * @returns {Promise<{blob: Uint8Array<ArrayBufferLike>, contentType: string}>} - A promise that resolves to an object containing the converted image blob and its content type.
 */
export const convertImage = async (
  image: Uint8Array | File,
  options: Options
): Promise<{ blob: Uint8Array<ArrayBufferLike>; contentType: string }> => {
  const sharpImage = sharp(
    image instanceof Uint8Array ? image : await image.bytes()
  )

  const metadata = await sharpImage.metadata()

  const width = options.width ? Number(options.width) : metadata.width
  const height = options.height ? Number(options.height) : metadata.height
  const quality = options.quality ? Number(options.quality) : 100
  const format = options.format

  sharpImage.resize({ width })

  if (height !== undefined) {
    sharpImage.resize({ height, fit: "cover" })
  }

  let contentType: string

  switch (format) {
    case "avif":
      sharpImage.avif({ quality })
      contentType = "image/avif"
      break
    case "webp":
      sharpImage.webp({ quality })
      contentType = "image/webp"
      break
    case "png":
      sharpImage.png({ quality })
      contentType = "image/png"
      break
    case "jpeg":
    default:
      sharpImage.jpeg({ quality })
      contentType = "image/jpeg"
      break
  }

  const blob = Uint8Array.from(await sharpImage.toBuffer())

  return { blob, contentType }
}
