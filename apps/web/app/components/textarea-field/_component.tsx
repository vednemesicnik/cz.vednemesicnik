import type { FieldMetadata } from '@conform-to/react'
import { clsx } from 'clsx'
import { createContext, type ReactNode, useContext } from 'react'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import styles from './_styles.module.css'

type TextareaFieldContextValue = {
  field: FieldMetadata<string | undefined>
  hintId: string
  counterId: string
  hasErrors: boolean
}

const Context = createContext<TextareaFieldContextValue | undefined>(undefined)

type Props<FieldType extends string | undefined = string> = {
  children: ReactNode
  field: FieldMetadata<FieldType>
  className?: string
}

/**
 * A field's label, a multi-line input, then one row: the hint and the errors
 * at its start, an optional counter at its end (design 28c, 29b). The field
 * owns the Conform field, so its parts share its id; the textarea is
 * described by its `TextareaFieldHint` and `TextareaFieldCounter` whenever
 * they are rendered.
 *
 * @example
 * ```tsx
 * <TextareaField field={fields.perex}>
 *   <TextareaFieldLabel>Perex</TextareaFieldLabel>
 *   <TextareaFieldControl rows={3} />
 *   <TextareaFieldHint>Krátké shrnutí pod názvem.</TextareaFieldHint>
 *   <TextareaFieldCounter>{`${length} / 160`}</TextareaFieldCounter>
 * </TextareaField>
 * ```
 *
 * @param props.children - The label, the control, then an optional hint and
 * counter
 * @param props.field - The Conform field; its errors show under the hint.
 * @returns The field's `<section>`
 */
export const TextareaField = <FieldType extends string | undefined = string>({
  children,
  field,
  className,
}: Props<FieldType>) => {
  const hasErrors = field.errors !== undefined && field.errors.length > 0

  return (
    <Context.Provider
      value={{
        counterId: `${field.id}-counter`,
        field: field as FieldMetadata<string | undefined>,
        hasErrors,
        hintId: `${field.id}-hint`,
      }}
    >
      <section className={clsx(styles.container, className)}>
        {children}
        <ErrorMessageGroup className={styles.errors}>
          {field.errors?.map((error, index) => (
            <ErrorMessage key={index}>{error}</ErrorMessage>
          ))}
        </ErrorMessageGroup>
      </section>
    </Context.Provider>
  )
}

/**
 * What the field shares with its parts: the Conform field, the hint's and the
 * counter's ids, and whether it has errors.
 *
 * @returns The textarea field's context
 */
export const useTextareaField = () => {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error('useTextareaField must be used within a TextareaField')
  }

  return context
}
