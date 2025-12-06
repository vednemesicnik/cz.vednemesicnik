import { clsx } from "clsx"
import { type ReactNode, useEffect, useRef, useState } from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
  isOpen: boolean
  onClose: () => void
  titleId: string
  descriptionId?: string
  className?: string
}

export const Modal = ({
  children,
  isOpen,
  titleId,
  descriptionId,
  onClose,
  className,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isHidden, setIsHidden] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog === null) return

    if (isOpen && !dialog.open) {
      dialog.showModal()
    }
  }, [isOpen])

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog === null) return

    if (!isOpen && dialog.open) {
      setIsHidden(true)

      const handleClose = () => {
        dialog.close()
        setIsHidden(false)
      }

      dialog.addEventListener("animationend", handleClose)

      return () => dialog.removeEventListener("animationend", handleClose)
    }
  }, [isOpen])

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog === null) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
      }
    }

    dialog.addEventListener("keydown", handleKeyDown)
    return () => dialog.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <dialog
      ref={dialogRef}
      className={clsx(styles.dialog, isHidden && styles.hidden)}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <section className={clsx(styles.container, className)}>
        {children}
      </section>
    </dialog>
  )
}
