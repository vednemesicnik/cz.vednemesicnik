import { clsx } from "clsx"
import { type ComponentProps } from "react"

import { ErrorMessage } from "~/components/error-message"
import { ErrorMessageGroup } from "~/components/error-message-group"
import { Label } from "~/components/label"

import styles from "./_styles.module.css"

type Props = ComponentProps<"input"> & {
  label: string
  errors?: string[]
}

export const Input = ({ label, errors, id, required, ...rest }: Props) => {
  const hasErrors = errors !== undefined && errors.length > 0

  return (
    <section className={styles.container}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <input
        className={clsx(styles.input, hasErrors && styles.inputError)}
        id={id}
        required={required}
        {...rest}
      />
      <ErrorMessageGroup>
        {errors?.map((error, index) => (
          <ErrorMessage key={index}>{error}</ErrorMessage>
        ))}
      </ErrorMessageGroup>
    </section>
  )
}
