# Database Structure Documentation

This summarizes the schema generated from the Sequelize models after merging providers into the unified `users` table with a role system.

## Table of Contents
1. [Users](#users)
2. [Roles](#roles)
3. [Services](#services)
4. [Provider Service Relations](#provider-service-relations)
5. [Reservations](#reservations)
6. [Languages](#languages)
7. [Refresh Tokens](#refresh-tokens)
8. [Blogs](#blogs)
9. [Blog Media](#blog-media)
10. [Relationships](#relationships)

---

## Users

**Table Name:** `users`  
**Model Name:** `User`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `user_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| `provider_id` | VIRTUAL | Mirrors `user_id` | Convenience alias for provider-facing APIs |
| `role_id` | BIGINT | FOREIGN KEY → `roles.role_id` | Role assignment (admin/worker/customer) |
| `first_name` | STRING(100) | NOT NULL | First name |
| `last_name` | STRING(100) | NOT NULL | Last name |
| `email` | STRING(255) | NOT NULL, UNIQUE, EMAIL | Email address |
| `phone_number` | STRING(50) | NULLABLE | Phone number |
| `password_hash` | STRING(255) | NULLABLE | Hashed password |
| `title` | STRING(100) | NULLABLE | Provider/staff title |
| `bio` | TEXT | NULLABLE | Provider/staff bio |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT: true | Active flag |
| `is_verified` | BOOLEAN | NOT NULL, DEFAULT: false | Verification flag |
| `language_id` | BIGINT | FOREIGN KEY → `languages.language_id`, DEFAULT: 4 | Preferred language |
| `created_at` | DATE | NOT NULL, DEFAULT: NOW | Created timestamp |
| `updated_at` | DATE | NULLABLE | Updated timestamp |

**Relationships:**
- Has many `Reservations` as `reservations` (customer bookings)
- Has many `Reservations` as `provider_reservations` (when acting as provider)
- Has many `RefreshTokens` as `refreshTokens`
- Belongs to `Language` as `language`
- Belongs to `Role` as `role`
- Belongs to many `Services` through `ProviderServiceRelation` as `services`
- Has many `Blogs` as `blogs`

---

## Roles

**Table Name:** `roles`  
**Model Name:** `Role`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `role_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique role identifier |
| `role_key` | STRING(50) | NOT NULL, UNIQUE | Machine key (`admin`, `worker`, `customer`) |
| `role_name` | STRING(100) | NOT NULL | Display name |
| `description` | TEXT | NULLABLE | Details |
| `is_provider` | BOOLEAN | NOT NULL, DEFAULT: false | Flag for provider/staff roles |
| `created_at` | DATE | NOT NULL, DEFAULT: NOW | Created timestamp |
| `updated_at` | DATE | NULLABLE | Updated timestamp |

**Relationships:**
- Has many `Users` as `users`

---

## Services

**Table Name:** `services`  
**Model Name:** `Service`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `service_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique service identifier |
| `name` | STRING(255) | NOT NULL | Service name |
| `description` | TEXT | NULLABLE | Description |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT: true | Active flag |
| `notes` | TEXT | NULLABLE | Notes |
| `created_at` | DATE | NOT NULL, DEFAULT: NOW | Created timestamp |
| `updated_at` | DATE | NULLABLE | Updated timestamp |

**Relationships:**
- Has many `ServiceVariants` as `variants`
- Belongs to many `Users` (provider roles) through `ProviderServiceRelation` as `providers`

---

## Provider Service Relations

**Table Name:** `provider_services`  
**Model Name:** `ProviderServiceRelation`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `provider_id` | BIGINT | PRIMARY KEY, FOREIGN KEY → `users.user_id`, CASCADE DELETE | User acting as provider |
| `service_id` | BIGINT | PRIMARY KEY, FOREIGN KEY → `services.service_id`, CASCADE DELETE | Service identifier |

**Relationships:**
- Belongs to `User` as `provider`
- Belongs to `Service` as `service`

---

## Reservations

**Table Name:** `reservations`  
**Model Name:** `Reservation`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `reservation_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique reservation identifier |
| `user_id` | BIGINT | FOREIGN KEY → `users.user_id` | Customer |
| `provider_id` | BIGINT | FOREIGN KEY → `users.user_id` | Assigned provider/staff |
| `variant_id` | BIGINT | NOT NULL, FOREIGN KEY → `service_variants.variant_id` | Service variant |
| `user_package_item_id` | BIGINT | FOREIGN KEY → `user_package_items.ledger_id` | Optional package credit |
| `start_time` | DATE | NOT NULL | Start time |
| `end_time` | DATE | NOT NULL | End time |
| `status` | STRING(50) | NOT NULL, DEFAULT: `pending` | `pending`, `confirmed`, `cancelled`, `completed`, `no_show` |
| `notes` | TEXT | NULLABLE | Notes |
| `created_at` | DATE | NOT NULL, DEFAULT: NOW | Created timestamp |
| `updated_at` | DATE | NULLABLE | Updated timestamp |

**Relationships:**
- Belongs to `User` as `user`
- Belongs to `User` as `provider`
- Belongs to `ServiceVariant` as `variant`

---

## Languages

**Table Name:** `languages`  
**Model Name:** `Language`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `language_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique language identifier |
| `code` | STRING(10) | NOT NULL, UNIQUE | ISO code |
| `name` | STRING(100) | NOT NULL | English name |
| `native_name` | STRING(100) | NOT NULL | Localized name |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT: true | Active flag |
| `created_at` | DATE | NOT NULL, DEFAULT: NOW | Created timestamp |

**Relationships:**
- Has many `Users` as `users`

---

## Refresh Tokens

**Table Name:** `refresh_tokens`  
**Model Name:** `RefreshToken`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `token_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique token identifier |
| `token_hash` | STRING(255) | NOT NULL, UNIQUE | SHA-256 hash of token |
| `user_id` | BIGINT | FOREIGN KEY → `users.user_id` | Owner |
| `expires_at` | DATE | NOT NULL | Expiration timestamp |
| `created_at` | DATE | NOT NULL, DEFAULT: NOW | Created timestamp |
| `revoked_at` | DATE | NULLABLE | Revocation timestamp |

**Relationships:**
- Belongs to `User` as `user`

---

## Blogs

**Table Name:** `blogs`  
**Model Name:** `Blog`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `blog_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique blog identifier |
| `provider_id` | BIGINT | NOT NULL, FOREIGN KEY → `users.user_id` | Author (provider role) |
| `title` | STRING(255) | NOT NULL | Title |
| `content` | TEXT | NOT NULL | Content |
| `cover_image_url` | TEXT | NULLABLE | Cover image |
| `is_published` | BOOLEAN | NOT NULL, DEFAULT: false | Publication flag |
| `published_at` | DATE | NULLABLE | Published timestamp |
| `created_at` | DATE | NOT NULL, DEFAULT: NOW | Created timestamp |
| `updated_at` | DATE | NULLABLE | Updated timestamp |

**Relationships:**
- Belongs to `User` as `provider`
- Has many `BlogMedia` as `media`

---

## Blog Media

**Table Name:** `blog_media`  
**Model Name:** `BlogMedia`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `media_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique media identifier |
| `blog_id` | BIGINT | NOT NULL, FOREIGN KEY → `blogs.blog_id`, CASCADE DELETE | Parent blog |
| `media_type` | STRING(20) | NOT NULL, DEFAULT: `image`, ENUM: `image`, `video` | Media type |
| `object_key` | STRING(512) | NOT NULL | Storage key |
| `url` | TEXT | NOT NULL | Public URL |
| `alt_text` | STRING(255) | NULLABLE | Alt text |
| `created_at` | DATE | NOT NULL, DEFAULT: NOW | Created timestamp |
| `updated_at` | DATE | NULLABLE | Updated timestamp |

**Relationships:**
- Belongs to `Blog` as `blog`

---

## Relationships

- **Users ↔ Roles:** `users.role_id` → `roles.role_id`
- **Users ↔ Languages:** `users.language_id` → `languages.language_id`
- **Reservations:** `reservations.user_id` and `reservations.provider_id` both point to `users.user_id`
- **Services ↔ Users:** Many-to-many through `provider_services` (only provider/staff roles should be linked)
- **Refresh Tokens:** Linked only to `users`
- **Blogs:** Authored by users with provider roles
