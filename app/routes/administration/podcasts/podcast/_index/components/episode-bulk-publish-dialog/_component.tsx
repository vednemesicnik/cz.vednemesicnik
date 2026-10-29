import { useEffect, useRef, useState } from 'react'
import { useFetcher } from 'react-router'
import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { EPISODE_BULK_NOUN } from '~/config/bulk-noun-config'
import { FORM_CONFIG } from '~/config/form-config'
import {
  type PublishDateChoice,
  PublishDateFieldset,
} from '~/routes/administration/articles/components/publish-date-fieldset'
import { formatListCount } from '~/utils/format-list-count'
import { formatNumericDate } from '~/utils/format-numeric-date'
import { getMomentOnDay } from '~/utils/get-moment-on-day'
import { toLocalDayValue } from '~/utils/to-local-day-value'
import { useModalDialog } from '~/utils/use-modal-dialog'

import styles from './_styles.module.css'

// Over five, nobody reads the list: the dialog gives only the count (27b).
const MAX_LISTED_EPISODES = 5

type Episode = {
  id: string
  title: string
}

type KeptEpisode = Episode & {
  publishedAt: string
}

type Props = {
  action: string
  fetcherKey: string
  orderedEpisodes: Episode[]
  keptEpisodes: KeptEpisode[]
  notes: string | null
  onClose: () => void
}

/**
 * Publishes the selected episodes at once (design 27b): no order to drag, as
 * the number already gives it — the highest number becomes the newest, the
 * server spaces them a second apart. The ones published before return to
 * their date and stand apart (fge4es3p). *Dnes* is the server's now; *Jiný
 * den* carries the moment of confirmation to that day, as for an article.
 *
 * @param props.orderedEpisodes - Never published, highest number first.
 * @param props.keptEpisodes - Published before, with their stored date (ISO).
 * @param props.notes - The waiting, not-submitted, incomplete and held
 *   sentences in one paragraph, or `null`.
 */
export const EpisodeBulkPublishDialog = ({
  action,
  fetcherKey,
  orderedEpisodes,
  keptEpisodes,
  notes,
  onClose,
}: Props) => {
  const fetcher = useFetcher({ key: fetcherKey })
  const ref = useModalDialog(onClose)
  const publishedAtRef = useRef<HTMLInputElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)

  // After showModal, which focuses the first stop: Enter confirms (22c).
  useEffect(() => {
    submitRef.current?.focus()
  }, [])

  const [now] = useState(() => new Date())
  const today = toLocalDayValue(now)
  const [choice, setChoice] = useState<PublishDateChoice>('today')
  const [otherDay, setOtherDay] = useState(today)

  const episodes = [...orderedEpisodes, ...keptEpisodes]
  const count = formatListCount(episodes.length, EPISODE_BULK_NOUN.objectForms)
  const isListed = episodes.length <= MAX_LISTED_EPISODES
  // Another day that is today is Dnes: the server's now can't be in the future.
  const publishDate =
    choice === 'other' && otherDay === today ? 'today' : choice

  const handleSubmit = () => {
    if (publishDate === 'other' && publishedAtRef.current !== null) {
      publishedAtRef.current.value = getMomentOnDay(otherDay).toISOString()
    }

    ref.current?.close()
  }

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent className={styles.content}>
        <AdminModalTitle>{`Publikovat ${count}?`}</AdminModalTitle>

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
            value={FORM_CONFIG.intent.value.bulkPublish}
          />
          {episodes.map((episode) => (
            <input
              key={episode.id}
              name={'ids'}
              type={'hidden'}
              value={episode.id}
            />
          ))}
          <input name={'publishDate'} type={'hidden'} value={publishDate} />
          <input name={'publishedAt'} ref={publishedAtRef} type={'hidden'} />

          {isListed && orderedEpisodes.length > 0 && (
            <ul className={styles.titles}>
              {orderedEpisodes.map((episode) => (
                <li key={episode.id}>{episode.title}</li>
              ))}
            </ul>
          )}

          {/* One episode has nothing to order (copy 0farrwua H). */}
          {orderedEpisodes.length > 1 && (
            <AdminModalDescription>
              Na webu budou seřazené podle čísla: nejvyšší číslo bude
              nejnovější.
            </AdminModalDescription>
          )}

          {isListed && keptEpisodes.length > 0 && (
            <div className={styles.keptSection}>
              <h3 className={styles.subheading}>
                Vrátí se na své datum publikace
              </h3>
              <ul className={styles.keptList}>
                {keptEpisodes.map((episode) => (
                  <li className={styles.keptRow} key={episode.id}>
                    <span className={styles.text}>{episode.title}</span>
                    <span className={styles.date}>
                      {formatNumericDate(new Date(episode.publishedAt))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {notes !== null && <p className={styles.note}>{notes}</p>}

          {/* The date applies only to the ones never published (fge4es3p). */}
          {orderedEpisodes.length > 0 && (
            <PublishDateFieldset
              choice={choice}
              now={now}
              onChoiceChange={setChoice}
              onOtherDayChange={setOtherDay}
              originalPublishedAt={null}
              otherDay={otherDay}
            />
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
            <Button ref={submitRef} size={'sm'} type={'submit'}>
              {`Publikovat ${count}`}
            </Button>
          </AdminModalActions>
        </fetcher.Form>
      </AdminModalContent>
    </AdminDialog>
  )
}
