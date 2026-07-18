import { type RefObject, useId } from 'react'
import { useFetcher } from 'react-router'

import { AdminButton } from '~/components/admin/admin-button'
import { AdminInput } from '~/components/admin/admin-input'
import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { FORM_CONFIG } from '~/config/form-config'

import styles from './_styles.module.css'

type Props = {
  ref: RefObject<HTMLDialogElement | null>
  action: string
  fetcherKey: string
  intent: string
  title: string
  description: string
  confirmLabel: string
  // Initial datetime-local value (YYYY-MM-DDTHH:mm); defaults to now.
  defaultValue?: string
}

// datetime-local expects local wall-clock time as YYYY-MM-DDTHH:mm. toISOString
// would emit UTC and shift the value, so build it from the local components.
const toLocalDateTimeValue = (date: Date): string => {
  const pad = (value: number) => String(value).padStart(2, '0')

  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export const AdminPublishDateDialog = ({
  ref,
  action,
  fetcherKey,
  intent,
  title,
  description,
  confirmLabel,
  defaultValue,
}: Props) => {
  const fetcher = useFetcher({ key: fetcherKey })

  // Unique per instance so the label/input association holds when both the
  // backdated-publish and change-date dialogs are on the page at once.
  const inputId = useId()

  const now = toLocalDateTimeValue(new Date())

  // Read ref.current inside the handlers, not during render: the <dialog> is
  // attached in the commit phase, so at render time ref.current is still null.
  const handleCancel = () => ref.current?.close()
  // Close on submit rather than the confirm button's click, so submitting with
  // Enter from the date field closes the dialog too. Invalid values (a future
  // date past max) block native submit, so the dialog stays open as expected.
  const handleSubmit = () => ref.current?.close()

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>{title}</AdminModalTitle>
        <AdminModalDescription>{description}</AdminModalDescription>

        <fetcher.Form
          action={action}
          className={styles.form}
          method={'post'}
          onSubmit={handleSubmit}
        >
          <AuthenticityTokenInput />
          <input
            name={FORM_CONFIG.intent.name}
            type={'hidden'}
            value={intent}
          />

          <AdminInput
            defaultValue={defaultValue ?? now}
            id={inputId}
            label={'Datum publikace'}
            max={now}
            name={'publishedAt'}
            required
            type={'datetime-local'}
          />

          <AdminModalActions>
            <AdminButton
              onClick={handleCancel}
              type={'button'}
              variant={'secondary'}
            >
              Zrušit
            </AdminButton>
            <AdminButton type={'submit'}>{confirmLabel}</AdminButton>
          </AdminModalActions>
        </fetcher.Form>
      </AdminModalContent>
    </AdminDialog>
  )
}
