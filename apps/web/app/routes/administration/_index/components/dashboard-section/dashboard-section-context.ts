import { createContext } from 'react'

/** The id of the section's heading, which names the section. */
export const DashboardSectionContext = createContext<string | undefined>(
  undefined,
)
