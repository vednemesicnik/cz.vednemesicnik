import { clsx } from 'clsx'
import type { ChangeEvent, ComponentProps } from 'react'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { UploadFileIcon } from '~/components/icons/upload-file-icon'
import { Label } from '~/components/label'
import styles from './_styles.module.css'

type Props = Omit<ComponentProps<'input'>, 'type'> & {
  errors?: string[]
  filesCount: number
  label: string
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
}

export const AdminFileInput = ({
  accept = '*',
  errors,
  filesCount,
  id,
  label,
  multiple = true,
  onFileChange,
  required,
  ...rest
}: Props) => {
  const displayText =
    filesCount > 0 ? `Vybráno souborů: ${filesCount}` : 'Vyberte soubory'
  const hasErrors = errors !== undefined && errors.length > 0

  return (
    <section className={styles.container}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <section
        className={clsx(styles.fileArea, hasErrors && styles.fileAreaError)}
      >
        <section className={styles.inputArea}>
          <section
            aria-hidden={'true'}
            className={clsx(
              styles.inputData,
              filesCount > 0 && styles.inputDataSet,
              hasErrors && styles.inputDataError,
            )}
          >
            <UploadFileIcon className={styles.fileIcon} />
            <span aria-hidden={'true'} className={styles.fileName}>
              {displayText}
            </span>
          </section>
          <input
            accept={accept}
            aria-label={displayText}
            aria-labelledby={id}
            className={styles.input}
            id={id}
            multiple={multiple}
            onChange={onFileChange}
            required={required}
            type={'file'}
            {...rest}
          />
        </section>
      </section>
      <ErrorMessageGroup>
        {errors?.map((error, index) => (
          <ErrorMessage key={index}>{error}</ErrorMessage>
        ))}
      </ErrorMessageGroup>
    </section>
  )
}
