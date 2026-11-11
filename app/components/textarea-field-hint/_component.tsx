import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { useTextareaField } from '~/components/textarea-field'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * Helper text under a `TextareaField`'s textarea, at the start of its row and
 * read with it as its description.
 *
 * @param props.children - The hint, e.g. „Stručně popište, o čem podcast je.“
 * @returns The hint's `<div>`
 */
export const TextareaFieldHint = ({ children, className }: Props) => {
  const { hintId } = useTextareaField()

  return (
    <div className={clsx(styles.hint, className)} id={hintId}>
      {children}
    </div>
  )
}
