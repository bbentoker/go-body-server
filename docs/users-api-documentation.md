# Users API Documentation

## Overview
This document describes the API endpoints for managing users in the Go Body system.

## Base URL
All endpoints are prefixed with: `/users`

---

## Endpoints

### 1. Create User
Creates a new user in the system.

**Endpoint:** `POST /users`

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "phone_number": "+1234567890"
}
```

**Required Fields:**
- `first_name` (string): User's first name
- `last_name` (string): User's last name
- `email` (string): Valid email address (must be unique)
- `password` (string): Password (will be hashed)

**Optional Fields:**
- `phone_number` (string): User's phone number

**Success Response (201 Created):**
```json
{
  "user_id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone_number": "+1234567890",
  "is_verified": false,
  "language_id": 4,
  "created_at": "2024-11-15T10:00:00.000Z"
}
```

**Error Responses:**

- **400 Bad Request** - Missing required fields
```json
{
  "message": "Missing required fields: first_name, last_name, email, password"
}
```

- **500 Internal Server Error**
```json
{
  "message": "Failed to create user",
  "error": "Error details"
}
```

**Notes:**
- Password is automatically hashed before storage
- Password hash is never returned in response
- User is created with `is_verified: false`
- Default language is Turkish (language_id = 4)

**Example:**
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone_number": "+1234567890"
  }'
```

---

### 2. List All Users
Retrieves a list of all users in the system.

**Endpoint:** `GET /users`

**Query Parameters:**
- `includeReservations` (optional) - Set to `true` or `1` to include user's reservations

**Example Requests:**
```
GET /users
GET /users?includeReservations=true
```

**Success Response (200 OK):**
```json
[
  {
    "user_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone_number": "+1234567890",
    "is_verified": false,
    "language_id": 4,
    "created_at": "2024-11-15T10:00:00.000Z"
  },
  {
    "user_id": 2,
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "phone_number": "+1234567891",
    "is_verified": true,
    "language_id": 1,
    "created_at": "2024-11-14T09:00:00.000Z"
  }
]
```

**With Reservations:**
```json
[
  {
    "user_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone_number": "+1234567890",
    "is_verified": false,
    "language_id": 4,
    "created_at": "2024-11-15T10:00:00.000Z",
    "reservations": [
      {
        "reservation_id": 1,
        "service_id": 1,
        "provider_id": 1,
        "start_time": "2024-11-20T14:00:00.000Z",
        "end_time": "2024-11-20T15:30:00.000Z",
        "status": "confirmed"
      }
    ]
  }
]
```

**Error Response:**

- **500 Internal Server Error**
```json
{
  "message": "Failed to retrieve users",
  "error": "Error details"
}
```

**Notes:**
- Returns all users in the system
- Password hash is never included in response
- Use `includeReservations` parameter to get user's booking history

**Example:**
```bash
# Get all users
curl -X GET http://localhost:3000/users

# Get all users with their reservations
curl -X GET "http://localhost:3000/users?includeReservations=true"
```

---

### 3. Get User by ID
Retrieves a single user by their ID.

**Endpoint:** `GET /users/:userId`

**URL Parameters:**
- `userId` (required) - User ID

**Query Parameters:**
- `includeReservations` (optional) - Set to `true` or `1` to include user's reservations

**Example Requests:**
```
GET /users/1
GET /users/1?includeReservations=true
```

**Success Response (200 OK):**
```json
{
  "user_id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone_number": "+1234567890",
  "is_verified": false,
  "language_id": 4,
  "created_at": "2024-11-15T10:00:00.000Z"
}
```

**With Reservations:**
```json
{
  "user_id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone_number": "+1234567890",
  "is_verified": false,
  "language_id": 4,
  "created_at": "2024-11-15T10:00:00.000Z",
  "reservations": [
    {
      "reservation_id": 1,
      "service_id": 1,
      "provider_id": 1,
      "start_time": "2024-11-20T14:00:00.000Z",
      "end_time": "2024-11-20T15:30:00.000Z",
      "status": "confirmed",
      "total_price": "75.00"
    }
  ]
}
```

**Error Responses:**

- **404 Not Found**
```json
{
  "message": "User not found"
}
```

- **500 Internal Server Error**
```json
{
  "message": "Failed to retrieve user",
  "error": "Error details"
}
```

**Example:**
```bash
# Get user by ID
curl -X GET http://localhost:3000/users/1

# Get user with reservations
curl -X GET "http://localhost:3000/users/1?includeReservations=true"
```

---

### 4. Update User
Updates an existing user's information.

**Endpoint:** `PUT /users/:userId`

**URL Parameters:**
- `userId` (required) - User ID

**Request Body (all fields optional):**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "newemail@example.com",
  "phone_number": "+1234567890",
  "password": "newpassword123"
}
```

**Updatable Fields:**
- `first_name` (string): User's first name
- `last_name` (string): User's last name
- `email` (string): Email address
- `phone_number` (string): Phone number
- `password` (string): New password (will be hashed)

**Success Response (200 OK):**
```json
{
  "user_id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "newemail@example.com",
  "phone_number": "+1234567890",
  "is_verified": false,
  "language_id": 4,
  "created_at": "2024-11-15T10:00:00.000Z"
}
```

**Error Responses:**

- **400 Bad Request** - No valid fields provided
```json
{
  "message": "No valid fields provided for update"
}
```

- **404 Not Found**
```json
{
  "message": "User not found"
}
```

- **500 Internal Server Error**
```json
{
  "message": "Failed to update user",
  "error": "Error details"
}
```

**Notes:**
- Only provided fields will be updated
- Password is automatically hashed if provided
- Password hash is never returned in response
- Cannot update `user_id`, `created_at`, or `is_verified` through this endpoint

**Example:**
```bash
# Update user's name
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jonathan",
    "last_name": "Doe"
  }'

