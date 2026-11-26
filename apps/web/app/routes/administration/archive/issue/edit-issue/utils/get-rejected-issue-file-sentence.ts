import { ISSUE_FILE_CONFIG } from '~/config/issue-file-config'

import type { IssueFileKind } from '../../issue-files/_schema'

const BYTES_PER_MEGABYTE = 1024 * 1024

// One decimal, rounded up, so a file just over the limit never reads as it.
const megabyteFormat = new Intl.NumberFormat('cs', { maximumFractionDigits: 1 })
const formatMegabytes = (bytes: number) =>
  megabyteFormat.format(Math.ceil((bytes / BYTES_PER_MEGABYTE) * 10) / 10)

/**
 * Why a picked cover or PDF does not upload, said under its field (design
 * 26d, copy yzyd9p1l): it is of another type, or over the limit. Checked at
 * selection; the server checks again.
 *
 * @param kind - The cover or the PDF.
 * @param file - The picked file.
 * @returns „Vyberte PDF do 10 MB — podzim_tisk.pdf má 23,4 MB. Zkuste PDF
 *   exportovat pro web.“, „Vyberte obrázek — obalka.pdf není obrázek.“ and the
 *   like, or `null` for a file that may go.
 */
export const getRejectedIssueFileSentence = (
  kind: IssueFileKind,
  file: File,
): string | null => {
  const { maxFileBytes } = ISSUE_FILE_CONFIG[kind]
  const limit = maxFileBytes / BYTES_PER_MEGABYTE

  if (kind === 'pdf') {
    if (file.type !== ISSUE_FILE_CONFIG.pdf.contentType) {
      return `Vyberte PDF — ${file.name} není PDF.`
    }
    if (file.size > maxFileBytes) {
      return `Vyberte PDF do ${limit} MB — ${file.name} má ${formatMegabytes(file.size)} MB. Zkuste PDF exportovat pro web.`
    }
    return null
  }

  if (!file.type.startsWith('image/')) {
    return `Vyberte obrázek — ${file.name} není obrázek.`
  }
  if (file.size > maxFileBytes) {
    return `Vyberte obrázek do ${limit} MB — ${file.name} má ${formatMegabytes(file.size)} MB.`
  }
  return null
}
