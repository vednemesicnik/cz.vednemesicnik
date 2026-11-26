-- Whether the Doc of a final version was edited after its PDF was made (#101, `01a`, `12b`): a
-- revision of the Doc's text later than the moment the PDF was exported. Comments, renames and
-- sharing make no revision. An article every author agreed to whose Doc has one is _Upraveno po
-- schválení_. The issue detail asks Drive when it opens and records what it found here.
--
-- Times are UTC instants as ISO 8601 text with milliseconds, as everywhere in the schema.

-- The Doc's `modifiedTime` read just before the export: a revision later than it is an edit the
-- PDF may not carry. NULL for a marking made before this column, where `marked_at` stands in.
ALTER TABLE final_versions ADD COLUMN doc_modified_at TEXT;

-- The Doc's `modifiedTime` the last check examined. While Drive reports no later one, nothing
-- changed and the revisions are not listed again.
ALTER TABLE final_versions ADD COLUMN doc_checked_at TEXT;

-- The newest revision of the Doc after the baseline, NULL while none was found. Once set it is
-- never cleared: a revision does not stop having happened.
ALTER TABLE final_versions ADD COLUMN doc_revised_at TEXT;
