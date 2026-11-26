import type { FormMetadata } from '@conform-to/react'
import { type FocusEvent, useEffect, useState } from 'react'
import { slugify } from '~/utils/slugify'

type UseAutoSlugOptions = {
  sourceValue: string | undefined
  updateFieldValue: FormMetadata['update']
  fieldName: string
  /** The field was changed by hand before, so it starts not following. */
  isInitiallyTouched?: boolean
  /** The field's value now; a source that gives the same one sends nothing. */
  fieldValue?: string
  /** Off while the form cannot take a change, e.g. before the edit hold. */
  isEnabled?: boolean
}

export const useAutoSlug = ({
  sourceValue,
  updateFieldValue,
  fieldName,
  isInitiallyTouched = false,
  fieldValue,
  isEnabled = true,
}: UseAutoSlugOptions) => {
  const [isFocused, setIsFocused] = useState(false)
  const [isTouched, setIsTouched] = useState(isInitiallyTouched)

  useEffect(() => {
    // An emptied source empties the field too; undefined means it doesn't follow.
    if (!isEnabled || isFocused || isTouched || sourceValue === undefined) {
      return
    }

    const value = slugify(sourceValue)
    // A Conform update submits the form, which reads disabled fields as
    // empty: send one only for a real change.
    if (value === fieldValue) return

    updateFieldValue({ name: fieldName, value })
  }, [
    fieldName,
    fieldValue,
    updateFieldValue,
    sourceValue,
    isEnabled,
    isFocused,
    isTouched,
  ])

  const handleFocus = () => setIsFocused(true)

  // Opt-in: once the author types in the field, it stops following the source
  // (design 25c). Without it, the field follows again after every blur.
  const handleInput = () => setIsTouched(true)

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    updateFieldValue({ name: fieldName, value: slugify(event.target.value) })
  }

  // Follows the source again, from its current value (24a: *Obnovit podle
  // názvu*).
  const resume = () => setIsTouched(false)

  return {
    handleBlur,
    handleFocus,
    handleInput,
    /** Whether the field follows the source now. */
    isFollowing: sourceValue !== undefined && !isTouched,
    resume,
  }
}
