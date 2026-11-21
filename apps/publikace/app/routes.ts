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
    /* `12j`: _Zkontrolovat znovu_ under an article whose folder was found missing. */
    checkArticleFolders: post('/issues/:name/articles/:id/folders/check'),
    /* `12k`: _Předat ke korektuře_ and _Zrušit předání_ act at once, with no dialog, and the
       toast's _Vrátit_ sends the other one (`12l`). With `?undo=` each takes back only the step
       it was offered for. */
    handOver: post('/issues/:name/articles/:id/handover'),
    cancelHandover: post('/issues/:name/articles/:id/handover/cancel'),
    /* _Zrušit finální verzi_ from the row's „⋯“ (`12q`), with the marking's time as `?marked=`. */
    cancelFinalVersion: post('/issues/:name/articles/:id/final-version/cancel'),
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

  /* What the background jobs in Apps Script call, with a Google identity token and no cookie. A
     deployed script keeps calling what it was written against, so a path here and a field in what
     it sends or gets back are never renamed in place: a change is a new version. */
  api: {
    /* The reply check of artworks, a job under `publikace.app@` with its own trigger (#31): it
       claims the batches to ask about, then reports what Reply_Check said and what it archived. */
    artworkReplies: {
      claim: post('/api/v1/artwork-replies/claim'),
      report: post('/api/v1/artwork-replies/report'),
    },
    /* The proofreaders' morning digest, a job under `publikace.app@` with a daily trigger (#14):
       one call, and the app builds, sends and records the digest. */
    proofreadingDigest: {
      run: post('/api/v1/proofreading-digest/run'),
    },
    /* `SCRIPT__Publication__Article_Approvals` for the issues made in the app (#88, #89): it
       claims the clauses of final versions to send and those whose reply to read, mails each
       author, archives a consent, and reports both halves of the run. */
    approvals: {
      claim: post('/api/v1/approvals/claim'),
      report: post('/api/v1/approvals/report'),
    },
  },

  /* _Korektura_ (`15a`–`15e`), the one page a proofreader has, and its steps, at once and with no
     dialog (`15d`). Each step sends the state the card showed: a take `shown` as a field, a
     cancel the take's time as `?take=`, a restore the cancellation's as `?cancelled=`, so a
     step decided over a card that changed meanwhile writes nothing. `?article=` is a link from
     the morning digest (`12n`). */
  proofreading: {
    index: get('/proofreading'),
    take: post('/proofreading/articles/:id'),
    cancel: post('/proofreading/articles/:id/cancel'),
    restore: post('/proofreading/articles/:id/restore'),
    /* _Označit finální verzi_ (`15f`): the dialog at its own address over the page, with the take
       the card showed as `?take=`, and the marking. Its cancel carries the marking's time as
       `?marked=` (`15g`). */
    askFinalVersion: get('/proofreading/articles/:id/final-version'),
    markFinalVersion: post('/proofreading/articles/:id/final-version'),
    cancelFinalVersion: post('/proofreading/articles/:id/final-version/cancel'),
  },

  /* _Ke kontrole_ (`13a`): the replies the reply check did not recognise as a consent.
     _Je to souhlas_ and _Vrátit_ answer at once, with no dialog (`13b`). */
  review: {
    index: get('/review'),
    verify: post('/review/batches/:id/consent'),
    undo: post('/review/batches/:id/consent/undo'),
    clauseVerify: post('/review/clauses/:id/consent'),
    clauseUndo: post('/review/clauses/:id/consent/undo'),
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
    /* _Adresa korektorů_ (`14f`): the dialog at its own address over Nastavení, and saving it. */
    askProofreaders: get('/settings/proofreaders'),
    saveProofreaders: post('/settings/proofreaders'),
    /* Connecting publikace.app@ (`14g`, `14h`): a form that sends the browser to Google, and the
       address Google sends it back to. */
    account: {
      connect: post('/settings/account/connect'),
      callback: get('/settings/account/callback'),
    },
    /* _Úlohy na pozadí_: every job with its last run (`14d`), and one job's history (`14e`),
       by the job's key as `job_runs` names it. */
    jobs: {
      index: get('/settings/jobs'),
      show: get('/settings/jobs/:job'),
    },
  },
})
