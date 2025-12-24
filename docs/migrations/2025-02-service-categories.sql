-- Add service categories and link services to categories.

CREATE TABLE IF NOT EXISTS service_categories (
    service_category_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE services
    ADD COLUMN IF NOT EXISTS service_category_id INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'services_service_category_id_fkey'
    ) THEN
        ALTER TABLE services
            ADD CONSTRAINT services_service_category_id_fkey
            FOREIGN KEY (service_category_id)
            REFERENCES service_categories(service_category_id)
            ON DELETE SET NULL;
    END IF;
END $$;
