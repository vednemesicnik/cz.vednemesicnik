import { useRef, useState } from 'react'
import { useFetcher } from 'react-router'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalSubject } from '~/components/admin/admin-modal-subject'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { FORM_CONFIG } from '~/config/form-config'
import { getMomentOnDay } from '~/utils/get-moment-on-day'
import { toLocalDayValue } from '~/utils/to-local-day-value'
import { useModalDialog } from '~/utils/use-modal-dialog'

import {
  type PublishDateChoice,
  PublishDateFieldset,
} from '../../../../../articles/components/publish-date-fieldset'
import styles from './_styles.module.css'

type Props = {
  action: string
  fetcherKey: string
  episodeTitle: string
  authorName: string
  isApproval: boolean
  originalPublishedAt: string | null
  onClose: () => void
}

/**
 * Publishes the episode, or approves and publishes it, from its podcast's
 * table (design 27b, as the article's 23f): the episode by its number and
 * title, its author, then the publish date — *Dnes*, *Jiný den* (today or
 * earlier) and, for an episode published before, *Původní datum* first
 * (fge4es3p). Opens as it mounts.
 *
 * @param props.isApproval - Schválit a publikovat? instead of Publikovat?
 * @param props.originalPublishedAt - The stored publish date (ISO), or `null`.
 */
export const EpisodePublishDialog = ({
  action,
  fetcherKey,
  episodeTitle,
  authorName,
  isApproval,
  originalPublishedAt,
  onClose,
}: Props) => {
  const fetcher = useFetcher({ key: fetcherKey })
  const ref = useModalDialog(onClose)

  const [now] = useState(() => new Date())
  const today = toLocalDayValue(now)
  const [choice, setChoice] = useState<PublishDateChoice>(
    originalPublishedAt === null ? 'today' : 'original',
  )
  const [otherDay, setOtherDay] = useState(today)
  const publishedAtRef = useRef<HTMLInputElement>(null)

  // Another day that is today is Dnes: the server's now can't be in the future.
  const publishDate =
    choice === 'other' && otherDay === today ? 'today' : choice

  // Another day keeps the time of confirmation (23f), read at submit.
  const handleSubmit = () => {
    if (publishDate === 'other' && publishedAtRef.current !== null) {
      publishedAtRef.current.value = getMomentOnDay(otherDay).toISOString()
    }

    ref.current?.close()
  }

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>
          {isApproval ? 'Schválit a publikovat?' : 'Publikovat?'}
        </AdminModalTitle>

        <div className={styles.episode}>
          <AdminModalSubject>{episodeTitle}</AdminModalSubject>
          <p className={styles.author}>Autor: {authorName}</p>
        </div>

        <AdminModalDescription>
          Epizoda bude publikována na webu.
        </AdminModalDescription>

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
            value={FORM_CONFIG.intent.value.publish}
          />
          <input name={'publishDate'} type={'hidden'} value={publishDate} />
          <input name={'publishedAt'} ref={publishedAtRef} type={'hidden'} />

          <PublishDateFieldset
            choice={choice}
            now={now}
            onChoiceChange={setChoice}
            onOtherDayChange={setOtherDay}
            originalPublishedAt={originalPublishedAt}
            otherDay={otherDay}
          />

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
              {isApproval ? 'Schválit a publikovat' : 'Publikovat'}
            </Button>
          </AdminModalActions>
        </fetcher.Form>
      </AdminModalContent>
    </AdminDialog>
  )
}
