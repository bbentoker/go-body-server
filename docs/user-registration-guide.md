# User Registration Guide

## Overview
This guide provides detailed information about the user registration endpoint and best practices for implementing user registration in your application.

---

## Endpoint

**POST** `/auth/user/register`

**Access:** Public (no authentication required)

---

## Request Structure

### Required Fields

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

| Field      | Type   | Required | Description                          |
|------------|--------|----------|--------------------------------------|
| first_name | string | Yes      | User's first name                    |
| last_name  | string | Yes      | User's last name                     |
| email      | string | Yes      | Valid email address (must be unique) |
| password   | string | Yes      | Minimum 6 characters                 |

### Optional Fields

| Field       | Type   | Required | Default | Description                    |
|-------------|--------|----------|---------|--------------------------------|
| phone_number| string | No       | null    | User's phone number            |
| language_id | number | No       | 4 (Turkish) | Preferred language ID      |

---

## Validation Rules

### 1. **Email Validation**
- Must be a valid email format
- Must be unique (not already registered)
- Case-insensitive (john@example.com = John@Example.com)

**Valid Examples:**
```
john@example.com
jane.doe@company.co.uk
user+test@domain.com
```

**Invalid Examples:**
```
notanemail
@example.com
user@
user@.com
```

### 2. **Password Validation**
- Minimum 6 characters
- No maximum length (but reasonable limits apply)
- Can contain any characters

**Recommendations for Frontend:**
- Minimum 8 characters (stronger than backend requirement)
- At least one uppercase letter
- At least one number
- At least one special character

### 3. **Name Validation**
- Cannot be empty strings
- No specific length restrictions on backend
- Recommended: 2-100 characters each

### 4. **Language ID**
Available language IDs:
- 1: English
- 2: Spanish
- 3: Chinese
- 4: Turkish (default)
- 5: Arabic

---

## Success Response

**Status Code:** `201 Created`

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

**Note:** Password hash is **never** returned in the response.

---

## Error Responses

### 400 Bad Request - Missing Fields
```json
{
  "message": "First name, last name, email, and password are required"
}
```

### 400 Bad Request - Invalid Email
```json
{
  "message": "Invalid email format"
}
```

### 400 Bad Request - Weak Password
```json
{
  "message": "Password must be at least 6 characters long"
}
```

### 409 Conflict - Email Already Exists
```json
{
  "message": "User with this email already exists"
}
```

### 500 Internal Server Error
```json
{
  "message": "Failed to create user"
}
```

---

## Usage Examples

### Example 1: Basic Registration (JavaScript/Fetch)

```javascript
async function registerUser(userData) {
  const response = await fetch('http://localhost:3000/auth/user/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      first_name: userData.firstName,
      last_name: userData.lastName,
      email: userData.email,
      password: userData.password,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const data = await response.json();
  
  // Store tokens securely
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  return data.user;
}

// Usage
try {
  const user = await registerUser({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'SecurePass123!',
  });
  
  console.log('Registration successful:', user);
  // Redirect to dashboard or home page
  window.location.href = '/dashboard';
} catch (error) {
  console.error('Registration failed:', error.message);
  alert(error.message);
}
```

### Example 2: Registration with Phone and Language

```javascript
const response = await fetch('http://localhost:3000/auth/user/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    first_name: 'Ahmet',
    last_name: 'Yılmaz',
    email: 'ahmet@example.com',
    password: 'GüvenliŞifre123',
    phone_number: '+905551234567',
    language_id: 4, // Turkish
  }),
});

const data = await response.json();
```

### Example 3: React Registration Form

```jsx
import React, { useState } from 'react';

function RegistrationForm() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone_number: '',
    language_id: 4,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/auth/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const data = await response.json();
      
      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Redirect or show success
      console.log('User registered:', data.user);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      
      {error && <div className="error">{error}</div>}
      
      <input
        type="text"
        name="first_name"
        placeholder="First Name"
        value={formData.first_name}
        onChange={handleChange}
        required
      />
      
      <input
        type="text"
        name="last_name"
        placeholder="Last Name"
        value={formData.last_name}
        onChange={handleChange}
        required
      />
      
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      
      <input
        type="password"
        name="password"
        placeholder="Password (min 6 characters)"
        value={formData.password}
        onChange={handleChange}
        required
        minLength={6}
      />
      
      <input
        type="tel"
        name="phone_number"
        placeholder="Phone Number (optional)"
        value={formData.phone_number}
        onChange={handleChange}
      />
      
      <select
        name="language_id"
        value={formData.language_id}
        onChange={handleChange}
      >
        <option value={1}>English</option>
        <option value={2}>Español</option>
        <option value={3}>中文</option>
        <option value={4}>Türkçe</option>
        <option value={5}>العربية</option>
      </select>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}

export default RegistrationForm;
```

