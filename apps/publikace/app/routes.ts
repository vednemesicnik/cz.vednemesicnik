import { get, post, route } from 'remix/routes'

/**
 * The URL contract, shared by the router, links, redirects and tests. Paths are English;
 * the words on the page are Czech.
 *
 * The built client modules are not a route: `serveAssets()` answers them above everything
 * that will read a session, so nothing here names `/assets`.
 *
 * A removal asks first at an address of its own — `GET` draws the question over the page,
 * `POST` to the same address is the answer — so it works with no script at all, below the
 * browsers that open a dialog from a button by markup alone.
 */
export const routes = route({
  home: '/',

  auth: {
    signIn: get('/sign-in'),
    /* `POST` only: a link could be followed from somebody else's page or by a browser fetching
       ahead (`03`, rozhodnuto 17. 11. 2026). */
    signOut: post('/sign-out'),
    google: {
      start: get('/sign-in/google'),
      callback: get('/sign-in/google/callback'),
    },
  },

  settings: {
    index: get('/settings'),
    addAccess: post('/settings/access'),
    setAdmin: post('/settings/access/accounts/:id/admin'),
    askRemoveAccount: get('/settings/access/accounts/:id/remove'),
    removeAccount: post('/settings/access/accounts/:id/remove'),
    askRemoveGroup: get('/settings/access/groups/:id/remove'),
    removeGroup: post('/settings/access/groups/:id/remove'),
  },
})
