import type { FieldMetadata } from '@conform-to/react'
import { getInputProps } from '@conform-to/react'
import { clsx } from 'clsx'
import { type DragEvent, useEffect, useRef, useState } from 'react'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import styles from './_styles.module.css'

type Props<FieldType extends File | undefined = File> = {
  label: string
  className?: string
  field: FieldMetadata<FieldType>
  previewUrl?: string
  disabled?: boolean
}

export const AdminImageInput = <FieldType extends File | undefined = File>({
  label,
  className,
  field,
  previewUrl,
  disabled,
}: Props<FieldType>) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [objectUrl])

  const handleFileChange = (file: File | null) => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
    }

    if (file) {
      setObjectUrl(URL.createObjectURL(file))
    } else {
      setObjectUrl(null)
    }
  }

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    setIsDragging(false)

    const file = event.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) {
      handleFileChange(file)

      // Update the input element with the dropped file
      if (inputRef.current) {
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        inputRef.current.files = dataTransfer.files
      }
    }
  }

  const hasErrors = field.errors !== undefined && field.errors.length > 0

  return (
    <div className={clsx(styles.imageArea, className)}>
      <label
        className={styles.labelWrapper}
        htmlFor={field.id}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <span className={styles.fieldLabel}>
          {label} {field.required && '*'}
        </span>
        <div
          className={clsx(
            styles.dropZone,
            isDragging && styles.dragging,
            hasErrors && styles.dropZoneError,
          )}
        >
          {objectUrl || previewUrl ? (
            <img
              alt={'Náhled obrázku'}
              className={styles.preview}
              src={objectUrl || previewUrl}
            />
          ) : (
            <div className={styles.placeholder}>
              <p className={styles.placeholderText}>
                Přetáhněte obrázek nebo klikněte pro výběr
              </p>
            </div>
          )}

          <input
            {...getInputProps(field, { type: 'file' })}
            accept={'image/*'}
            className={styles.fileInput}
            disabled={disabled}
            onChange={(event) => {
              const file = event.target.files?.[0] || null
              handleFileChange(file)
            }}
            ref={inputRef}
          />
        </div>
      </label>

      <ErrorMessageGroup>
        {field.errors?.map((error, index) => (
          <ErrorMessage key={index}>{error}</ErrorMessage>
        ))}
      </ErrorMessageGroup>
    </div>
  )
}
