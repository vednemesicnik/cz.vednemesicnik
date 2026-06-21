import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { CheckIcon } from '~/components/icons/check-icon'
import { ContentCopyIcon } from '~/components/icons/content-copy-icon'

import styles from './_styles.module.css'

type Props = {
  value: string
  children: ReactNode
  className?: string
}

export const CopyButton = ({ value, children, className }: Props) => {
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      className={clsx(styles.button, copied && styles.copied, className)}
      onClick={handleClick}
      title={copied ? 'Zkopírováno!' : 'Kopírovat'}
      type="button"
    >
      {children && <span className={styles.text}>{children}</span>}
      <ContentCopyIcon
        className={clsx(styles.icon, copied && styles.iconHidden)}
      />
      <CheckIcon className={clsx(styles.icon, !copied && styles.iconHidden)} />
    </button>
  )
}
