# Public API Documentation

All routes are prefixed with `/public`. Some endpoints are open, others require an authenticated user token (`Authorization: Bearer <accessToken>`).

## Table of Contents
- [Languages](#languages)
  - [List Active Languages](#1-list-active-languages)
- [Countries](#countries)
  - [List Countries](#2-list-countries)
- [Blogs](#blogs)
  - [List Published Blogs](#3-list-published-blogs)
- [Services](#services)
  - [List Services Without Price](#4-list-services-without-price)
- [Reservations](#reservations)
  - [Public Reservations By Date Range](#5-public-reservations-by-date-range)
  - [My Reservations (auth)](#6-my-reservations-auth)
  - [Create Reservation Request (auth)](#7-create-reservation-request-auth)
- [Profile](#profile)
  - [Get Profile (auth)](#8-get-profile-auth)
  - [Update Profile (auth)](#9-update-profile-auth)
  - [Update Language Preference (auth)](#10-update-language-preference-auth)

---

## Languages

### 1. List Active Languages
**Endpoint:** `GET /public/languages`  
**Auth:** Not required  
**Response:** Array of active languages (`language_id`, `code`, `name`, `native_name`).

---

## Countries

### 2. List Countries
**Endpoint:** `GET /public/countries`  
**Auth:** Not required  
**Description:** Returns all countries with sanitized fields, ordered alphabetically by name.

**Response:**
```json
{
  "count": 239,
  "countries": [
    {
      "id": 1,
      "iso_code_2": "AF",
      "name": "Afghanistan",
      "iso_code_3": "AFG",
      "phone_code": 93
    },
    {
      "id": 2,
      "iso_code_2": "AL",
      "name": "Albania",
      "iso_code_3": "ALB",
      "phone_code": 355
    }
  ]
}
```

**Fields:**
- `id` - Country ID (integer)
- `iso_code_2` - ISO 3166-1 alpha-2 code (2-letter country code)
- `name` - Country display name
- `iso_code_3` - ISO 3166-1 alpha-3 code (3-letter country code, nullable)
- `phone_code` - International dialing code (integer)

---

## Blogs

### 3. List Published Blogs
**Endpoint:** `GET /public/blogs`  
**Auth:** Not required  
**Query Params:** `includeMedia` (`true`|`1`) to include `media` array.  
**Description:** Returns only blogs with `is_published = true` and `published_at` not null, ordered by `published_at` desc then `created_at` desc.

---

## Services

### 4. List Services Without Price
**Endpoint:** `GET /public/services`  
**Auth:** Not required  
**Description:** Returns all services/products with the `price` field removed. Useful for public menus without showing pricing.

---

## Reservations

### 5. Public Reservations By Date Range
**Endpoint:** `GET /public/reservations`  
**Auth:** Not required  
**Query Params:**  
- `start_date` (optional, ISO date)  
- `end_date` (optional, ISO date)  
- `provider_id` (optional)  
If dates are omitted, defaults to current week (Mon–Sun). Only `confirmed` and `completed` reservations are returned.

**Response shape (abridged):**
```json
{
  "date_range": { "start": "2025-11-24T00:00:00.000Z", "end": "2025-11-30T23:59:59.999Z" },
  "count": 3,
  "reservations": [
    {
      "reservation_id": 12,
      "provider_id": 5,
      "service_id": 9,
      "start_time": "...",
      "end_time": "...",
      "status": "confirmed",
      "provider": { "provider_id": 5, "first_name": "Ana", "last_name": "Lopez", "title": "Therapist" },
      "service": { "service_id": 9, "name": "Deep Tissue", "description": "...", "duration_minutes": 60, "price": "85.00" }
    }
  ],
  "services": [
    { "service_id": 9, "name": "Deep Tissue", "description": "...", "duration_minutes": 60, "price": "85.00" }
  ],
  "providers": [
    { "provider_id": 5, "first_name": "Ana", "last_name": "Lopez", "title": "Therapist", "email": "ana@example.com", "bio": "..." }
  ]
}
```

### 6. My Reservations (auth)
**Endpoint:** `GET /public/my-reservations`  
**Auth:** Required (user token)  
**Description:** Returns all reservations for the authenticated user.

### 7. Create Reservation Request (auth)
**Endpoint:** `POST /public/reservation-request`  
**Auth:** Required (user token)  
**Description:** Create a new reservation request (pending). Provide required reservation fields in the body (see reservation API for details).

---

## Profile

### 8. Get Profile (auth)
**Endpoint:** `GET /public/profile`  
**Auth:** Required (user token)  
**Description:** Get the authenticated user's profile information.

**Query Parameters:**
- `includeReservations` (optional): Set to `true` or `1` to include user's reservations in the response

**Response:**
```json
{
  "user_id": 12,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone_number": "+905365288656",
  "title": null,
  "bio": null,
  "role_id": 3,
  "is_active": true,
  "is_verified": false,
  "language_id": 4,
  "country_id": 218,
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-01T00:00:00.000Z",
  "role": {
    "role_id": 3,
    "role_key": "customer",
    "role_name": "Customer",
    "is_provider": false
  },
  "language": {
    "language_id": 4,
    "code": "tr",
    "name": "Turkish",
    "native_name": "Türkçe"
  }
}
```

**Errors:**
- `401` - Authentication required
- `404` - User not found
- `500` - Server error

### 9. Update Profile (auth)
**Endpoint:** `PUT /public/profile`  
**Auth:** Required (user token)  
**Description:** Update the authenticated user's profile fields.

**Body Parameters:**
- `first_name` (optional)
- `last_name` (optional)
- `email` (optional)
- `phone_number` (optional)
- `password` (optional)

**Response:** Updated user object

**Errors:**
- `400` - No valid fields provided
- `403` - Access denied (provider accounts cannot use this endpoint)
- `404` - User not found
- `500` - Server error

### 10. Update Language Preference (auth)
**Endpoint:** `PATCH /public/language`  
**Auth:** Required (user token)  
**Description:** Update the authenticated user's language preference.

**Body Parameters:**
- `language_id` (required) - Must be a valid number

**Response:**
```json
{
  "message": "Language preference updated successfully",
  "user": {
    "user_id": 12,
    "language_id": 4,
    ...
  }
}
```

**Errors:**
- `400` - language_id is required or invalid
- `403` - Access denied (provider accounts cannot use this endpoint)
- `404` - User not found
- `500` - Server error
