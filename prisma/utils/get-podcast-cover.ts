import fs from 'node:fs'

type Args = {
  altText: string
  filePath: string
}

export type PodcastCover = {
  altText: string
  contentType: string
  blob: Uint8Array<ArrayBuffer>
}
export const getPodcastCover = async ({
  altText,
  filePath,
}: Args): Promise<PodcastCover> => {
  if (!filePath.endsWith('.jpg'))
    throw new Error(`File ${filePath} is not a JPG file.`)

  // fs.promises.readFile() returns Buffer which extends Uint8Array<ArrayBufferLike>.
  // Prisma expects Uint8Array<ArrayBuffer> (not ArrayBufferLike which includes SharedArrayBuffer).
  // This assertion is safe because Buffer always uses ArrayBuffer, never SharedArrayBuffer.
  const blob = (await fs.promises.readFile(filePath)) as Uint8Array<ArrayBuffer>

  return {
    altText,
    blob,
    contentType: 'image/png',
  }
}
