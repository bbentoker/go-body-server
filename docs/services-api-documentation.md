# Services API Documentation

This document provides detailed information about all service management endpoints in the Go Body server application.

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

---

## Service Management Routes

### 1. Create Service

Create a new service offering in the system.

**Endpoint:** `POST /services`

**Request Body:**
```json
{
  "name": "Swedish Massage",
  "description": "A relaxing full-body massage using gentle pressure and long, flowing strokes to promote relaxation and ease muscle tension.",
  "duration_minutes": 60,
  "price": 85.00,
  "is_active": true,
  "requires_provider": true
}
```

**Required Fields:**
- `name` (string): Service name (max 255 characters)
- `duration_minutes` (integer): Duration in minutes (minimum: 1)
- `price` (decimal): Service price (minimum: 0, format: 10.2)

**Optional Fields:**
- `description` (text): Detailed description of the service
- `is_active` (boolean): Whether the service is currently active (default: true)
- `requires_provider` (boolean): Whether the service requires a provider (default: true)

**Success Response (201 Created):**
```json
{
  "service_id": 1,
  "name": "Swedish Massage",
  "description": "A relaxing full-body massage using gentle pressure and long, flowing strokes to promote relaxation and ease muscle tension.",
  "duration_minutes": 60,
  "price": "85.00",
  "is_active": true,
  "requires_provider": true
}
```

**Error Responses:**

- **400 Bad Request:**
```json
{
  "message": "Missing required fields: name, duration_minutes, price"
}
```

**Example Request (curl):**
```bash
curl -X POST http://localhost:3000/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Swedish Massage",
    "description": "A relaxing full-body massage",
    "duration_minutes": 60,
    "price": 85.00,
    "is_active": true,
    "requires_provider": true
  }'
```

**Notes:**
- The `service_id` is auto-generated
- Price must be a positive decimal value
- Duration must be at least 1 minute
- If `is_active` is false, the service won't be visible for bookings

---

### 2. List All Services

Retrieve a list of all services in the system.

**Endpoint:** `GET /services`

**Query Parameters:**
- `includeProviders` (optional, boolean): Include provider relationships in response
  - Accepted values: `true`, `1`
  - Default: `false`

**Success Response (200 OK):**

Without providers:
```json
[
  {
    "service_id": 1,
    "name": "Swedish Massage",
    "description": "A relaxing full-body massage",
    "duration_minutes": 60,
    "price": "85.00",
    "is_active": true,
    "requires_provider": true
  },
  {
    "service_id": 2,
    "name": "Quick Haircut",
    "description": "Professional haircut service",
    "duration_minutes": 30,
    "price": "25.00",
    "is_active": true,
    "requires_provider": true
  }
]
```

With providers (`?includeProviders=true`):
```json
[
  {
    "service_id": 1,
    "name": "Swedish Massage",
    "description": "A relaxing full-body massage",
    "duration_minutes": 60,
    "price": "85.00",
    "is_active": true,
    "requires_provider": true,
    "providers": [
      {
        "provider_id": 1,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "phone_number": "555-0123",
        "title": "Massage Therapist",
        "bio": "Certified massage therapist with 10 years experience",
        "role_id": 2,
        "is_active": true,
        "is_verified": true,
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
]
```

**Example Request (curl):**
```bash
# Basic request
curl http://localhost:3000/services

# With providers
curl http://localhost:3000/services?includeProviders=true
```

**Notes:**
- Returns an empty array `[]` if no services exist
- Include providers to see which providers can perform each service
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

**Success Response (200 OK):**

Without providers:
```json
{
  "service_id": 1,
  "name": "Swedish Massage",
  "description": "A relaxing full-body massage using gentle pressure and long, flowing strokes to promote relaxation and ease muscle tension.",
  "duration_minutes": 60,
  "price": "85.00",
  "is_active": true,
  "requires_provider": true
}
```

With providers (`?includeProviders=true`):
```json
{
  "service_id": 1,
  "name": "Swedish Massage",
  "description": "A relaxing full-body massage",
  "duration_minutes": 60,
  "price": "85.00",
  "is_active": true,
  "requires_provider": true,
  "providers": [
    {
      "provider_id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone_number": "555-0123",
      "title": "Massage Therapist",
      "bio": "Certified massage therapist",
      "role_id": 2,
      "is_active": true,
      "is_verified": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
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

# With providers
curl http://localhost:3000/services/1?includeProviders=true
```

