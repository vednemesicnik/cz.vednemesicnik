import { type SubmitEvent, useId, useRef, useState } from 'react'
import { useFetcher } from 'react-router'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalSubject } from '~/components/admin/admin-modal-subject'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { ErrorMessage } from '~/components/error-message'
import { TextField } from '~/components/text-field'
import { FORM_CONFIG } from '~/config/form-config'
import { toLocalDayValue } from '~/utils/to-local-day-value'
import { useModalDialog } from '~/utils/use-modal-dialog'

import styles from './_styles.module.css'

type Props = {
  action: string
  fetcherKey: string
  title: string
  description?: string
  publishedAt: string | null
  onClose: () => void
}

const ARTICLE_DESCRIPTION =
  'Datum a čas publikace určují pořadí článku na webu.'

const FUTURE_ERROR = 'Zadejte datum a čas, které nejsou v budoucnosti.'

// The local time of day as a time input wants it, `HH:mm`.
const toLocalTimeValue = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// The local moment of a date input's day and a time input's time.
const toLocalMoment = (day: string, time: string) => {
  const [year, month, date] = day.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(year, month - 1, date, hours, minutes)
}

/**
 * Změnit datum publikace… of a published article or episode, the
 * Coordinator's (design 23f, 27c): the content by its title, a date and a time
 * prefilled with the current publish date, never in the future.
 *
 * @param props.title - The article's title, or the episode's with its number.
 * @param props.description - What the date decides; the article's sentence
 *   by default, the episode has its own (copy v0m112v3).
 * @param props.publishedAt - The stored publish date (ISO); `null` starts at now.
 */
export const ArticleChangeDateDialog = ({
  action,
  fetcherKey,
  title,
  description = ARTICLE_DESCRIPTION,
  publishedAt,
  onClose,
}: Props) => {
  const fetcher = useFetcher({ key: fetcherKey })
  const ref = useModalDialog(onClose)
  const dateId = useId()
  const timeId = useId()
  const errorId = useId()

  const [now] = useState(() => new Date())
  const [initial] = useState(() => {
    const moment = publishedAt === null ? now : new Date(publishedAt)
    return { day: toLocalDayValue(moment), time: toLocalTimeValue(moment) }
  })
  const [day, setDay] = useState(initial.day)
  const [time, setTime] = useState(initial.time)
  // Only after confirming, and only for today with a later time (23f).
  const [isFuture, setIsFuture] = useState(false)
  const publishedAtRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    if (toLocalMoment(day, time).getTime() > Date.now()) {
      event.preventDefault()
      setIsFuture(true)
      return
    }

    if (publishedAtRef.current !== null) {
      // The inputs have minutes only; an untouched value keeps the stored
      // instant, seconds included.
      const isUnchanged = day === initial.day && time === initial.time
      publishedAtRef.current.value =
        isUnchanged && publishedAt !== null
          ? publishedAt
          : toLocalMoment(day, time).toISOString()
    }

    ref.current?.close()
  }

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>Změnit datum publikace?</AdminModalTitle>
        <AdminModalSubject>{title}</AdminModalSubject>
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
            value={FORM_CONFIG.intent.value.changePublishedAt}
          />
          <input name={'publishedAt'} ref={publishedAtRef} type={'hidden'} />

          <div className={styles.fields}>
            <TextField
              id={dateId}
              label={'Datum publikace'}
              max={toLocalDayValue(now)}
              onChange={(event) => {
                setDay(event.currentTarget.value)
                setIsFuture(false)
              }}
              required
              type={'date'}
              value={day}
            />
            <TextField
              aria-describedby={isFuture ? errorId : undefined}
              aria-invalid={isFuture || undefined}
              id={timeId}
              label={'Čas publikace'}
              onChange={(event) => {
                setTime(event.currentTarget.value)
                setIsFuture(false)
              }}
              required
              type={'time'}
              value={time}
            />
          </div>

          {isFuture && (
            <div id={errorId}>
              <ErrorMessage>{FUTURE_ERROR}</ErrorMessage>
            </div>
          )}

          <AdminModalActions>
            <Button
              onClick={() => ref.current?.close()}
              size={'sm'}
              type={'button'}
              variant={'ghost'}
            >
              Zrušit
            </Button>
            <Button size={'sm'} type={'submit'}>
              Změnit datum publikace
            </Button>
          </AdminModalActions>
        </fetcher.Form>
      </AdminModalContent>
    </AdminDialog>
  )
}
