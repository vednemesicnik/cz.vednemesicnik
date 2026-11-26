import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import { useTextField } from '~/components/text-field'

import styles from './_styles.module.css'

type Props = Omit<ComponentProps<'input'>, 'size'>

/**
 * A `TextField`'s single-line input. The field's id and `required` win over
 * any passed in (e.g. by Conform's `getInputProps`), so the label always
 * points at it; the hint is added to its description, and the field's errors
 * switch it to the error look.
 *
 * @returns The `<input>`
 */
export const TextFieldControl = ({ className, ...rest }: Props) => {
  const { inputId, hintId, required, hasErrors, size } = useTextField()
  // Keep the error description a form library passes and add the hint to it.
  // An id with no hint rendered is ignored by the accessible description.
  const describedBy = [rest['aria-describedby'], hintId]
    .filter(Boolean)
    .join(' ')

  return (
    <input
      className={clsx(
        styles.control,
        size === 'sm' && styles.sm,
        hasErrors && styles.isInvalid,
        className,
      )}
      {...rest}
      aria-describedby={describedBy}
      aria-invalid={rest['aria-invalid'] ?? (hasErrors || undefined)}
      id={inputId}
      required={required}
    />
  )
}
