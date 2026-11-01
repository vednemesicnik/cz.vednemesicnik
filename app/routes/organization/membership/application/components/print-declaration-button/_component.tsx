import { type RefObject, useEffect } from 'react'

import { Button } from '~/components/button'

type Props = {
  /** The frame whose document prints. */
  frameRef: RefObject<HTMLIFrameElement | null>
  className?: string
}

/**
 * Prints the document in the frame, not the page, so only the sheet lands on
 * paper. Once hydrated it also claims ⌘P/Ctrl+P. It never falls back to the
 * page's own print: a button that does nothing beats printing the site around
 * the sheet (6enrr4f4).
 */
export const PrintDeclarationButton = ({ frameRef, className }: Props) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isPrintShortcut =
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey &&
        event.key.toLowerCase() === 'p'
      if (!isPrintShortcut) return

      event.preventDefault()
      frameRef.current?.contentWindow?.print()
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [frameRef])

  return (
    <Button
      className={className}
      onClick={() => frameRef.current?.contentWindow?.print()}
      type={'button'}
      variant={'outline'}
    >
      Vytisknout prohlášení
    </Button>
  )
}
