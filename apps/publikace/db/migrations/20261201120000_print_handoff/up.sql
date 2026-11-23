-- What the print folder of an issue made in the app holds (#110, `12t`): the job
-- `SCRIPT__Publication__Print_Handoff` fills `_Podklady_pro_tisk` with copies of the approved
-- texts and of the artworks with consent, claims what belongs there through the app's API and
-- reports what it copied. The app keeps the copies' IDs, never their content; the job keeps no
-- state of its own.
--
-- Times are UTC instants as ISO 8601 text with milliseconds, as everywhere in the schema.

-- One issue's folder as the job last reported it. `sheet_id` is the _Podklady_ sheet the job made
-- in the folder. `claim_key` and `claimed_at` are the run that holds the issue and when it took it,
-- a lease another run waits out. `filled_at` is the start of the last run that got through the
-- whole issue; a run cut short by its time leaves it as it was.
CREATE TABLE print_handoffs (
  issue_id INTEGER PRIMARY KEY REFERENCES issues (id),
  sheet_id TEXT,
  claim_key TEXT,
  claimed_at TEXT CHECK (claimed_at IS NULL OR claim_key IS NOT NULL),
  filled_at TEXT
) STRICT;

-- One article's folder inside the print folder, made with whatever came first, the approved text
-- or an artwork with consent. `text_file_id` is the copy of the text as a Google Doc and
-- `text_final_version_id` the approved final version it was exported from. `is_text_changed` is
-- what the job found: the Doc was edited after that version, so the copy stays the last approved
-- one and the _Podklady_ sheet says so. `last_image_number` only grows, so `obr-NN` never moves
-- to another picture.
CREATE TABLE print_articles (
  article_id INTEGER PRIMARY KEY REFERENCES articles (id) ON DELETE CASCADE,
  issue_id INTEGER NOT NULL REFERENCES issues (id),
  folder_id TEXT NOT NULL,
  text_file_id TEXT,
  text_final_version_id INTEGER REFERENCES final_versions (id) ON DELETE SET NULL,
  is_text_changed INTEGER NOT NULL DEFAULT 0 CHECK (is_text_changed IN (0, 1)),
  last_image_number INTEGER NOT NULL DEFAULT 0 CHECK (last_image_number >= 0)
) STRICT;

CREATE INDEX print_articles_by_issue ON print_articles (issue_id);

-- One artwork's copy in its article's folder, `obr-NN` with the artwork's extension.
CREATE TABLE print_artworks (
  artwork_id INTEGER PRIMARY KEY REFERENCES artworks (id) ON DELETE CASCADE,
  article_id INTEGER NOT NULL REFERENCES print_articles (article_id) ON DELETE CASCADE,
  copy_file_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK (name <> '')
) STRICT;

CREATE INDEX print_artworks_by_article ON print_artworks (article_id);
