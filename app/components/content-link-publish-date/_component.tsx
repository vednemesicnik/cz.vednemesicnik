import { getFormattedPublishDate } from '~/utils/get-formatted-publish-date'

import styles from './_styles.module.css'

type Props = {
  date: Date | null
}

export const ContentLinkPublishDate = ({ date }: Props) => {
  return (
    <p className={styles.paragraph}>
      {date === null ? '...' : getFormattedPublishDate(date)}
    </p>
  )
}
