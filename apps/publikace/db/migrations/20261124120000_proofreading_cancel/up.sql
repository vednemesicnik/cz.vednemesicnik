-- A proofreader takes an article on the page Korektura, and the take can be cancelled and given
-- back (#82).
--
-- Times are UTC instants as ISO 8601 text with milliseconds, as everywhere in the schema.

-- When the standing take was cancelled. A cancelled take keeps `proofread_at` and who took it, so
-- that _Vrátit_ gives it back to the same person with the same time (`15d`), as a cancelled
-- handover keeps its own (`12l`). A new take overwrites them and clears this.
ALTER TABLE articles ADD COLUMN proofreading_cancelled_at TEXT
  CHECK (proofreading_cancelled_at IS NULL OR proofread_at IS NOT NULL);

-- The app never looks an article up by its Doc: the Doc carries only the text.
DROP INDEX articles_by_doc;
