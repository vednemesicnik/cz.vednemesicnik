import { route } from 'remix/routes'

/**
 * The URL contract, shared by the router, links, redirects and tests. Paths are English;
 * the words on the page are Czech.
 *
 * The built client modules are not a route: `serveAssets()` answers them above everything
 * that will read a session, so nothing here names `/assets`.
 */
export const routes = route({
  home: '/',
})
