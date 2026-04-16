-- Fix campaigns table: expand category_color, change image_url to MEDIUMTEXT, change status to VARCHAR
ALTER TABLE campaigns MODIFY COLUMN category_color VARCHAR(50) DEFAULT '#7C3AED';
ALTER TABLE campaigns MODIFY COLUMN image_url MEDIUMTEXT;
ALTER TABLE campaigns MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIF';

-- Project Tasks table
CREATE TABLE IF NOT EXISTS project_tasks (
    id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    project_id  VARCHAR(36) NOT NULL,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    stage       VARCHAR(30) NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'A_FAIRE',
    assigned_to VARCHAR(36),
    created_by  VARCHAR(36) NOT NULL,
    due_date    DATE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id)  REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by)  REFERENCES users(id)
);

CREATE INDEX idx_tasks_project ON project_tasks(project_id);
CREATE INDEX idx_tasks_assigned ON project_tasks(assigned_to);

-- Add 2 more Responsable Innovation users for 3-score requirement (password = "password123")
INSERT INTO users (id, email, password_hash, first_name, last_name, role, department, points) VALUES
(UUID(), 'innovation2@test.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Claire', 'Moreau', 'RESPONSABLE_INNOVATION', 'Innovation', 0),
(UUID(), 'innovation3@test.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Thomas', 'Leroy',  'RESPONSABLE_INNOVATION', 'Innovation', 0);
