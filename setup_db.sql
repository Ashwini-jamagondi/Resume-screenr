-- Run this in MySQL to set up the database


CREATE DATABASE IF NOT EXISTS resume_screener
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'resume_user'@'localhost' IDENTIFIED BY 'resume_pass_2024';
GRANT ALL PRIVILEGES ON resume_screener.* TO 'resume_user'@'localhost';
FLUSH PRIVILEGES;

USE resume_screener;

-- Tables are auto-created by SQLAlchemy on startup.
-- Run this script first, then start the backend.

SELECT 'Database ready!' AS status;