### Example 4: cURL

```bash
curl -X POST http://localhost:3000/auth/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "phone_number": "+1234567890",
    "language_id": 1
  }'
```

---

## Security Considerations

### 1. **Password Hashing**
- Passwords are automatically hashed using bcrypt before storage
- Plain text passwords are never stored in the database
- Password hashing is handled by the backend

### 2. **Token Security**
- Access tokens should be stored securely (not in localStorage for production)
- Refresh tokens should be stored in httpOnly cookies or secure storage
- Implement token refresh logic for expired access tokens

### 3. **HTTPS**
- Always use HTTPS in production
- Never send credentials over unencrypted connections

### 4. **Rate Limiting**
- Implement rate limiting on registration endpoint
- Prevent automated registration attacks

```javascript
// Example with express-rate-limit
const rateLimit = require('express-rate-limit');

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 registration attempts per windowMs
  message: 'Too many registration attempts, please try again later.',
});

router.post('/user/register', registrationLimiter, authController.registerUser);
```

### 5. **Email Verification**
Consider implementing email verification:
- User receives verification email after registration
- Account is marked as `is_verified: false` initially
- User clicks link in email to verify
- Update `is_verified` to `true`

---

## Best Practices

### Frontend Validation
Always validate on frontend before sending request:

```javascript
function validateRegistrationForm(formData) {
  const errors = {};

  // Name validation
  if (formData.first_name.trim().length < 2) {
    errors.first_name = 'First name must be at least 2 characters';
  }

  if (formData.last_name.trim().length < 2) {
    errors.last_name = 'Last name must be at least 2 characters';
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    errors.email = 'Invalid email format';
  }

  // Password validation
  if (formData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }
  if (!/[A-Z]/.test(formData.password)) {
    errors.password = 'Password must contain at least one uppercase letter';
  }
  if (!/[0-9]/.test(formData.password)) {
    errors.password = 'Password must contain at least one number';
  }

  return Object.keys(errors).length === 0 ? null : errors;
}
```

### Error Handling
Provide clear error messages to users:

```javascript
function getErrorMessage(error) {
  const errorMessages = {
    'User with this email already exists': 
      'This email is already registered. Please login or use a different email.',
    'Invalid email format': 
      'Please enter a valid email address.',
    'Password must be at least 6 characters long': 
      'Password is too short. Please use at least 6 characters.',
  };

  return errorMessages[error.message] || 'Registration failed. Please try again.';
}
```

### Progressive Enhancement
Consider collecting minimal information first:

1. **Step 1:** Email and password only
2. **Step 2:** Name and phone (after initial registration)
3. **Step 3:** Language preference and additional details

---

## After Registration

Once registered, the user:
1. Receives access and refresh tokens
2. Is automatically logged in
3. Can make authenticated requests using the access token
4. Has `is_verified: false` (implement email verification if needed)

### Next Steps
- Redirect to profile completion page
- Send welcome email
- Show onboarding tutorial
- Request email verification

---

## Testing

### Test Cases

```javascript
describe('User Registration', () => {
  test('should register user with valid data', async () => {
    const response = await fetch('/auth/user/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        password: 'password123',
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.user.email).toBe('john@test.com');
    expect(data.accessToken).toBeDefined();
  });

  test('should reject duplicate email', async () => {
    // Register first user
    await registerUser('john@test.com');

    // Try to register again with same email
    const response = await fetch('/auth/user/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'john@test.com',
        password: 'password123',
      }),
    });

    expect(response.status).toBe(409);
  });

  test('should reject invalid email', async () => {
    const response = await fetch('/auth/user/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'John',
        last_name: 'Doe',
        email: 'invalidemail',
        password: 'password123',
      }),
    });

    expect(response.status).toBe(400);
  });
});
```

---

## Summary

The user registration endpoint provides a secure and straightforward way to register new users. Key features:

- ✅ Automatic password hashing
- ✅ Email uniqueness validation
- ✅ Automatic token generation
- ✅ Default language support
- ✅ Phone number support
- ✅ Immediate login after registration
- ✅ Sanitized response (no password hash)

For questions or issues, refer to the main authentication documentation or contact the development team.

