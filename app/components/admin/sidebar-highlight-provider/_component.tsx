import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'

// Context

type SidebarHighlight = {
  highlightsSection: boolean
  setHighlightsSection: (highlightsSection: boolean) => void
}

const Context = createContext<SidebarHighlight | undefined>(undefined)

// Provider

type Props = {
  children: ReactNode
}

/**
 * Lets a boundary below the sidebar turn off the highlight of the section the address
 * belongs to (design 30e, 30h: `panel bez zvýraznění`).
 */
export const SidebarHighlightProvider = ({ children }: Props) => {
  const [highlightsSection, setHighlightsSection] = useState(true)

  return (
    <Context.Provider value={{ highlightsSection, setHighlightsSection }}>
      {children}
    </Context.Provider>
  )
}

// Hooks

/**
 * @returns Whether the sidebar highlights the section of the current address; `true`
 *   outside the provider.
 */
export const useSidebarHighlight = () =>
  useContext(Context)?.highlightsSection ?? true

/**
 * Sets whether the sidebar highlights the section while the calling component is
 * mounted. Runs after hydration, so without JavaScript the section stays highlighted.
 * A no-op outside the provider (e.g. in Storybook).
 *
 * @param highlightsSection - Whether to highlight.
 */
export const useHighlightSidebarSection = (highlightsSection: boolean) => {
  const setHighlightsSection = useContext(Context)?.setHighlightsSection

  useEffect(() => {
    if (setHighlightsSection === undefined) return

    setHighlightsSection(highlightsSection)
    return () => setHighlightsSection(true)
  }, [highlightsSection, setHighlightsSection])
}
