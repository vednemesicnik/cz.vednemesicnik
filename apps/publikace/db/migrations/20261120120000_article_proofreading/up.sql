-- Who marked an article as in proofreading, and when (#50).
--
-- Times are UTC instants as ISO 8601 text with milliseconds, as everywhere in the schema.

-- Set by _Označit probíhající korekturu_ in the article's Doc, once and for good: nobody undoes
-- it (`01d`). The address is the one the clicker's Google identity token vouched for, the name
-- the one it carried, if any. The time and the address are set together or not at all.
ALTER TABLE articles ADD COLUMN proofread_at TEXT;
ALTER TABLE articles ADD COLUMN proofread_by_email TEXT
  CHECK ((proofread_at IS NULL) = (proofread_by_email IS NULL));
ALTER TABLE articles ADD COLUMN proofread_by_name TEXT
  CHECK (proofread_by_name IS NULL OR proofread_by_email IS NOT NULL);

-- The Doc menu finds its article by the Doc it was clicked in.
CREATE INDEX articles_by_doc ON articles (doc_id);
