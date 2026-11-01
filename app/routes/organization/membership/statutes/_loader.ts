import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

import { buildPdfResponse } from '~/utils/pdf-store/serve-pdf.server'

const FILE_NAME = 'stanovy-spolku.pdf'

// Committed with the code and copied into the image, as it changes only when the
// spolek adopts new statutes.
const FILE_PATH = join(process.cwd(), 'documents', FILE_NAME)

export const loader = async () => {
  try {
    const [file, stats] = await Promise.all([
      readFile(FILE_PATH),
      stat(FILE_PATH),
    ])

    return buildPdfResponse(new Uint8Array(file), {
      contentType: 'application/pdf',
      etag: `"${stats.size}-${stats.mtimeMs}"`,
      fileName: FILE_NAME,
      lastModified: stats.mtime.toUTCString(),
    })
  } catch {
    throw new Response('Not found.', { status: 404 })
  }
}
