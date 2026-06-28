import { type ReactNode, useEffect, useRef } from 'react'
import { CloseIcon } from '~/components/icons/close-icon'
import { MenuIcon } from '~/components/icons/menu-icon'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const Navigation = ({ children }: Props) => {
  const panelRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const panel = panelRef.current
    const menuButton = menuButtonRef.current
    if (!panel || !menuButton) return

    const handleClick = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest('a')) {
        panel.hidePopover()
      }
    }

    const handleToggle = (event: ToggleEvent) => {
      const isOpen = event.newState === 'open'
      menuButton.setAttribute('aria-expanded', String(isOpen))
      if (isOpen) {
        panel.querySelector<HTMLElement>('a, button')?.focus()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const focusable = [
        ...panel.querySelectorAll<HTMLElement>('a, button:not([disabled])'),
      ]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    panel.addEventListener('click', handleClick)
    panel.addEventListener('toggle', handleToggle)
    panel.addEventListener('keydown', handleKeyDown)

    return () => {
      panel.removeEventListener('click', handleClick)
      panel.removeEventListener('toggle', handleToggle)
      panel.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <nav className={styles.container}>
      <button
        aria-controls={'primary-navigation'}
        aria-expanded={'false'}
        aria-label={'Otevřít menu'}
        className={styles.menuButton}
        popoverTarget={'primary-navigation'}
        popoverTargetAction={'toggle'}
        ref={menuButtonRef}
        type={'button'}
      >
        <span className={styles.openIcon}>
          <MenuIcon />
        </span>
        <span className={styles.closeIcon}>
          <CloseIcon />
        </span>
      </button>
      <div
        className={styles.panel}
        id={'primary-navigation'}
        popover={'auto'}
        ref={panelRef}
      >
        <ul className={styles.list}>{children}</ul>
      </div>
    </nav>
  )
}
