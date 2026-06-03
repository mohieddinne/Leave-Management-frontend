-- =====================================================
-- conges_db_visualization.sql
-- SQL commands to inspect and visualize the Leave Management database
-- Usage:
--   PowerShell (Windows):
--   Get-Content .\conges_db_visualization.sql | & "C:\xampp\mysql\bin\mysql.exe" -h 127.0.0.1 -P 3306 -u root --default-character-set=utf8mb4 --table
--   CMD/bash:
--   mysql -h 127.0.0.1 -P 3306 -u root < conges_db_visualization.sql
-- =====================================================

-- 1) Server and database context
SELECT @@hostname AS hostname, @@port AS port, @@version_comment AS version_comment;
SHOW DATABASES;

USE conges_db;

-- 2) List tables
SHOW TABLES;

-- 3) Show table structures
DESCRIBE departments;
DESCRIBE employees;
DESCRIBE leave_types;
DESCRIBE leave_balances;
DESCRIBE leave_requests;

-- 4) Quick row counts
SELECT 'departments' AS table_name, COUNT(*) AS total FROM departments
UNION ALL
SELECT 'employees', COUNT(*) FROM employees
UNION ALL
SELECT 'leave_types', COUNT(*) FROM leave_types
UNION ALL
SELECT 'leave_balances', COUNT(*) FROM leave_balances
UNION ALL
SELECT 'leave_requests', COUNT(*) FROM leave_requests;

-- 5) Basic data preview
SELECT * FROM departments ORDER BY id;
SELECT id, first_name, last_name, email, job_title, department_id, manager_id FROM employees ORDER BY id;
SELECT id, name, paid_leave, default_days_per_year, active, allow_half_day FROM leave_types ORDER BY id;
SELECT id, employee_id, leave_type_id, year, total_days, used_days, carried_over_days, additional_days
FROM leave_balances
ORDER BY id;

-- 6) Leave requests with employee and type labels
SELECT
  lr.id,
  CONCAT(e.first_name, ' ', e.last_name) AS employee,
  lt.name AS leave_type,
  lr.start_date,
  lr.end_date,
  lr.status,
  lr.manager_comment,
  lr.request_date,
  lr.response_date
FROM leave_requests lr
LEFT JOIN employees e ON e.id = lr.employee_id
LEFT JOIN leave_types lt ON lt.id = lr.leave_type_id
ORDER BY lr.id DESC;

-- 7) Requests per status
SELECT lr.status, COUNT(*) AS total
FROM leave_requests lr
GROUP BY lr.status
ORDER BY total DESC;

-- 8) Pending requests (to approve)
SELECT
  lr.id,
  CONCAT(e.first_name, ' ', e.last_name) AS employee,
  lt.name AS leave_type,
  lr.start_date,
  lr.end_date,
  lr.request_date
FROM leave_requests lr
LEFT JOIN employees e ON e.id = lr.employee_id
LEFT JOIN leave_types lt ON lt.id = lr.leave_type_id
WHERE lr.status = 'PENDING'
ORDER BY lr.request_date ASC;

-- 9) Team map (employee -> manager)
SELECT
  e.id AS employee_id,
  CONCAT(e.first_name, ' ', e.last_name) AS employee,
  m.id AS manager_id,
  CONCAT(m.first_name, ' ', m.last_name) AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id
ORDER BY e.id;

-- 10) Department map (employee -> department)
SELECT
  e.id AS employee_id,
  CONCAT(e.first_name, ' ', e.last_name) AS employee,
  d.id AS department_id,
  d.name AS department
FROM employees e
LEFT JOIN departments d ON d.id = e.department_id
ORDER BY d.name, e.id;

-- 11) Remaining balance per employee and leave type
SELECT
  lb.id,
  CONCAT(e.first_name, ' ', e.last_name) AS employee,
  lt.name AS leave_type,
  lb.year,
  lb.total_days,
  lb.used_days,
  lb.carried_over_days,
  lb.additional_days,
  (COALESCE(lb.total_days,0) + COALESCE(lb.carried_over_days,0) + COALESCE(lb.additional_days,0) - COALESCE(lb.used_days,0)) AS remaining_days
FROM leave_balances lb
LEFT JOIN employees e ON e.id = lb.employee_id
LEFT JOIN leave_types lt ON lt.id = lb.leave_type_id
ORDER BY lb.year DESC, employee, leave_type;

-- 12) Calendar-oriented query (events)
SELECT
  lr.id,
  CONCAT(e.first_name, ' ', e.last_name) AS employee,
  lt.name AS leave_type,
  lr.start_date,
  lr.end_date,
  lr.status,
  lt.color_code
FROM leave_requests lr
LEFT JOIN employees e ON e.id = lr.employee_id
LEFT JOIN leave_types lt ON lt.id = lr.leave_type_id
WHERE lr.status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')
ORDER BY lr.start_date, lr.id;
