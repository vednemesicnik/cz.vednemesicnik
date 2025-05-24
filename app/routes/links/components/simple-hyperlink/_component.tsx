import { BaseHyperlink } from "~/components/base-hyperlink"

import styles from "./_styles.module.css"

type Props = {
  href: string
  children: string
}

export const SimpleHyperlink = ({ children, href }: Props) => {
  return (
    <BaseHyperlink
      href={href}
      className={styles.linkButton}
      target={"_self"}
      aria-label={children}
    >
      {children}
    </BaseHyperlink>
  )
}
