-- Fix missing ON DELETE CASCADE on idea_scores → ideas
-- and projects → ideas (block delete if project exists, handled in service instead)

-- 1. idea_scores: drop old FK, re-add with CASCADE
ALTER TABLE idea_scores DROP FOREIGN KEY FKktnivjj8lcif4w8e27u2e6bpp;
ALTER TABLE idea_scores ADD CONSTRAINT fk_idea_scores_idea
    FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE;
