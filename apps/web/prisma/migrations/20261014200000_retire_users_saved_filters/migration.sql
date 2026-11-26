-- The users list has no filters any more (design 28d, #647), so its saved
-- filters have nothing to apply. SQLite stores the FilterTable enum as TEXT,
-- so retiring the `users` value changes no column, only these rows.
DELETE FROM "Filter" WHERE "tableKey" = 'users';
