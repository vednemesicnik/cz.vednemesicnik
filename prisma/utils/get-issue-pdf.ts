import fs from 'node:fs'

type Args = {
  fileName: string
  filePath: string
}

export type IssuePdf = {
  fileName: string
  contentType: string
  blob: Uint8Array<ArrayBuffer>
}
export const getIssuePdf = async ({
  filePath,
  fileName,
}: Args): Promise<IssuePdf> => {
  if (!filePath.endsWith('.pdf'))
    throw new Error(`File ${filePath} is not a PDF file.`)

  // fs.promises.readFile() returns Buffer which extends Uint8Array<ArrayBufferLike>.
  // Prisma expects Uint8Array<ArrayBuffer> (not ArrayBufferLike which includes SharedArrayBuffer).
  // This assertion is safe because Buffer always uses ArrayBuffer, never SharedArrayBuffer.
  const blob = (await fs.promises.readFile(filePath)) as Uint8Array<ArrayBuffer>

  return {
    blob,
    contentType: 'application/pdf',
    fileName: fileName,
  }
}
