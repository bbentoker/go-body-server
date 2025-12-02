-- Merge providers into the unified users table and introduce the roles table.
-- Run inside a maintenance window; review duplicate emails before production use.

BEGIN;

-- 1) Create roles table (idempotent) and seed default roles
CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    role_key VARCHAR(50) NOT NULL UNIQUE,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_provider BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ
);

INSERT INTO roles (role_id, role_key, role_name, description, is_provider)
VALUES
    (COALESCE(NULLIF(current_setting('ADMIN_ROLE_ID', true), '')::INT, 1), 'admin', 'Admin', 'Administrative staff', true),
    (COALESCE(NULLIF(current_setting('WORKER_ROLE_ID', true), '')::INT, 2), 'worker', 'Worker', 'Standard provider/staff', true),
    (COALESCE(NULLIF(current_setting('CUSTOMER_ROLE_ID', true), '')::INT, 3), 'customer', 'Customer', 'Standard customer account', false)
ON CONFLICT (role_key) DO UPDATE SET
    role_name = EXCLUDED.role_name,
    description = EXCLUDED.description,
    is_provider = EXCLUDED.is_provider;

-- 2) Add columns to users to support provider fields and roles
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(role_id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS title VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Default any existing users to the customer role
UPDATE users
SET role_id = (SELECT role_id FROM roles WHERE role_key = 'customer')
WHERE role_id IS NULL;

-- 3) Move providers into users (preserve provider ids when possible)
CREATE TEMP TABLE provider_user_map AS
SELECT
    p.provider_id AS old_provider_id,
    CASE
        WHEN EXISTS (SELECT 1 FROM users u WHERE u.user_id = p.provider_id)
            THEN nextval('users_user_id_seq')
        ELSE p.provider_id
    END AS new_user_id
FROM providers p;

INSERT INTO users (
    user_id, role_id, first_name, last_name, email, phone_number,
    password_hash, title, bio, is_active, is_verified, language_id,
    created_at, updated_at
)
SELECT
    m.new_user_id, p.role_id, p.first_name, p.last_name, p.email, p.phone_number,
    p.password_hash, p.title, p.bio, p.is_active, p.is_verified, COALESCE(p.language_id, 4),
    p.created_at, p.updated_at
FROM providers p
JOIN provider_user_map m ON m.old_provider_id = p.provider_id
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = p.email);

SELECT setval('users_user_id_seq', (SELECT GREATEST(MAX(user_id), 1) FROM users));

-- 4) Re-point dependent tables to the new user ids
UPDATE reservations r
SET provider_id = m.new_user_id
FROM provider_user_map m
WHERE r.provider_id = m.old_provider_id;

UPDATE provider_services ps
SET provider_id = m.new_user_id
FROM provider_user_map m
WHERE ps.provider_id = m.old_provider_id;

UPDATE blogs b
SET provider_id = m.new_user_id
FROM provider_user_map m
WHERE b.provider_id = m.old_provider_id;

-- Refresh tokens now only store user_id
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(user_id);
UPDATE refresh_tokens rt
SET user_id = m.new_user_id
FROM provider_user_map m
WHERE rt.provider_id = m.old_provider_id;
ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS provider_id;
ALTER TABLE refresh_tokens DROP CONSTRAINT IF EXISTS check_owner;

-- 5) Drop legacy tables
DROP TABLE IF EXISTS providers CASCADE;
DROP TABLE IF EXISTS provider_roles CASCADE;

COMMIT;
