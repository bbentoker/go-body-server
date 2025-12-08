# Password Reset API Documentation

This document describes the password reset flow for Go Body. The password reset feature allows users to securely reset their password via email.

## Overview

The password reset flow consists of two steps:

1. **Request Reset**: User submits their email address to receive a password reset link
2. **Confirm Reset**: User clicks the link and submits their new password along with the reset code

## Configuration

The following environment variables configure the password reset feature:

| Variable | Description | Default |
|----------|-------------|---------|
| `PASSWORD_RESET_EXPIRY_MINUTES` | Minutes until reset code expires | `60` |
| `FRONTEND_URL` | Base URL for the frontend app | `http://localhost:3000` |

## API Endpoints

### 1. Request Password Reset

Initiates the password reset process by sending an email with a reset link.

**Endpoint:** `POST /auth/password/request-reset`

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Success Response (200 OK):**

```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

> **Note:** For security reasons, this endpoint returns a success response even if the email doesn't exist in the system. This prevents email enumeration attacks.

**Error Responses:**

| Status | Message | Description |
|--------|---------|-------------|
| 400 | `Email is required` | Missing email in request body |
| 429 | `A password reset request is already pending. Please check your email or try again later.` | User already has a non-expired reset request |
| 500 | `Failed to send password reset email. Please try again later.` | Email delivery failed |

**Behavior:**

1. Validates the email is provided
2. Looks up the user by email (case-insensitive)
3. If user doesn't exist, returns success (security measure)
4. Checks for existing non-expired reset requests
5. Creates a new reset token with expiration
6. Sends email with reset link to `{FRONTEND_URL}/auth/reset-password?code={reset_code}`

---

### 2. Confirm Password Reset

Validates the reset code and updates the user's password.

**Endpoint:** `POST /auth/password/confirm-reset`

**Request Body:**

```json
{
  "reset_code": "abc123def456...",
  "new_password": "newSecurePassword123"
}
```

**Success Response (200 OK):**

```json
{
  "message": "Password has been reset successfully. Please log in with your new password."
}
```

**Error Responses:**

| Status | Message | Description |
|--------|---------|-------------|
| 400 | `Reset code and new_password are required` | Missing required fields |
| 400 | `Password must be at least 6 characters long` | Password doesn't meet requirements |
| 400 | `Invalid or expired reset code` | Reset code is invalid, expired, or already used |
| 500 | `Failed to reset password` | Internal error during password update |

**Behavior:**

1. Validates reset code and new password are provided
2. Validates password is at least 6 characters
3. Verifies the reset code is valid, not expired, and not used
4. Updates the user's password
5. Marks the reset token as used
6. Revokes all existing user sessions (for security)

---

## Database Schema

### Password Reset Tokens Table

```sql
CREATE TABLE password_reset_tokens (
    token_id BIGSERIAL PRIMARY KEY,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    used_at TIMESTAMP
);

CREATE INDEX idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
```

---

## Email Template

The password reset email uses the `PASSWORD_RESET` template from the email service:

**Subject:** `Password Reset Request - Go Body`

**Template Data:**
- `firstName`: User's first name
- `resetUrl`: Full URL including the reset code
- `expiresIn`: Human-readable expiration time (e.g., "1 hour")

---

## Security Considerations

1. **Token Hashing**: Reset codes are hashed using SHA-256 before storage
2. **Single Use**: Each token can only be used once (`used_at` timestamp)
3. **Expiration**: Tokens expire after the configured time period
4. **Rate Limiting**: Only one active reset request per user at a time
5. **Session Invalidation**: All existing sessions are revoked upon password reset
6. **Email Enumeration Prevention**: Same response for existing and non-existing emails
7. **Secure Generation**: Reset codes are generated using `crypto.randomBytes(32)`

---

## Frontend Integration

### Reset Link Format

The email contains a link in the following format:

```
{FRONTEND_URL}/auth/reset-password?code={reset_code}
```

### Example Frontend Flow

1. User visits `/auth/forgot-password`
2. User submits email via `POST /auth/password/request-reset`
3. User receives email with reset link
4. User clicks link, lands on `/auth/reset-password?code=...`
5. Frontend extracts `code` from URL query params
6. User enters new password
7. Frontend submits via `POST /auth/password/confirm-reset` with `reset_code` and `new_password`
8. On success, redirect to login page

### Example Frontend Implementation

```javascript
// Request password reset
async function requestPasswordReset(email) {
  const response = await fetch('/auth/password/request-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return response.json();
}

// Confirm password reset
async function confirmPasswordReset(resetCode, newPassword) {
  const response = await fetch('/auth/password/confirm-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reset_code: resetCode,
      new_password: newPassword,
    }),
  });
  return response.json();
}
```

---

## Complete Flow Example

### Step 1: Request Reset

```bash
curl -X POST http://localhost:3001/auth/password/request-reset \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

**Response:**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

### Step 2: User Receives Email

User receives an email with a link like:
```
https://go-body.co/auth/reset-password?code=a1b2c3d4e5f6...
```

### Step 3: Confirm Reset

```bash
curl -X POST http://localhost:3001/auth/password/confirm-reset \
  -H "Content-Type: application/json" \
  -d '{
    "reset_code": "a1b2c3d4e5f6...",
    "new_password": "myNewSecurePassword123"
  }'
```

**Response:**
```json
{
  "message": "Password has been reset successfully. Please log in with your new password."
}
```

---

## Error Handling Best Practices

1. **Show generic messages to users**: Don't reveal whether an email exists in the system
2. **Log detailed errors server-side**: For debugging and monitoring
3. **Handle network errors**: Show retry options for temporary failures
4. **Validate on client and server**: Prevent unnecessary API calls for invalid input

