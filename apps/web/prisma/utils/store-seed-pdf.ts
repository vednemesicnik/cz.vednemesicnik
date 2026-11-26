import { readFile } from 'node:fs/promises'

import { createId } from '@paralleldrive/cuid2'

import { buildPdfKey } from '~/utils/pdf-store/pdf-key'
import { pdfStore } from '~/utils/pdf-store/pdf-store.server'
import { PDF_CONTENT_TYPE } from '~/utils/pdf-store/store-pdf.server'

type Args = {
  fileName: string
  filePath: string
}

// IssuePDF row data ready to spread into a nested Prisma `pdf: { create: ... }`.
// The PDF binary goes to the object store; only metadata lives in the DB.
export type SeedPdf = { id: string; fileName: string; contentType: string }

// Write the PDF to the store under a fresh id and return the row data. The id is
// generated up front so the object is written before the row is committed
// (files-before-DB), matching the admin create path (see e.g.
// app/routes/administration/archive/add-issue/_action.ts).
export const storeSeedPdf = async ({
  fileName,
  filePath,
}: Args): Promise<SeedPdf> => {
  if (!filePath.endsWith('.pdf')) {
    throw new Error(`File ${filePath} is not a PDF file.`)
  }

  const buffer = await readFile(filePath)
  const id = createId()
  await pdfStore.put(buildPdfKey(id), buffer, PDF_CONTENT_TYPE)

  return { contentType: PDF_CONTENT_TYPE, fileName, id }
}
