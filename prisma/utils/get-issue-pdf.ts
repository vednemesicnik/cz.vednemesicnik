import fs from 'node:fs'

type Args = {
  fileName: string
  filePath: string
}

export type IssuePdf = {
  fileName: string
  contentType: string
  blob: Uint8Array
}
export const getIssuePdf = async ({
  filePath,
  fileName,
}: Args): Promise<IssuePdf> => {
  if (!filePath.endsWith('.pdf'))
    throw new Error(`File ${filePath} is not a PDF file.`)

  return {
    blob: await fs.promises.readFile(filePath),
    contentType: 'application/pdf',
    fileName: fileName,
  }
}
