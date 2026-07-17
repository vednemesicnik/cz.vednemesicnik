import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { type FetcherSubmitOptions, useFetcher } from 'react-router'

import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { DIALOG_RETURN_VALUE } from '~/config/dialog-config'
import { FORM_CONFIG } from '~/config/form-config'

type Options = {
  action: FetcherSubmitOptions['action']
  selectedIds: string[]
  // Called once the bulk delete has completed successfully (e.g. to clear the
  // selection). Deliberately a separate hook from the single-delete dialog hook,
  // which is shared by ~18 item rows and must stay untouched.
  onDone: () => void
}

export const useAdminBulkDelete = (
  dialogRef: RefObject<HTMLDialogElement | null>,
  { action, selectedIds, onDone }: Options,
) => {
  const [returnValue, setReturnValue] = useState<string>('')
  const fetcher = useFetcher()
  const isSubmitting = fetcher.state !== 'idle'

  const authTokenName = FORM_CONFIG.authenticityToken.name
  const authTokenValue = useAuthenticityToken()
  const intentName = FORM_CONFIG.intent.name
  const intentValue = FORM_CONFIG.intent.value.bulkDelete

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
    // Reset so a second confirmation re-triggers the effect.
    setReturnValue('')

    const formData = new FormData()
    formData.append(authTokenName, authTokenValue)
    formData.append(intentName, intentValue)
    for (const id of selectedIds) formData.append('ids', id)
    void fetcher.submit(formData, { action, method: 'POST' })
  }, [
    action,
    authTokenName,
    authTokenValue,
    fetcher,
    intentName,
    intentValue,
    returnValue,
    selectedIds,
  ])

  // Fire onDone once the submit round-trips back to idle with the action's data
  // (the reference route revalidates without redirecting, so data is present).
  const wasSubmittingRef = useRef(false)
  useEffect(() => {
    if (fetcher.state !== 'idle') {
      wasSubmittingRef.current = true
      return
    }
    if (wasSubmittingRef.current) {
      wasSubmittingRef.current = false
      if (fetcher.data != null) onDone()
    }
  }, [fetcher.state, fetcher.data, onDone])

  const openDialog = useCallback(() => {
    dialogRef.current?.showModal()
  }, [dialogRef])

  return { isSubmitting, openDialog }
}
