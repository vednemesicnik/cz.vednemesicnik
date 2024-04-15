import fs from "node:fs"

type Args = {
  altText: string
  filePath: string
}

export type ArchiveIssueCover = {
  altText: string
  contentType: string
  blob: Buffer
}
export const getArchivedIssueCover = async ({ altText, filePath }: Args): Promise<ArchiveIssueCover> => {
  if (!filePath.endsWith(".png")) throw new Error(`File ${filePath} is not a PNG file.`)

  return {
    altText,
    contentType: "image/png",
    blob: await fs.promises.readFile(filePath),
  }
}
