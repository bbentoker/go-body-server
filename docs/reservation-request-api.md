# Reservation Request API Documentation

This document describes the new reservation request endpoints that allow authenticated users to request reservations with pending status, view available time slots, and check pending reservation counts.

## Table of Contents
- [Public Routes](#public-routes)
  - [Get Public Reservations](#get-public-reservations)
  - [Get My Reservations](#get-my-reservations)
  - [Create Reservation Request](#create-reservation-request)
- [Reservation Routes](#reservation-routes)
  - [Get Pending Reservations](#get-pending-reservations)
  - [Get Pending Reservations Count](#get-pending-reservations-count)
  - [Approve Reservation](#approve-reservation)
  - [Reject Reservation](#reject-reservation)

---

## Public Routes

### Get Public Reservations

Retrieves existing reservations, services, and providers information to help users choose available time slots.

**Endpoint:** `GET /public/reservations`

**Authentication:** Not required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| start_date | string (ISO 8601) | No | Start date for the range. Defaults to current week Monday |
| end_date | string (ISO 8601) | No | End date for the range. Defaults to current week Sunday |
| provider_id | integer | No | Filter reservations by specific provider |

**Response:** `200 OK`

```json
{
  "date_range": {
    "start": "2025-11-18T00:00:00.000Z",
    "end": "2025-11-24T23:59:59.999Z"
  },
  "count": 5,
  "reservations": [
    {
      "reservation_id": 1,
      "provider_id": 1,
      "service_id": 2,
      "start_time": "2025-11-20T10:00:00.000Z",
      "end_time": "2025-11-20T11:00:00.000Z",
      "status": "confirmed",
      "provider": {
        "provider_id": 1,
        "first_name": "John",
        "last_name": "Doe",
        "title": "Massage Therapist"
      },
      "service": {
        "service_id": 2,
        "name": "Deep Tissue Massage",
        "description": "Therapeutic massage",
        "duration_minutes": 60,
        "price": 80.00
      }
    }
  ],
  "services": [
    {
      "service_id": 1,
      "name": "Swedish Massage",
      "description": "Relaxing massage",
      "duration_minutes": 60,
      "price": 70.00
    }
  ],
  "providers": [
    {
      "provider_id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "title": "Massage Therapist",
      "email": "john@example.com",
      "phone": "555-0100",
      "bio": "Certified massage therapist with 10 years experience",
      "profile_image_url": "https://example.com/image.jpg",
      "is_active": true
    }
  ]
}
```

**Notes:**
- Returns only confirmed and completed reservations (not pending, cancelled, or no-show)
- Sensitive user information is excluded for privacy
- Defaults to current week if no dates are specified
- Useful for displaying availability calendar to users

**Example Requests:**

```bash
# Get current week's reservations
GET /public/reservations

# Get specific date range
GET /public/reservations?start_date=2025-11-20&end_date=2025-11-27

# Get reservations for specific provider
GET /public/reservations?provider_id=1&start_date=2025-11-20&end_date=2025-11-27
```

---

### Get My Reservations

Retrieves all reservations for the authenticated user across all statuses. Requires authentication and automatically uses the user ID from the token.

**Endpoint:** `GET /public/my-reservations`

**Authentication:** Required (Bearer token)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| provider_id | integer | No | Filter by specific provider |
| service_id | integer | No | Filter by specific service |
| status | string | No | Filter by status (pending, confirmed, completed, cancelled, no_show) |
| limit | integer | No | Limit the number of results |
| offset | integer | No | Offset for pagination |

**Response:** `200 OK`

```json
{
  "count": 12,
  "reservations": [
    {
      "reservation_id": 123,
      "user_id": 45,
      "provider_id": 1,
      "service_id": 2,
      "start_time": "2025-11-20T10:00:00.000Z",
      "end_time": "2025-11-20T11:00:00.000Z",
      "total_price": 80.00,
      "status": "confirmed",
      "notes": "First time client",
      "created_at": "2025-11-18T12:00:00.000Z",
      "updated_at": "2025-11-18T12:00:00.000Z",
      "user": {
        "user_id": 45,
        "first_name": "Alice",
        "last_name": "Johnson",
        "email": "alice@example.com",
        "phone": "555-0200"
      },
      "provider": {
        "provider_id": 1,
        "first_name": "John",
        "last_name": "Doe",
        "title": "Massage Therapist",
        "email": "john@example.com",
        "phone": "555-0100"
      },
      "service": {
        "service_id": 2,
        "name": "Deep Tissue Massage",
        "description": "Therapeutic massage",
        "duration_minutes": 60,
        "price": 80.00
      }
    },
    {
      "reservation_id": 124,
      "user_id": 45,
      "provider_id": 2,
      "service_id": 3,
      "start_time": "2025-11-22T14:00:00.000Z",
      "end_time": "2025-11-22T15:30:00.000Z",
      "total_price": 95.00,
      "status": "pending",
      "notes": null,
      "created_at": "2025-11-19T09:00:00.000Z",
      "updated_at": "2025-11-19T09:00:00.000Z",
      "provider": {
        "provider_id": 2,
        "first_name": "Jane",
        "last_name": "Smith",
        "title": "Yoga Instructor"
      },
      "service": {
        "service_id": 3,
        "name": "Private Yoga Session",
        "description": "One-on-one yoga instruction",
        "duration_minutes": 90,
        "price": 95.00
      }
    }
  ]
}
```

**Error Responses:**

`401 Unauthorized` - Missing or invalid token
```json
{
  "error": "Access token required"
}
```

`403 Forbidden` - Token verification failed
```json
{
  "error": "Token verification failed"
}
```

**Example Requests:**

```bash
# Get all reservations for authenticated user
curl -X GET https://api.example.com/public/my-reservations \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get only pending reservations
GET /public/my-reservations?status=pending

# Get confirmed reservations for specific provider
GET /public/my-reservations?status=confirmed&provider_id=1

# Get reservations with pagination
GET /public/my-reservations?limit=10&offset=0
```

**Use Cases:**
- User dashboard displaying all their reservations
- View reservation history
- Filter reservations by status (pending, confirmed, completed, cancelled)
- Track upcoming appointments
- Review past appointments

**Notes:**
- Automatically uses the authenticated user's ID from the JWT token
- Returns reservations in descending order by start time (most recent first)
- Includes full details of user, provider, and service
- Shows all statuses by default unless filtered

---

### Create Reservation Request

Creates a new reservation request with pending status. Requires authentication and automatically uses the authenticated user's ID.

**Endpoint:** `POST /public/reservation-request`

**Authentication:** Required (Bearer token)

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "provider_id": 1,
  "service_id": 2,
  "start_time": "2025-11-20T10:00:00.000Z",
  "notes": "Optional notes for the provider"
}
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| provider_id | integer | Yes | ID of the provider |
| service_id | integer | Yes | ID of the service |
| start_time | string (ISO 8601) | Yes | Requested start time (must be on the hour or half-hour) |
| notes | string | No | Additional notes or special requests |

**Response:** `201 Created`

```json
{
  "reservation_id": 123,
  "user_id": 45,
  "provider_id": 1,
  "service_id": 2,
  "start_time": "2025-11-20T10:00:00.000Z",
  "end_time": "2025-11-20T11:00:00.000Z",
  "total_price": 80.00,
  "status": "pending",
  "notes": "Optional notes for the provider",
  "created_at": "2025-11-18T12:00:00.000Z",
  "updated_at": "2025-11-18T12:00:00.000Z",
  "user": {
    "user_id": 45,
    "first_name": "Alice",
    "last_name": "Johnson",
    "email": "alice@example.com",
    "phone": "555-0200"
  },
  "provider": {
    "provider_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "title": "Massage Therapist"
  },
  "service": {
    "service_id": 2,
    "name": "Deep Tissue Massage",
    "description": "Therapeutic massage",
    "duration_minutes": 60,
    "price": 80.00
  }
}
```

**Validation Rules:**
- Start time must be on the hour (e.g., 9:00) or half-hour (e.g., 9:30)
- Reservation cannot be in the past
- Must be within business hours (9:00 AM - 9:00 PM)
- Must have at least 1-hour gap between other reservations for the provider
- Service must be active

**Error Responses:**

`400 Bad Request` - Validation error
```json
{
  "error": "Missing required fields: provider_id, service_id, and start_time are required"
}
```

```json
{
  "error": "Reservation time must be on the hour (e.g., 9:00) or half-hour (e.g., 9:30)"
}
```

```json
{
  "error": "There must be at least 1 hour gap between reservations for this provider"
}
```

`401 Unauthorized` - Missing or invalid token
```json
{
  "error": "Access token required"
}
```

`404 Not Found` - Service not found
```json
{
  "error": "Service not found"
}
```

**Example Request:**

```bash
curl -X POST https://api.example.com/public/reservation-request \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "provider_id": 1,
    "service_id": 2,
    "start_time": "2025-11-20T10:00:00.000Z",
    "notes": "First time client"
  }'
```

---

## Reservation Routes

### Get Pending Reservations

Retrieves all pending reservation requests with optional filters.

**Endpoint:** `GET /reservations/pending`

**Authentication:** Not required (but typically used by authenticated providers/admins)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| provider_id | integer | No | Filter by specific provider |
| user_id | integer | No | Filter by specific user |
| service_id | integer | No | Filter by specific service |
| limit | integer | No | Limit the number of results |
| offset | integer | No | Offset for pagination |

**Response:** `200 OK`

```json
{
  "count": 8,
  "reservations": [
    {
      "reservation_id": 123,
      "user_id": 45,
      "provider_id": 1,
      "service_id": 2,
      "start_time": "2025-11-20T10:00:00.000Z",
      "end_time": "2025-11-20T11:00:00.000Z",
      "status": "pending",
      "total_price": 80.00,
      "notes": "First time client",
      "created_at": "2025-11-18T12:00:00.000Z",
      "updated_at": "2025-11-18T12:00:00.000Z",
      "user": {
        "user_id": 45,
        "first_name": "Alice",
        "last_name": "Johnson",
        "email": "alice@example.com",
        "phone": "555-0200"
      },
      "provider": {
        "provider_id": 1,
        "first_name": "John",
        "last_name": "Doe",
        "title": "Massage Therapist"
      },
      "service": {
        "service_id": 2,
        "name": "Deep Tissue Massage",
        "description": "Therapeutic massage",
        "duration_minutes": 60,
        "price": 80.00
      }
    }
  ]
}
```

**Example Requests:**

```bash
# Get all pending reservations
GET /reservations/pending

# Get pending reservations for specific provider
GET /reservations/pending?provider_id=1

# Get pending reservations for specific user
GET /reservations/pending?user_id=45

# Get pending reservations with pagination
GET /reservations/pending?limit=10&offset=0

# Get pending reservations with multiple filters
GET /reservations/pending?provider_id=1&service_id=2&limit=20
```

**Use Cases:**
- Display list of pending reservations for a provider to review
- Show user's own pending reservation requests
- Admin panel to manage all pending reservations
- Filter pending requests by service type

---

### Get Pending Reservations Count

Retrieves the count and details of pending reservation requests. Can be filtered by provider.

**Endpoint:** `GET /reservations/pending/count`

**Authentication:** Not required (but typically used by authenticated providers/admins)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| provider_id | integer | No | Filter by specific provider |

**Response (All Providers):** `200 OK`

When no `provider_id` is specified, returns counts grouped by provider:

```json
{
  "total_count": 15,
  "provider_id": null,
  "counts_by_provider": [
    {
      "provider_id": 1,
      "count": 8,
      "provider": {
        "provider_id": 1,
        "first_name": "John",
        "last_name": "Doe",
        "title": "Massage Therapist"
      }
    },
    {
      "provider_id": 2,
      "count": 7,
      "provider": {
        "provider_id": 2,
        "first_name": "Jane",
        "last_name": "Smith",
        "title": "Yoga Instructor"
      }
    }
  ],
  "reservations": [
    {
      "reservation_id": 123,
      "user_id": 45,
      "provider_id": 1,
      "service_id": 2,
      "start_time": "2025-11-20T10:00:00.000Z",
      "end_time": "2025-11-20T11:00:00.000Z",
      "status": "pending",
      "total_price": 80.00,
      "notes": "First time client",
      "user": {
        "user_id": 45,
        "first_name": "Alice",
        "last_name": "Johnson",
        "email": "alice@example.com",
        "phone": "555-0200"
      },
      "provider": {
        "provider_id": 1,
        "first_name": "John",
        "last_name": "Doe",
        "title": "Massage Therapist"
      },
      "service": {
        "service_id": 2,
        "name": "Deep Tissue Massage",
        "description": "Therapeutic massage",
        "duration_minutes": 60,
        "price": 80.00
      }
    }
  ]
}
```

**Response (Specific Provider):** `200 OK`

When `provider_id` is specified:

```json
{
  "total_count": 8,
  "provider_id": 1,
  "reservations": [
    {
      "reservation_id": 123,
      "user_id": 45,
      "provider_id": 1,
      "service_id": 2,
      "start_time": "2025-11-20T10:00:00.000Z",
      "end_time": "2025-11-20T11:00:00.000Z",
      "status": "pending",
      "total_price": 80.00,
      "notes": "First time client",
      "user": { /* user details */ },
      "provider": { /* provider details */ },
      "service": { /* service details */ }
    }
  ]
}
```

**Example Requests:**

```bash
# Get all pending reservations across all providers
GET /reservations/pending/count

# Get pending reservations for specific provider
GET /reservations/pending/count?provider_id=1
```

**Use Cases:**
- Dashboard displays showing pending reservation counts
- Provider notifications about new reservation requests
- Admin panels to see total pending reservations
- Quick overview of which providers have pending requests

---

### Approve Reservation

Approves a pending reservation by changing its status to confirmed.

**Endpoint:** `PATCH /reservations/:id/approve`

**Authentication:** Not required (but typically used by authenticated providers)

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | The reservation ID to approve |

**Response:** `200 OK`

```json
{
  "message": "Reservation approved successfully",
  "reservation": {
    "reservation_id": 123,
    "user_id": 45,
    "provider_id": 1,
    "service_id": 2,
    "start_time": "2025-11-20T10:00:00.000Z",
    "end_time": "2025-11-20T11:00:00.000Z",
    "status": "confirmed",
    "total_price": 80.00,
    "notes": "First time client",
    "created_at": "2025-11-18T12:00:00.000Z",
    "updated_at": "2025-11-18T15:30:00.000Z",
    "user": {
      "user_id": 45,
      "first_name": "Alice",
      "last_name": "Johnson",
      "email": "alice@example.com",
      "phone": "555-0200"
    },
    "provider": {
      "provider_id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "title": "Massage Therapist"
    },
    "service": {
      "service_id": 2,
      "name": "Deep Tissue Massage",
      "description": "Therapeutic massage",
      "duration_minutes": 60,
      "price": 80.00
    }
  }
}
```

**Error Responses:**

`400 Bad Request` - Reservation is not pending
```json
{
  "error": "Cannot approve reservation with status 'confirmed'. Only pending reservations can be approved."
}
```

`404 Not Found` - Reservation not found
```json
{
  "error": "Reservation not found"
}
```

**Example Request:**

```bash
curl -X PATCH https://api.example.com/reservations/123/approve
```

**Notes:**
- Only reservations with status `pending` can be approved
- After approval, the status changes to `confirmed`
- The reservation will now appear in public reservation listings

---

### Reject Reservation

Rejects a pending reservation by changing its status to cancelled. Optionally includes a rejection reason.

**Endpoint:** `PATCH /reservations/:id/reject`

**Authentication:** Not required (but typically used by authenticated providers)

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | The reservation ID to reject |

**Request Body (Optional):**
```json
{
  "reason": "Provider not available at requested time"
}
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| reason | string | No | Reason for rejecting the reservation (will be appended to notes) |

**Response:** `200 OK`

```json
{
  "message": "Reservation rejected successfully",
  "reservation": {
    "reservation_id": 123,
    "user_id": 45,
    "provider_id": 1,
    "service_id": 2,
    "start_time": "2025-11-20T10:00:00.000Z",
    "end_time": "2025-11-20T11:00:00.000Z",
    "status": "cancelled",
    "total_price": 80.00,
    "notes": "First time client\n[REJECTED] Provider not available at requested time",
    "created_at": "2025-11-18T12:00:00.000Z",
    "updated_at": "2025-11-18T15:30:00.000Z",
    "user": {
      "user_id": 45,
      "first_name": "Alice",
      "last_name": "Johnson",
      "email": "alice@example.com",
      "phone": "555-0200"
    },
    "provider": {
      "provider_id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "title": "Massage Therapist"
    },
    "service": {
      "service_id": 2,
      "name": "Deep Tissue Massage",
      "description": "Therapeutic massage",
      "duration_minutes": 60,
      "price": 80.00
    }
  }
}
```

**Error Responses:**

`400 Bad Request` - Reservation is not pending
```json
{
  "error": "Cannot reject reservation with status 'confirmed'. Only pending reservations can be rejected."
}
```

`404 Not Found` - Reservation not found
```json
{
  "error": "Reservation not found"
}
```

**Example Requests:**

```bash
# Reject without reason
curl -X PATCH https://api.example.com/reservations/123/reject

# Reject with reason
curl -X PATCH https://api.example.com/reservations/123/reject \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Provider not available at requested time"
  }'
```

**Notes:**
- Only reservations with status `pending` can be rejected
- After rejection, the status changes to `cancelled`
- If a reason is provided, it's appended to the notes field with a `[REJECTED]` prefix
- The time slot becomes available for other reservations

---

## Workflow Example

### Complete User Reservation Request Flow

1. **User views available time slots:**
```bash
GET /public/reservations?start_date=2025-11-20&end_date=2025-11-27&provider_id=1
```

2. **User reviews services and providers** from the response

3. **User logs in** (if not already authenticated) via `/auth/login`

4. **User checks their existing reservations:**
```bash
GET /public/my-reservations
Authorization: Bearer <token>
```

5. **User creates a reservation request:**
```bash
POST /public/reservation-request
Authorization: Bearer <token>
{
  "provider_id": 1,
  "service_id": 2,
  "start_time": "2025-11-20T14:00:00.000Z"
}
```

6. **User can view their pending request:**
```bash
GET /public/my-reservations?status=pending
Authorization: Bearer <token>
```

7. **Provider checks pending requests:**
```bash
# Get list of pending reservations
GET /reservations/pending?provider_id=1

# Or get just the count
GET /reservations/pending/count?provider_id=1
```

8. **Provider reviews the details** of each pending reservation

9. **Provider approves or rejects** the request:
```bash
# To approve
PATCH /reservations/123/approve

# To reject (with optional reason)
PATCH /reservations/123/reject
{
  "reason": "Provider not available at requested time"
}
```

10. **User views updated reservation:**
```bash
GET /public/my-reservations
Authorization: Bearer <token>
# Status will now be 'confirmed' or 'cancelled'
```

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success - Request processed successfully |
| 201 | Created - Reservation request created successfully |
| 400 | Bad Request - Validation error or invalid data |
| 401 | Unauthorized - Authentication required or token invalid |
| 403 | Forbidden - Token verification failed |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error occurred |

---

## Notes

### Reservation Status Flow
- **pending**: Initial status for user-requested reservations (created via `/public/reservation-request`)
- **confirmed**: Reservation approved by provider (via `/reservations/:id/approve` or created directly)
- **completed**: Service has been completed
- **cancelled**: Reservation was cancelled or rejected (via `/reservations/:id/reject`)
- **no_show**: User did not show up for the appointment

### Approve/Reject Workflow
- Use `PATCH /reservations/:id/approve` to approve a pending reservation (changes status to `confirmed`)
- Use `PATCH /reservations/:id/reject` to reject a pending reservation (changes status to `cancelled`)
- Only reservations with status `pending` can be approved or rejected
- Rejection reasons are optional but recommended for better communication with users

### Time Slot Validation
- All reservations must start on the hour or half-hour (e.g., 9:00, 9:30, 10:00)
- Business hours: 9:00 AM - 9:00 PM
- 1-hour gap required between reservations for the same provider

### Security
- The reservation request endpoint automatically uses the authenticated user's ID from the JWT token
- Users cannot create reservation requests for other users
- Sensitive information is sanitized in public endpoints

