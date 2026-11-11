import { clsx } from 'clsx'
import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useId,
  useRef,
} from 'react'

import styles from './_styles.module.css'

type EditorDetailContextValue = {
  name: string
  panelId: string
  headingId: string
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  rowRef: RefObject<HTMLButtonElement | null>
  headingRef: RefObject<HTMLHeadingElement | null>
}

const Context = createContext<EditorDetailContextValue | undefined>(undefined)

type Props = {
  /** The detail's name: its row and its panel's heading, which names the panel. */
  name: string
  isOpen: boolean
  /** Another detail is open over it: out of reach (24f). */
  isInert: boolean
  onOpen: () => void
  onClose: () => void
  className?: string
  children: ReactNode
}

/**
 * One detail of the article editor's right column (design 24a). On a phone it
 * is a row with its value that opens the detail over the whole screen, with
 * the save line and *Hotovo*, which only closes (24f). It is one section at
 * every width, so its fields exist once in the form. Opening moves the focus
 * to the panel's name, and closing moves it back to the row.
 *
 * @param props.children - `EditorDetailSummary`, then `EditorDetailPanel`.
 */
export const EditorDetail = ({
  name,
  isOpen,
  isInert,
  onOpen,
  onClose,
  className,
  children,
}: Props) => {
  const panelId = useId()
  const headingId = useId()
  const rowRef = useRef<HTMLButtonElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (isOpen) {
      headingRef.current?.focus()
    } else if (wasOpenRef.current) {
      rowRef.current?.focus()
    }
    wasOpenRef.current = isOpen
  }, [isOpen])

  return (
    <section className={clsx(styles.detail, className)} inert={isInert}>
      <Context.Provider
        value={{
          headingId,
          headingRef,
          isOpen,
          name,
          onClose,
          onOpen,
          panelId,
          rowRef,
        }}
      >
        {children}
      </Context.Provider>
    </section>
  )
}

/**
 * What an `EditorDetail` shares with its parts: its name, the panel's ids,
 * the open state and the focus targets.
 *
 * @returns The editor detail's context
 */
export const useEditorDetail = () => {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error('useEditorDetail must be used within an EditorDetail')
  }

  return context
}
