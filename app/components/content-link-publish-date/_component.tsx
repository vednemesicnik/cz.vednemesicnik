import type { FormattedDate } from '~/utils/format-date'

import styles from './_styles.module.css'

type Props = {
  date: FormattedDate
}

export const ContentLinkPublishDate = ({ date }: Props) => {
  return (
    <p className={styles.paragraph}>
      <time dateTime={date.iso ?? undefined}>{date.formatted}</time>
    </p>
  )
}
