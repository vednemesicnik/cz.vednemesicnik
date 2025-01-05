import { type ComponentProps, type ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = ComponentProps<"fieldset"> & {
  legend: string
  children: ReactNode
}

export const Fieldset = ({ children, legend, ...rest }: Props) => {
  return (
    <fieldset className={styles.fieldset} {...rest}>
      <legend className={styles.legend}>{legend}</legend>
      <section className={styles.content}>{children}</section>
    </fieldset>
  )
}
