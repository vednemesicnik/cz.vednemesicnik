-- What the app found missing of an issue's own folders (#134): the issue folder, and `Články`
-- in it, where the newsroom's link creates every article.
--
-- Times are UTC instants as ISO 8601 text with milliseconds, as everywhere in the schema.

-- When the app found the folder in the bin or off the shared drive (`12j`). Set where it ran into
-- it, the newsroom's link page and its form, kept at the first time while it stays missing,
-- cleared once the app reaches the folder again. With the issue folder in the bin, `Články` is
-- marked only when it is missing on its own: inside the issue folder it comes back with it. The
-- app never recreates either. The record queue's triggers watch other columns, so a mark does
-- not rewrite the Registr.
ALTER TABLE issues ADD COLUMN folder_missing_at TEXT;
ALTER TABLE issues ADD COLUMN articles_folder_missing_at TEXT;
