import * as serverSharp from "sharp"

export const sharp = serverSharp.default

type Options = {
  width: string | null
  height: string | null
  quality: string | null
  format: string | null
}

export const convertImage = async (
  image: Uint8Array | File,
  options: Options
) => {
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

  const blob = await sharpImage.toBuffer()

  return { blob, contentType }
}
