import type { FormMetadata } from '@conform-to/react'
import { type FocusEvent, useEffect, useState } from 'react'
import { slugify } from '~/utils/slugify'

type UseAutoSlugOptions = {
  sourceValue: string
  updateFieldValue: FormMetadata['update']
  fieldName: string
}

export const useAutoSlug = ({
  sourceValue,
  updateFieldValue,
  fieldName,
}: UseAutoSlugOptions) => {
  const [isSlugFocused, setIsSlugFocused] = useState(false)

  useEffect(() => {
    if (!isSlugFocused) {
      updateFieldValue({ name: fieldName, value: slugify(sourceValue) })
    }
  }, [fieldName, isSlugFocused, updateFieldValue, sourceValue])

  const handleFocus = () => setIsSlugFocused(true)

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    updateFieldValue({ name: fieldName, value: slugify(event.target.value) })
  }

  return {
    handleBlur,
    handleFocus,
  }
}
