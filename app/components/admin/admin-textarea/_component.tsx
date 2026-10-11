import { type FieldMetadata, getTextareaProps } from '@conform-to/react'
import { clsx } from 'clsx'
import type { ComponentProps, ReactNode } from 'react'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { Label } from '~/components/label'
import styles from './_styles.module.css'

type Props<FieldType extends string | undefined = string> = {
  label: ReactNode
  className?: string
  textareaProps: ComponentProps<'textarea'>
  field: FieldMetadata<FieldType>
  hint?: ReactNode
}

export const AdminTextarea = <FieldType extends string | undefined = string>({
  label,
  className,
  textareaProps: { className: textareaClassName, ...restTextareaProps },
  field,
  hint,
}: Props<FieldType>) => {
  const hasErrors = field.errors !== undefined && field.errors.length > 0
  const hintId = hint !== undefined ? `${field.id}-hint` : undefined
  const textareaProps = getTextareaProps(field)
  // Keep the error description Conform sets and add the hint to it.
  const describedBy =
    [textareaProps['aria-describedby'], hintId].filter(Boolean).join(' ') ||
    undefined

  return (
    <section className={clsx(styles.container, className)}>
      <Label htmlFor={field.id} required={field.required}>
        {label}
      </Label>
      <textarea
        {...textareaProps}
        aria-describedby={describedBy}
        className={clsx(
          styles.textarea,
          hasErrors && styles.textareaError,
          textareaClassName,
        )}
        {...restTextareaProps}
      />
      {hint !== undefined && (
        <div className={styles.hint} id={hintId}>
          {hint}
        </div>
      )}
      <ErrorMessageGroup>
        {field.errors?.map((error, index) => (
          <ErrorMessage key={index}>{error}</ErrorMessage>
        ))}
      </ErrorMessageGroup>
    </section>
  )
}
