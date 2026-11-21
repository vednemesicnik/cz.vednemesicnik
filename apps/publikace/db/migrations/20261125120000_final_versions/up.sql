-- The final version of an article and one editorial clause per author (#88): a proofreader, or
-- an editor-in-chief for them, marks it on the page Korektura (`15f`), and the article is then
-- _K souhlasu_ (`01a`). `SCRIPT__Publication__Approval_Send` claims the clauses through the app's
-- API and e-mails each author the PDF (#89).
--
-- Times are UTC instants as ISO 8601 text with milliseconds, as everywhere in the schema.

-- One marking: who made it and when, and the PDF of the Doc as it was then, stored in the
-- article folder. `attempt_key` is the tag on that file (`appProperties`), by which a marking
-- Drive stopped midway finds what to put in the bin, never by a name (`11c`). A cancelled
-- marking keeps its row and its PDF's ID, the PDF itself goes to the bin, and its clauses are
-- deleted: nothing was sent.
CREATE TABLE final_versions (
  id INTEGER PRIMARY KEY,
  article_id INTEGER NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
  marked_at TEXT NOT NULL,
  marked_by_email TEXT NOT NULL,
  marked_by_name TEXT,
  pdf_file_id TEXT NOT NULL,
  pdf_hash TEXT NOT NULL,
  attempt_key TEXT NOT NULL UNIQUE,
  cancelled_at TEXT
) STRICT;

-- At most one marking stands for an article.
CREATE UNIQUE INDEX final_versions_standing ON final_versions (article_id)
  WHERE cancelled_at IS NULL;

-- One author's clause of one marking: the author as the article had them, and the signature the
-- clause carries (the name, as the form took it). `pending` is _K odeslání_, `sent` _Čeká na
-- odpověď_, `failed` _Chyba_ with the job's error.
--
-- `clause_key` names the clause to the job: the Mailer's idempotency key and the tag in the
-- e-mail's subject. `claim_key` and `claimed_at` are the run that holds it and when, a lease
-- another run waits out. `first_claimed_at` is the first time any run took it, and is never
-- cleared: from then on an e-mail may be on its way, and the marking can no longer be cancelled
-- (`15g`).
CREATE TABLE article_clauses (
  id INTEGER PRIMARY KEY,
  final_version_id INTEGER NOT NULL REFERENCES final_versions (id) ON DELETE CASCADE,
  article_id INTEGER NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  signature TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'sent', 'failed')),
  clause_key TEXT NOT NULL UNIQUE,
  claim_key TEXT,
  claimed_at TEXT CHECK (claimed_at IS NULL OR claim_key IS NOT NULL),
  first_claimed_at TEXT CHECK (first_claimed_at IS NULL OR claim_key IS NOT NULL),
  sent_at TEXT CHECK (sent_at IS NULL OR state = 'sent'),
  error TEXT CHECK (error IS NULL OR state = 'failed'),
  UNIQUE (final_version_id, position)
) STRICT;

CREATE INDEX article_clauses_by_article ON article_clauses (article_id);
