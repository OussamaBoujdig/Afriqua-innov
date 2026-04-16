-- Add task_id to documents for task attachments
ALTER TABLE documents ADD COLUMN task_id VARCHAR(36) NULL;
ALTER TABLE documents ADD CONSTRAINT fk_document_task FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE;
CREATE INDEX idx_documents_task ON documents(task_id);
