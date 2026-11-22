import { createRequestHandler, type ServerBuild } from 'react-router'

/** A handler that answers one request, the shape both React Router and Remix share. */
export type FetchHandler = (request: Request) => Promise<Response>

/**
 * Creates the handler for the React Router web app from its server build.
 *
 * @param build The imported server build (`build/server/index.js`). Importing it before
 *   the port opens runs the app's environment check at boot, as `react-router-serve` did.
 * @param mode The build mode, `process.env.NODE_ENV` as `react-router-serve` passed it.
 * @returns A handler for every request the static files don't answer.
 */
export function createWebHandler(
  build: ServerBuild,
  mode?: string,
): FetchHandler {
  const handleRequest = createRequestHandler(build, mode)

  return (request) => handleRequest(request)
}
