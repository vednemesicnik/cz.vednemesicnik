-- _Poslat žádost znovu_ in the issue detail (`12b`, #92): an editor-in-chief sets an author's
-- clause back to _K odeslání_, and the next run of `SCRIPT__Publication__Article_Approvals` sends
-- the same e-mail again. `send_attempt` counts those sendings, the first one included.
--
-- The Mailer answers a key it has already sent as sent, without sending, so each attempt needs a
-- key of its own: the job gets it as `sendKey`, built from `clause_key` and this number, while
-- `clause_key` stays the tag in the subject and the key of the report, so a reply to either
-- e-mail is found under the same clause.
ALTER TABLE article_clauses ADD COLUMN send_attempt INTEGER NOT NULL DEFAULT 1
  CHECK (send_attempt >= 1);
