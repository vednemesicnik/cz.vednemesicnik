import { BaseLink } from "~/components/base-link"

import styles from "./_styles.module.css"

type Props = {
  to: string
  children: string
}

export const SimpleLink = ({ children, to }: Props) => {
  return (
    <BaseLink
      to={to}
      className={styles.linkButton}
      reloadDocument={true}
      aria-label={children}
    >
      {children}
    </BaseLink>
  )
}
