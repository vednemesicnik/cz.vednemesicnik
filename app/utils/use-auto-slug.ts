import type { FormMetadata } from '@conform-to/react'
import { type FocusEvent, useEffect, useState } from 'react'
import { slugify } from '~/utils/slugify'

type UseAutoSlugOptions = {
  sourceValue: string | undefined
  updateFieldValue: FormMetadata['update']
  fieldName: string
}

export const useAutoSlug = ({
  sourceValue,
  updateFieldValue,
  fieldName,
}: UseAutoSlugOptions) => {
  const [isFocused, setIsFocused] = useState(false)
  const [isTouched, setIsTouched] = useState(false)

  useEffect(() => {
    // An emptied source empties the field too; undefined means it doesn't follow.
    if (isFocused || isTouched || sourceValue === undefined) return

    updateFieldValue({ name: fieldName, value: slugify(sourceValue) })
  }, [fieldName, updateFieldValue, sourceValue, isFocused, isTouched])

  const handleFocus = () => setIsFocused(true)

  // Opt-in: once the author types in the field, it stops following the source
  // (design 25c). Without it, the field follows again after every blur.
  const handleInput = () => setIsTouched(true)

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    updateFieldValue({ name: fieldName, value: slugify(event.target.value) })
  }

  return {
    handleBlur,
    handleFocus,
    handleInput,
  }
}
