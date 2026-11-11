import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { useTextareaField } from '~/components/textarea-field'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  /**
   * `attention` turns the counter amber for a limit that only advises, as the
   * perex's 160 (24a); the field's errors still win.
   */
  tone?: 'neutral' | 'attention'
  className?: string
}

/**
 * The length against its limit at the end of a `TextareaField`'s row, read
 * with the textarea as part of its description. It turns to the error colour
 * with the field's errors.
 *
 * @param props.children - The count, e.g. „512 / 500“
 * @returns The counter's `<span>`
 */
export const TextareaFieldCounter = ({
  children,
  tone = 'neutral',
  className,
}: Props) => {
  const { counterId, hasErrors } = useTextareaField()

  return (
    <span
      className={clsx(
        styles.counter,
        hasErrors
          ? styles.isInvalid
          : tone === 'attention' && styles.isAttention,
        className,
      )}
      id={counterId}
    >
      {children}
    </span>
  )
}
