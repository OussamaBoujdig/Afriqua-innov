-- Backfill null references for existing ideas
UPDATE ideas
SET reference = CONCAT('ID-', YEAR(created_at), '-', UPPER(LEFT(id, 6)))
WHERE reference IS NULL;

-- Recalculate total_score for ideas that have been scored
UPDATE ideas i
SET total_score = (
    SELECT ROUND(AVG(s.total_score), 2)
    FROM idea_scores s
    WHERE s.idea_id = i.id
)
WHERE EXISTS (SELECT 1 FROM idea_scores s WHERE s.idea_id = i.id);
