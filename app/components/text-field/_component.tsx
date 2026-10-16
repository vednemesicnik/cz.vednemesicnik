import { clsx } from 'clsx'
import type { ComponentProps, ReactNode } from 'react'

import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { Label } from '~/components/label'

import styles from './_styles.module.css'

type Props = ComponentProps<'input'> & {
  label: string
  /** A heading over the field already names it; the label stays for readers. */
  isLabelHidden?: boolean
  hint?: ReactNode
  errors?: string[]
}

/**
 * The design system's `TextField` (components/forms/TextField, FormSet): a
 * label, a single-line input, a hint and the errors under it, 6 px apart. No
 * row is reserved for errors.
 *
 * @param props.label - The visible label, tied to the input by `id`.
 * @param props.hint - Helper text under the input, added to its description.
 * @param props.errors - Messages shown under the hint; they switch the input
 * to the error look.
 * @param props.className - Goes on the field, not the input (as in the design
 * system), e.g. to place it in a grid.
 */
export const TextField = ({
  label,
  isLabelHidden = false,
  hint,
  errors,
  id,
  required,
  className,
  ...rest
}: Props) => {
  const hasErrors = errors !== undefined && errors.length > 0
  const hintId =
    hint !== undefined && id !== undefined ? `${id}-hint` : undefined
  // Keep the error description a form library passes and add the hint to it.
  const describedBy =
    [rest['aria-describedby'], hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={clsx(styles.field, className)}>
      <Label
        className={isLabelHidden ? 'screen-reader-only' : undefined}
        htmlFor={id}
        required={required}
      >
        {label}
      </Label>
      <input
        className={clsx(styles.input, hasErrors && styles.inputError)}
        id={id}
        required={required}
        {...rest}
        aria-describedby={describedBy}
        aria-invalid={rest['aria-invalid'] ?? (hasErrors || undefined)}
      />
      {hint !== undefined && (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      )}
      <ErrorMessageGroup>
        {errors?.map((error, index) => (
          <ErrorMessage key={index}>{error}</ErrorMessage>
        ))}
      </ErrorMessageGroup>
    </div>
  )
}
