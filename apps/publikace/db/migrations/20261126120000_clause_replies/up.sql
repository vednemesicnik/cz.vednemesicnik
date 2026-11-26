-- What `SCRIPT__Publication__Article_Approvals` reports about the reply to an author's clause,
-- and what the editors-in-chief decide about it in Ke kontrole (#89). The columns are those of a
-- batch of artworks (`20261121120000_consent_replies`), because the reply check and the queue
-- treat both alike.
--
-- `state` keeps `pending`, `sent` and `failed`: what follows _Čeká na odpověď_ (_Odpověď ke
-- kontrole_, _Souhlas k archivaci_, _Souhlas udělen_) is read from these columns, as a batch's
-- state is. The run that checks the reply holds the clause through `claim_key` and `claimed_at`,
-- as the run that sends it does: a clause is sent only while `pending`, and asked about only
-- once it is not, so one run never holds it for both.
--
-- Times are UTC instants as ISO 8601 text with milliseconds, as everywhere in the schema.

-- The author's latest reply as the reply check last read it: the Gmail thread and message, the
-- moment it arrived, and its own text, cut of the quote and the signature. `is_exact_consent` is 1
-- when that text is exactly „Souhlasím“. The text is cleared once the conversation is archived,
-- because the PDF in the article's `Licence` then holds it.
ALTER TABLE article_clauses ADD COLUMN reply_thread_id TEXT;
ALTER TABLE article_clauses ADD COLUMN reply_message_id TEXT;
ALTER TABLE article_clauses ADD COLUMN reply_received_at TEXT;
ALTER TABLE article_clauses ADD COLUMN reply_text TEXT;
ALTER TABLE article_clauses ADD COLUMN is_exact_consent INTEGER NOT NULL DEFAULT 0
  CHECK (is_exact_consent IN (0, 1));
ALTER TABLE article_clauses ADD COLUMN checked_at TEXT;

-- _Je to souhlas_ (`13b`): who decided and when. Cleared by _Vrátit_ until the job archives.
ALTER TABLE article_clauses ADD COLUMN consent_verified_at TEXT;
ALTER TABLE article_clauses ADD COLUMN consent_verified_by_email TEXT
  CHECK ((consent_verified_at IS NULL) = (consent_verified_by_email IS NULL));
ALTER TABLE article_clauses ADD COLUMN consent_verified_by_name TEXT;

-- _Souhlas udělen_: the job archived the conversation as a PDF in the article's `Licence`, this
-- file.
ALTER TABLE article_clauses ADD COLUMN approved_at TEXT;
ALTER TABLE article_clauses ADD COLUMN consent_file_id TEXT
  CHECK ((approved_at IS NULL) = (consent_file_id IS NULL));

-- The archive failed on the last try (`13c`), with the job's technical text. Cleared by the
-- archive that succeeds.
ALTER TABLE article_clauses ADD COLUMN archive_failed_at TEXT;
ALTER TABLE article_clauses ADD COLUMN archive_error TEXT;

CREATE INDEX article_clauses_by_claim ON article_clauses (claim_key);
