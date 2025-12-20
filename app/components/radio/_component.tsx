import { clsx } from "clsx"
import { type ComponentProps } from "react"

import { ErrorMessage } from "~/components/error-message"
import { ErrorMessageGroup } from "~/components/error-message-group"

import styles from "./_styles.module.css"

type Props = ComponentProps<"input"> & {
  label: string
  errors?: string[]
}

export const Radio = ({
  label,
  type = "radio",
  errors,
  id,
  ...rest
}: Props) => {
  const hasErrors = errors !== undefined && errors.length > 0

  return (
    <section className={styles.container}>
      <div className={styles.wrapper}>
        <input type={type} id={id} className={styles.radio} {...rest} />
        <label
          htmlFor={id}
          className={clsx(styles.label, hasErrors && styles.labelError)}
        >
          {label}
        </label>
      </div>
      <ErrorMessageGroup>
        {errors?.map((error, index) => (
          <ErrorMessage key={index}>{error}</ErrorMessage>
        ))}
      </ErrorMessageGroup>
    </section>
  )
}
