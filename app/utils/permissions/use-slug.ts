import { useEffect, useState } from 'react'
import { slugify } from '~/utils/slugify'

export const useSlug = (value: string) => {
  const [slug, setSlug] = useState('')
  const [isSlugFocused, setIsSlugFocused] = useState(false)

  useEffect(() => {
    if (!isSlugFocused) {
      setSlug(slugify(value))
    }
  }, [value, isSlugFocused])

  return {
    setIsSlugFocused,
    setSlug,
    slug,
  }
}
