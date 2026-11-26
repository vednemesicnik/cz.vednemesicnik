DROP TRIGGER record_clause_answered;
DROP TRIGGER record_batch_answered;
ALTER TABLE article_clauses DROP COLUMN answered_at;
ALTER TABLE article_clauses DROP COLUMN answered_message_id;
ALTER TABLE artwork_batches DROP COLUMN answered_at;
ALTER TABLE artwork_batches DROP COLUMN answered_message_id;
DROP INDEX consent_answers_one_per_clause_reply;
DROP INDEX consent_answers_one_per_batch_reply;
DROP TABLE consent_answers;
