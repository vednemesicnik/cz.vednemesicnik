import type { ComponentProps } from 'react'
import styles from './_styles.module.css'

type Props = ComponentProps<'textarea'>

export const Textarea = (props: Props) => (
  <textarea className={styles.textarea} {...props} />
)
