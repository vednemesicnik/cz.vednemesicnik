import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { Label } from '~/components/label'
import { useTextField } from '~/components/text-field'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  /** „(nepovinné)“ after the label. */
  optional?: boolean
  /** Sign-in and single-field dialogs: the task says it, the input stays `required`. */
  isRequiredMarkHidden?: boolean
  /** Something around the field already names it; the label stays for readers. */
  isVisuallyHidden?: boolean
  className?: string
}

/**
 * A `TextField`'s visible label, tied to its input by `id`; the asterisk
 * follows the field's `required`.
 *
 * @param props.children - The label, e.g. „Název“
 * @returns The `<label>`
 */
export const TextFieldLabel = ({
  children,
  optional = false,
  isRequiredMarkHidden = false,
  isVisuallyHidden = false,
  className,
}: Props) => {
  const { inputId, required, size } = useTextField()

  return (
    <Label
      className={clsx(
        size === 'sm' && styles.sm,
        isVisuallyHidden && 'screen-reader-only',
        className,
      )}
      htmlFor={inputId}
      optional={optional}
      required={required && !isRequiredMarkHidden}
    >
      {children}
    </Label>
  )
}
