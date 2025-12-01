# Database Structure Documentation

This document contains the complete database structure based on all Sequelize model files.

## Table of Contents
1. [Users](#users)
2. [Providers](#providers)
3. [Provider Roles](#provider-roles)
4. [Services](#services)
5. [Provider Service Relations](#provider-service-relations)
6. [Reservations](#reservations)
7. [Languages](#languages)
8. [Refresh Tokens](#refresh-tokens)
9. [Blogs](#blogs)
10. [Blog Media](#blog-media)
11. [Relationships](#relationships)

---

## Users

**Table Name:** `users`  
**Model Name:** `User`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `user_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| `first_name` | STRING(100) | NOT NULL | User's first name |
| `last_name` | STRING(100) | NOT NULL | User's last name |
| `email` | STRING(255) | NOT NULL, UNIQUE, EMAIL VALIDATION | User's email address |
| `phone_number` | STRING(50) | NULLABLE | User's phone number |
| `password_hash` | STRING(255) | NULLABLE | Hashed password |
| `is_verified` | BOOLEAN | NOT NULL, DEFAULT: false | Email verification status |
| `language_id` | BIGINT | NOT NULL, DEFAULT: 4, FOREIGN KEY → `languages.language_id` | Preferred language (Turkish default) |
| `created_at` | DATE | NOT NULL, DEFAULT: NOW | Account creation timestamp |

**Relationships:**
- Has many `Reservations` (as `reservations`)
- Has many `RefreshTokens` (as `refreshTokens`)
- Belongs to `Language` (as `language`)

---

## Providers

**Table Name:** `providers`  
**Model Name:** `Provider`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `provider_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique provider identifier |
| `first_name` | STRING(100) | NOT NULL | Provider's first name |
| `last_name` | STRING(100) | NOT NULL | Provider's last name |
| `email` | STRING(255) | NOT NULL, UNIQUE, EMAIL VALIDATION | Provider's email address |
| `phone_number` | STRING(50) | NULLABLE | Provider's phone number |
| `password_hash` | STRING(255) | NULLABLE | Hashed password |
| `title` | STRING(100) | NULLABLE | Professional title |
| `bio` | TEXT | NULLABLE | Provider biography |
| `role_id` | BIGINT | NOT NULL, FOREIGN KEY → `provider_roles.role_id` | Provider role identifier |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT: true | Active status |
| `is_verified` | BOOLEAN | NOT NULL, DEFAULT: false | Verification status |
| `language_id` | BIGINT | NOT NULL, DEFAULT: 4, FOREIGN KEY → `languages.language_id` | Preferred language (Turkish default) |
| `created_at` | DATE | NOT NULL, DEFAULT: NOW | Account creation timestamp |

**Relationships:**
- Has many `Reservations` (as `reservations`)
- Has many `RefreshTokens` (as `refreshTokens`)
- Has many `Blogs` (as `blogs`)
- Belongs to `ProviderRole` (as `role`)
- Belongs to `Language` (as `language`)
- Belongs to many `Services` through `ProviderServiceRelation` (as `services`)

---

## Provider Roles

**Table Name:** `provider_roles`  
**Model Name:** `ProviderRole`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `role_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique role identifier |
| `role_name` | STRING(100) | NOT NULL, UNIQUE | Role name |
| `description` | TEXT | NULLABLE | Role description |
| `created_at` | DATE | NOT NULL, DEFAULT: NOW | Creation timestamp |
| `updated_at` | DATE | NULLABLE | Last update timestamp |

**Relationships:**
- Has many `Providers` (as `providers`)

---

## Services

**Table Name:** `services`  
**Model Name:** `Service`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `service_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique service identifier |
| `name` | STRING(255) | NOT NULL | Service name |
| `description` | TEXT | NULLABLE | Service description |
| `duration_minutes` | INTEGER | NOT NULL, MIN: 1 | Service duration in minutes |
| `price` | DECIMAL(10, 2) | NOT NULL, MIN: 0 | Service price |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT: true | Active status |
| `requires_provider` | BOOLEAN | NOT NULL, DEFAULT: true | Whether service requires a provider |

**Relationships:**
- Has many `Reservations` (as `reservations`)
- Belongs to many `Providers` through `ProviderServiceRelation` (as `providers`)

---

## Provider Service Relations

**Table Name:** `provider_services`  
**Model Name:** `ProviderServiceRelation`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `provider_id` | BIGINT | PRIMARY KEY, FOREIGN KEY → `providers.provider_id`, CASCADE DELETE | Provider identifier |
| `service_id` | BIGINT | PRIMARY KEY, FOREIGN KEY → `services.service_id`, CASCADE DELETE | Service identifier |

**Note:** This is a junction table for the many-to-many relationship between Providers and Services.

**Relationships:**
- Belongs to `Provider` (as `provider`)
- Belongs to `Service` (as `service`)

---

## Reservations

**Table Name:** `reservations`  
**Model Name:** `Reservation`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `reservation_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique reservation identifier |
| `user_id` | BIGINT | NULLABLE, FOREIGN KEY → `users.user_id` | User who made the reservation |
| `provider_id` | BIGINT | NULLABLE, FOREIGN KEY → `providers.provider_id` | Provider for the reservation |
| `service_id` | BIGINT | NULLABLE, FOREIGN KEY → `services.service_id` | Service being reserved |
| `start_time` | DATE | NOT NULL | Reservation start time |
| `end_time` | DATE | NOT NULL | Reservation end time |
| `status` | STRING(50) | NOT NULL, DEFAULT: 'pending', ENUM: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'] | Reservation status |
| `total_price` | DECIMAL(10, 2) | NOT NULL, MIN: 0 | Total price for the reservation |
| `notes` | TEXT | NULLABLE | Additional notes |
| `created_at` | DATE | NOT NULL, DEFAULT: NOW | Creation timestamp |
| `updated_at` | DATE | NULLABLE | Last update timestamp |

**Validations:**
- `end_time` must be after `start_time`

**Relationships:**
- Belongs to `User` (as `user`)
- Belongs to `Provider` (as `provider`)
- Belongs to `Service` (as `service`)

---

## Languages

**Table Name:** `languages`  
**Model Name:** `Language`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `language_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique language identifier |
| `code` | STRING(10) | NOT NULL, UNIQUE | Language code (e.g., 'en', 'tr') |
| `name` | STRING(100) | NOT NULL | Language name |
| `native_name` | STRING(100) | NOT NULL | Native language name |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT: true | Active status |
| `created_at` | DATE | NOT NULL, DEFAULT: NOW | Creation timestamp |

**Relationships:**
- Has many `Users` (as `users`)
- Has many `Providers` (as `providers`)

---

## Refresh Tokens

**Table Name:** `refresh_tokens`  
**Model Name:** `RefreshToken`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `token_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique token identifier |
| `token_hash` | STRING(255) | NOT NULL, UNIQUE | Hashed refresh token |
| `user_id` | BIGINT | NULLABLE, FOREIGN KEY → `users.user_id` | Associated user (mutually exclusive with provider_id) |
| `provider_id` | BIGINT | NULLABLE, FOREIGN KEY → `providers.provider_id` | Associated provider (mutually exclusive with user_id) |
| `expires_at` | DATE | NOT NULL | Token expiration timestamp |
| `created_at` | DATE | NOT NULL, DEFAULT: NOW | Creation timestamp |
| `revoked_at` | DATE | NULLABLE | Token revocation timestamp |

**Validations:**
- Must belong to either a user OR a provider, not both or neither

**Indexes:**
- `idx_refresh_tokens_token_hash` on `token_hash`
- `idx_refresh_tokens_user_id` on `user_id`
- `idx_refresh_tokens_provider_id` on `provider_id`
- `idx_refresh_tokens_expires_at` on `expires_at`

**Relationships:**
- Belongs to `User` (as `user`) - optional
- Belongs to `Provider` (as `provider`) - optional

---

## Blogs

**Table Name:** `blogs`  
**Model Name:** `Blog`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `blog_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique blog post identifier |
| `provider_id` | BIGINT | NOT NULL, FOREIGN KEY → `providers.provider_id` | Provider who created the blog |
| `title` | STRING(255) | NOT NULL | Blog post title |
| `content` | TEXT | NOT NULL | Blog post content |
| `cover_image_url` | TEXT | NULLABLE | Cover image URL |
| `is_published` | BOOLEAN | NOT NULL, DEFAULT: false | Publication status |
| `published_at` | DATE | NULLABLE | Publication timestamp |
| `created_at` | DATE | NOT NULL, DEFAULT: NOW | Creation timestamp |
| `updated_at` | DATE | NULLABLE | Last update timestamp |

**Relationships:**
- Belongs to `Provider` (as `provider`)
- Has many `BlogMedia` (as `media`, CASCADE DELETE)

---

## Blog Media

**Table Name:** `blog_media`  
**Model Name:** `BlogMedia`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `media_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique media identifier |
| `blog_id` | BIGINT | NOT NULL, FOREIGN KEY → `blogs.blog_id` | Associated blog post |
| `media_type` | ENUM | NOT NULL, DEFAULT: 'image', VALUES: ['image', 'video'] | Type of media |
| `object_key` | STRING(512) | NOT NULL | Storage object key |
| `url` | TEXT | NOT NULL | Media URL |
| `alt_text` | STRING(255) | NULLABLE | Alternative text for accessibility |
| `created_at` | DATE | NOT NULL, DEFAULT: NOW | Creation timestamp |
| `updated_at` | DATE | NULLABLE | Last update timestamp |

**Relationships:**
- Belongs to `Blog` (as `blog`, CASCADE DELETE)

---

## Relationships

### Entity Relationship Summary

```
Users
├── Has many Reservations
├── Has many RefreshTokens
└── Belongs to Language

Providers
├── Has many Reservations
├── Has many RefreshTokens
├── Has many Blogs
├── Belongs to ProviderRole
├── Belongs to Language
└── Belongs to many Services (through ProviderServiceRelation)

ProviderRoles
└── Has many Providers

Services
├── Has many Reservations
└── Belongs to many Providers (through ProviderServiceRelation)

ProviderServiceRelation (Junction Table)
├── Belongs to Provider
└── Belongs to Service

Reservations
├── Belongs to User
├── Belongs to Provider
└── Belongs to Service

Languages
├── Has many Users
└── Has many Providers

RefreshTokens
├── Belongs to User (optional, mutually exclusive with provider)
└── Belongs to Provider (optional, mutually exclusive with user)

Blogs
├── Belongs to Provider
└── Has many BlogMedia (CASCADE DELETE)

BlogMedia
└── Belongs to Blog (CASCADE DELETE)
```

### Foreign Key Relationships

| From Table | From Column | To Table | To Column | On Delete |
|------------|-------------|----------|-----------|-----------|
| `users` | `language_id` | `languages` | `language_id` | - |
| `providers` | `role_id` | `provider_roles` | `role_id` | - |
| `providers` | `language_id` | `languages` | `language_id` | - |
| `provider_services` | `provider_id` | `providers` | `provider_id` | CASCADE |
| `provider_services` | `service_id` | `services` | `service_id` | CASCADE |
| `reservations` | `user_id` | `users` | `user_id` | - |
| `reservations` | `provider_id` | `providers` | `provider_id` | - |
| `reservations` | `service_id` | `services` | `service_id` | - |
| `refresh_tokens` | `user_id` | `users` | `user_id` | - |
| `refresh_tokens` | `provider_id` | `providers` | `provider_id` | - |
| `blogs` | `provider_id` | `providers` | `provider_id` | - |
| `blog_media` | `blog_id` | `blogs` | `blog_id` | CASCADE |

---

## Notes

- All timestamps use `DataTypes.NOW` as default for `created_at` fields
- Some tables have `updated_at` fields that are automatically managed by Sequelize
- The `RefreshToken` model has a custom validation ensuring it belongs to either a user OR a provider, not both
- The `Reservation` model validates that `end_time` must be after `start_time`
- Default language is set to 4 (Turkish) for both Users and Providers
- `ProviderServiceRelation` is a junction table with composite primary key
- `BlogMedia` has CASCADE DELETE when parent `Blog` is deleted
- `ProviderServiceRelation` has CASCADE DELETE for both foreign keys

