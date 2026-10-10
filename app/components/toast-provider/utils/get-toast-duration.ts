import type { ToastTone } from '~/components/toast'

const BASE_MS = 4000
const PER_WORD_MS = 500
const ERROR_EXTRA_MS = 3000
const MINIMUM_MS = 5000
const MAXIMUM_MS = 10_000

/**
 * How long a toast stays: 4 s + 0.5 s per word, 5–10 s; an error 3 s longer,
 * 8–13 s (design g5, fezlur0t).
 *
 * @param message - The toast's text.
 * @param tone - The toast's tone.
 * @returns The duration in milliseconds.
 */
export const getToastDuration = (message: string, tone: ToastTone) => {
  const wordCount = message.trim().split(/\s+/).filter(Boolean).length
  const extra = tone === 'error' ? ERROR_EXTRA_MS : 0
  const duration = BASE_MS + PER_WORD_MS * wordCount + extra

  return Math.min(Math.max(duration, MINIMUM_MS + extra), MAXIMUM_MS + extra)
}
