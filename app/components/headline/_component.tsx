import { applyClasses, combineClasses } from '@liborgabrhel/style-utils'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  marginBottom?: boolean
}

export const Headline = ({ children, marginBottom = true }: Props) => {
  return (
    <h2
      className={combineClasses(
        styles.headline,
        applyClasses(styles.marginBottom).if(marginBottom),
      )}
    >
      {children}
    </h2>
  )
}
