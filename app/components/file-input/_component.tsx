import { clsx } from "clsx"
import { type ChangeEvent, type ComponentProps, useState } from "react"

import { ErrorMessage } from "~/components/error-message"
import { ErrorMessageGroup } from "~/components/error-message-group"
import { Hyperlink } from "~/components/hyperlink"
import { UploadFileIcon } from "~/components/icons/upload-file-icon"
import { Label } from "~/components/label"

import styles from "./_styles.module.css"

const MIME_TYPES = {
  pdf: "application/pdf",
  image: "image/*",
}

type Props = Omit<ComponentProps<"input">, "accept"> & {
  label: string
  accept: "pdf" | "image"
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
            className={clsx(
              styles.inputData,
              fileName !== null && styles.inputDataSet
            )}
            aria-hidden={"true"}
          >
            <UploadFileIcon className={styles.fileIcon} />
            <span className={styles.fileName} aria-hidden={"true"}>
              {fileName ? fileName : "Vyberte soubor"}
            </span>
          </section>
          <input
            id={id}
            required={required}
            accept={acceptValue}
            onChange={handleFileChange}
            className={styles.input}
            aria-labelledby={id}
            aria-label={
              fileName ? `Vybraný soubor: ${fileName}` : "Vyberte soubor"
            }
            {...rest}
          />
        </section>
        <Hyperlink
          href={fileUrl ?? ""}
          className={clsx(
            styles.previewLink,
            fileUrl !== null && styles.visible
          )}
          aria-hidden={"true"}
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
