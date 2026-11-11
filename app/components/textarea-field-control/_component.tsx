import { getTextareaProps } from '@conform-to/react'
import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import { useTextareaField } from '~/components/textarea-field'

import styles from './_styles.module.css'

type Props = ComponentProps<'textarea'>

/**
 * A `TextareaField`'s multi-line input, wired to its Conform field. The hint
 * and the counter are added to its description, and the field's errors switch
 * it to the error look.
 *
 * @returns The `<textarea>`
 */
export const TextareaFieldControl = ({ className, ...rest }: Props) => {
  const { field, hintId, counterId, hasErrors } = useTextareaField()
  const textareaProps = getTextareaProps(field)
  // Keep the error description Conform sets and add the hint and counter.
  // An id with nothing rendered is ignored by the accessible description.
  const describedBy = [textareaProps['aria-describedby'], hintId, counterId]
    .filter(Boolean)
    .join(' ')

  return (
    <textarea
      {...textareaProps}
      aria-describedby={describedBy}
      className={clsx(styles.control, hasErrors && styles.isInvalid, className)}
      {...rest}
    />
  )
}
