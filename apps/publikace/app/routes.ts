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

  /* The dialog _Nové vydání_ stands at its own address over the overview, as a removal does in
     Settings: `GET` draws it, `POST` to the same address creates the issue (`11d`). `/issues/new`
     is matched before `/issues/:name`. */
  issues: {
    new: get('/issues/new'),
    create: post('/issues/new'),
    show: get('/issues/:name'),
    finish: post('/issues/:name/finish'),
    /* _Vydat nový odkaz_ asks at an address of its own, as a removal does (`02d`). */
    askRenewLink: get('/issues/:name/link/renew'),
    renewLink: post('/issues/:name/link/renew'),
    /* A batch of artworks (`12o`): _Poslat žádost znovu_ at once, _Zahodit dávku_ after asking at
       an address of its own, as a removal does. */
    resendBatch: post('/issues/:name/artworks/batches/:id/resend'),
    askDiscardBatch: get('/issues/:name/artworks/batches/:id/discard'),
    discardBatch: post('/issues/:name/artworks/batches/:id/discard'),
  },

  /* The pages behind a shared link, without sign-in or cookies (`02a`). `GET` draws the form,
     `POST` to the same address creates the article (`20a`–`20d`). */
  links: {
    article: get('/l/:key/article'),
    createArticle: post('/l/:key/article'),

    /* The artworks behind an article's link (`21`), as public as the article page. Each chosen
       file is sent at once to `files`, as its raw body (`21a`, _Nahrává se hned po výběru_);
       `POST` to the page itself sends the batch, or with `intent=another` opens the form again
       with the provider kept (`21c`, _Nahrát další díla_). */
    artworks: {
      show: get('/l/:key/artworks'),
      submit: post('/l/:key/artworks'),
      upload: post('/l/:key/artworks/files'),
      remove: post('/l/:key/artworks/files/:id/remove'),
    },
  },

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
    /* Connecting publikace.app@ (`14g`, `14h`): a form that sends the browser to Google, and the
       address Google sends it back to. */
    account: {
      connect: post('/settings/account/connect'),
      callback: get('/settings/account/callback'),
    },
  },
})
