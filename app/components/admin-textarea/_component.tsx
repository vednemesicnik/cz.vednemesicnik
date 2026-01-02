import { type FieldMetadata, getTextareaProps } from '@conform-to/react'
import { clsx } from 'clsx'
import type { ComponentProps } from 'react'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { Label } from '~/components/label'
import styles from './_styles.module.css'

type Props<FieldType extends string | undefined = string> = {
  label: string
  className?: string
  textareaProps: ComponentProps<'textarea'>
  field: FieldMetadata<FieldType>
}

export const AdminTextarea = <FieldType extends string | undefined = string>({
  label,
  className,
  textareaProps: { className: textareaClassName, ...restTextareaProps },
  field,
}: Props<FieldType>) => {
  const hasErrors = field.errors !== undefined && field.errors.length > 0

  return (
    <section className={clsx(styles.container, className)}>
      <Label htmlFor={field.id} required={field.required}>
        {label}
      </Label>
      <textarea
        {...getTextareaProps(field)}
        className={clsx(
          styles.textarea,
          hasErrors && styles.textareaError,
          textareaClassName,
        )}
        {...restTextareaProps}
      />
      <ErrorMessageGroup>
        {field.errors?.map((error, index) => (
          <ErrorMessage key={index}>{error}</ErrorMessage>
        ))}
      </ErrorMessageGroup>
    </section>
  )
}
