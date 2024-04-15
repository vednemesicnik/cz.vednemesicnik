import styles from "./_archived-issue.module.css"
import { combineStyles } from "~/utils/combine-styles"
import { applyStyles } from "~/utils/apply-styles"
import { Link } from "@remix-run/react"

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
      className={combineStyles(styles.container, applyStyles(styles.ghosted).if(isGhosted))}
    >
      <figure className={styles.content}>
        <img src={coverSrc} alt={coverAlt} className={styles.cover} loading={"lazy"} width={"220"} height={"300"} />
        <figcaption className={styles.label}>{label}</figcaption>
      </figure>
    </Link>
  )
}
