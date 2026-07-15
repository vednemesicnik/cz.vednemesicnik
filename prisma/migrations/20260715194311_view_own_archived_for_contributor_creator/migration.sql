-- Grant Contributor and Creator `view own archived` on their content (#195).
-- Data-only: the `view × own × archived` catalog rows already exist for every entity;
-- this connects the two roles to them. Idempotent (WHERE NOT EXISTS) so it is a no-op
-- on a freshly seeded database.
INSERT INTO "_AuthorPermissionToAuthorRole" ("A", "B")
SELECT p.id, r.id
FROM "AuthorPermission" p
JOIN "AuthorRole" r ON r.name IN ('contributor', 'creator')
WHERE p.action = 'view'
  AND p.access = 'own'
  AND p.state = 'archived'
  AND p.entity IN (
    'article',
    'article_category',
    'article_tag',
    'podcast',
    'podcast_episode',
    'podcast_episode_link',
    'issue'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "_AuthorPermissionToAuthorRole" j
    WHERE j."A" = p.id AND j."B" = r.id
  );
