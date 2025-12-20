import { clsx } from 'clsx'
import { type ChangeEvent, type ComponentProps, useState } from 'react'

import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { Hyperlink } from '~/components/hyperlink'
import { UploadFileIcon } from '~/components/icons/upload-file-icon'
import { Label } from '~/components/label'

import styles from './_styles.module.css'

const MIME_TYPES = {
  image: 'image/*',
  pdf: 'application/pdf',
}

type Props = Omit<ComponentProps<'input'>, 'accept'> & {
  label: string
  accept: 'pdf' | 'image'
  errors?: string[]
}

export const FileInput = ({
  label,
  id,
  errors,
  required,
  onChange,
  accept,
  ...rest
}: Props) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setFileUrl(url)
      setFileName(file.name)
    } else {
      setFileUrl(null)
      setFileName(null)
    }

    if (onChange !== undefined) {
      onChange(event)
    }
  }

  const acceptValue = MIME_TYPES[accept]

  return (
    <section className={styles.container}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <section className={styles.fileArea}>
        <section className={styles.inputArea}>
          <section
            aria-hidden={'true'}
            className={clsx(
              styles.inputData,
              fileName !== null && styles.inputDataSet,
            )}
          >
            <UploadFileIcon className={styles.fileIcon} />
            <span aria-hidden={'true'} className={styles.fileName}>
              {fileName ? fileName : 'Vyberte soubor'}
            </span>
          </section>
          <input
            accept={acceptValue}
            aria-label={
              fileName ? `Vybraný soubor: ${fileName}` : 'Vyberte soubor'
            }
            aria-labelledby={id}
            className={styles.input}
            id={id}
            onChange={handleFileChange}
            required={required}
            {...rest}
          />
        </section>
        <Hyperlink
          aria-hidden={'true'}
          className={clsx(
            styles.previewLink,
            fileUrl !== null && styles.visible,
          )}
          href={fileUrl ?? ''}
        >
          Ukázat nahraný soubor
        </Hyperlink>
      </section>
      <ErrorMessageGroup>
        {errors?.map((error, index) => (
          <ErrorMessage key={index}>{error}</ErrorMessage>
        ))}
      </ErrorMessageGroup>
    </section>
  )
}
