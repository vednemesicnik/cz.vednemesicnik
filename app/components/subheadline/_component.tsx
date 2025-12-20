import { applyClasses, combineClasses } from '@liborgabrhel/style-utils'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  marginTop?: boolean
  marginBottom?: boolean
}

export const Subheadline = ({
  children,
  marginTop = false,
  marginBottom = false,
}: Props) => {
  return (
    <h3
      className={combineClasses(
        styles.subheadline,
        applyClasses(styles.marginTop).if(marginTop),
        applyClasses(styles.marginBottom).if(marginBottom),
      )}
    >
      {children}
    </h3>
  )
}
