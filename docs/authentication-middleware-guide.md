# Authentication Middleware Guide

## Overview
This guide explains the authentication middleware system and how to use bearer tokens to access protected routes.

---

## Middleware Functions

### 1. `authenticateToken`
Verifies JWT access token from Authorization header.

**Usage:**
```javascript
router.get('/protected', authenticateToken, controller.protectedRoute);
```

**What it does:**
- Extracts bearer token from `Authorization` header
- Verifies token signature and expiration
- Attaches decoded user info to `req.user`
- Rejects invalid or expired tokens

**Attached data:**
```javascript
req.user = {
  id: 1,              // user_id or provider_id
  type: 'user',       // 'user' or 'provider'
  email: 'user@example.com'
}
```

---

### 2. `authorizeUser`
Ensures authenticated user can only access their own data.

**Usage:**
```javascript
router.get('/user/:userId/data', authenticateToken, authorizeUser, controller.getUserData);
```

**What it does:**
- Checks if user is authenticated
- Verifies user type is 'user' (not provider)
- Validates that `req.user.id` matches `req.params.userId`
- Prevents users from accessing other users' data

---

### 3. `authenticateProvider`
Verifies the authenticated user is a provider.

**Usage:**
```javascript
router.get('/provider/dashboard', authenticateToken, authenticateProvider, controller.dashboard);
```

---

### 4. `authenticateAdmin`
Verifies the authenticated user is an admin provider.

**Usage:**
```javascript
router.post('/admin/settings', authenticateToken, authenticateAdmin, controller.updateSettings);
```

---

## How to Use Bearer Token Authentication

### Step 1: Login or Register
First, obtain access token by logging in or registering:

```bash
# Register
curl -X POST http://localhost:3000/auth/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "user_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidHlwZSI6InVzZXIiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJpYXQiOjE3MDA1MDAwMDAsImV4cCI6MTcwMDUwMDkwMH0.signature",
  "refreshToken": "a1b2c3d4e5f6..."
}
```

### Step 2: Use Access Token
Include the access token in the `Authorization` header with `Bearer` prefix:

```bash
curl -X GET http://localhost:3000/reservations/user/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Complete Examples

### Example 1: Get User Reservations (curl)

```bash
# Step 1: Login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }')

# Extract access token (using jq)
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')

# Step 2: Get reservations
curl -X GET http://localhost:3000/reservations/user/1 \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Example 2: Get User Reservations (JavaScript)

```javascript
// Step 1: Login
async function login(email, password) {
  const response = await fetch('http://localhost:3000/auth/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  // Store tokens
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  return data;
}

// Step 2: Get user reservations
async function getUserReservations(userId) {
  const accessToken = localStorage.getItem('accessToken');
  
  const response = await fetch(`http://localhost:3000/reservations/user/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return await response.json();
}

// Usage
try {
  await login('john@example.com', 'password123');
  const reservations = await getUserReservations(1);
  console.log('User reservations:', reservations);
} catch (error) {
  console.error('Error:', error.message);
}
```

### Example 3: React Hook for Protected Routes

```jsx
import { useState, useEffect } from 'react';

function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Decode token to get user info (optional)
      // Or just verify it's valid by making a test request
      setUser({ token });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await fetch('http://localhost:3000/auth/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    
    return data;
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return { user, loading, login, logout };
}

// Component
function MyReservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user]);

  const fetchReservations = async () => {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`http://localhost:3000/reservations/user/${user.user_id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    setReservations(data.reservations);
  };

  return (
    <div>
      <h2>My Reservations</h2>
      {reservations.map(reservation => (
        <div key={reservation.reservation_id}>
          {reservation.service.name} - {reservation.start_time}
        </div>
      ))}
    </div>
  );
}
```

---

## Error Handling

### 401 Unauthorized
Token is missing from the request.

```json
{
  "error": "Access token required"
}
```

**Solution:** Include Authorization header with Bearer token.

---

### 403 Forbidden - Invalid Token
Token is invalid, expired, or malformed.

```json
{
  "error": "Invalid or expired token"
}
```

**Solution:** 
1. Refresh the access token using refresh token
2. If refresh token is expired, re-login

---

### 403 Forbidden - Unauthorized Access
Trying to access another user's data.

```json
{
  "error": "Access denied. You can only access your own reservations."
}
```

**Solution:** Only request your own user ID.

---

## Token Refresh Flow

When access token expires, use the refresh token to get a new one:

```javascript
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('http://localhost:3000/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  
  if (!response.ok) {
    // Refresh token expired, need to re-login
    throw new Error('Session expired. Please login again.');
  }
  
  const data = await response.json();
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  return data.accessToken;
}

// Use in API calls
async function apiCallWithRetry(url, options = {}) {
  let token = localStorage.getItem('accessToken');
  
  options.headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };
  
  let response = await fetch(url, options);
  
  // If 403, try refreshing token
  if (response.status === 403) {
    token = await refreshAccessToken();
    options.headers['Authorization'] = `Bearer ${token}`;
    response = await fetch(url, options);
  }
  
  return response;
}
```

---

## Security Best Practices

### 1. Token Storage
- **Don't** store tokens in localStorage for production (vulnerable to XSS)
- **Do** use httpOnly cookies for refresh tokens
- **Do** use memory/state for access tokens in production

### 2. Token Expiration
- Access tokens expire in 15 minutes (configurable)
- Refresh tokens expire in 7 days (configurable)
- Implement automatic token refresh

### 3. HTTPS
- Always use HTTPS in production
- Never send tokens over unencrypted connections

### 4. Token Validation
- Server validates token on every request
- Invalid tokens are rejected immediately
- Expired tokens require refresh

---

## Testing Protected Routes

### Using Postman
1. Login and copy the `accessToken` from response
2. In Headers, add:
   - Key: `Authorization`
   - Value: `Bearer <paste_token_here>`
3. Send request

### Using curl
```bash
curl -X GET http://localhost:3000/reservations/user/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -v
```

### Using curl with saved token
```bash
# Save token to file
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." > token.txt

# Use token from file
TOKEN=$(cat token.txt)
curl -X GET http://localhost:3000/reservations/user/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## Summary

The authentication middleware provides:

✅ **Token-based authentication** using JWT
✅ **User authorization** ensuring users can only access their own data
✅ **Provider authentication** for provider-specific routes
✅ **Automatic token validation** on protected routes
✅ **Clear error messages** for debugging

For more information, see:
- [Auth API Documentation](./auth-api-documentation.md)
- [User Registration Guide](./user-registration-guide.md)

