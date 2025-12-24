# Services API Documentation

This document provides detailed information about service management endpoints in the Go Body server application.

## Base URL
All service routes are prefixed with `/services`

Example: `GET BASE_URL/services`

---

## Table of Contents
- [Service Management Routes](#service-management-routes)
  - [Create Service](#1-create-service)
  - [List All Services](#2-list-all-services)
  - [Get Service by ID](#3-get-service-by-id)
  - [Update Service](#4-update-service)
  - [Delete Service](#5-delete-service)
- [Service Category Management Routes](#service-category-management-routes)
  - [Create Service Category](#6-create-service-category)
  - [List Service Categories](#7-list-service-categories)
  - [Get Service Category by ID](#8-get-service-category-by-id)
  - [Update Service Category](#9-update-service-category)
  - [Delete Service Category](#10-delete-service-category)

---

## Service Management Routes

### 1. Create Service

Create a new service offering in the system.

**Endpoint:** `POST /services`

**Request Body:**
```json
{
  "name": "Swedish Massage",
  "description": "A relaxing full-body massage using gentle pressure and long, flowing strokes.",
  "notes": "Do not assign to trainees.",
  "is_active": true,
  "service_category_id": 3
}
```

**Required Fields:**
- `name` (string): Service name (max 255 characters)

**Optional Fields:**
- `description` (text): Detailed description of the service
- `notes` (text): Internal notes
- `is_active` (boolean): Whether the service is currently active (default: true)
- `service_category_id` (integer | null): Category assignment (nullable)

**Success Response (201 Created):**
```json
{
  "service_id": 1,
  "name": "Swedish Massage",
  "description": "A relaxing full-body massage using gentle pressure and long, flowing strokes.",
  "notes": "Do not assign to trainees.",
  "is_active": true,
  "service_category_id": 3,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**

- **400 Bad Request:**
```json
{
  "message": "Missing required fields: name"
}
```

- **404 Not Found:**
```json
{
  "message": "Service category not found"
}
```

**Example Request (curl):**
```bash
curl -X POST http://localhost:3000/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Swedish Massage",
    "description": "A relaxing full-body massage",
    "is_active": true,
    "service_category_id": 3
  }'
```

**Notes:**
- The `service_id` is auto-generated
- `service_category_id` can be omitted or set to `null`

---

### 2. List All Services

Retrieve a list of all services in the system.

**Endpoint:** `GET /services`

**Query Parameters:**
- `includeProviders` (optional, boolean): Include provider relationships in response
  - Accepted values: `true`, `1`
  - Default: `false`
- `includeVariants` (optional, boolean): Include service variants in response
  - Accepted values: `true`, `1`
  - Default: `false`
- `includeCategory` (optional, boolean): Include category details in response
  - Accepted values: `true`, `1`
  - Default: `false`

**Success Response (200 OK):**

Basic response:
```json
[
  {
    "service_id": 1,
    "name": "Swedish Massage",
    "description": "A relaxing full-body massage",
    "notes": null,
    "is_active": true,
    "service_category_id": 3,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

With category and variants (`?includeCategory=true&includeVariants=true`):
```json
[
  {
    "service_id": 1,
    "name": "Swedish Massage",
    "description": "A relaxing full-body massage",
    "notes": null,
    "is_active": true,
    "service_category_id": 3,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "category": {
      "service_category_id": 3,
      "name": "Massage",
      "description": "Bodywork services",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    },
    "variants": [
      {
        "variant_id": 10,
        "service_id": 1,
        "name": "Swedish Massage",
        "duration_minutes": 60,
        "price": "85.00",
        "is_active": true,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
]
```

**Example Request (curl):**
```bash
# Basic request
curl http://localhost:3000/services

# With category and variants
curl http://localhost:3000/services?includeCategory=true&includeVariants=true
```

**Notes:**
- Returns an empty array `[]` if no services exist
- Results include both active and inactive services

---

### 3. Get Service by ID

Retrieve details of a specific service.

**Endpoint:** `GET /services/:serviceId`

**Path Parameters:**
- `serviceId` (integer, required): The unique identifier of the service

**Query Parameters:**
- `includeProviders` (optional, boolean): Include provider relationships in response
  - Accepted values: `true`, `1`
  - Default: `false`
- `includeVariants` (optional, boolean): Include service variants in response
  - Accepted values: `true`, `1`
  - Default: `false`
- `includeCategory` (optional, boolean): Include category details in response
  - Accepted values: `true`, `1`
  - Default: `false`

**Success Response (200 OK):**
```json
{
  "service_id": 1,
  "name": "Swedish Massage",
  "description": "A relaxing full-body massage using gentle pressure and long, flowing strokes.",
  "notes": "Do not assign to trainees.",
  "is_active": true,
  "service_category_id": 3,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**

- **404 Not Found:**
```json
{
  "message": "Service not found"
}
```

**Example Request (curl):**
```bash
# Basic request
curl http://localhost:3000/services/1

# With category
curl http://localhost:3000/services/1?includeCategory=true
```

---

### 4. Update Service

Update an existing service's information.

**Endpoint:** `PUT /services/:serviceId`

**Path Parameters:**
- `serviceId` (integer, required): The unique identifier of the service

**Request Body:**
All fields are optional. Only include the fields you want to update.

```json
{
  "name": "Deep Tissue Massage",
  "description": "Updated description",
  "notes": "Priority for senior therapists.",
  "is_active": false,
  "service_category_id": null
}
```

**Available Fields:**
- `name` (string): Service name (max 255 characters)
- `description` (text): Service description
- `notes` (text): Internal notes
- `is_active` (boolean): Active status
- `service_category_id` (integer | null): Category assignment (nullable)

**Success Response (200 OK):**
```json
{
  "service_id": 1,
  "name": "Deep Tissue Massage",
  "description": "Updated description",
  "notes": "Priority for senior therapists.",
  "is_active": false,
  "service_category_id": null,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-02T00:00:00.000Z"
}
```

**Error Responses:**

- **400 Bad Request:**
```json
{
  "message": "No valid fields to update"
}
```

- **404 Not Found:**
```json
{
  "message": "Service not found"
}
```

- **404 Not Found:**
```json
{
  "message": "Service category not found"
}
```

**Example Request (curl):**
```bash
# Assign a category
curl -X PUT http://localhost:3000/services/1 \
  -H "Content-Type: application/json" \
  -d '{"service_category_id": 2}'

# Remove a category
curl -X PUT http://localhost:3000/services/1 \
  -H "Content-Type: application/json" \
  -d '{"service_category_id": null}'
```

---

### 5. Delete Service

Permanently delete a service from the system.

**Endpoint:** `DELETE /services/:serviceId`

**Path Parameters:**
- `serviceId` (integer, required): The unique identifier of the service

**Success Response (204 No Content):**
- Empty response body
- HTTP status code: 204

**Error Responses:**

- **404 Not Found:**
```json
{
  "message": "Service not found"
}
```

**Example Request (curl):**
```bash
curl -X DELETE http://localhost:3000/services/1
```

---

## Service Category Management Routes

### 6. Create Service Category

Create a new service category.

**Endpoint:** `POST /service-categories`

**Request Body:**
```json
{
  "name": "Massage",
  "description": "Bodywork services",
  "is_active": true
}
```

**Required Fields:**
- `name` (string): Category name (max 255 characters)

**Optional Fields:**
- `description` (text): Category description
- `is_active` (boolean): Whether the category is active (default: true)

**Success Response (201 Created):**
```json
{
  "service_category_id": 3,
  "name": "Massage",
  "description": "Bodywork services",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**

- **400 Bad Request:**
```json
{
  "message": "Missing required fields: name"
}
```

---

### 7. List Service Categories

Retrieve a list of all service categories.

**Endpoint:** `GET /service-categories`

**Success Response (200 OK):**
```json
[
  {
    "service_category_id": 3,
    "name": "Massage",
    "description": "Bodywork services",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 8. Get Service Category by ID

Retrieve details of a specific service category.

**Endpoint:** `GET /service-categories/:categoryId`

**Path Parameters:**
- `categoryId` (integer, required): The unique identifier of the category

**Success Response (200 OK):**
```json
{
  "service_category_id": 3,
  "name": "Massage",
  "description": "Bodywork services",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**

- **404 Not Found:**
```json
{
  "message": "Service category not found"
}
```

---

### 9. Update Service Category

Update an existing service category.

**Endpoint:** `PUT /service-categories/:categoryId`

**Request Body:**
```json
{
  "name": "Massage",
  "description": "Updated description",
  "is_active": false
}
```

**Success Response (200 OK):**
```json
{
  "service_category_id": 3,
  "name": "Massage",
  "description": "Updated description",
  "is_active": false,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-02T00:00:00.000Z"
}
```

**Error Responses:**

- **400 Bad Request:**
```json
{
  "message": "No valid fields to update"
}
```

- **404 Not Found:**
```json
{
  "message": "Service category not found"
}
```

---

### 10. Delete Service Category

Permanently delete a service category.

**Endpoint:** `DELETE /service-categories/:categoryId`

**Success Response (204 No Content):**
- Empty response body
- HTTP status code: 204

**Error Responses:**

- **404 Not Found:**
```json
{
  "message": "Service category not found"
}
```

---

## Common Error Responses

All endpoints may return the following error responses:

**500 Internal Server Error:**
```json
{
  "message": "Internal server error message"
}
```

This typically indicates a database error or server configuration issue.

---

## Data Validation Rules

### Service Fields

- **name:**
  - Type: String
  - Max length: 255 characters
  - Required for creation
  - Cannot be null

- **description:**
  - Type: Text
  - Optional
  - Can be null

- **notes:**
  - Type: Text
  - Optional
  - Can be null

- **is_active:**
  - Type: Boolean
  - Default: true
  - Controls visibility for bookings

- **service_category_id:**
  - Type: Integer
  - Optional
  - Can be null
  - Must reference an existing category if provided

### Service Category Fields

- **name:**
  - Type: String
  - Max length: 255 characters
  - Required for creation
  - Cannot be null

- **description:**
  - Type: Text
  - Optional
  - Can be null

- **is_active:**
  - Type: Boolean
  - Default: true

---

## Example Use Cases

### Creating Services with Categories

**1. Create a category:**
```json
POST /service-categories
{
  "name": "Massage",
  "description": "Bodywork services",
  "is_active": true
}
```

**2. Create a service assigned to that category:**
```json
POST /services
{
  "name": "Deep Tissue Massage",
  "description": "Targeted muscle relief",
  "service_category_id": 3
}
```

**3. Remove a category assignment:**
```json
PUT /services/1
{
  "service_category_id": null
}
```

---

## Related APIs

- **Provider API:** Manage providers who can perform services
- **Reservation API:** Book services for users
- **Service Variants API:** Manage service duration and pricing

---

## Version History

- **v1.1** (Service categories)
  - Added service categories
  - Added `service_category_id` on services
  - Added `includeCategory` query option
  - Added `/service-categories` CRUD endpoints

---

## Support

For issues or questions about the Services API, please contact the development team or refer to the main project documentation.
