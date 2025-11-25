# Authentication API Documentation

This document provides detailed information about all authentication and login endpoints in the Go Body server application.

## Base URL
All authentication routes are prefixed with `/auth`

Example: `POST BASE_URL/auth/admin/login`

---

## Table of Contents
- [Provider Login Routes](#provider-login-routes)
  - [Admin Provider Login](#1-admin-provider-login)
  - [Worker Provider Login](#2-worker-provider-login)
- [User Routes](#user-routes)
  - [User Registration](#3-user-registration)
  - [User Login](#4-user-login)
- [Password Reset Routes](#password-reset-routes)
  - [User Password Reset](#5-user-password-reset)
  - [Provider Password Reset](#6-provider-password-reset)
- [Token Management Routes](#token-management-routes)
  - [Refresh Token](#7-refresh-token)
  - [Logout](#8-logout)
  - [Logout All Sessions](#9-logout-all-sessions)

---

## Provider Login Routes

### 1. Admin Provider Login

Login endpoint for providers with administrative privileges.

**Endpoint:** `POST /auth/admin/login`

**Request Body:**
```json
{
  "email": "admin@admin.com",
  "password": "your-password"
}
```

**Required Fields:**
- `email` (string): Provider's email address
- `password` (string): Provider's password

**Success Response (200 OK):**
```json
{
  "provider": {
    "provider_id": 1,
    "first_name": "Admin",
    "last_name": "User",
    "email": "admin@admin.com",
    "phone_number": "555-0123",
    "title": "System Administrator",
    "bio": "Seed admin provider account.",
    "role_id": 1,
    "is_active": true,
    "is_verified": false,
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses:**

- **400 Bad Request:**
```json
{
  "message": "Email and password are required"
}
```

- **401 Unauthorized:**
```json
{
  "message": "Invalid admin credentials"
}
```

**Notes:**
- Only providers with `role_id = 1` (admin role) can login through this endpoint
- Returns both access token (JWT) and refresh token
- Automatically creates the admin role if it doesn't exist

---

### 2. Worker Provider Login

Login endpoint for providers with standard worker privileges.

**Endpoint:** `POST /auth/worker/login`

**Request Body:**
```json
{
  "email": "worker@example.com",
  "password": "your-password"
}
```

**Required Fields:**
- `email` (string): Provider's email address
- `password` (string): Provider's password

**Success Response (200 OK):**
```json
{
  "provider": {
    "provider_id": 2,
    "first_name": "John",
    "last_name": "Doe",
    "email": "worker@example.com",
    "phone_number": "555-0456",
    "title": "Senior Therapist",
    "bio": "Experienced massage therapist.",
    "role_id": 2,
    "is_active": true,
    "is_verified": false,
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Error Responses:**

- **400 Bad Request:**
```json
{
  "message": "Email and password are required"
}
```

- **401 Unauthorized:**
```json
{
  "message": "Invalid worker credentials"
}
```

**Notes:**
- Only providers with `role_id = 2` (worker role) can login through this endpoint
- Returns both access token (JWT) and refresh token
- Automatically creates the worker role if it doesn't exist

---

## User Routes

### 3. User Registration

**Endpoint:** `POST /auth/user/register`

**Description:** Registers a new user and returns access tokens.

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "phone_number": "+1234567890",
  "language_id": 4
}
```

**Required Fields:**
- `first_name` (string): User's first name
- `last_name` (string): User's last name
- `email` (string): Valid email address
- `password` (string): Password (minimum 6 characters)

**Optional Fields:**
- `phone_number` (string): Phone number
- `language_id` (number): Language preference (default: 4 for Turkish)

**Success Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "user_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone_number": "+1234567890",
    "is_verified": false,
    "language_id": 4,
    "created_at": "2024-11-15T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- **400 Bad Request** - Missing required fields
```json
{
  "message": "First name, last name, email, and password are required"
}
```

- **400 Bad Request** - Invalid email format
```json
{
  "message": "Invalid email format"
}
```

- **400 Bad Request** - Weak password
```json
{
  "message": "Password must be at least 6 characters long"
}
```

- **409 Conflict** - Email already exists
```json
{
  "message": "User with this email already exists"
}
```

- **500 Internal Server Error** - Server error
```json
{
  "message": "Failed to create user"
}
```

**Notes:**
- User is automatically logged in after successful registration
- Password is hashed before storage (never stored in plain text)
- Returns both access token and refresh token
- Default language is Turkish (language_id = 4) if not specified
- User account is created with `is_verified: false`

For detailed registration guide with examples, see [User Registration Guide](./user-registration-guide.md)

---

### 4. User Login

Login endpoint for regular users/customers.

**Endpoint:** `POST /auth/user/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Required Fields:**
- `email` (string): User's email address
- `password` (string): User's password

**Success Response (200 OK):**
```json
{
  "user": {
    "user_id": 1,
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "user@example.com",
    "phone_number": "555-0789",
    "is_verified": false,
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440002"
}
```

**Error Responses:**

- **400 Bad Request:**
```json
{
  "message": "Email and password are required"
}
```

- **401 Unauthorized:**
```json
{
  "message": "Invalid user credentials"
}
```

**Notes:**
- Used by customers who want to make reservations
- Returns both access token (JWT) and refresh token
- `password_hash` is not returned in the response

---

## Password Reset Routes

### 5. User Password Reset

Directly reset a user's password by email. No token/email verification flow is included; restrict usage to trusted/admin contexts or wrap with your own verification step.

**Endpoint:** `POST /auth/user/reset-password`

**Request Body:**
```json
{
  "email": "user@example.com",
  "new_password": "new-strong-password"
}
```

**Rules:**
- `new_password` must be at least 6 characters.

**Responses:**
- `200 OK` – password reset successfully
- `400 Bad Request` – missing fields or weak password
- `404 Not Found` – user not found

### 6. Provider Password Reset

Directly reset a provider's password by email. No token/email verification flow is included; restrict usage to trusted/admin contexts or wrap with your own verification step.

**Endpoint:** `POST /auth/provider/reset-password`

**Request Body:**
```json
{
  "email": "provider@example.com",
  "new_password": "new-strong-password"
}
```

**Rules:**
- `new_password` must be at least 6 characters.

**Responses:**
- `200 OK` – password reset successfully
- `400 Bad Request` – missing fields or weak password
- `404 Not Found` – provider not found

---

## Token Management Routes

### 7. Refresh Token

Generate a new access token using a valid refresh token.

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Required Fields:**
- `refreshToken` (string): A valid refresh token received from login

**Success Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440003"
}
```

**Error Responses:**

- **400 Bad Request:**
```json
{
  "message": "Refresh token is required"
}
```

- **401 Unauthorized:**
```json
{
  "message": "Invalid or expired refresh token"
}
```

**Notes:**
- Both access token and refresh token are rotated (new tokens generated)
- The old refresh token is automatically revoked
- Refresh tokens expire after a configured period (default: 7 days)

---

### 8. Logout

Logout from a specific session by revoking a refresh token.

**Endpoint:** `POST /auth/logout`

**Request Body:**
```json
{
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Required Fields:**
- `refreshToken` (string): The refresh token to revoke

**Success Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Error Responses:**

- **400 Bad Request:**
```json
{
  "message": "Refresh token is required"
}
```

- **404 Not Found:**
```json
{
  "message": "Token not found or already revoked"
}
```

**Notes:**
- Only revokes the specific refresh token provided
- Other active sessions remain valid
- The access token remains valid until it expires (cannot be revoked)

---

### 9. Logout All Sessions

Logout from all active sessions for a user or provider.

**Endpoint:** `POST /auth/logout-all`

**Request Body:**
```json
{
  "userId": 1,
  "type": "user"
}
```

**Required Fields:**
- `userId` (number): The ID of the user or provider
- `type` (string): Either `"user"` or `"provider"`

**Success Response (200 OK):**
```json
{
  "message": "All sessions logged out successfully"
}
```

**Error Responses:**

- **400 Bad Request (missing fields):**
```json
{
  "message": "userId and type (user/provider) are required"
}
```

- **400 Bad Request (invalid type):**
```json
{
  "message": "type must be either \"user\" or \"provider\""
}
```

**Notes:**
- Revokes all refresh tokens associated with the user/provider
- Useful for security purposes (e.g., password change, suspicious activity)
- Access tokens remain valid until they expire

---

## Authentication Flow

### Standard Login Flow
1. User/Provider submits credentials to appropriate login endpoint
2. Server validates credentials against database
3. Server generates JWT access token (short-lived, ~15 minutes)
4. Server generates refresh token (long-lived, ~7 days) and stores hash in database
5. Both tokens returned to client

### Token Refresh Flow
1. Client detects access token is expired or about to expire
2. Client sends refresh token to `/auth/refresh` endpoint
3. Server validates refresh token
4. Server generates new access token and refresh token
5. Server revokes old refresh token
6. New tokens returned to client

### Logout Flow
1. **Single Session:** Client sends refresh token to `/auth/logout`
2. **All Sessions:** Client sends userId and type to `/auth/logout-all`
3. Server revokes refresh token(s) in database
4. Client discards tokens from storage

---

## Security Considerations

### Password Security
- Passwords are hashed using bcrypt before storage
- Plain text passwords are never stored in the database
- Password hashing includes salt for additional security

### Token Security
- **Access Tokens (JWT):**
  - Short-lived (typically 15 minutes)
  - Contains user/provider ID and type
  - Signed with secret key
  - Cannot be revoked (wait for expiration)

- **Refresh Tokens:**
  - Long-lived (typically 7 days)
  - Stored as SHA-256 hash in database
  - Can be revoked immediately
  - Single-use (rotated on each refresh)

### Best Practices
- Store access token in memory (not localStorage)
- Store refresh token in httpOnly cookie (if using cookies)
- Always use HTTPS in production
- Implement rate limiting on login endpoints
- Log failed authentication attempts
- Implement account lockout after multiple failed attempts

---

## Environment Variables

The following environment variables can be configured:

```env
# Provider Roles
ADMIN_ROLE_ID=1
WORKER_ROLE_ID=2
ADMIN_ROLE_NAME=admin
WORKER_ROLE_NAME=worker

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "message": "Error description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized (invalid credentials or token)
- `404` - Not Found (token not found)
- `500` - Internal Server Error

---

## Testing Examples

### Using cURL

**Login as Admin:**
```bash
curl -X POST http://localhost:3000/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"admin123"}'
```

**Login as User:**
```bash
curl -X POST http://localhost:3000/auth/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**Reset User Password (direct):**
```bash
curl -X POST http://localhost:3000/auth/user/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","new_password":"newPass123"}'
```

**Reset Provider Password (direct):**
```bash
curl -X POST http://localhost:3000/auth/provider/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"provider@example.com","new_password":"newPass123"}'
```

**Refresh Token:**
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"your-refresh-token-here"}'
```

**Logout:**
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"your-refresh-token-here"}'
```

### Using Postman

1. Create a new POST request
2. Set the URL to `http://localhost:3000/auth/user/login`
3. Go to Body tab → Select "raw" → Select "JSON"
4. Enter the request body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
5. Click "Send"
6. Save the `accessToken` and `refreshToken` from response for subsequent requests

---

## Database Schema Reference

### refresh_tokens Table
```sql
CREATE TABLE refresh_tokens (
    token_id BIGSERIAL PRIMARY KEY,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT,
    provider_id BIGINT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    
    CONSTRAINT check_token_owner CHECK (
        (user_id IS NOT NULL AND provider_id IS NULL) OR
        (user_id IS NULL AND provider_id IS NOT NULL)
    )
);
```

**Notes:**
- A token belongs to either a user OR a provider, never both
- `token_hash` stores SHA-256 hash of the refresh token
- `revoked_at` is set when token is manually revoked
- Expired tokens can be cleaned up via scheduled job

---

## Changelog

### Version 1.1
- Added direct password reset endpoints for users and providers

### Version 1.0
- Initial authentication system
- Admin and worker provider login endpoints
- User login endpoint
- Token refresh mechanism
- Logout single session
- Logout all sessions
- Added `is_verified` field to users and providers tables (default: false)

