import { clsx } from 'clsx'
import { isRouteErrorResponse } from 'react-router'

import { getErrorMessage } from '~/utils/get-error-message'

import styles from './_styles.module.css'

type Props = {
  error: unknown
  className?: string
}

const getDiagnosticMessage = (error: unknown) => {
  if (!isRouteErrorResponse(error)) return getErrorMessage(error)

  const status = `${error.status} ${error.statusText}`.trim()
  if (error.data === null || error.data === undefined) return status

  const data =
    typeof error.data === 'string' ? error.data : JSON.stringify(error.data)
  return `${status}: ${data}`
}

/**
 * Error message and stack under a boundary's sentence, in development only
 * (design 30g). Production HTML never carries them — the server log has them.
 *
 * @param error - The error handed to the boundary.
 * @param className - Placement override from the rendering boundary.
 */
export const BoundaryDiagnostics = ({ error, className }: Props) => {
  if (!import.meta.env.DEV) return null

  const stack = error instanceof Error ? error.stack : undefined

  return (
    <pre className={clsx(styles.diagnostics, className)}>
      {getDiagnosticMessage(error)}
      {stack !== undefined && `\n\n${stack}`}
    </pre>
  )
}
