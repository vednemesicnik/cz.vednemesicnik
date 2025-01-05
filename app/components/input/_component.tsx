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
  return (
    <section className={styles.container}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <input className={styles.input} id={id} required={required} {...rest} />
      <ErrorMessageGroup>
        {errors?.map((error, index) => (
          <ErrorMessage key={index}>{error}</ErrorMessage>
        ))}
      </ErrorMessageGroup>
    </section>
  )
}