**Notes:**
- The `serviceId` must be a valid integer
- Use `includeProviders=true` to see available providers for this service

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
  "duration_minutes": 90,
  "price": 120.00,
  "is_active": false,
  "requires_provider": true
}
```

**Available Fields:**
- `name` (string): Service name (max 255 characters)
- `description` (text): Service description
- `duration_minutes` (integer): Duration in minutes (minimum: 1)
- `price` (decimal): Service price (minimum: 0)
- `is_active` (boolean): Active status
- `requires_provider` (boolean): Provider requirement

**Success Response (200 OK):**
```json
{
  "service_id": 1,
  "name": "Deep Tissue Massage",
  "description": "Updated description",
  "duration_minutes": 90,
  "price": "120.00",
  "is_active": false,
  "requires_provider": true
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

**Example Request (curl):**
```bash
# Update price and duration
curl -X PUT http://localhost:3000/services/1 \
  -H "Content-Type: application/json" \
  -d '{
    "price": 95.00,
    "duration_minutes": 75
  }'

# Deactivate a service
curl -X PUT http://localhost:3000/services/1 \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
```

**Notes:**
- Only send the fields you want to update
- Cannot update `service_id`
- Validation rules apply (e.g., price >= 0, duration >= 1)
- Returns the updated service object

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

**Notes:**
- This is a permanent deletion
- Consider using the update endpoint to set `is_active: false` instead for soft deletion
- Deleting a service may affect existing reservations that reference this service
- No response body is returned on successful deletion

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

- **duration_minutes:**
  - Type: Integer
  - Minimum value: 1
  - Required for creation
  - Cannot be null

- **price:**
  - Type: Decimal(10, 2)
  - Minimum value: 0
  - Required for creation
  - Cannot be null
  - Stored with 2 decimal places

- **is_active:**
  - Type: Boolean
  - Default: true
  - Controls visibility for bookings

- **requires_provider:**
  - Type: Boolean
  - Default: true
  - Indicates if service needs a provider assignment

---

## Example Use Cases

### Creating Multiple Service Types

**1. Service requiring a provider:**
```json
POST /services
{
  "name": "Personal Training Session",
  "description": "One-on-one fitness training",
  "duration_minutes": 60,
  "price": 75.00,
  "is_active": true,
  "requires_provider": true
}
```

**2. Service not requiring a provider:**
```json
POST /services
{
  "name": "Gym Access Pass",
  "description": "Day pass for gym facilities",
  "duration_minutes": 480,
  "price": 15.00,
  "is_active": true,
  "requires_provider": false
}
```

**3. Inactive service (for testing or future use):**
```json
POST /services
{
  "name": "Pool Therapy",
  "description": "Aquatic therapy sessions",
  "duration_minutes": 45,
  "price": 60.00,
  "is_active": false,
  "requires_provider": true
}
```

### Workflow Examples

**1. Listing active services only (requires application-level filtering):**
```bash
# Get all services and filter on client side
curl http://localhost:3000/services
```

**2. Getting service with available providers:**
```bash
curl http://localhost:3000/services/1?includeProviders=true
```

**3. Temporarily disabling a service:**
```bash
curl -X PUT http://localhost:3000/services/1 \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
```

**4. Updating pricing:**
```bash
curl -X PUT http://localhost:3000/services/1 \
  -H "Content-Type: application/json" \
  -d '{"price": 95.00}'
```

---

## Best Practices

1. **Service Naming:**
   - Use clear, descriptive names
   - Keep consistent naming conventions
   - Avoid special characters

2. **Pricing:**
   - Always use 2 decimal places
   - Consider currency when setting prices
   - Update prices using the update endpoint

3. **Duration:**
   - Set realistic durations
   - Include buffer time if needed
   - Consider transition time between appointments

4. **Active Status:**
   - Use `is_active: false` instead of deleting services
   - Maintain historical data for reporting
   - Inactive services can be reactivated later

5. **Provider Relationships:**
   - Use `includeProviders` parameter when you need to show available staff
   - Services with `requires_provider: false` can be booked without staff assignment

---

## Related APIs

- **Provider API:** Manage providers who can perform services
- **Reservation API:** Book services for users
- **Provider Service Relations API:** Assign providers to services

---

## Version History

- **v1.0** (Initial Release)
  - Basic CRUD operations for services
  - Provider relationship support
  - Active/inactive status management

---

## Support

For issues or questions about the Services API, please contact the development team or refer to the main project documentation.

