import type { ComponentProps } from 'react'
import styles from './_styles.module.css'

type Props = ComponentProps<'input'>

export const Input = (props: Props) => (
  <input className={styles.input} {...props} />
)
