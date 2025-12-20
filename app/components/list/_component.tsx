import { combineClasses } from '@liborgabrhel/style-utils'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

export const List = ({ children, className }: Props) => {
  return <ul className={combineClasses(className, styles.list)}>{children}</ul>
}
