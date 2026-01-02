-- ==========================================
-- 1. CORE LOOKUP TABLES
-- ==========================================

CREATE TABLE languages (
    language_id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE, -- e.g., 'tr', 'en'
    name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO languages (language_id, code, name, native_name) VALUES
    (1, 'en', 'English', 'English'),
    (2, 'es', 'Spanish', 'Español'),
    (3, 'zh', 'Chinese', '中文'),
    (4, 'tr', 'Turkish', 'Türkçe'),
    (5, 'ar', 'Arabic', 'العربية'),
    (6, 'ru', 'Russian', 'Русский'),
    (7, 'id', 'Indonesian', 'Bahasa Indonesia');

CREATE TABLE countries (
    id SERIAL PRIMARY KEY,
    iso_code_2 CHAR(2) NOT NULL,
    official_name VARCHAR(80) NOT NULL,
    name VARCHAR(80) NOT NULL,
    iso_code_3 CHAR(3) DEFAULT NULL,
    numeric_code SMALLINT DEFAULT NULL,
    phone_code INTEGER NOT NULL
);

-- Note: Countries data should be inserted from src/utils/countries.sql
    
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_key VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'admin', 'worker', 'customer'
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_provider BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Seed roles (adjust IDs/keys to match your environment)
INSERT INTO roles (role_id, role_key, role_name, description, is_provider)
VALUES
  (1, 'admin', 'Admin', 'Administrative staff with elevated privileges', true),
  (2, 'worker', 'Worker', 'Standard provider/staff account', true),
  (3, 'customer', 'Customer', 'Default customer account', false)
ON CONFLICT (role_key) DO UPDATE SET
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description,
  is_provider = EXCLUDED.is_provider;

-- Seed admin user (password hash is for 'ChangeMe123!' — rotate in production)
INSERT INTO users (user_id, role_id, first_name, last_name, email, phone_number, password_hash, title, bio, is_active, is_verified, language_id, country_id)
VALUES (
  1,
  1, -- admin role
  'Gizem',
  'Özlü',
  'gizem@go-body.co',
  NULL,
  '$2b$10$CwTycUXWue0Thq9StjUM0uJ8p8N3DybZ0fjrqHO1B2c7JB/ZIyB9W',
  'Administrator',
  'Seed admin user',
  true,
  true,
  4,
  NULL
)
ON CONFLICT (email) DO NOTHING;

-- ==========================================
-- 2. ACTORS (Users & Providers)
-- ==========================================

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(role_id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(50),
    password_hash VARCHAR(255),
    title VARCHAR(100),
    bio TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    language_id INTEGER REFERENCES languages(language_id) DEFAULT 4, -- Assumes 4 is TR
    country_id INTEGER REFERENCES countries(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 3. SERVICES & VARIANTS
-- ==========================================

CREATE TABLE service_categories (
    service_category_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- The base definition of a service (e.g., "Massage")
CREATE TABLE services (
    service_id SERIAL PRIMARY KEY,
    service_category_id INTEGER REFERENCES service_categories(service_category_id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Specific variations (e.g., "60 Min Massage", "90 Min Massage")
CREATE TABLE service_variants (
    variant_id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(service_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g. "Standard", "Express"
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Junction: Which providers perform which base services
CREATE TABLE provider_services (
    provider_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(service_id) ON DELETE CASCADE,
    PRIMARY KEY (provider_id, service_id)
);

-- ==========================================
-- 4. PACKAGES (Templates)
-- ==========================================

-- The Menu Item (e.g., "5 Session Pack")
CREATE TABLE packages (
    package_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    total_duration INTEGER , -- Display purpose or sum of variants
    price DECIMAL(10, 2) CHECK (price >= 0),
    price_visible BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- The Recipe (e.g., "Contains 5 of Variant A")

CREATE TABLE package_items (
    item_id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES packages(package_id) ON DELETE CASCADE,
    
    -- Points to the generic Service (e.g., "Massage")
    service_id INTEGER NOT NULL REFERENCES services(service_id) ON DELETE CASCADE,
    
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 5. USER PACKAGES (Wallet/Ledger)
-- ==========================================

-- The Purchase Record (e.g., "John bought 5 Session Pack")
CREATE TABLE user_packages (
    user_package_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    package_id INTEGER NOT NULL REFERENCES packages(package_id),
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- The Tracking Ledger (e.g., "John has 3/5 Left")
CREATE TABLE user_package_items (
    ledger_id SERIAL PRIMARY KEY,
    user_package_id INTEGER NOT NULL REFERENCES user_packages(user_package_id) ON DELETE CASCADE,
    variant_id INTEGER NOT NULL REFERENCES service_variants(variant_id),
    total_quantity INTEGER NOT NULL, -- Snapshot at purchase
    used_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT check_usage CHECK (used_quantity <= total_quantity)
);

-- ==========================================
-- 6. RESERVATIONS
-- ==========================================

CREATE TABLE reservations (
    reservation_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    provider_id INTEGER REFERENCES users(user_id),
    
    -- What is being performed?
    variant_id INTEGER NOT NULL REFERENCES service_variants(variant_id),
    
    -- How is it paid for? (NULL = Direct Payment, ID = Uses Package Credit)
    user_package_item_id INTEGER REFERENCES user_package_items(ledger_id),
    
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    
    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT check_times CHECK (end_time > start_time)
);

-- ==========================================
-- 7. SECURITY & CONTENT
-- ==========================================

CREATE TABLE refresh_tokens (
    token_id SERIAL PRIMARY KEY,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    user_id INTEGER REFERENCES users(user_id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE password_reset_tokens (
    token_id SERIAL PRIMARY KEY,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE blogs (
    blog_id SERIAL PRIMARY KEY,
    provider_id INTEGER NOT NULL REFERENCES users(user_id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    cover_image_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE blog_media (
    media_id SERIAL PRIMARY KEY,
    blog_id INTEGER NOT NULL REFERENCES blogs(blog_id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
    object_key VARCHAR(512) NOT NULL,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 8. INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_provider ON reservations(provider_id);
CREATE INDEX idx_reservations_dates ON reservations(start_time, end_time);
CREATE INDEX idx_user_pkg_items_user_pkg ON user_package_items(user_package_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- ==========================================
-- 9. EMAIL TRACKING (Resend Integration)
-- ==========================================

-- Create enum types for email status and event types
CREATE TYPE email_status AS ENUM ('pending', 'sent', 'delivered', 'bounced', 'complained', 'failed');
CREATE TYPE email_event_type AS ENUM (
    'email.sent',
    'email.delivered',
    'email.delivery_delayed',
    'email.complained',
    'email.bounced',
    'email.opened',
    'email.clicked'
);

-- Table for storing sent email information
CREATE TABLE emails (
    email_id SERIAL PRIMARY KEY,
    resend_id VARCHAR(255) UNIQUE,
    user_id INTEGER REFERENCES users(user_id),
    from_address VARCHAR(255) NOT NULL,
    to_addresses JSONB NOT NULL,
    cc_addresses JSONB,
    bcc_addresses JSONB,
    reply_to VARCHAR(255),
    subject VARCHAR(998) NOT NULL,
    html_content TEXT,
    text_content TEXT,
    template_name VARCHAR(100),
    template_data JSONB,
    tags JSONB,
    status email_status NOT NULL DEFAULT 'pending',
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    complained_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Table for storing email events from Resend webhooks
CREATE TABLE email_events (
    event_id SERIAL PRIMARY KEY,
    email_id INTEGER REFERENCES emails(email_id) ON DELETE CASCADE,
    resend_email_id VARCHAR(255) NOT NULL,
    event_type email_event_type NOT NULL,
    webhook_id VARCHAR(255) UNIQUE,
    recipient_email VARCHAR(255),
    bounce_type VARCHAR(50),
    bounce_classification VARCHAR(100),
    click_url TEXT,
    user_agent TEXT,
    ip_address VARCHAR(45),
    raw_payload JSONB,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for email tables
CREATE INDEX idx_emails_resend_id ON emails(resend_id);
CREATE INDEX idx_emails_user_id ON emails(user_id);
CREATE INDEX idx_emails_status ON emails(status);
CREATE INDEX idx_emails_template ON emails(template_name);
CREATE INDEX idx_emails_created ON emails(created_at);

CREATE INDEX idx_email_events_email_id ON email_events(email_id);
CREATE INDEX idx_email_events_resend_email_id ON email_events(resend_email_id);
CREATE INDEX idx_email_events_type ON email_events(event_type);
CREATE INDEX idx_email_events_occurred ON email_events(occurred_at);

-- ==========================================
-- 10. DECISION TREES
-- ==========================================

-- Stores decision tree versions with their full structure
CREATE TABLE decision_trees (
    tree_id SERIAL PRIMARY KEY,
    version VARCHAR(20) NOT NULL UNIQUE, -- e.g., 'v1', 'v2', 'v3'
    tree_data JSONB NOT NULL, -- Full tree structure: { startNodeId, nodes, edges }
    created_by INTEGER REFERENCES users(user_id),
    is_active BOOLEAN NOT NULL DEFAULT true, -- Marks the current active tree
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Stores user submissions/answers to decision trees
CREATE TABLE decision_tree_submissions (
    submission_id SERIAL PRIMARY KEY,
    tree_id INTEGER NOT NULL REFERENCES decision_trees(tree_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id), -- Nullable for potential anonymous submissions
    path JSONB NOT NULL, -- Array of steps: [{ stepIndex, nodeId, questionText, selectedAnswerId, selectedAnswerText }]
    result JSONB NOT NULL, -- Final node: { nodeId, title, type }
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for decision tree tables
CREATE INDEX idx_decision_trees_version ON decision_trees(version);
CREATE INDEX idx_decision_trees_active ON decision_trees(is_active);
CREATE INDEX idx_decision_trees_created ON decision_trees(created_at);

CREATE INDEX idx_decision_tree_submissions_tree ON decision_tree_submissions(tree_id);
CREATE INDEX idx_decision_tree_submissions_user ON decision_tree_submissions(user_id);
CREATE INDEX idx_decision_tree_submissions_submitted ON decision_tree_submissions(submitted_at);

CREATE TABLE consulting_requests (
  consulting_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  selected_areas JSONB NOT NULL,
  message TEXT NOT NULL,
  request_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contact_submissions (
  contact_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE email_verification_tokens (
  token_id SERIAL PRIMARY KEY,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  used_at TIMESTAMP
);
CREATE INDEX idx_email_verification_tokens_token_hash ON email_verification_tokens(token_hash);
CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);