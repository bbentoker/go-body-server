# Reservations API Documentation

## Overview
This document describes the API endpoints for managing reservations in the Go Body system.

## Base URL
All endpoints are prefixed with: `/reservations`

---

## Public vs Private Endpoints

- **Public Endpoint** (`/reservations/public`): Sanitized data without sensitive user information. See [Public API Documentation](./public-reservations-api.md)
- **Private Endpoints**: All other endpoints require authentication and return full data

---

## Endpoints

### 1. Get Reservations by Date Range (Index)
Retrieves reservations within a date range. If no dates provided, returns current week's reservations (Monday to Sunday).

**Endpoint:** `GET /reservations/index`

**Query Parameters:**
- `start_date` (optional) - Start date in ISO format (e.g., "2024-11-13")
- `end_date` (optional) - End date in ISO format (e.g., "2024-11-19")
- `provider_id` (optional) - Filter by provider ID
- `user_id` (optional) - Filter by user ID

**Example Requests:**
```
GET /reservations/index
GET /reservations/index?start_date=2024-11-13&end_date=2024-11-19
GET /reservations/index?provider_id=1
GET /reservations/index?start_date=2024-11-01&end_date=2024-11-30&provider_id=2
```

**Success Response (200 OK):**
```json
{
  "date_range": {
    "start": "2024-11-11T00:00:00.000Z",
    "end": "2024-11-17T23:59:59.999Z"
  },
  "count": 5,
  "reservations": [
    {
      "reservation_id": 1,
      "user_id": 1,
      "provider_id": 1,
      "service_id": 1,
      "start_time": "2024-11-13T09:00:00.000Z",
      "end_time": "2024-11-13T10:30:00.000Z",
      "status": "confirmed",
      "total_price": "75.00",
      "notes": "Morning appointment",
      "created_at": "2024-11-10T10:00:00.000Z",
      "updated_at": "2024-11-10T10:00:00.000Z",
      "user": {
        "user_id": 1,
        "full_name": "John Doe",
        "email": "john@example.com"
      },
      "provider": {
        "provider_id": 1,
        "full_name": "Jane Smith",
        "specialty": "Massage Therapy"
      },
      "service": {
        "service_id": 1,
        "name": "Deep Tissue Massage",
        "duration_minutes": 90,
        "price": "75.00"
      }
    }
  ],
  "services": [
    {
      "service_id": 1,
      "name": "Deep Tissue Massage",
      "description": "Therapeutic massage targeting deep muscle layers",
      "duration_minutes": 90,
      "price": "75.00",
      "is_active": true,
      "requires_provider": true
    },
    {
      "service_id": 2,
      "name": "Swedish Massage",
      "description": "Relaxing full body massage",
      "duration_minutes": 60,
      "price": "60.00",
      "is_active": true,
      "requires_provider": true
    }
  ],
  "users": [
    {
      "user_id": 1,
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone_number": "+1234567890",
      "date_of_birth": "1990-05-15",
      "gender": "male",
      "address": "123 Main St",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "user_id": 2,
      "full_name": "Jane Smith",
      "email": "jane@example.com",
      "phone_number": "+1234567891",
      "date_of_birth": "1985-08-20",
      "gender": "female",
      "is_active": true,
      "created_at": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

- **400 Bad Request** - Invalid date format
```json
{
  "error": "Invalid date format"
}
```

- **400 Bad Request** - Start date after end date
```json
{
  "error": "start_date must be before or equal to end_date"
}
```

**Notes:**
- If `start_date` and `end_date` are not provided, the endpoint returns reservations for the current week (Monday to Sunday)
- The date range is inclusive (includes both start and end dates)
- Results are sorted by `start_time` in ascending order
- `start_date` is set to 00:00:00 (start of day)
- `end_date` is set to 23:59:59 (end of day)
- **Response includes all active services and all users** in addition to filtered reservations
- This is useful for frontend to populate dropdowns or show available options without additional API calls

---

### 2. Create Reservation
Creates a new reservation with automatic time slot validation.

**Endpoint:** `POST /reservations`

**Request Body:**
```json
{
  "user_id": 1,
  "provider_id": 1,
  "service_id": 1,
  "start_time": "2024-11-15T09:00:00Z",
  "notes": "Optional notes about the reservation"
}
```

**Validation Rules:**
- **Cannot create reservations for past dates or times**
- Start time must be on the hour (e.g., 9:00) or half-hour (e.g., 9:30)
- Reservations must start at or after 9:00 AM
- Reservations must end by 9:00 PM (21:00)
- End time is automatically calculated based on service duration
- There must be at least 1 hour gap between reservations for the same provider
- Service must be active

**Success Response (201 Created):**
```json
{
  "reservation_id": 1,
  "user_id": 1,
  "provider_id": 1,
  "service_id": 1,
  "start_time": "2024-11-15T09:00:00.000Z",
  "end_time": "2024-11-15T10:30:00.000Z",
  "status": "pending",
  "total_price": "75.00",
  "notes": "Optional notes about the reservation",
  "created_at": "2024-11-13T10:00:00.000Z",
  "updated_at": "2024-11-13T10:00:00.000Z",
  "user": {
    "user_id": 1,
    "full_name": "John Doe",
    "email": "john@example.com"
  },
  "provider": {
    "provider_id": 1,
    "full_name": "Jane Smith",
    "specialty": "Massage Therapy"
  },
  "service": {
    "service_id": 1,
    "name": "Deep Tissue Massage",
    "duration_minutes": 90,
    "price": "75.00"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Missing required fields
```json
{
  "error": "Missing required fields: user_id, provider_id, service_id, and start_time are required"
}
```

- **400 Bad Request** - Invalid date format
```json
{
  "error": "Invalid date format for start_time"
}
```

- **400 Bad Request** - Past date/time
```json
{
  "error": "Cannot create reservations for past dates or times"
}
```

- **400 Bad Request** - Invalid time slot
```json
{
  "error": "Reservation time must be on the hour (e.g., 9:00) or half-hour (e.g., 9:30)"
}
```

- **400 Bad Request** - Outside business hours (start)
```json
{
  "error": "Reservations must start at 9:00 AM or later"
}
```

- **400 Bad Request** - Outside business hours (end)
```json
{
  "error": "Reservations must end by 9:00 PM"
}
```

- **400 Bad Request** - Gap violation
```json
{
  "error": "There must be at least 1 hour gap between reservations for this provider"
}
```

- **404 Not Found** - Service not found
```json
{
  "error": "Service not found"
}
```

---

### 3. Get All Reservations
Retrieves a list of reservations with optional filters.

**Endpoint:** `GET /reservations`

**Query Parameters:**
- `user_id` (optional) - Filter by user ID
- `provider_id` (optional) - Filter by provider ID
- `service_id` (optional) - Filter by service ID
- `status` (optional) - Filter by status (pending, confirmed, cancelled, completed, no_show)
- `limit` (optional) - Limit number of results
- `offset` (optional) - Offset for pagination

**Example Requests:**
```
GET /reservations
GET /reservations?user_id=1
GET /reservations?provider_id=2&status=confirmed
GET /reservations?limit=10&offset=0
```

**Success Response (200 OK):**
```json
[
  {
    "reservation_id": 1,
    "user_id": 1,
    "provider_id": 1,
    "service_id": 1,
    "start_time": "2024-11-15T09:00:00.000Z",
    "end_time": "2024-11-15T10:30:00.000Z",
    "status": "confirmed",
    "total_price": "75.00",
    "notes": "Optional notes",
    "created_at": "2024-11-13T10:00:00.000Z",
    "updated_at": "2024-11-13T10:00:00.000Z",
    "user": { ... },
    "provider": { ... },
    "service": { ... }
  }
]
```

---

### 4. Get User's All Reservations
Retrieves all reservations for a specific user with optional filters. **Protected route - requires authentication.**

**Endpoint:** `GET /reservations/user/:userId`

**Authentication:** Required (Bearer Token)

**Authorization:** Users can only access their own reservations

**URL Parameters:**
- `userId` (required) - User ID

**Query Parameters:**
- `provider_id` (optional) - Filter by provider ID
- `service_id` (optional) - Filter by service ID
- `status` (optional) - Filter by status (pending, confirmed, cancelled, completed, no_show)
- `limit` (optional) - Limit number of results
- `offset` (optional) - Offset for pagination

**Headers:**
```
Authorization: Bearer <access_token>
```

**Example Requests:**
```
GET /reservations/user/1
GET /reservations/user/1?status=confirmed
GET /reservations/user/1?provider_id=2&status=pending
GET /reservations/user/1?limit=10&offset=0
GET /reservations/user/1?service_id=3
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
[
  {
    "reservation_id": 3,
    "user_id": 1,
    "provider_id": 1,
    "service_id": 2,
    "start_time": "2024-11-20T14:00:00.000Z",
    "end_time": "2024-11-20T15:00:00.000Z",
    "status": "confirmed",
    "total_price": "60.00",
    "notes": "Upcoming appointment",
    "created_at": "2024-11-13T10:00:00.000Z",
    "updated_at": "2024-11-13T10:00:00.000Z",
    "user": {
      "user_id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    },
    "provider": {
      "provider_id": 1,
      "first_name": "Jane",
      "last_name": "Smith",
      "title": "Senior Therapist"
    },
    "service": {
      "service_id": 2,
      "name": "Swedish Massage",
      "duration_minutes": 60,
      "price": "60.00"
    }
  },
  {
    "reservation_id": 2,
    "user_id": 1,
    "provider_id": 1,
    "service_id": 1,
    "start_time": "2024-11-15T09:00:00.000Z",
    "end_time": "2024-11-15T10:30:00.000Z",
    "status": "completed",
    "total_price": "75.00",
    "notes": "Past appointment",
    "created_at": "2024-11-10T10:00:00.000Z",
    "updated_at": "2024-11-15T11:00:00.000Z",
    "user": {
      "user_id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    },
    "provider": {
      "provider_id": 1,
      "first_name": "Jane",
      "last_name": "Smith",
      "title": "Senior Therapist"
    },
    "service": {
      "service_id": 1,
      "name": "Deep Tissue Massage",
      "duration_minutes": 90,
      "price": "75.00"
    }
  }
]
```

**Notes:**
- Returns array of reservations for the specified user
- Sorted by start_time in descending order (most recent first)
- Includes full user, provider, and service details
- Returns empty array `[]` if user has no reservations
- Supports pagination with `limit` and `offset` parameters
- Can filter by provider, service, or status
- Response format matches the general `/reservations` endpoint

**Error Responses:**

- **400 Bad Request** - Missing user ID
```json
{
  "error": "User ID is required"
}
```

- **401 Unauthorized** - Missing or invalid token
```json
{
  "error": "Access token required"
}
```

- **403 Forbidden** - Invalid or expired token
```json
{
  "error": "Invalid or expired token"
}
```

- **403 Forbidden** - Attempting to access another user's data
```json
{
  "error": "Access denied. You can only access your own reservations."
}
```

- **403 Forbidden** - Provider trying to access user endpoint
```json
{
  "error": "Access denied. User account required."
}
```

- **500 Internal Server Error**
```json
{
  "error": "Failed to fetch user reservations"
}
```

---

### 5. Get Reservation by ID
Retrieves a single reservation by its ID.

**Endpoint:** `GET /reservations/:id`

**URL Parameters:**
- `id` (required) - Reservation ID

**Example Request:**
```
GET /reservations/1
```

**Success Response (200 OK):**
```json
{
  "reservation_id": 1,
  "user_id": 1,
  "provider_id": 1,
  "service_id": 1,
  "start_time": "2024-11-15T09:00:00.000Z",
  "end_time": "2024-11-15T10:30:00.000Z",
  "status": "confirmed",
  "total_price": "75.00",
  "notes": "Optional notes",
  "created_at": "2024-11-13T10:00:00.000Z",
  "updated_at": "2024-11-13T10:00:00.000Z",
  "user": {
    "user_id": 1,
    "full_name": "John Doe",
    "email": "john@example.com"
  },
  "provider": {
    "provider_id": 1,
    "full_name": "Jane Smith"
  },
  "service": {
    "service_id": 1,
    "name": "Deep Tissue Massage",
    "duration_minutes": 90,
    "price": "75.00"
  }
}
```

**Error Response:**
- **404 Not Found**
```json
{
  "error": "Reservation not found"
}
```

---

### 6. Update Reservation
Updates an existing reservation.

**Endpoint:** `PUT /reservations/:id`

**URL Parameters:**
- `id` (required) - Reservation ID

**Request Body (all fields optional):**
```json
{
  "start_time": "2024-11-15T10:00:00Z",
  "service_id": 2,
  "status": "confirmed",
  "notes": "Updated notes"
}
```

**Validation Rules:**
- Same validation rules as creating a reservation apply
- **Cannot update reservations to past dates or times**
- If `start_time` is updated, the system recalculates `end_time` and `total_price`
- If `service_id` is updated, the system recalculates `end_time` and `total_price`
- Time slot and business hours validations are enforced
- 1-hour gap validation excludes the current reservation being updated

**Success Response (200 OK):**
```json
{
  "reservation_id": 1,
  "user_id": 1,
  "provider_id": 1,
  "service_id": 2,
  "start_time": "2024-11-15T10:00:00.000Z",
  "end_time": "2024-11-15T11:00:00.000Z",
  "status": "confirmed",
  "total_price": "60.00",
  "notes": "Updated notes",
  "created_at": "2024-11-13T10:00:00.000Z",
  "updated_at": "2024-11-13T11:00:00.000Z",
  "user": { ... },
  "provider": { ... },
  "service": { ... }
}
```

**Error Responses:**
- **404 Not Found** - Reservation not found
- **400 Bad Request** - Invalid date format
```json
{
  "error": "Invalid date format for start_time"
}
```
- **400 Bad Request** - Past date/time
```json
{
  "error": "Cannot update reservation to a past date or time"
}
```
- **400 Bad Request** - Same validation errors as creation apply

---

### 7. Delete Reservation
Deletes a reservation permanently.

**Endpoint:** `DELETE /reservations/:id`

**URL Parameters:**
- `id` (required) - Reservation ID

**Example Request:**
```
DELETE /reservations/1
```

**Success Response (200 OK):**
```json
{
  "message": "Reservation deleted successfully"
}
```

**Error Response:**
- **404 Not Found**
```json
{
  "error": "Reservation not found"
}
```

---

## Business Logic

### Time Slot Validation
- Reservations can only start at the top of the hour (e.g., 9:00, 10:00) or at the half-hour (e.g., 9:30, 10:30)
- Minutes must be exactly 0 or 30

### Business Hours
- **Start Time:** Must be at or after 9:00 AM
- **End Time:** Must be at or before 9:00 PM (21:00)
- End time is automatically calculated: `start_time + service.duration_minutes`

### Gap Between Reservations
- There must be at least 1 hour gap between reservations for the same provider
- This means:
  - **After a reservation**: If a provider has a reservation that ends at 10:30, the next reservation cannot start before 11:30 (must wait 1 hour after the previous one ends)
  - **Before a reservation**: If there's an existing reservation that starts at 14:00, a new reservation must end by 13:00 or earlier (must finish 1 hour before the next one starts)
  - **Example Timeline**:
    - Reservation A: 9:00 - 10:30
    - Gap: 10:30 - 11:30 (1 hour minimum)
    - Reservation B: 11:30 - 13:00 ✓ (valid)
    - Reservation B: 11:00 - 12:30 ✗ (invalid - starts too early)
- Reservations with status `cancelled` or `no_show` are excluded from this check

### Automatic Calculations
- **End Time:** Calculated as `start_time + service.duration_minutes`
- **Total Price:** Set to the service's current price

### Reservation Statuses
Available statuses:
- `pending` - Initial state, awaiting confirmation
- `confirmed` - Reservation confirmed
- `cancelled` - Reservation cancelled
- `completed` - Service completed
- `no_show` - Client did not show up

---

## Example Usage Scenarios

### Creating a Morning Reservation
```bash
curl -X POST http://localhost:3000/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "provider_id": 1,
    "service_id": 1,
    "start_time": "2024-11-15T09:00:00Z",
    "notes": "First appointment of the day"
  }'
```

### Checking Provider Availability
```bash
# Get all reservations for a specific provider
curl -X GET "http://localhost:3000/reservations?provider_id=1&status=confirmed"
```

### Updating Reservation Status
```bash
curl -X PUT http://localhost:3000/reservations/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed"
  }'
```

### Rescheduling a Reservation
```bash
curl -X PUT http://localhost:3000/reservations/1 \
  -H "Content-Type: application/json" \
  -d '{
    "start_time": "2024-11-15T14:00:00Z"
  }'
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200 OK` - Successful GET, PUT, or DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Validation errors or invalid data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server-side errors

Error responses always include an `error` field with a descriptive message, and may include a `details` field with additional information.

