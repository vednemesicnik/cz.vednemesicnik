import type { ComponentProps } from "react"

import { ErrorMessage } from "~/components/error-message"
import { ErrorMessageGroup } from "~/components/error-message-group"
import { Label } from "~/components/label"

import styles from "./_styles.module.css"

type Props = ComponentProps<"textarea"> & {
  label: string
  errors?: string[]
}

export const TextArea = ({ label, errors, id, required, ...rest }: Props) => {
  return (
    <section className={styles.container}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <textarea
        id={id}
        className={styles.textarea}
        required={required}
        rows={10}
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
