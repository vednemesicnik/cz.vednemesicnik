import { type ReactNode } from "react"

import { appendParameters } from "~/utils/append-parameters"

import styles from "./_styles.module.css"

type Props = {
  to: string
  subject?: string
  body?: string
  title?: string
  children: ReactNode
}

export const MailHyperlink = ({
  to,
  subject = "",
  body = "",
  title,
  children,
}: Props) => {
  const mailParams = [
    subject && `subject=${encodeURIComponent(subject)}`,
    body && `body=${encodeURIComponent(body)}`,
  ]
    .filter(Boolean)
    .join("&")

  const mailtoLink = appendParameters(`mailto:${to}`, mailParams)

  return (
    <a href={mailtoLink} className={styles.mailHyperlink} title={title}>
      {children}
    </a>
  )
}
