CREATE DATABASE IF NOT EXISTS queueing_system;
USE queueing_system;

-- =========================================
-- 1. OFFICES
-- Create offices first because users reference them.
-- =========================================

CREATE TABLE IF NOT EXISTS offices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE
);

INSERT IGNORE INTO offices (name) VALUES
  ('Registrar'),
  ('Cashier'),
  ('Guidance Office'),
  ('Library'),
  ('Admission Office');


-- =========================================
-- 2. USERS
-- office_id assigns staff to their office.
-- Students and admins may have NULL office_id.
-- =========================================

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'staff', 'admin')
    NOT NULL DEFAULT 'student',
  office_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_users_office
    FOREIGN KEY (office_id) REFERENCES offices(id)
);


-- =========================================
-- 3. QUEUE TICKETS
-- Existing ticket numbers are preserved.
-- =========================================

CREATE TABLE IF NOT EXISTS queue_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_number VARCHAR(20) NOT NULL,
  student_id INT NOT NULL,
  office_id INT NOT NULL,
  purpose VARCHAR(255),
  status ENUM(
    'waiting',
    'serving',
    'completed',
    'skipped',
    'cancelled'
  ) DEFAULT 'waiting',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  called_at TIMESTAMP NULL,

  CONSTRAINT fk_queue_student
    FOREIGN KEY (student_id) REFERENCES users(id),

  CONSTRAINT fk_queue_office
    FOREIGN KEY (office_id) REFERENCES offices(id)
);


-- =========================================
-- 4. OFFICE TICKET COUNTERS
-- Each office has its own ticket counter.
-- =========================================

CREATE TABLE IF NOT EXISTS office_ticket_counters (
  office_id INT PRIMARY KEY,
  last_number INT NOT NULL DEFAULT 0,

  CONSTRAINT fk_office_ticket_counters_office
    FOREIGN KEY (office_id) REFERENCES offices(id)
);


-- =========================================
-- 5. INITIALIZE OFFICE COUNTERS
-- For existing ticket records, start from the
-- highest existing ticket ID for each office.
-- Existing ticket numbers are not changed.
-- =========================================

INSERT INTO office_ticket_counters (office_id, last_number)
SELECT
  o.id,
  COALESCE(MAX(t.id), 0)
FROM offices o
LEFT JOIN queue_tickets t
  ON t.office_id = o.id
GROUP BY o.id
ON DUPLICATE KEY UPDATE
  last_number = GREATEST(
    office_ticket_counters.last_number,
    VALUES(last_number)
  );