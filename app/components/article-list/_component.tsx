import { combineClasses } from '@liborgabrhel/style-utils'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

export const ArticleList = ({ children, className }: Props) => {
  return <ul className={combineClasses(className, styles.grid)}>{children}</ul>
}
