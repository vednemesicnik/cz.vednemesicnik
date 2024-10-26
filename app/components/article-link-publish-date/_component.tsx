import { getFormattedPublishDate } from "~/utils/get-formatted-publish-date"

import styles from "./_styles.module.css"

type Props = {
  date: string | null
}

export const ArticleLinkPublishDate = ({ date }: Props) => {
  return (
    <p className={styles.paragraph}>
      {date === null ? "..." : getFormattedPublishDate(date)}
    </p>
  )
}
