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

  useEffect(() => {
    if (isFocused) return

    if (sourceValue) {
      updateFieldValue({ name: fieldName, value: slugify(sourceValue) })
    }
  }, [fieldName, updateFieldValue, sourceValue, isFocused])

  const handleFocus = () => setIsFocused(true)

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    updateFieldValue({ name: fieldName, value: slugify(event.target.value) })
  }

  return {
    handleBlur,
    handleFocus,
  }
}
