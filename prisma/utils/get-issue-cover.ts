import fs from "node:fs"

type Args = {
  altText: string
  filePath: string
}

export type IssueCover = {
  altText: string
  contentType: string
  blob: Uint8Array
}
export const getIssueCover = async ({
  altText,
  filePath,
}: Args): Promise<IssueCover> => {
  if (!filePath.endsWith(".jpg"))
    throw new Error(`File ${filePath} is not a JPG file.`)

  return {
    altText,
    contentType: "image/png",
    blob: await fs.promises.readFile(filePath),
  }
}
