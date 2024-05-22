import styles from "./_archived-issue.module.css"
import { Link } from "@remix-run/react"
import { applyClasses, combineClasses } from "@liborgabrhel/style-utils"

type Props = {
  coverAlt: string
  coverSrc: string
  pdfSrc: string
  label: string
  isGhosted?: boolean
}

export const ArchivedIssue = ({ coverAlt, coverSrc, pdfSrc, label, isGhosted = false }: Props) => {
  return (
    <Link
      to={pdfSrc}
      title={label}
      reloadDocument={true}
      className={combineClasses(styles.container, applyClasses(styles.ghosted).if(isGhosted))}
    >
      <figure className={styles.content}>
        <img src={coverSrc} alt={coverAlt} className={styles.cover} loading={"lazy"} width={"220"} height={"300"} />
        <figcaption className={styles.label}>{label}</figcaption>
      </figure>
    </Link>
  )
}
