import type { ColorScheme } from '@generated/prisma/enums'

import { getColorSchemeMetaContent } from './get-color-scheme-meta-content'

// React commits within milliseconds; past this the transition goes on anyway.
const TIMEOUT_MS = 500

/**
 * Resolves once the root layout has rendered the colour scheme into
 * `<meta name="color-scheme">`, so a view transition captures the page in its
 * new colours. Watches the attribute rather than animation frames, which the
 * browser pauses while a transition's update runs.
 *
 * @param colorScheme - The scheme just submitted.
 * @returns A promise that settles when the meta changes, or after a timeout.
 */
export const waitForColorScheme = (colorScheme: ColorScheme) => {
  const expectedContent = getColorSchemeMetaContent(colorScheme)
  const meta = document.querySelector('meta[name="color-scheme"]')

  return new Promise<void>((resolve) => {
    if (meta === null || meta.getAttribute('content') === expectedContent) {
      resolve()
      return
    }

    const settle = () => {
      observer.disconnect()
      window.clearTimeout(timeout)
      resolve()
    }

    const observer = new MutationObserver(() => {
      if (meta.getAttribute('content') === expectedContent) {
        settle()
      }
    })
    const timeout = window.setTimeout(settle, TIMEOUT_MS)

    observer.observe(meta, { attributeFilter: ['content'] })
  })
}
