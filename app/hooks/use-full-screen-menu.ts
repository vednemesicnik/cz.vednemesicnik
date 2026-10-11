import { useEffect, useRef, useState } from 'react'

/**
 * Drives a full-screen menu in a modal `<dialog>` (design 10b, tbi5qpq9). Opening
 * moves focus to the close button, which stands where the menu button was; Esc,
 * the close button, a followed link, or widening past the breakpoint closes it,
 * and the browser returns focus to the menu button. Native listeners, not React's
 * `onClose`, which does not fire reliably on `<dialog>`.
 *
 * @param inlineQuery - The media query from which the menu is not needed (the
 *   navigation stands inline); the menu closes when it starts to match.
 * @returns The refs for the dialog and its close button, whether the menu is
 *   open, and `open` and `close` handlers.
 */
export const useFullScreenMenu = (inlineQuery: string) => {
  const menuRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const open = () => {
    menuRef.current?.showModal()
    closeButtonRef.current?.focus()
    setIsMenuOpen(true)
  }

  const close = () => {
    menuRef.current?.close()
  }

  useEffect(() => {
    const menu = menuRef.current
    if (!menu) return

    // Esc closes the dialog natively; the `close` event covers it and the button alike.
    const handleMenuClose = () => setIsMenuOpen(false)
    // A followed link would otherwise leave the menu open over the next page.
    const handleMenuClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('a')) {
        menu.close()
      }
    }
    const inlineNavigation = window.matchMedia(inlineQuery)
    const handleWidthChange = () => {
      if (inlineNavigation.matches) menu.close()
    }

    menu.addEventListener('close', handleMenuClose)
    menu.addEventListener('click', handleMenuClick)
    inlineNavigation.addEventListener('change', handleWidthChange)

    return () => {
      menu.removeEventListener('close', handleMenuClose)
      menu.removeEventListener('click', handleMenuClick)
      inlineNavigation.removeEventListener('change', handleWidthChange)
    }
  }, [inlineQuery])

  return { close, closeButtonRef, isMenuOpen, menuRef, open }
}
