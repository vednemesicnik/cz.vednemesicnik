import { clsx } from 'clsx'
import {
  type ChangeEvent,
  type ComponentProps,
  type DragEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

import baseButtonStyles from '~/components/base-button/_styles.module.css'
import buttonStyles from '~/components/button/_styles.module.css'
import { ButtonLink } from '~/components/button-link'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { Label } from '~/components/label'
import { MAX_DECLARATION_BYTES } from '~/config/membership-application-config'
import { detectDeclarationType } from '~/utils/membership-application/detect-declaration-type'

import { DECLARATION_NOT_RECOGNISED } from '../../_schema'
import styles from './_styles.module.css'

const BYTES_IN_MEGABYTE = 1024 * 1024

// As many bytes as telling the type takes.
const SIGNATURE_LENGTH = 4

// A small file is „0,1 MB“, never „0,0 MB“.
const SMALLEST_MEGABYTES = 0.1

const formatMegabytes = (bytes: number) =>
  `${Math.max(bytes / BYTES_IN_MEGABYTE, SMALLEST_MEGABYTES).toLocaleString(
    'cs-CZ',
    {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    },
  )} MB`

type Props = Omit<ComponentProps<'input'>, 'accept' | 'type'> & {
  id: string
  /** The form's and the server's answers. */
  errors: string[] | undefined
}

/**
 * The signed scan, part of the form it stands in and sent with it (design 15d).
 * `FileDropField` is the other shape: it uploads at once and holds no file. A
 * refused file doesn't stay in the field, and the same checks run on the server.
 */
export const DeclarationUploadField = ({ id, errors, ...rest }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [refusal, setRefusal] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const shownErrors = refusal === null ? errors : [refusal]
  const hasErrors = shownErrors !== undefined && shownErrors.length > 0

  const clearInput = () => {
    if (inputRef.current !== null) inputRef.current.value = ''
  }

  const check = async (picked: File) => {
    if (picked.size > MAX_DECLARATION_BYTES) {
      return `Soubor má ${formatMegabytes(picked.size)}. Nahrajte prosím menší, nejvýš 8 MB.`
    }

    const head = await picked.slice(0, SIGNATURE_LENGTH).arrayBuffer()

    return detectDeclarationType(new Uint8Array(head)) === null
      ? DECLARATION_NOT_RECOGNISED
      : null
  }

  const take = async (picked: File) => {
    const message = await check(picked)

    setRefusal(message)
    setFile(message === null ? picked : null)
    if (message !== null) clearInput()
  }

  // A file picked before hydration is in the input, and no handler saw it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once, on mount
  useEffect(() => {
    const picked = inputRef.current?.files?.[0]
    if (picked !== undefined) void take(picked)
  }, [])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.currentTarget.files?.[0]
    if (picked === undefined) return
    void take(picked)
  }

  const handleDragOver = (event: DragEvent) => {
    if (!event.dataTransfer.types.includes('Files')) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }

  const handleDrop = (event: DragEvent) => {
    if (!event.dataTransfer.types.includes('Files')) return
    event.preventDefault()
    setIsDragOver(false)

    const dropped = event.dataTransfer.files[0]
    const input = inputRef.current
    if (dropped === undefined || input === null) return

    // One file, in the input, so the form sends it.
    const transfer = new DataTransfer()
    transfer.items.add(dropped)
    input.files = transfer.files
    // Setting `files` fires nothing, and the form revalidates on input.
    input.dispatchEvent(new Event('input', { bubbles: true }))
    void take(dropped)
  }

  const handleRemove = () => {
    clearInput()
    setFile(null)
    inputRef.current?.dispatchEvent(new Event('input', { bubbles: true }))
    // The button is about to go.
    inputRef.current?.focus()
  }

  return (
    <div className={styles.field}>
      <Label htmlFor={id}>Podepsané prohlášení</Label>

      {/* biome-ignore lint/a11y/noStaticElementInteractions: the input and its label are what a keyboard and a reader use; dropping is the mouse's extra */}
      <div
        className={styles.target}
        onDragLeave={() => setIsDragOver(false)}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          {...rest}
          accept={'application/pdf,image/jpeg,image/png'}
          aria-describedby={clsx(hintId, hasErrors && errorId)}
          aria-invalid={hasErrors || undefined}
          className={styles.input}
          id={id}
          onChange={handleChange}
          ref={inputRef}
          type={'file'}
        />

        {file === null ? (
          <div
            className={clsx(
              styles.dropZone,
              hasErrors && styles.invalid,
              isDragOver && styles.dragOver,
            )}
          >
            <label
              className={clsx(
                baseButtonStyles.button,
                buttonStyles.button,
                buttonStyles.outline,
                buttonStyles.md,
                styles.pick,
              )}
              htmlFor={id}
            >
              Vybrat soubor
            </label>
            <span className={styles.dropText}>nebo sem soubor přetáhněte</span>
          </div>
        ) : (
          <div className={styles.picked}>
            <span className={styles.pickedFile}>
              <span className={styles.pickedName}>{file.name}</span>
              <span className={styles.pickedSize}>
                {formatMegabytes(file.size)}
              </span>
            </span>
            <ButtonLink className={styles.remove} onClick={handleRemove}>
              Odebrat
            </ButtonLink>
          </div>
        )}
      </div>

      {hasErrors && (
        <ErrorMessageGroup id={errorId}>
          {shownErrors.map((error) => (
            <ErrorMessage key={error}>{error}</ErrorMessage>
          ))}
        </ErrorMessageGroup>
      )}

      <p className={styles.hint} id={hintId}>
        PDF, JPEG nebo PNG, nejvýš 8 MB. Stačí fotka z telefonu.
      </p>
    </div>
  )
}
