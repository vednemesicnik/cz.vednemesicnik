import fs from "node:fs"

type Args = {
  fileName: string
  filePath: string
}

export type ArchiveIssuePdf = {
  fileName: string
  contentType: string
  blob: Buffer
}
export const getArchivedIssuePdf = async ({ filePath, fileName }: Args): Promise<ArchiveIssuePdf> => {
  if (!filePath.endsWith(".pdf")) throw new Error(`File ${filePath} is not a PDF file.`)

  return {
    fileName: fileName,
    contentType: "application/pdf",
    blob: await fs.promises.readFile(filePath),
  }
}
