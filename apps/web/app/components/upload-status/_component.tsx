import { clsx } from 'clsx'
import { useEffect, useState } from 'react'

import { ButtonLink } from '~/components/button-link'
import { UploadStatusBar } from '~/components/upload-status-bar'

import styles from './_styles.module.css'

type Props = {
  /** *Zrušit*'s accessible name: `Zrušit nahrávání ctenari.jpg` (moo05ljj). */
  cancelLabel: string
  onCancel: () => void
  className?: string
}

/**
 * The design system's `UploadStatus`: one upload row for every file in the
 * administration (design 24b, bxy8xxqs). *Nahrává se* with *Zrušit* for the
 * whole upload, and under it the indeterminate bar; the row is one height
 * from the pick to the save. The word is said once, by a live region filled
 * after the row appears: text that comes with its live region is often not
 * read. The narrow column's shape is `CompactUploadStatus`.
 */
export const UploadStatus = ({ cancelLabel, onCancel, className }: Props) => {
  const [announcement, setAnnouncement] = useState('')
  useEffect(() => {
    const timeout = setTimeout(() => setAnnouncement('Nahrává se'), 150)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className={clsx(styles.uploadStatus, className)}>
      <div className={styles.row}>
        <span aria-hidden={true} className={styles.label}>
          Nahrává se
        </span>
        <span className={'screen-reader-only'} role={'status'}>
          {announcement}
        </span>
        <ButtonLink
          aria-label={cancelLabel}
          className={styles.cancel}
          onClick={onCancel}
        >
          Zrušit
        </ButtonLink>
      </div>
      <UploadStatusBar />
    </div>
  )
}
