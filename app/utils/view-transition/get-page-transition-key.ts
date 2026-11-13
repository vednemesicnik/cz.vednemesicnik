// Added to the address only by a form's submission: `index` by React Router
// for an index route's action, `intent` by the application steps (15d).
const SUBMISSION_PARAMETERS = ['index', 'intent']

/**
 * The address a public page stands for, the key of its `PageTransition` (18d):
 * a new one makes a new page, the next page of a list included. A form sent
 * from the page lands on the same page, so the parameters only a submission
 * adds don't count, and the form stays mounted to show its result.
 *
 * @param pathname - The location's path.
 * @param search - The location's search, with or without the `?`.
 * @returns The path and the search without the submission's parameters.
 */
export const getPageTransitionKey = (pathname: string, search: string) => {
  const parameters = new URLSearchParams(search)

  for (const name of SUBMISSION_PARAMETERS) {
    parameters.delete(name)
  }

  const rest = parameters.toString()

  return rest === '' ? pathname : `${pathname}?${rest}`
}
