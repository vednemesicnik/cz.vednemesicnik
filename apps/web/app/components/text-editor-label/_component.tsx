import type { ReactNode } from 'react'

import { Label } from '~/components/label'
import { useTextEditorField } from '~/components/text-editor'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * A `TextEditor`'s visible label: it names the editor and points at its
 * hidden input; the asterisk follows the field's `required`.
 *
 * @param props.children - The label, e.g. „Text“
 * @returns The `<label>`
 */
export const TextEditorLabel = ({ children, className }: Props) => {
  const { inputId, labelId, required } = useTextEditorField()

  return (
    <Label
      className={className}
      htmlFor={inputId}
      id={labelId}
      required={required}
    >
      {children}
    </Label>
  )
}
