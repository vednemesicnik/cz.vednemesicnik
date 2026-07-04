import { createId } from '@paralleldrive/cuid2'

import { buildPdfKey } from './pdf-key'
import { pdfStore } from './pdf-store.server'

// The stored object and the DB `contentType` metadata are both bound to this one
// constant, so the object's content type and the download response header can never
// diverge (uploads are validated to be application/pdf, so this always holds).
export const PDF_CONTENT_TYPE = 'application/pdf'

// Write a PDF object under its owning row `id`. Called before the row is committed
// (files-before-DB), mirroring the image store's storeImageVariants.
export async function storePdf(id: string, file: File) {
  await pdfStore.put(buildPdfKey(id), await file.bytes(), PDF_CONTENT_TYPE)
}

// Remove a PDF object — used after a durable DB delete (delete-after-DB).
export async function deletePdfObject(id: string) {
  await pdfStore.delete([buildPdfKey(id)])
}

// Row data for the IssuePDF update, spread into a Prisma `pdf.update.data`. The
// store fields (new id + contentType) are present only when the file is replaced;
// otherwise just the filename is written.
export type PdfUpdateData = { fileName: string } & Partial<{
  id: string
  contentType: string
}>

type PreparePdfReplacementArgs = {
  pdfId: string
  fileName: string
  file: File | undefined
}

// Prepare a PDF replacement for an edit action. When a new `file` is supplied it is
// stored under a fresh id (before the caller commits the row) and the returned
// `data` carries that id + content type so the row points at the new object;
// otherwise only `fileName` is updated. The returned `cleanup` drops the previous
// object and MUST be called only after the DB update has committed (delete files
// after DB, never before). A no-op when the file is unchanged.
export async function preparePdfReplacement({
  pdfId,
  fileName,
  file,
}: PreparePdfReplacementArgs): Promise<{
  data: PdfUpdateData
  cleanup: () => Promise<void>
}> {
  if (file === undefined) {
    return { cleanup: async () => {}, data: { fileName } }
  }

  // A fresh id gives the replacement a new store key (and download cache key),
  // leaving the previous object untouched until the update is durable.
  const newId = createId()
  await storePdf(newId, file)

  return {
    cleanup: async () => {
      await deletePdfObject(pdfId)
    },
    data: { contentType: PDF_CONTENT_TYPE, fileName, id: newId },
  }
}
