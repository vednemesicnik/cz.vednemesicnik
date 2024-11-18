import { type UIMatch, useMatches } from "@remix-run/react"
import type { ReactNode } from "react"

import styles from "./_styles.module.css"

type BreadcrumbMatch = UIMatch<
  Record<string, unknown>,
  { breadcrumb: (data?: unknown) => ReactNode }
>

export const Breadcrumbs = () => {
  const matches = (useMatches() as unknown as BreadcrumbMatch[]).filter(
    ({ handle }) => Boolean(handle) && "breadcrumb" in handle
  )
  const matchesCount = matches.length

  return (
    <nav className={styles.container}>
      <ul className={styles.list}>
        {matches.map((match, index) => {
          const isLast = matchesCount === index + 1
          return (
            <li key={index} className={styles.listItem}>
              {match.handle.breadcrumb(match)}
              {!isLast && <span>/</span>}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
