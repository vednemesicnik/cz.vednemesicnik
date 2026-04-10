import { type RefObject, useCallback, useEffect, useState } from 'react'
import { type FetcherSubmitOptions, useFetcher } from 'react-router'

import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { DIALOG_RETURN_VALUE } from '~/config/dialog-config'
import { FORM_CONFIG } from '~/config/form-config'

type Options = {
  withRedirect?: boolean
  action: FetcherSubmitOptions['action']
  key?: string
}

export const useAdminDeleteConfirmationDialog = (
  dialogRef: RefObject<HTMLDialogElement | null>,
  options: Options,
) => {
  const [returnValue, setReturnValue] = useState<string>('')
  const { submit } = useFetcher({ key: options.key })

  const authTokenName = FORM_CONFIG.authenticityToken.name
  const authTokenValue = useAuthenticityToken()
  const intentName = FORM_CONFIG.intent.name
  const intentValue = FORM_CONFIG.intent.value.delete
  const redirectName = FORM_CONFIG.redirect.name
  const redirectValue = options?.withRedirect ? 'true' : 'false'

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
    if (returnValue === DIALOG_RETURN_VALUE.accept) {
      const formData = new FormData()

      formData.append(authTokenName, authTokenValue)
      formData.append(intentName, intentValue)
      formData.append(redirectName, redirectValue)

      void submit(formData, { action: options.action, method: 'POST' })
    }
  }, [
    authTokenName,
    authTokenValue,
    intentName,
    intentValue,
    options.action,
    redirectName,
    redirectValue,
    returnValue,
    submit,
  ])

  const openDialog = useCallback(() => {
    dialogRef.current?.showModal()
  }, [dialogRef])

  return { openDialog }
}
