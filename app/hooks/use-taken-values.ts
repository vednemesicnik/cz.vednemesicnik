import { useRef } from 'react'

/**
 * The values of one field the server reported as held by another record (log
 * 0039), for the editor's schema to turn into a field error. They only grow:
 * a value stays taken until the page loads again.
 *
 * @param initialValues - What the loader reported.
 * @returns `has` for the schema and `add` for each save's answer.
 */
export const useTakenValues = (initialValues: ReadonlyArray<string | null>) => {
  const takenValuesRef = useRef<Set<string> | null>(null)
  if (takenValuesRef.current === null) {
    takenValuesRef.current = new Set(
      initialValues.filter((value): value is string => value !== null),
    )
  }
  const takenValues = takenValuesRef.current

  return {
    add: (value: string) => {
      takenValues.add(value)
    },
    has: (value: string) => takenValues.has(value),
  }
}
