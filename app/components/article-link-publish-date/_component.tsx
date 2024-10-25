import styles from "./_styles.module.css"

type Props = {
  date: string | null
}

export const ArticleLinkPublishDate = ({ date }: Props) => {
  return (
    <p className={styles.paragraph}>
      {date === null
        ? "..."
        : new Date(date).toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
    </p>
  )
}
