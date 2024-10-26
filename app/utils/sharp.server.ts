import * as serverSharp from "sharp"

export const sharp = serverSharp.default

export const convertImage = async (
  image: Buffer,
  contentType: string,
  options: { width: string | null; quality: string | null }
) => {
  const sharpImage = sharp(image)

  const metadata = await sharpImage.metadata()

  const width = options.width ? Number(options.width) : metadata.width
  const quality = options.quality ? Number(options.quality) : 100

  switch (contentType) {
    case "image/jpeg":
      return sharpImage.resize({ width }).jpeg({ quality }).toBuffer()
    case "image/png":
      return sharpImage.resize({ width }).png({ quality }).toBuffer()
    default:
      return image
  }
}
