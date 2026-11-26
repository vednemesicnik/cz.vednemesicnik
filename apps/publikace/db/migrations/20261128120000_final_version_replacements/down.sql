ALTER TABLE article_clauses DROP COLUMN replaces_clause_id;
DROP INDEX final_versions_standing;
CREATE UNIQUE INDEX final_versions_standing ON final_versions (article_id)
  WHERE cancelled_at IS NULL;
ALTER TABLE final_versions DROP COLUMN replaces_version_id;
ALTER TABLE final_versions DROP COLUMN replaced_at;
