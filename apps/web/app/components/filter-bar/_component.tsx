import { clsx } from 'clsx'
import { createContext, type ReactNode, useContext, useId } from 'react'

import styles from './_styles.module.css'

type FilterBarContextValue = {
  savedFiltersMenuId: string
}

const Context = createContext<FilterBarContextValue | undefined>(undefined)

type Props = {
  children: ReactNode
  replaced?: boolean
  className?: string
}

/**
 * The filter row over an administration list (design 22a, 22d): search and
 * filters on the left, wrapping as one group, Uložené filtry apart at the end.
 * Baseline alignment puts the saved filters' text on the line of the search
 * and the filters, whatever their heights.
 *
 * @param props.replaced - A selection bar stands in for the row on a wide
 *   screen (22c); the row keeps its size, so the table does not move.
 * @returns The `<search>` landmark with its parts
 */
export const FilterBar = ({ children, replaced = false, className }: Props) => {
  // useId() contains colons, which are invalid in an id/anchor context.
  const savedFiltersMenuId = `saved-filters-menu-${useId().replace(/:/g, '')}`

  return (
    <Context.Provider value={{ savedFiltersMenuId }}>
      <search
        className={clsx(
          styles.filterBar,
          replaced && styles.isReplaced,
          className,
        )}
      >
        {children}
      </search>
    </Context.Provider>
  )
}

/**
 * What the filter bar shares with its parts: the id of the saved-filters menu,
 * which both of its buttons open (22g).
 *
 * @returns The filter bar's context
 */
export const useFilterBar = () => {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error('useFilterBar must be used within a FilterBar')
  }

  return context
}
