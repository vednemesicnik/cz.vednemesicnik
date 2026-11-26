import { BaseHyperlink } from '~/components/base-hyperlink'

import styles from './_styles.module.css'

type Props = {
  href: string
  children: string
}

export const SimpleHyperlink = ({ children, href }: Props) => {
  return (
    <BaseHyperlink
      aria-label={children}
      className={styles.linkButton}
      href={href}
      target={'_self'}
    >
      {children}
    </BaseHyperlink>
  )
}
