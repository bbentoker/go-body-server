# Authentication API Documentation

All accounts (customers, workers, admins) now live in a single `users` table with a `role_id` that points to the `roles` table. Provider/staff accounts are simply users whose role has `is_provider = true`.

- Admin role: `role_key=admin`, `role_id` (env: `ADMIN_ROLE_ID`)
- Worker role: `role_key=worker`, `role_id` (env: `WORKER_ROLE_ID`)
- Customer role: `role_key=customer`, `role_id` (env: `CUSTOMER_ROLE_ID`)

Every successful auth response returns the authenticated `user` plus a token pair:

```json
{
  "user": {
    "user_id": 12,
    "first_name": "Ada",
    "last_name": "Lovelace",
    "email": "ada@example.com",
    "phone_number": null,
    "title": null,
    "bio": null,
    "role_id": 3,
    "is_active": true,
    "is_verified": false,
    "language_id": 4,
    "created_at": "2025-01-01T00:00:00.000Z",
    "role": {
      "role_id": 3,
      "role_key": "customer",
      "role_name": "Customer",
      "is_provider": false
    }
  },
  "accessToken": "<jwt>",
  "refreshToken": "<opaque>",
  "expiresIn": "60m"
}
```

Access token payload:

```json
{
  "id": 12,
  "email": "ada@example.com",
  "role": {
    "id": 3,
    "key": "customer",
    "name": "Customer",
    "is_provider": false
  },
  "iat": 1735737600,
  "exp": 1735741200
}
```

Base URL: all routes are prefixed with `/auth`.

---

## Admin / Worker Login

### POST `/auth/admin/login`
Authenticate a staff user with the admin role.

- Body: `{ "email": "admin@example.com", "password": "secret" }`
- Success: `200` with `user` (admin role) + token pair.
- Errors: `400` (missing fields), `401` (invalid credentials).

### POST `/auth/worker/login`
Authenticate a staff user with the worker role.

- Body: `{ "email": "worker@example.com", "password": "secret" }`
- Success: `200` with `user` (worker role) + token pair.
- Errors: `400` (missing fields), `401` (invalid credentials).

---

## Customer Registration & Login

### POST `/auth/user/register`
Creates a new customer (`role_key=customer`).

- Body:
  - `first_name` (required)
  - `last_name` (required)
  - `email` (required, unique)
  - `password` (required, min 6 chars)
  - `phone_number` (optional)
  - `language_id` (optional, defaults to `4`)
- Success: `201` with `user` + token pair.
- Errors: `400` (validation), `409` (email exists), `500` (creation failed).

### POST `/auth/user/login`
Customer login.

- Body: `{ "email": "user@example.com", "password": "secret" }`
- Success: `200` with `user` (customer role) + token pair.
- Errors: `400` (missing fields), `401` (invalid credentials).

---

## Password Reset

### POST `/auth/user/reset-password`
Reset password for any customer account.

- Body: `{ "email": "user@example.com", "new_password": "newpass" }`
- Success: `200` with confirmation message.
- Errors: `400` (missing/short password), `404` (user not found).

### POST `/auth/provider/reset-password`
Reset password for staff accounts (admin/worker roles).

- Body: `{ "email": "provider@example.com", "new_password": "newpass" }`
- Success: `200` with confirmation message.
- Errors: `400` (missing/short password), `404` (provider not found).

---

## Token Management

### POST `/auth/refresh`
Exchange a refresh token for a new access/refresh pair.

- Body: `{ "refreshToken": "<opaque token from login>" }`
- Success: `200` with a new token pair. The old refresh token is revoked.
- Errors: `400` (missing), `401` (invalid/expired).

### POST `/auth/logout`
Revoke a single refresh token.

- Body: `{ "refreshToken": "<opaque token>" }`
- Success: `200` with confirmation.
- Errors: `400` (missing), `404` (already revoked/not found).

### POST `/auth/logout-all`
Revoke all refresh tokens for a given user.

- Body: `{ "userId": 12 }`
- Success: `200` with confirmation.
- Errors: `400` (missing userId).

---

## Notes & Guarantees

- All roles live in `roles` (`role_key`, `role_name`, `is_provider`). Providers/admins are flagged via `is_provider=true`.
- Refresh tokens are opaque, hashed in `refresh_tokens.user_id` only (no provider_id column anymore).
- Access control middleware now relies on role data from the access token (`role.is_provider`, `role.key`) instead of legacy `type` values.
- Provider-facing routes should protect with `authenticateToken` + `authenticateProvider`; admin routes add `authenticateAdmin`.
