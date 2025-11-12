-- Geliştirme ortamında betiğin tekrar tekrar çalıştırılabilmesi için
-- mevcut tabloları (ve bağlı olanları) temizle.
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS provider_services_relation CASCADE;
DROP TABLE IF EXISTS providers CASCADE;
DROP TABLE IF EXISTS provider_roles CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. 'users' (Müşteriler / Hizmeti Alanlar)
-- Rezervasyonu yapan veya hizmeti alan kişi.
CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,  
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(50),
    password_hash VARCHAR(255), -- Sosyal girişler vb. için NULL olabilir
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 'provider_roles' (Sağlayıcı Rolleri)
-- Sağlayıcı rollerinin tanımları (örn. "admin", "worker").
CREATE TABLE provider_roles (
    role_id BIGSERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Varsayılan roller (betik tekrar çalıştırılınca temizlenip yeniden eklenir).
INSERT INTO provider_roles (role_name, description)
VALUES 
    ('admin', 'Administrative provider role with elevated privileges'),
    ('worker', 'Standard provider role');

-- 3. 'providers' (Hizmet Sağlayıcılar / Çalışanlar)
-- Hizmeti fiilen gerçekleştiren kişi (doktor, stilist, vb. ).
CREATE TABLE providers (
    provider_id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(50),
    password_hash VARCHAR(255), -- Sosyal girişler vb. için NULL olabilir
    title VARCHAR(100), -- Örn: "Kıdemli Terapist"
    bio TEXT, -- Profil sayfasında gösterim için
    role_id BIGINT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true, -- Artık çalışmıyorsa false yapılır
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_provider_role
        FOREIGN KEY (role_id)
        REFERENCES provider_roles(role_id)
        ON DELETE RESTRICT
);

INSERT INTO providers (
    first_name,
    last_name,
    email,
    phone_number,
    password_hash,
    title,
    bio,
    role_id
) VALUES (
    'Admin',
    'User',
    'admin@admin.com',
    NULL,
    NULL,
    'System Administrator',
    'Seed admin provider account.',
    1
);

-- 4. 'services' (Hizmetler)
-- Sunulan hizmetler (60dk, 75dk, 90dk vb.).
CREATE TABLE services (
    service_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true, -- Artık sunulmuyorsa false
    requires_provider BOOLEAN NOT NULL DEFAULT true -- Bazı hizmetler (örn: "Sadece Oda")
                                                   -- bir sağlayıcı gerektirmeyebilir.
);

-- 5. 'provider_services_relation' (Bağlantı Tablosu)
-- Hangi sağlayıcının hangi hizmetleri verebildiğini belirler.
CREATE TABLE provider_services_relation (
    provider_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    
    -- Foreign Key Kısıtlamaları
    CONSTRAINT fk_provider
        FOREIGN KEY(provider_id) 
        REFERENCES providers(provider_id)
        ON DELETE CASCADE, -- Sağlayıcı silinirse, bu bağlantı da silinir.
    
    CONSTRAINT fk_service
        FOREIGN KEY(service_id) 
        REFERENCES services(service_id)
        ON DELETE CASCADE, -- Hizmet silinirse, bu bağlantı da silinir.
    
    -- Bir sağlayıcıya bir hizmet sadece bir kez atanabilir.
    PRIMARY KEY (provider_id, service_id)
);

-- 6. 'reservations' (Rezervasyonlar)
-- Tüm parçaları birleştiren ana tablo.
CREATE TABLE reservations (
    reservation_id BIGSERIAL PRIMARY KEY,
    
    user_id BIGINT, -- Foreign Key, kullanıcı silinirse NULL olur
    provider_id BIGINT, -- Foreign Key, sağlayıcı silinirse NULL olur
    service_id BIGINT, -- Foreign Key, hizmet silinirse NULL olur
    
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    
    -- Durum, varsayılan olarak 'pending' (beklemede).
    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    
    -- Fiyat, 'services' tablosundan kopyalanır (indirimler/değişiklikler için).
    total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
    
    notes TEXT, -- Müşterinin veya sağlayıcının notları
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ, -- Durum değiştiğinde güncellenir (Trigger/App)
    
    -- Foreign Key Kısıtlamaları
    CONSTRAINT fk_user
        FOREIGN KEY(user_id) 
        REFERENCES users(user_id)
        ON DELETE SET NULL, -- Kullanıcı silinirse rezervasyon kaydı kalır.
    
    CONSTRAINT fk_provider
        FOREIGN KEY(provider_id) 
        REFERENCES providers(provider_id)
        ON DELETE SET NULL, -- Sağlayıcı silinirse rezervasyon kaydı kalır.
    
    CONSTRAINT fk_service
        FOREIGN KEY(service_id) 
        REFERENCES services(service_id)
        ON DELETE SET NULL, -- Hizmet silinirse rezervasyon kaydı kalır.
        
    -- Veri Bütünlüğü: Bitiş saati, başlangıç saatinden sonra olmalıdır.
    CONSTRAINT check_time_order CHECK (end_time > start_time)
);

---
--- PERFORMANS İÇİN INDEX'LER
---

-- Bir sağlayıcının belirli bir zaman aralığındaki
-- müsaitliğini hızla kontrol etmek için en önemli index.
CREATE INDEX idx_reservations_provider_time 
ON reservations (provider_id, start_time, end_time);

CREATE INDEX idx_reservations_user_id 
ON reservations (user_id);

-- Hangi sağlayıcıların belirli bir hizmeti verdiğini hızla bulmak için.
CREATE INDEX idx_provider_services_relation_service_id 
ON provider_services_relation (service_id);

-- Sağlayıcıların rollerine göre filtreleme için.
CREATE INDEX idx_providers_role_id 
ON providers (role_id);