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

CREATE TABLE provider_roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 2. ACTORS (Users & Providers)
-- ==========================================

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(50),
    password_hash VARCHAR(255),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    language_id INTEGER REFERENCES languages(language_id) DEFAULT 4, -- Assumes 4 is TR
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE providers (
    provider_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(50),
    password_hash VARCHAR(255),
    title VARCHAR(100),
    bio TEXT,
    role_id INTEGER NOT NULL REFERENCES provider_roles(role_id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    language_id INTEGER REFERENCES languages(language_id) DEFAULT 4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 3. SERVICES & VARIANTS
-- ==========================================

-- The base definition of a service (e.g., "Massage")
CREATE TABLE services (
    service_id SERIAL PRIMARY KEY,
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
    provider_id INTEGER NOT NULL REFERENCES providers(provider_id) ON DELETE CASCADE,
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
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- The Recipe (e.g., "Contains 5 of Variant A")
CREATE TABLE package_items (
    item_id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES packages(package_id) ON DELETE CASCADE,
    variant_id INTEGER NOT NULL REFERENCES service_variants(variant_id),
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
    provider_id INTEGER REFERENCES providers(provider_id),
    
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
    provider_id INTEGER REFERENCES providers(provider_id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT check_owner CHECK (
        (user_id IS NOT NULL AND provider_id IS NULL) OR 
        (user_id IS NULL AND provider_id IS NOT NULL)
    )
);

CREATE TABLE blogs (
    blog_id SERIAL PRIMARY KEY,
    provider_id INTEGER NOT NULL REFERENCES providers(provider_id),
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