import {
  type RefObject,
  type SubmitEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
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
  // Initial value as an ISO/UTC instant; the picker shows it in local time.
  // Defaults to now when omitted.
  defaultPublishedAt?: string
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
  defaultPublishedAt,
}: Props) => {
  const fetcher = useFetcher({ key: fetcherKey })

  // Unique per instance so the label/input association holds when both the
  // backdated-publish and change-date dialogs are on the page at once.
  const inputId = useId()

  // Carries the timezone-correct instant submitted to the server; filled from the
  // picker on submit (see handleSubmit).
  const publishedAtRef = useRef<HTMLInputElement>(null)

  // Recompute "now" each time the dialog opens (via the `open` attribute) so the
  // max and default stay current on long-lived pages. `openCount` bumps on every
  // open to remount the input, which re-applies its default/max — a mounted
  // input keeps its value otherwise. <dialog> has no open event, hence the
  // MutationObserver.
  const [now, setNow] = useState(() => toLocalDateTimeValue(new Date()))
  const [openCount, setOpenCount] = useState(0)

  useEffect(() => {
    const dialog = ref.current

    if (dialog === null) return

    const observer = new MutationObserver(() => {
      if (dialog.open) {
        setNow(toLocalDateTimeValue(new Date()))
        setOpenCount((count) => count + 1)
      }
    })

    observer.observe(dialog, { attributeFilter: ['open'], attributes: true })

    return () => observer.disconnect()
  }, [ref])

  // Local (browser-timezone) default shown in the picker, derived from the ISO
  // instant so it round-trips with the value submitted below.
  const defaultLocal = defaultPublishedAt
    ? toLocalDateTimeValue(new Date(defaultPublishedAt))
    : now

  // Read ref.current inside the handlers, not during render: the <dialog> is
  // attached in the commit phase, so at render time ref.current is still null.
  const handleCancel = () => ref.current?.close()
  // Close on submit rather than the confirm button's click, so submitting with
  // Enter from the date field closes the dialog too. Invalid values (a future
  // date past max) block native submit, so the dialog stays open as expected.
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    const local = new FormData(event.currentTarget).get('publishedAtLocal')
    if (publishedAtRef.current && typeof local === 'string' && local !== '') {
      // datetime-local only has minute precision. When the picker is left at its
      // seeded default, send the original instant verbatim so submitting an
      // unchanged date doesn't silently zero the seconds of an already-set value.
      // Otherwise the value is zoneless; new Date() reads it in the browser's
      // timezone, so toISOString() is the correct UTC instant to store.
      publishedAtRef.current.value =
        defaultPublishedAt && local === defaultLocal
          ? defaultPublishedAt
          : new Date(local).toISOString()
    }
    ref.current?.close()
  }

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
          {/* Timezone-correct instant sent to the server; set in handleSubmit. */}
          <input name={'publishedAt'} ref={publishedAtRef} type={'hidden'} />

          <AdminInput
            defaultValue={defaultLocal}
            id={inputId}
            key={openCount}
            label={'Datum publikace'}
            max={now}
            name={'publishedAtLocal'}
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
