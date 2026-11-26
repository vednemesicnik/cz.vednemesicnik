import { clsx } from 'clsx'
import { createContext, type ReactNode, useContext } from 'react'

import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'

import styles from './_styles.module.css'

type TextFieldSize = 'md' | 'sm'

type TextFieldContextValue = {
  inputId: string
  hintId: string
  required: boolean
  hasErrors: boolean
  size: TextFieldSize
}

const Context = createContext<TextFieldContextValue | undefined>(undefined)

type Props = {
  children: ReactNode
  id: string
  required?: boolean
  errors?: ReactNode[]
  /** `sm`: the field of an image tile, 12 px label and a 13 px input (24b). */
  size?: TextFieldSize
  className?: string
}

/**
 * The design system's `TextField` (components/forms/TextField, FormSet): a
 * label, a single-line input, a hint and the errors under it, 6 px apart. No
 * row is reserved for errors. The field owns the input's id and whether it is
 * required, so the label and the input can't disagree; the input is described
 * by its `TextFieldHint` whenever one is rendered.
 *
 * @example
 * ```tsx
 * <TextField errors={fields.name.errors} id={fields.name.id} required={fields.name.required}>
 *   <TextFieldLabel>Název</TextFieldLabel>
 *   <TextFieldControl {...getInputProps(fields.name, { type: 'text' })} />
 *   <TextFieldHint>Bez roku. Rok se k názvu přidá automaticky.</TextFieldHint>
 * </TextField>
 * ```
 *
 * @param props.children - The label, the control and an optional hint
 * @param props.id - The input's id, which the label points at
 * @param props.required - Marks the label and makes the input required
 * @param props.errors - Messages shown under the hint; they switch the input
 * to the error look.
 * @param props.className - Goes on the field, not the input (as in the design
 * system), e.g. to place it in a grid.
 * @returns The field's `<div>`
 */
export const TextField = ({
  children,
  id,
  required = false,
  errors,
  size = 'md',
  className,
}: Props) => {
  const hasErrors = errors !== undefined && errors.length > 0

  return (
    <Context.Provider
      value={{ hasErrors, hintId: `${id}-hint`, inputId: id, required, size }}
    >
      <div className={clsx(styles.field, styles[size], className)}>
        {children}
        <ErrorMessageGroup>
          {errors?.map((error, index) => (
            <ErrorMessage key={index}>{error}</ErrorMessage>
          ))}
        </ErrorMessageGroup>
      </div>
    </Context.Provider>
  )
}

/**
 * What the field shares with its parts: the input's and the hint's ids,
 * whether the input is required or has errors, and the size.
 *
 * @returns The text field's context
 */
export const useTextField = () => {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error('useTextField must be used within a TextField')
  }

  return context
}