# Update email and phone
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com",
    "phone_number": "+9876543210"
  }'

# Change password
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "password": "newSecurePassword456"
  }'
```

---

### 5. Delete User
Deletes a user from the system.

**Endpoint:** `DELETE /users/:userId`

**URL Parameters:**
- `userId` (required) - User ID

**Example Request:**
```
DELETE /users/1
```

**Success Response (204 No Content):**
No response body. Status code 204 indicates successful deletion.

**Error Responses:**

- **404 Not Found**
```json
{
  "message": "User not found"
}
```

- **500 Internal Server Error**
```json
{
  "message": "Failed to delete user",
  "error": "Error details"
}
```

**Notes:**
- Permanently deletes the user from the database
- User's reservations may be set to NULL or cascade delete depending on database configuration
- This action cannot be undone
- Consider using soft delete (is_active flag) in production

**Example:**
```bash
curl -X DELETE http://localhost:3000/users/1
```

---

## Data Model

### User Object
```json
{
  "user_id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone_number": "+1234567890",
  "is_verified": false,
  "language_id": 4,
  "created_at": "2024-11-15T10:00:00.000Z"
}
```

**Fields:**
- `user_id` (number): Unique identifier
- `first_name` (string): User's first name
- `last_name` (string): User's last name
- `email` (string): Email address (unique)
- `phone_number` (string|null): Phone number
- `is_verified` (boolean): Email verification status
- `language_id` (number): Preferred language (1=English, 2=Spanish, 3=Chinese, 4=Turkish, 5=Arabic)
- `created_at` (datetime): Account creation timestamp

**Not Included in Response:**
- `password_hash`: Never exposed via API

---

## Use Cases

### 1. User Management Dashboard
List all users with their reservation counts:
```javascript
const response = await fetch('http://localhost:3000/users?includeReservations=true');
const users = await response.json();

users.forEach(user => {
  console.log(`${user.first_name} ${user.last_name}: ${user.reservations.length} reservations`);
});
```

### 2. User Profile Update
Allow user to update their profile information:
```javascript
async function updateProfile(userId, updates) {
  const response = await fetch(`http://localhost:3000/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  
  return await response.json();
}

// Usage
await updateProfile(1, {
  first_name: 'John',
  phone_number: '+1234567890'
});
```

### 3. Admin User Creation
Create users from admin panel:
```javascript
async function createUserFromAdmin(userData) {
  const response = await fetch('http://localhost:3000/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
}
```

---

## Security Considerations

### Password Handling
- Passwords are automatically hashed using bcrypt
- Plain text passwords are never stored
- Password hashes are never returned in API responses
- Minimum password length should be enforced (recommend 8+ characters)

### Email Uniqueness
- Email addresses must be unique
- Attempting to create/update with existing email will fail
- Consider case-insensitive email comparison

### Data Privacy
- Password hash field is automatically excluded from all responses
- Consider implementing authentication middleware for sensitive operations
- Implement rate limiting on user creation to prevent abuse

---

## Best Practices

### 1. Always Validate Input on Frontend
```javascript
function validateUserData(data) {
  const errors = {};
  
  if (!data.first_name || data.first_name.trim().length < 2) {
    errors.first_name = 'First name must be at least 2 characters';
  }
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!data.password || data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }
  
  return Object.keys(errors).length === 0 ? null : errors;
}
```

### 2. Handle Errors Gracefully
```javascript
async function createUser(userData) {
  try {
    const response = await fetch('http://localhost:3000/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to create user:', error);
    throw error;
  }
}
```

### 3. Use Pagination for Large Lists
Consider implementing pagination for the list users endpoint:
```javascript
// Future enhancement suggestion
GET /users?page=1&limit=20
```

---

## Differences from Auth Routes

| Feature | `/users` Routes | `/auth/user/register` |
|---------|-----------------|----------------------|
| Purpose | User management (CRUD) | User registration with auto-login |
| Returns | User object only | User + tokens |
| Password | Optional on create | Required |
| Use Case | Admin operations | User self-registration |

**When to use `/users`:**
- Admin creating user accounts
- User profile management
- Bulk user operations
- User data retrieval

**When to use `/auth/user/register`:**
- User self-registration
- Public signup forms
- Mobile app registration

---

## Common HTTP Status Codes

- **200 OK**: Successful GET/PUT request
- **201 Created**: Successful POST (user created)
- **204 No Content**: Successful DELETE
- **400 Bad Request**: Invalid input data
- **404 Not Found**: User not found
- **500 Internal Server Error**: Server-side error

---

## Related Documentation

- [Auth API Documentation](./auth-api-documentation.md) - For user registration and login
- [Reservations API Documentation](./reservations-api-documentation.md) - For user reservations
- [User Registration Guide](./user-registration-guide.md) - Detailed registration guide

---

## Summary

The Users API provides comprehensive CRUD operations for user management:

✅ **Create** - Add new users to the system
✅ **Read** - List all users or get specific user by ID
✅ **Update** - Modify user information
✅ **Delete** - Remove users from the system
✅ **Password Security** - Automatic password hashing
✅ **Privacy** - Password hashes never exposed
✅ **Flexible** - Optional fields and query parameters

