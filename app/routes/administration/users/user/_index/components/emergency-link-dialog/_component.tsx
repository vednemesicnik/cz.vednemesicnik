import { useEffect, useId, useState } from 'react'
import { href, useFetcher } from 'react-router'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { adminCsrfFormMessage } from '~/components/boundary-error/utils/boundary-copy'
import { Button } from '~/components/button'
import { CopyButton } from '~/components/copy-button'
import { ErrorMessage } from '~/components/error-message'
import { Label } from '~/components/label'
import type { action as emergencyLinkAction } from '~/routes/administration/users/user/emergency-link/_action'
import { useModalDialog } from '~/utils/use-modal-dialog'

import styles from './_styles.module.css'

type Props = {
  userId: string
  accountName: string
  // When the link that still works was issued (`14:12`), or `null`.
  previousLinkTime: string | null
  onClose: () => void
}

/**
 * Issues an emergency sign-in link during a Google outage (#578, design 28e):
 * first the reminder to check the person's identity, and the link is created
 * only by „Vydat odkaz“ once that is ticked; then the link, shown once, with a
 * copy and the time it stops working. Closing needs no safeguard: a lost link
 * is issued again. Copy approved (n2fjcvyq).
 */
export const EmergencyLinkDialog = ({
  userId,
  accountName,
  previousLinkTime,
  onClose,
}: Props) => {
  const fetcher = useFetcher<typeof emergencyLinkAction>()
  const ref = useModalDialog(onClose)
  const checkboxId = useId()
  const [isConfirmed, setIsConfirmed] = useState(false)

  const result = fetcher.data
  const isSubmitting = fetcher.state !== 'idle'
  const handleClose = () => ref.current?.close()

  // The mode was switched off or the account changed meanwhile: the detail
  // reloads without the item.
  useEffect(() => {
    if (result?.status === 'not-found') ref.current?.close()
  }, [ref, result])

  if (result?.status === 'issued') {
    return (
      <AdminDialog ref={ref}>
        <AdminModalContent>
          <AdminModalTitle>Nouzový odkaz je vydaný</AdminModalTitle>
          <AdminModalDescription>
            Předejte ho telefonem nebo v chatu člověku, jehož totožnost jste
            ověřili. Lze ho použít jen jednou. Platí nejdéle 15 minut, do{' '}
            {result.expiresAt}. Po zavření dialogu se už nezobrazí.
          </AdminModalDescription>

          <div className={styles.link}>
            <CopyButton value={result.url}>{result.url}</CopyButton>
          </div>

          <AdminModalActions>
            <Button onClick={handleClose} size={'sm'} type={'button'}>
              Hotovo
            </Button>
          </AdminModalActions>
        </AdminModalContent>
      </AdminDialog>
    )
  }

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        {/* The account belongs to the title, tight under it, as Účet: in 20c. */}
        <hgroup className={styles.heading}>
          <AdminModalTitle>Vydat nouzový odkaz?</AdminModalTitle>
          <p className={styles.account}>
            Účet: <span className={styles.accountName}>{accountName}</span>
          </p>
        </hgroup>

        <AdminModalDescription>
          Kdokoli s tímto odkazem může potvrdit přihlášení do tohoto účtu.
        </AdminModalDescription>
        <AdminModalDescription>
          Před vydáním ověřte totožnost osobně nebo při hlasovém hovoru. Zpráva
          ani e-mail nestačí.
        </AdminModalDescription>
        {previousLinkTime !== null && (
          <AdminModalDescription>
            {`Vydáním nového odkazu přestane platit předchozí z ${previousLinkTime}.`}
          </AdminModalDescription>
        )}

        <fetcher.Form
          action={href('/administration/users/:userId/emergency-link', {
            userId,
          })}
          className={styles.form}
          method={'post'}
        >
          <AuthenticityTokenInput />

          {result?.status === 'csrf' && (
            <ErrorMessage>{adminCsrfFormMessage}</ErrorMessage>
          )}

          <div className={styles.confirmation}>
            <input
              checked={isConfirmed}
              className={styles.checkbox}
              id={checkboxId}
              name={'identityConfirmed'}
              onChange={(event) => setIsConfirmed(event.target.checked)}
              type={'checkbox'}
            />
            <Label htmlFor={checkboxId}>
              Totožnost ověřena osobně nebo při hlasovém hovoru
            </Label>
          </div>

          <AdminModalActions>
            <Button
              onClick={handleClose}
              size={'sm'}
              type={'button'}
              variant={'ghost'}
            >
              Zrušit
            </Button>
            <Button
              disabled={!isConfirmed || isSubmitting}
              size={'sm'}
              type={'submit'}
            >
              Vydat odkaz
            </Button>
          </AdminModalActions>
        </fetcher.Form>
      </AdminModalContent>
    </AdminDialog>
  )
}
