import type { ReactNode } from "react"
import { type UIMatch, useMatches } from "react-router"

import styles from "./_styles.module.css"

export type BreadcrumbMatch = UIMatch<
  unknown,
  { breadcrumb: (match?: unknown) => ReactNode }
>

export const Breadcrumbs = () => {
  const matches = (useMatches() as unknown as BreadcrumbMatch[]).filter(
    ({ handle }) => Boolean(handle) && "breadcrumb" in handle
  )
  const matchesCount = matches.length

  console.log({ matches, matchesCount })

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
