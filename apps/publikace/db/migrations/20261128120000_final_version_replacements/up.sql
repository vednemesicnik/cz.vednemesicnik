-- A new final version marked by an editor-in-chief after the job has taken the clauses of the
-- standing one, and before every author agreed to it (#90, `12r`, `12s`). The new marking stands
-- in place of the old one, which stays as the record of what was sent.
--
-- Times are UTC instants as ISO 8601 text with milliseconds, as everywhere in the schema.

-- When a newer marking replaced this one: the newer marking's own time. A replaced marking keeps
-- its PDF and its clauses, because e-mails went out with them. Nothing of it is sent, asked about
-- or archived any more. A marking is cancelled or replaced, never both.
ALTER TABLE final_versions ADD COLUMN replaced_at TEXT
  CHECK (replaced_at IS NULL OR cancelled_at IS NULL);

-- The marking this one replaced. Cancelling this one, while no run has taken its clauses, makes
-- that one stand again as it was.
ALTER TABLE final_versions ADD COLUMN replaces_version_id INTEGER REFERENCES final_versions (id);

-- At most one marking stands for an article: neither cancelled nor replaced.
DROP INDEX final_versions_standing;
CREATE UNIQUE INDEX final_versions_standing ON final_versions (article_id)
  WHERE cancelled_at IS NULL AND replaced_at IS NULL;

-- The same author's clause in the marking that this clause's marking replaced. When a run ever
-- took that clause, an e-mail may have reached the author, and the job's e-mail says this one
-- replaces it.
ALTER TABLE article_clauses ADD COLUMN replaces_clause_id INTEGER REFERENCES article_clauses (id);
