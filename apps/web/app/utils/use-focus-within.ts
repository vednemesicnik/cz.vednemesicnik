import { type FocusEvent, useEffect, useRef, useState } from 'react'

/**
 * Whether the focus is inside an element, for what shows only while it is.
 * Focus lost to a pointer press counts as lost when the press ends: whatever
 * hides with the focus would otherwise move the layout between the press and
 * the release, and the click would land beside its target.
 *
 * @returns Whether the focus is inside, and the handlers for the element.
 */
export const useFocusWithin = () => {
  const [isFocusWithin, setIsFocusWithin] = useState(false)
  const elementRef = useRef<HTMLElement | null>(null)
  const isPressedRef = useRef(false)

  useEffect(() => {
    const press = () => {
      isPressedRef.current = true
    }
    const release = () => {
      isPressedRef.current = false
    }
    // Capture, so a press counts before the focus leaves.
    document.addEventListener('pointerdown', press, true)
    document.addEventListener('pointerup', release, true)
    document.addEventListener('pointercancel', release, true)
    return () => {
      document.removeEventListener('pointerdown', press, true)
      document.removeEventListener('pointerup', release, true)
      document.removeEventListener('pointercancel', release, true)
    }
  }, [])

  const settle = () => {
    if (!elementRef.current?.contains(document.activeElement)) {
      setIsFocusWithin(false)
    }
  }

  const onBlurCapture = (event: FocusEvent<HTMLElement>) => {
    elementRef.current = event.currentTarget
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return
    }
    if (!isPressedRef.current) {
      setIsFocusWithin(false)
      return
    }
    // After the release's click, which the timeout lets through first.
    const settleAfterRelease = () => {
      document.removeEventListener('pointerup', settleAfterRelease, true)
      document.removeEventListener('pointercancel', settleAfterRelease, true)
      setTimeout(settle)
    }
    document.addEventListener('pointerup', settleAfterRelease, true)
    document.addEventListener('pointercancel', settleAfterRelease, true)
  }

  const onFocusCapture = (event: FocusEvent<HTMLElement>) => {
    elementRef.current = event.currentTarget
    setIsFocusWithin(true)
  }

  return { isFocusWithin, onBlurCapture, onFocusCapture }
}
