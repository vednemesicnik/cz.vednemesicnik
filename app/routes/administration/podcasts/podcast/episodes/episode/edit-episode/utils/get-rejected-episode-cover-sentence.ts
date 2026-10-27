import { EPISODE_COVER_CONFIG } from '~/config/episode-cover-config'

const BYTES_PER_MEGABYTE = 1024 * 1024

// One decimal, rounded up, so a file just over the limit never reads as it.
const megabyteFormat = new Intl.NumberFormat('cs', { maximumFractionDigits: 1 })
const formatMegabytes = (bytes: number) =>
  megabyteFormat.format(Math.ceil((bytes / BYTES_PER_MEGABYTE) * 10) / 10)

/**
 * Why a picked episode cover does not upload, said under its field (design
 * 27d), in the issue cover's sentences (26d, copy yzyd9p1l): it is not an
 * image, or it is over 5 MB. Checked at selection; the server checks again.
 *
 * @param file - The picked file.
 * @returns „Vyberte obrázek do 5 MB — obalka.jpg má 6,2 MB.“, „Vyberte
 *   obrázek — obalka.pdf není obrázek.“, or `null` for a file that may go.
 */
export const getRejectedEpisodeCoverSentence = (file: File): string | null => {
  const { maxFileBytes } = EPISODE_COVER_CONFIG

  if (!file.type.startsWith('image/')) {
    return `Vyberte obrázek — ${file.name} není obrázek.`
  }
  if (file.size > maxFileBytes) {
    return `Vyberte obrázek do ${maxFileBytes / BYTES_PER_MEGABYTE} MB — ${file.name} má ${formatMegabytes(file.size)} MB.`
  }
  return null
}
