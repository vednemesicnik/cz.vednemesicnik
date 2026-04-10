import { type FieldMetadata, getInputProps } from '@conform-to/react'
import { clsx } from 'clsx'
import type { ComponentProps } from 'react'
import styles from './_styles.module.css'

type InputProps = ComponentProps<'input'>

type Props<FieldType extends string | undefined = string> = {
  label: string
  className?: string
  inputProps: {
    value?: string
  } & Omit<InputProps, 'value'>
  field: FieldMetadata<FieldType>
}

export const AdminRadioInput = <FieldType extends string | undefined = string>({
  label,
  className,
  inputProps: {
    className: inputClassName,
    value: inputValue,
    ...restInputProps
  },
  field,
}: Props<FieldType>) => {
  const hasErrors = field.errors !== undefined && field.errors.length > 0

  return (
    <label className={clsx(styles.radioLabel, className)}>
      <input
        {...getInputProps(field, { type: 'radio', value: inputValue })}
        className={clsx(
          styles.radio,
          hasErrors && styles.radioError,
          inputClassName,
        )}
        {...restInputProps}
      />
      <span className={styles.labelText}>
        {label} {field.required && '*'}
      </span>
    </label>
  )
}
