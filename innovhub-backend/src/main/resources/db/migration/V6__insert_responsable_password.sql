-- Responsable innovation : mot de passe en clair = "password"
-- Hash BCrypt (Spring BCryptPasswordEncoder / même format que V1)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, department, points, is_active, created_at, updated_at)
VALUES (
  UUID(),
  'responsable@innovhub.com',
  '$2a$10$jwWnok4HUM7cC4/zB0n28O7RAAA7J6JtL9eD8rXgWlwn7OD99KLfm',
  'Responsable',
  'Innovation',
  'RESPONSABLE_INNOVATION',
  'Innovation',
  0,
  TRUE,
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  first_name    = VALUES(first_name),
  last_name     = VALUES(last_name),
  role          = VALUES(role),
  department    = VALUES(department),
  is_active     = TRUE;
