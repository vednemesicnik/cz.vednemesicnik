import { useRef, useState } from 'react'
import { useFetcher } from 'react-router'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
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
} from '../publish-date-fieldset'

import styles from './_styles.module.css'

type Props = {
  action: string
  fetcherKey: string
  articleTitle: string
  authorNames: string[]
  isApproval: boolean
  note: string | null
  originalPublishedAt: string | null
  onClose: () => void
}

/**
 * Publishes the article, or approves and publishes it (design 23f): the article
 * by its title and authors, then the publish date — *Dnes*, *Jiný den* (today or
 * earlier, at the moment of confirmation) and, for an article published before,
 * *Původní datum* first (fge4es3p). *Dnes* is the server's time; *Původní datum*
 * sends no date, so the server keeps the stored one.
 *
 * @param props.isApproval - Schválit a publikovat? instead of Publikovat?
 * @param props.note - A line in full ink before the date, e.g. that nobody
 *   submitted the article.
 * @param props.originalPublishedAt - The stored publish date (ISO), or `null`.
 */
export const ArticlePublishDialog = ({
  action,
  fetcherKey,
  articleTitle,
  authorNames,
  isApproval,
  note,
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

        {/* The article by its title, the authors in the nominative (23f). */}
        <p className={styles.article}>
          <span className={styles.articleTitle}>{articleTitle}</span>
          <span className={styles.authors}>
            Autoři: {authorNames.join(', ')}
          </span>
        </p>

        <AdminModalDescription>
          Článek bude publikován na webu.
        </AdminModalDescription>
        {note !== null && <p className={styles.note}>{note}</p>}

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
