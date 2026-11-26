import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { useTextField } from '~/components/text-field'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  /** The hint shows only while the field has the focus (24b alt text). */
  isShownOnFocus?: boolean
  className?: string
}

/**
 * Helper text under a `TextField`'s input, read with it as its description.
 *
 * @param props.children - The hint, e.g. „Bez roku. Rok se k názvu přidá automaticky.“
 * @returns The hint's paragraph
 */
export const TextFieldHint = ({
  children,
  isShownOnFocus = false,
  className,
}: Props) => {
  const { hintId } = useTextField()

  return (
    <p
      className={clsx(
        styles.hint,
        isShownOnFocus && styles.isShownOnFocus,
        className,
      )}
      id={hintId}
    >
      {children}
    </p>
  )
}
