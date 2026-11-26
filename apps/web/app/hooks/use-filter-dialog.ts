import { type RefObject, useEffect, useRef } from 'react'

import type { FilterFetcher } from '~/types/saved-filter'

/**
 * Drives a saved-filter dialog that is mounted only while it is open: it shows the
 * modal on mount, closes it once its fetcher round-trips with a successful Conform
 * reply, and reports every close so the parent can unmount it. Remounting per open
 * is what keeps a form from reappearing with the previous submission's values.
 *
 * @param fetcher - The fetcher the dialog's form submits through.
 * @param onClose - Called on the native `close` event; must be stable.
 * @returns The ref to attach to the dialog.
 */
export const useFilterDialog = (
  fetcher: FilterFetcher,
  onClose: () => void,
): RefObject<HTMLDialogElement | null> => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  useEffect(() => {
    // Mount-only: showModal() on an already-open dialog throws.
    dialogRef.current?.showModal()
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current

    if (dialog === null) return

    dialog.addEventListener('close', onClose)

    return () => dialog.removeEventListener('close', onClose)
  }, [onClose])

  // `fetcher.data` outlives the submit, so the closing has to be tied to the round
  // trip rather than to the mere presence of a reply.
  const wasSubmittingRef = useRef(false)

  useEffect(() => {
    if (fetcher.state !== 'idle') {
      wasSubmittingRef.current = true

      return
    }

    if (!wasSubmittingRef.current) {
      return
    }

    wasSubmittingRef.current = false

    if (fetcher.data?.submissionResult?.status === 'success') {
      dialogRef.current?.close()
    }
  }, [fetcher.data, fetcher.state])

  return dialogRef
}
