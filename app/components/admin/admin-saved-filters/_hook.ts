import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { href, useFetcher } from 'react-router'

import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { DIALOG_RETURN_VALUE } from '~/config/dialog-config'
import { FORM_CONFIG } from '~/config/form-config'

import type { FilterActionData, FilterFetcher } from './_types'

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

    if (fetcher.data?.submissionResult.status === 'success') {
      dialogRef.current?.close()
    }
  }, [fetcher.data, fetcher.state])

  return dialogRef
}

/**
 * Wires the shared delete confirmation dialog to the saved-filters endpoint. The
 * generic `useAdminDeleteConfirmationDialog` cannot serve here: it posts a bare
 * `delete` intent to a record's own route, while this endpoint needs
 * `delete-filter` plus the row id.
 *
 * @param dialogRef - The confirmation dialog, which the caller keeps mounted.
 * @returns `openDialog`, which remembers the row the confirmation applies to.
 */
export const useDeleteFilterConfirmation = (
  dialogRef: RefObject<HTMLDialogElement | null>,
) => {
  const [pendingFilterId, setPendingFilterId] = useState<string | null>(null)
  const [returnValue, setReturnValue] = useState('')
  const fetcher = useFetcher<FilterActionData>()

  const authenticityTokenName = FORM_CONFIG.authenticityToken.name
  const authenticityTokenValue = useAuthenticityToken()
  const intentName = FORM_CONFIG.intent.name
  const intentValue = FORM_CONFIG.intent.value.deleteFilter

  useEffect(() => {
    const dialog = dialogRef.current

    if (dialog === null) return

    const handleClose = () => {
      setReturnValue(dialog.returnValue)
    }

    dialog.addEventListener('close', handleClose)

    return () => dialog.removeEventListener('close', handleClose)
  }, [dialogRef])

  useEffect(() => {
    if (returnValue !== DIALOG_RETURN_VALUE.accept) return
    if (pendingFilterId === null) return

    // Reset so confirming a second row re-triggers the effect.
    setReturnValue('')
    setPendingFilterId(null)

    const formData = new FormData()

    formData.append(authenticityTokenName, authenticityTokenValue)
    formData.append(intentName, intentValue)
    formData.append('id', pendingFilterId)

    void fetcher.submit(formData, {
      action: href('/administration/filters'),
      method: 'POST',
    })
  }, [
    authenticityTokenName,
    authenticityTokenValue,
    fetcher,
    intentName,
    intentValue,
    pendingFilterId,
    returnValue,
  ])

  const openDialog = useCallback(
    (filterId: string) => {
      setPendingFilterId(filterId)
      dialogRef.current?.showModal()
    },
    [dialogRef],
  )

  return { openDialog }
}
