import { ErrorIcon } from "~/components/icons/error-icon"

import styles from "./_styles.module.css"

type Props = {
  children: string
}

export const ErrorMessage = ({ children }: Props) => {
  return (
    <div className={styles.container}>
      <ErrorIcon className={styles.icon} />

      <p className={styles.error} role={"alert"}>
        {children}
      </p>
    </div>
  )
}
