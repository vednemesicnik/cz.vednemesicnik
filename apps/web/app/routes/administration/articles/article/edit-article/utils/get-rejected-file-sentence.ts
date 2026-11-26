import { ARTICLE_IMAGE_CONFIG } from '~/config/article-image-config'

const BYTES_PER_MEGABYTE = 1024 * 1024

/**
 * Why a picked file gets no tile, said under *Přidat obrázky* (design 24b): it
 * is not an image, or it is over the limit. Checked at selection; the server
 * checks again.
 *
 * @param file - The picked file.
 * @returns The sentence naming the file and the reason, or `null` for a file
 *   that may go.
 */
export const getRejectedFileSentence = (file: File): string | null => {
  if (!file.type.startsWith('image/')) {
    return `Vyberte obrázek — ${file.name} není obrázek.`
  }

  if (file.size > ARTICLE_IMAGE_CONFIG.maxFileBytes) {
    // Rounded up, so a file just over the limit never reads as 10 MB.
    const megabytes = Math.ceil(file.size / BYTES_PER_MEGABYTE)
    const limit = ARTICLE_IMAGE_CONFIG.maxFileBytes / BYTES_PER_MEGABYTE
    return `Vyberte obrázek do ${limit} MB — ${file.name} má ${megabytes} MB.`
  }

  return null
}
