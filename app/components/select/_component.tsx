import { createContext, type ReactNode, useContext } from 'react'

import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'

import styles from './_styles.module.css'

type SelectContextValue = {
  selectId: string
  required: boolean
}

const Context = createContext<SelectContextValue | undefined>(undefined)

type Props = {
  children: ReactNode
  id: string
  required?: boolean
  errors?: string[]
}

/**
 * A field's label, a native `<select>` and the errors under it, 6 px apart.
 * The field owns the select's id and whether it is required, so the label and
 * the select can't disagree.
 *
 * @example
 * ```tsx
 * <Select errors={fields.authorId.errors} id={fields.authorId.id} required={fields.authorId.required}>
 *   <SelectLabel>Autor</SelectLabel>
 *   <SelectControl {...getSelectProps(fields.authorId)}>
 *     <option value={author.id}>{author.name}</option>
 *   </SelectControl>
 * </Select>
 * ```
 *
 * @param props.children - The label and the control
 * @param props.id - The select's id, which the label points at
 * @param props.required - Marks the label and makes the select required
 * @param props.errors - Messages shown under the select
 * @returns The field's `<section>`
 */
export const Select = ({ children, id, required = false, errors }: Props) => {
  return (
    <Context.Provider value={{ required, selectId: id }}>
      <section className={styles.container}>
        {children}
        <ErrorMessageGroup>
          {errors?.map((error, index) => (
            <ErrorMessage key={index}>{error}</ErrorMessage>
          ))}
        </ErrorMessageGroup>
      </section>
    </Context.Provider>
  )
}

/**
 * What the field shares with its parts: the select's id and whether it is
 * required.
 *
 * @returns The select field's context
 */
export const useSelect = () => {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error('useSelect must be used within a Select')
  }

  return context
}
