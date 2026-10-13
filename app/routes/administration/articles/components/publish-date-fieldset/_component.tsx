import { useId } from 'react'

import { TextField } from '~/components/text-field'
import { formatNumericDate } from '~/utils/format-numeric-date'
import { toLocalDayValue } from '~/utils/to-local-day-value'

import styles from './_styles.module.css'

/** The publish date choice: the stored date, today, or another day. */
export type PublishDateChoice = 'original' | 'today' | 'other'

type Props = {
  now: Date
  originalPublishedAt: string | null
  choice: PublishDateChoice
  onChoiceChange: (choice: PublishDateChoice) => void
  otherDay: string
  onOtherDayChange: (day: string) => void
}

/**
 * „Datum publikace“ in a publish dialog (design 23f, 22c): *Dnes*, *Jiný den*
 * with a calendar that offers no future day and, for an article published
 * before, *Původní datum* first.
 *
 * @param props.now - The dialog's opening moment, for *Dnes* and the calendar.
 * @param props.originalPublishedAt - The stored publish date (ISO), or `null`
 *   to leave *Původní datum* out.
 * @param props.otherDay - The chosen other day, `YYYY-MM-DD`.
 */
export const PublishDateFieldset = ({
  now,
  originalPublishedAt,
  choice,
  onChoiceChange,
  otherDay,
  onOtherDayChange,
}: Props) => {
  const otherDayId = useId()
  const today = toLocalDayValue(now)

  const options: { value: PublishDateChoice; label: string }[] = [
    ...(originalPublishedAt === null
      ? []
      : [
          {
            label: `Původní datum, ${formatNumericDate(new Date(originalPublishedAt))}`,
            value: 'original' as const,
          },
        ]),
    { label: `Dnes, ${formatNumericDate(now)}`, value: 'today' },
    { label: 'Jiný den', value: 'other' },
  ]

  return (
    <fieldset className={styles.dates}>
      <legend className={styles.legend}>Datum publikace</legend>
      {options.map((option) => (
        <label className={styles.option} key={option.value}>
          <input
            checked={choice === option.value}
            className={styles.radio}
            name={'publishDateChoice'}
            onChange={() => onChoiceChange(option.value)}
            type={'radio'}
            value={option.value}
          />
          {option.label}
        </label>
      ))}

      {/* Today or earlier: the calendar offers no future day (23f). */}
      {choice === 'other' && (
        <TextField
          className={styles.otherDay}
          id={otherDayId}
          label={'Jiný den'}
          max={today}
          onChange={(event) => onOtherDayChange(event.currentTarget.value)}
          required
          type={'date'}
          value={otherDay}
        />
      )}
    </fieldset>
  )
}
