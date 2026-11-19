-- The two folders inside an article's folder, and what the app found missing of the three (#44).
--
-- Times are UTC instants as ISO 8601 text with milliseconds, as everywhere in the schema.

-- `Obrazová díla` holds the uploaded artworks, `Licence` the PDF of each artwork's record and
-- its temporary Doc. Both are created in the article's all-or-nothing step and known only by
-- these IDs, never by name; a committed article without them is not a target of its link.
ALTER TABLE articles ADD COLUMN artworks_folder_id TEXT;
ALTER TABLE articles ADD COLUMN licences_folder_id TEXT;

-- When the app found the article's folder, or one of the two inside it, in the bin or off
-- the shared drive (`12j`). Set where the app ran into it, kept at the first time while it stays
-- missing, cleared once the app reaches the folder again. The app never recreates it.
ALTER TABLE articles ADD COLUMN folder_missing_at TEXT;
ALTER TABLE articles ADD COLUMN artworks_folder_missing_at TEXT;
ALTER TABLE articles ADD COLUMN licences_folder_missing_at TEXT;
