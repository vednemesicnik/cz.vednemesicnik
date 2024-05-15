import fs from "node:fs"

type Args = {
  altText: string
  filePath: string
}

export type PodcastCover = {
  altText: string
  contentType: string
  blob: Buffer
}
export const getPodcastCover = async ({ altText, filePath }: Args): Promise<PodcastCover> => {
  if (!filePath.endsWith(".jpg")) throw new Error(`File ${filePath} is not a JPG file.`)

  return {
    altText,
    contentType: "image/png",
    blob: await fs.promises.readFile(filePath),
  }
}
