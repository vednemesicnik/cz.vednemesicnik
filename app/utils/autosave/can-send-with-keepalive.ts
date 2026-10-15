import { AUTOSAVE_CONFIG } from '~/config/autosave-config'

const encoder = new TextEncoder()

// A multipart part's boundary and headers, on top of its name and value.
const PART_OVERHEAD_BYTES = 150

/**
 * Whether a save can still go out while the page closes: a `keepalive`
 * request carries no file here and stays under the browser's 64 KB, multipart
 * framing counted.
 *
 * @param formData - The save as it would be sent.
 * @returns `false` for a file or a body over the limit.
 */
export const canSendWithKeepalive = (formData: FormData): boolean => {
  let size = 0

  for (const [name, value] of formData) {
    if (typeof value !== 'string') return false
    size +=
      PART_OVERHEAD_BYTES +
      encoder.encode(name).length +
      encoder.encode(value).length
  }

  return size <= AUTOSAVE_CONFIG.keepaliveLimitBytes
}
