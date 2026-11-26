-- The group's name in Google Workspace, as the membership service last gave it. `NULL` while no
-- answer has carried one: a group added before the service named groups, or one whose name the
-- directory did not give. It is shown, never decides who may sign in, and an answer without a
-- name leaves it as it is.
ALTER TABLE access_groups ADD COLUMN name TEXT;
