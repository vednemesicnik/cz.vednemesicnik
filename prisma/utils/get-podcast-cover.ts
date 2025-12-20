import fs from 'node:fs'

type Args = {
  altText: string
  filePath: string
}

export type PodcastCover = {
  altText: string
  contentType: string
  blob: Uint8Array
}
export const getPodcastCover = async ({
  altText,
  filePath,
}: Args): Promise<PodcastCover> => {
  if (!filePath.endsWith('.jpg'))
    throw new Error(`File ${filePath} is not a JPG file.`)

  return {
    altText,
    blob: await fs.promises.readFile(filePath),
    contentType: 'image/png',
  }
}
