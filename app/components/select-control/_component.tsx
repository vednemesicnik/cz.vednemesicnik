import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import { useSelect } from '~/components/select'

import styles from './_styles.module.css'

type Props = ComponentProps<'select'>

/**
 * A `Select`'s native select with its options as children. The field's id
 * and `required` win over any passed in (e.g. by Conform's
 * `getSelectProps`), so the label always points at it.
 *
 * @param props.children - The `<option>`s
 * @returns The `<select>`
 */
export const SelectControl = ({ children, className, ...rest }: Props) => {
  const { selectId, required } = useSelect()

  return (
    <select
      className={clsx(styles.control, className)}
      {...rest}
      id={selectId}
      required={required}
    >
      {children}
    </select>
  )
}
