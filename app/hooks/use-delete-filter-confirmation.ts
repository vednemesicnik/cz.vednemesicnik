import { type RefObject, useCallback, useEffect, useState } from 'react'
import { href, useFetcher } from 'react-router'

import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { DIALOG_RETURN_VALUE } from '~/config/dialog-config'
import { FORM_CONFIG } from '~/config/form-config'
import type { FilterActionData } from '~/types/saved-filter'

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
      const dialog = dialogRef.current

      if (dialog === null) return

      setPendingFilterId(filterId)
      // Closing with Esc leaves `returnValue` untouched, so a previous accept
      // would still be there and would delete this row without a confirmation.
      dialog.returnValue = ''
      dialog.showModal()
    },
    [dialogRef],
  )

  return { openDialog }
}
