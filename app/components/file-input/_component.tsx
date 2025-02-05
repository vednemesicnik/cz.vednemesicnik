import { applyClasses, combineClasses } from "@liborgabrhel/style-utils"
import { type ChangeEvent, type ComponentProps, useState } from "react"

import { ErrorMessage } from "~/components/error-message"
import { ErrorMessageGroup } from "~/components/error-message-group"
import { Hyperlink } from "~/components/hyperlink"
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
            className={combineClasses(
              styles.inputData,
              applyClasses(styles.inputDataSet).if(fileName !== null)
            )}
            aria-hidden={"true"}
          >
            <svg
              xmlns={"http://www.w3.org/2000/svg"}
              viewBox={"0 -960 960 960"}
              className={styles.fileIcon}
              aria-hidden={"true"}
            >
              <path
                d={
                  "M440-200h80v-167l64 64 56-57-160-160-160 160 57 56 63-63v167ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"
                }
              />
            </svg>
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
          className={combineClasses(
            styles.previewLink,
            applyClasses(styles.visible).if(fileUrl !== null)
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
