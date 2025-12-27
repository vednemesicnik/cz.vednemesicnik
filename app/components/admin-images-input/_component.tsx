import { clsx } from 'clsx'
import { type ChangeEvent, type ComponentProps, useState } from 'react'

import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { UploadFileIcon } from '~/components/icons/upload-file-icon'
import { Label } from '~/components/label'

import styles from './_styles.module.css'

type Props = Omit<ComponentProps<'input'>, 'accept' | 'type' | 'multiple'> & {
  errors?: string[]
  featuredIndexName: string
  label: string
}

export const AdminImagesInput = ({
  errors,
  featuredIndexName,
  id,
  label,
  onChange,
  required,
  ...rest
}: Props) => {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [featuredIndex, setFeaturedIndex] = useState<number | null>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    setFiles(selectedFiles)

    // Clean up old preview URLs
    previews.forEach((url) => {
      URL.revokeObjectURL(url)
    })

    // Create new preview URLs
    const urls = selectedFiles.map((file) => URL.createObjectURL(file))
    setPreviews(urls)

    // Reset featured index
    setFeaturedIndex(null)

    if (onChange !== undefined) {
      onChange(event)
    }
  }

  const handleFeaturedChange = (index: number) => {
    setFeaturedIndex(index)
  }

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
              files.length > 0 && styles.inputDataSet,
            )}
          >
            <UploadFileIcon className={styles.fileIcon} />
            <span aria-hidden={'true'} className={styles.fileName}>
              {files.length > 0
                ? `Vybráno souborů: ${files.length}`
                : 'Vyberte soubory'}
            </span>
          </section>
          <input
            accept={'image/*'}
            aria-label={
              files.length > 0
                ? `Vybráno souborů: ${files.length}`
                : 'Vyberte soubory'
            }
            aria-labelledby={id}
            className={styles.input}
            id={id}
            multiple
            onChange={handleFileChange}
            required={required}
            type={'file'}
            {...rest}
          />
        </section>
      </section>

      {files.length > 0 && (
        <section className={styles.previewSection}>
          <Label>Náhled obrázků</Label>
          <section className={styles.previewGrid}>
            {files.map((_file, index) => (
              <section className={styles.imagePreview} key={index}>
                <img
                  alt={`Náhled ${index + 1}`}
                  className={styles.previewImage}
                  src={previews[index]}
                />
                <label className={styles.featuredLabel}>
                  <input
                    checked={featuredIndex === index}
                    className={styles.featuredRadio}
                    name={'_featured_radio'}
                    onChange={() => handleFeaturedChange(index)}
                    type={'radio'}
                  />
                  <span>Hlavní obrázek</span>
                </label>
              </section>
            ))}
          </section>
        </section>
      )}

      {/* Hidden input for featured index */}
      {featuredIndex !== null && (
        <input name={featuredIndexName} type={'hidden'} value={featuredIndex} />
      )}

      <ErrorMessageGroup>
        {errors?.map((error, index) => (
          <ErrorMessage key={index}>{error}</ErrorMessage>
        ))}
      </ErrorMessageGroup>
    </section>
  )
}
