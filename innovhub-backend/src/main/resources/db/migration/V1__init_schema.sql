CREATE DATABASE IF NOT EXISTS innovhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE innovhub;

-- Users
CREATE TABLE users (
    id            VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    role          ENUM('PORTEUR_IDEE','RESPONSABLE_INNOVATION',
                       'DIRECTEUR_BU','DIRECTEUR_GENERAL') NOT NULL DEFAULT 'PORTEUR_IDEE',
    business_unit VARCHAR(100),
    department    VARCHAR(100),
    avatar_url    VARCHAR(500),
    points        INT NOT NULL DEFAULT 0,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at DATETIME,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Campaigns (must be before ideas due to FK)
CREATE TABLE campaigns (
    id             VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title          VARCHAR(255) NOT NULL,
    description    TEXT,
    category       VARCHAR(100) NOT NULL,
    category_color VARCHAR(50) DEFAULT '#7C3AED',
    image_url      MEDIUMTEXT,
    status         VARCHAR(20) NOT NULL DEFAULT 'ACTIF',
    start_date     DATE,
    end_date       DATE,
    created_by     VARCHAR(36) NOT NULL,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Ideas
CREATE TABLE ideas (
    id                VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    reference         VARCHAR(20) UNIQUE,
    title             VARCHAR(255) NOT NULL,
    category          VARCHAR(100),
    problem_statement TEXT NOT NULL,
    proposed_solution TEXT NOT NULL,
    expected_roi      VARCHAR(255),
    estimated_cost    DECIMAL(15,2),
    roi_delay_months  INT,
    target_bu         VARCHAR(100),
    timeline_months   INT,
    resources_needed  TEXT,
    status            ENUM('BROUILLON','SOUMISE','EN_VALIDATION','SCOREE',
                           'APPROUVEE_INNOVATION','APPROUVEE_BU',
                           'APPROUVEE_DG','EN_INCUBATION','REJETEE','CLOTUREE')
                      NOT NULL DEFAULT 'BROUILLON',
    current_stage     ENUM('EXPLORATION','CONCEPTUALISATION','PILOTE','MISE_A_ECHELLE'),
    total_score       DECIMAL(4,2),
    campaign_id       VARCHAR(36),
    submitted_by      VARCHAR(36) NOT NULL,
    assigned_to       VARCHAR(36),
    submitted_at      DATETIME,
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (submitted_by) REFERENCES users(id),
    FOREIGN KEY (assigned_to)  REFERENCES users(id),
    FOREIGN KEY (campaign_id)  REFERENCES campaigns(id) ON DELETE SET NULL
);

-- Auto reference trigger
DELIMITER $$
CREATE TRIGGER set_idea_reference
BEFORE INSERT ON ideas
FOR EACH ROW
BEGIN
    SET NEW.reference = CONCAT(
        'ID-', YEAR(NOW()), '-',
        LPAD((SELECT COUNT(*) + 1 FROM ideas), 3, '0')
    );
END$$
DELIMITER ;

-- Idea Scores
CREATE TABLE idea_scores (
    id                    VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    idea_id               VARCHAR(36) NOT NULL,
    scored_by             VARCHAR(36) NOT NULL,
    innovation_level      INT NOT NULL CHECK (innovation_level BETWEEN 0 AND 10),
    technical_feasibility INT NOT NULL CHECK (technical_feasibility BETWEEN 0 AND 10),
    strategic_alignment   INT NOT NULL CHECK (strategic_alignment BETWEEN 0 AND 10),
    roi_potential         INT NOT NULL CHECK (roi_potential BETWEEN 0 AND 10),
    risk_level            INT NOT NULL CHECK (risk_level BETWEEN 0 AND 10),
    total_score           DECIMAL(4,2) AS (
        ROUND(
            innovation_level      * 0.25 +
            technical_feasibility * 0.20 +
            strategic_alignment   * 0.25 +
            roi_potential         * 0.20 +
            (10 - risk_level)     * 0.10
        , 2)
    ) STORED,
    comments  TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_score (idea_id, scored_by),
    FOREIGN KEY (idea_id)   REFERENCES ideas(id) ON DELETE CASCADE,
    FOREIGN KEY (scored_by) REFERENCES users(id)
);

-- Workflow History
CREATE TABLE idea_workflow_history (
    id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    idea_id     VARCHAR(36) NOT NULL,
    from_status VARCHAR(50),
    to_status   VARCHAR(50) NOT NULL,
    action_by   VARCHAR(36) NOT NULL,
    comment     TEXT,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idea_id)   REFERENCES ideas(id) ON DELETE CASCADE,
    FOREIGN KEY (action_by) REFERENCES users(id)
);

-- Projects
CREATE TABLE projects (
    id             VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    idea_id        VARCHAR(36) NOT NULL UNIQUE,
    name           VARCHAR(255) NOT NULL,
    description    TEXT,
    current_stage  ENUM('EXPLORATION','CONCEPTUALISATION','PILOTE','MISE_A_ECHELLE')
                   NOT NULL DEFAULT 'EXPLORATION',
    stage_progress INT NOT NULL DEFAULT 0,
    owner_id       VARCHAR(36) NOT NULL,
    due_date       DATE,
    launched_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at      DATETIME,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (idea_id)  REFERENCES ideas(id),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Project Deliverables
CREATE TABLE project_deliverables (
    id         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    project_id VARCHAR(36) NOT NULL,
    stage      ENUM('EXPLORATION','CONCEPTUALISATION','PILOTE','MISE_A_ECHELLE') NOT NULL,
    title      VARCHAR(255) NOT NULL,
    is_done    BOOLEAN NOT NULL DEFAULT FALSE,
    done_at    DATETIME,
    done_by    VARCHAR(36),
    sort_order INT NOT NULL DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (done_by)    REFERENCES users(id)
);

-- Comments
CREATE TABLE comments (
    id         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    idea_id    VARCHAR(36),
    project_id VARCHAR(36),
    author_id  VARCHAR(36) NOT NULL,
    content    TEXT NOT NULL,
    parent_id  VARCHAR(36),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (idea_id)    REFERENCES ideas(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id)  REFERENCES users(id),
    FOREIGN KEY (parent_id)  REFERENCES comments(id) ON DELETE CASCADE
);

-- Documents
CREATE TABLE documents (
    id              VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    idea_id         VARCHAR(36),
    project_id      VARCHAR(36),
    file_name       VARCHAR(255) NOT NULL,
    file_path       VARCHAR(500) NOT NULL,
    file_type       VARCHAR(100),
    file_size_bytes BIGINT,
    uploaded_by     VARCHAR(36) NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idea_id)     REFERENCES ideas(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id)  REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Votes
CREATE TABLE votes (
    id         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    idea_id    VARCHAR(36) NOT NULL,
    user_id    VARCHAR(36) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_vote (idea_id, user_id),
    FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Notifications
CREATE TABLE notifications (
    id         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id    VARCHAR(36) NOT NULL,
    type       VARCHAR(50) NOT NULL,
    title      VARCHAR(255) NOT NULL,
    message    TEXT,
    link       VARCHAR(500),
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Refresh Tokens
CREATE TABLE refresh_tokens (
    id         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id    VARCHAR(36) NOT NULL,
    token      VARCHAR(500) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_ideas_status       ON ideas(status);
CREATE INDEX idx_ideas_submitted_by ON ideas(submitted_by);
CREATE INDEX idx_ideas_campaign_id  ON ideas(campaign_id);
CREATE INDEX idx_notif_user_unread  ON notifications(user_id, is_read);

-- Seed data (password = "password123")
INSERT INTO users (id, email, password_hash, first_name, last_name, role, department, points) VALUES
(UUID(), 'porteur@test.com',    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jean',     'Dupont',   'PORTEUR_IDEE',            'IT',        120),
(UUID(), 'innovation@test.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sophie',   'Bernard',  'RESPONSABLE_INNOVATION',  'Innovation', 2450),
(UUID(), 'directeurbu@test.com','$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Marc',     'Durand',   'DIRECTEUR_BU',            'Direction',  800),
(UUID(), 'dg@test.com',         '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Philippe', 'Martin',   'DIRECTEUR_GENERAL',       'Direction',  500);
