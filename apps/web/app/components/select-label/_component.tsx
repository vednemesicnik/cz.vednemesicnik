import type { ReactNode } from 'react'

import { Label } from '~/components/label'
import { useSelect } from '~/components/select'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * A `Select`'s visible label, tied to its select by `id`; the asterisk
 * follows the field's `required`.
 *
 * @param props.children - The label, e.g. „Autor“
 * @returns The `<label>`
 */
export const SelectLabel = ({ children, className }: Props) => {
  const { selectId, required } = useSelect()

  return (
    <Label className={className} htmlFor={selectId} required={required}>
      {children}
    </Label>
  )
}
