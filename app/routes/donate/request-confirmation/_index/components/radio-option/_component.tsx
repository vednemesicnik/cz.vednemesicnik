import type { ComponentProps, ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = Omit<ComponentProps<'input'>, 'type'> & {
  children: ReactNode
}

export const RadioOption = ({ children, ...props }: Props) => (
  <label className={styles.option}>
    <input className={styles.input} type="radio" {...props} />
    <span className={styles.label}>{children}</span>
  </label>
)
