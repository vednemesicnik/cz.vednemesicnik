import { StatusTag, type StatusTagState } from '~/components/status-tag'
import { showsPublishDate } from '~/utils/content-preview/shows-publish-date'
import type { FormattedDate } from '~/utils/format-date'

import styles from './_styles.module.css'

type Props = {
  date: FormattedDate
  previewState?: StatusTagState | null
}

/**
 * The publication date in a content card's footer.
 *
 * @param props.previewState - For content the reader doesn't see (10d): a
 *   draft's grey state tag stands in place of the date, an archived one's
 *   after it.
 */
export const ContentLinkPublishDate = ({
  date,
  previewState = null,
}: Props) => {
  return (
    <p className={styles.paragraph}>
      {showsPublishDate(previewState) &&
        (date.iso ? (
          <time dateTime={date.iso}>{date.formatted}</time>
        ) : (
          date.formatted
        ))}
      {previewState !== null && <StatusTag muted state={previewState} />}
    </p>
  )
}
