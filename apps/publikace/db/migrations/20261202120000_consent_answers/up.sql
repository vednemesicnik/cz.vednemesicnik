-- Answering a reply from Ke kontrole (`13d`–`13h`, #31): the editors-in-chief write back to the
-- provider of a batch or the author of a clause, and the Mailer sends it inside the thread of the
-- consent request, as a reply to the provider's latest message.
--
-- Times are UTC instants as ISO 8601 text with milliseconds, as everywhere in the schema.

-- One answer, stored before the Mailer is asked, so a send it never confirmed is still on record
-- and is retried with the same text under the same key (`13e`). It belongs to a batch or to a
-- clause, never both. `in_reply_to_message_id` is the Gmail message the card showed; the quote of
-- it in the e-mail is kept beside it, so a retry sends the very same e-mail. `signature_name` is
-- NULL when Google gave the editor no name, and the e-mail is then signed by the newsroom alone;
-- `editor_name` is what the card shows, the address when there is no name. At most one of
-- `sent_at`, `failed_at` and `refused_at` is the outcome: `failed_at` is a send the Mailer did
-- not confirm, which may still have gone. Deleted with the reply's text once the conversation is
-- archived, because the PDF in `Licence` then holds it (`13f`).
CREATE TABLE consent_answers (
  id INTEGER PRIMARY KEY,
  batch_id INTEGER REFERENCES artwork_batches (id),
  clause_id INTEGER REFERENCES article_clauses (id),
  in_reply_to_message_id TEXT NOT NULL CHECK (in_reply_to_message_id <> ''),
  reply_received_at TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  text TEXT NOT NULL CHECK (length(text) BETWEEN 1 AND 5000),
  signature_name TEXT,
  editor_email TEXT NOT NULL,
  editor_name TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  started_at TEXT NOT NULL,
  sent_at TEXT,
  failed_at TEXT,
  refused_at TEXT,
  CHECK ((batch_id IS NULL) <> (clause_id IS NULL)),
  CHECK ((sent_at IS NOT NULL) + (failed_at IS NOT NULL) + (refused_at IS NOT NULL) <= 1)
) STRICT;

-- One answer per message of the provider: a second editor or tab answering the same reply finds
-- this one instead of sending its own.
CREATE UNIQUE INDEX consent_answers_one_per_batch_reply
  ON consent_answers (batch_id, in_reply_to_message_id) WHERE batch_id IS NOT NULL;
CREATE UNIQUE INDEX consent_answers_one_per_clause_reply
  ON consent_answers (clause_id, in_reply_to_message_id) WHERE clause_id IS NOT NULL;

-- The provider's message the last confirmed answer went to, and when. The latest reply counts as
-- answered while `answered_message_id` is the batch's `reply_message_id`; a newer reply leaves
-- them apart, and the batch is back in Ke kontrole without anything being reset.
ALTER TABLE artwork_batches ADD COLUMN answered_message_id TEXT
  CHECK (answered_message_id <> '');
ALTER TABLE artwork_batches ADD COLUMN answered_at TEXT
  CHECK ((answered_message_id IS NULL) = (answered_at IS NULL));

-- The same for an author's clause.
ALTER TABLE article_clauses ADD COLUMN answered_message_id TEXT
  CHECK (answered_message_id <> '');
ALTER TABLE article_clauses ADD COLUMN answered_at TEXT
  CHECK ((answered_message_id IS NULL) = (answered_at IS NULL));

-- An answer puts the provider or the author on the move, which the Evidence says as _Čeká na
-- odpověď_: the record queue writes the issue's Evidence again, as it does for every other
-- change of a batch's or a clause's state (`20261130120000_record_queue`).
CREATE TRIGGER record_batch_answered
AFTER UPDATE OF answered_message_id, answered_at ON artwork_batches
WHEN NEW.created_at IS NOT NULL AND
  (OLD.answered_message_id IS NOT NEW.answered_message_id OR
   OLD.answered_at IS NOT NEW.answered_at)
BEGIN
  INSERT INTO record_marks (kind, issue_id) VALUES ('evidence', NEW.issue_id)
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;

CREATE TRIGGER record_clause_answered
AFTER UPDATE OF answered_message_id, answered_at ON article_clauses
WHEN
  (OLD.answered_message_id IS NOT NEW.answered_message_id OR
   OLD.answered_at IS NOT NEW.answered_at)
BEGIN
  INSERT INTO record_marks (kind, issue_id)
  VALUES ('evidence', (SELECT issue_id FROM articles WHERE id = NEW.article_id))
  ON CONFLICT (kind, issue_id) DO UPDATE
    SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL;
END;
