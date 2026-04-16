CREATE TABLE IF NOT EXISTS project_team_members (
    id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    project_id  VARCHAR(36) NOT NULL,
    user_id     VARCHAR(36) NOT NULL,
    team_role   VARCHAR(50),
    added_by    VARCHAR(36) NOT NULL,
    added_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_project_user (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)    REFERENCES users(id),
    FOREIGN KEY (added_by)   REFERENCES users(id)
);

CREATE INDEX idx_team_project ON project_team_members(project_id);
CREATE INDEX idx_team_user    ON project_team_members(user_id);
