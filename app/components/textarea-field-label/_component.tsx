import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { Label } from '~/components/label'
import { useTextareaField } from '~/components/textarea-field'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  /** „(nepovinné)“ after the label. */
  optional?: boolean
  /** Something around the field already names it; the label stays for readers. */
  isVisuallyHidden?: boolean
  className?: string
}

/**
 * A `TextareaField`'s visible label, tied to its textarea by `id`; the
 * asterisk follows the Conform field's `required`.
 *
 * @param props.children - The label, e.g. „Popis“
 * @returns The `<label>`
 */
export const TextareaFieldLabel = ({
  children,
  optional = false,
  isVisuallyHidden = false,
  className,
}: Props) => {
  const { field } = useTextareaField()

  return (
    <Label
      className={clsx(
        styles.label,
        isVisuallyHidden && 'screen-reader-only',
        className,
      )}
      htmlFor={field.id}
      optional={optional}
      required={field.required}
    >
      {children}
    </Label>
  )
}
