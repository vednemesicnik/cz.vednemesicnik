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
import { formatArticleCount } from '~/utils/format-article-count'
import { formatNumericDate } from '~/utils/format-numeric-date'
import { getMomentOnDay } from '~/utils/get-moment-on-day'
import { toLocalDayValue } from '~/utils/to-local-day-value'
import { useModalDialog } from '~/utils/use-modal-dialog'

import {
  type PublishDateChoice,
  PublishDateFieldset,
} from '../../../components/publish-date-fieldset'
import { ReorderableList } from '../reorderable-list'

import styles from './_styles.module.css'

type Article = {
  id: string
  title: string
  detail: string
}

type KeptArticle = Article & {
  publishedAt: string
}

type Props = {
  action: string
  fetcherKey: string
  orderedArticles: Article[]
  keptArticles: KeptArticle[]
  notes: string | null
  skipped: string | null
  onClose: () => void
}

/**
 * Publishes the selected articles at once (design 22c). The ones never
 * published stand in the order they will have on the website, check order by
 * default, dragged into another; the ones published before return to their
 * date and stand apart (fge4es3p). Incomplete articles are left out and said
 * in `skipped` (23h, copy bhmem1jc). *Dnes* is the server's now; *Jiný den*
 * carries the moment of confirmation to that day.
 *
 * @param props.orderedArticles - Never published, in check order.
 * @param props.keptArticles - Published before, with their stored date (ISO).
 * @param props.notes - The waiting and not-submitted sentences, or `null`.
 * @param props.skipped - The incomplete sentence, or `null`.
 */
export const BulkPublishDialog = ({
  action,
  fetcherKey,
  orderedArticles,
  keptArticles,
  notes,
  skipped,
  onClose,
}: Props) => {
  const fetcher = useFetcher({ key: fetcherKey })
  const ref = useModalDialog(onClose)
  const publishedAtRef = useRef<HTMLInputElement>(null)

  const [ordered, setOrdered] = useState(orderedArticles)
  const [now] = useState(() => new Date())
  const today = toLocalDayValue(now)
  const [choice, setChoice] = useState<PublishDateChoice>('today')
  const [otherDay, setOtherDay] = useState(today)

  const count = formatArticleCount(ordered.length + keptArticles.length)
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
      <AdminModalContent>
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
          {[...ordered, ...keptArticles].map((article) => (
            <input
              key={article.id}
              name={'ids'}
              type={'hidden'}
              value={article.id}
            />
          ))}
          <input name={'publishDate'} type={'hidden'} value={publishDate} />
          <input name={'publishedAt'} ref={publishedAtRef} type={'hidden'} />

          {ordered.length > 0 && (
            <div className={styles.section}>
              <AdminModalDescription>
                V tomto pořadí budou články na webu. Pořadí změníte přetažením.
              </AdminModalDescription>
              <ReorderableList items={ordered} onReorder={setOrdered} />
            </div>
          )}

          {keptArticles.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.subheading}>
                Vrátí se na své datum publikace
              </h3>
              <ul className={styles.keptList}>
                {keptArticles.map((article) => (
                  <li className={styles.keptRow} key={article.id}>
                    <span className={styles.text}>
                      <span>{article.title}</span>
                      <span className={styles.detail}>{article.detail}</span>
                    </span>
                    <span className={styles.date}>
                      {formatNumericDate(new Date(article.publishedAt))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {notes !== null && <p className={styles.note}>{notes}</p>}
          {skipped !== null && <p className={styles.note}>{skipped}</p>}

          {/* The date applies only to the ordered ones (fge4es3p). */}
          {ordered.length > 0 && (
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
            <Button size={'sm'} type={'submit'}>
              {`Publikovat ${count}`}
            </Button>
          </AdminModalActions>
        </fetcher.Form>
      </AdminModalContent>
    </AdminDialog>
  )
}
