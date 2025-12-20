import { clsx } from 'clsx'
import type { ComponentProps, JSX } from 'react'

import { BaseHyperlink } from '~/components/base-hyperlink'
import { MailIcon } from '~/components/icons/mail-icon'
import { appendParameters } from '~/utils/append-parameters'

import styles from './_styles.module.css'

type Props = Omit<ComponentProps<'a'>, 'href'> & {
  address: string
  subject?: string
  body?: string
}

/**
 * MailHyperlink component renders a `BaseHyperlink` component with a `mailto` link.
 * It allows setting the email address, subject, and body of the email.
 * The `target` and `rel` attributes are reset to `undefined`.
 *
 * @param {Object} props - The properties object.
 * @param {string} props.address - The email address to send the email to.
 * @param {string} [props.subject] - The subject of the email.
 * @param {string} [props.body] - The body of the email.
 * @param {React.ReactNode} props.children - The content to be displayed inside the anchor element.
 * @param {Object} [props.rest] - Additional properties to be passed to the anchor element.
 * @returns {JSX.Element} The rendered anchor element with a `mailto` link and mail icon.
 */
export const MailHyperlink = ({
  address,
  subject = '',
  body = '',
  children,
  className,
  ...rest
}: Props): JSX.Element => {
  const mailParams = [
    subject && `subject=${encodeURIComponent(subject)}`,
    body && `body=${encodeURIComponent(body)}`,
  ]
    .filter(Boolean)
    .join('&')

  const link = appendParameters(`mailto:${address}`, mailParams)

  return (
    <BaseHyperlink
      className={clsx(styles.link, className)}
      href={link}
      rel={undefined}
      target={undefined}
      {...rest}
    >
      {children}
      <span className={styles.iconWrapper}>
        <MailIcon />
      </span>
    </BaseHyperlink>
  )
}
