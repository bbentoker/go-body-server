# Language Preference API Documentation

This document describes how to update user language preferences and how language information is returned during authentication.

## Table of Contents
- [Available Languages](#available-languages)
- [Get Available Languages](#get-available-languages)
- [Language in Authentication](#language-in-authentication)
  - [User Registration](#user-registration)
  - [User Login](#user-login)
- [Update Language Preference](#update-language-preference)
- [Usage Examples](#usage-examples)

---

## Available Languages

The system supports 5 languages by default:

| ID | Code | Name     | Native Name |
|----|------|----------|-------------|
| 1  | en   | English  | English     |
| 2  | es   | Spanish  | Español     |
| 3  | zh   | Chinese  | 中文        |
| 4  | tr   | Turkish  | Türkçe      |
| 5  | ar   | Arabic   | العربية     |

**Default Language:** Turkish (tr) - `language_id = 4`

---

## Get Available Languages

Retrieves all active languages available in the system. This endpoint does not require authentication.

**Endpoint:** `GET /public/languages`

**Authentication:** Not required

**Response:** `200 OK`

```json
{
  "count": 5,
  "languages": [
    {
      "language_id": 5,
      "code": "ar",
      "name": "Arabic",
      "native_name": "العربية",
      "is_active": true,
      "created_at": "2025-11-18T12:00:00.000Z"
    },
    {
      "language_id": 3,
      "code": "zh",
      "name": "Chinese",
      "native_name": "中文",
      "is_active": true,
      "created_at": "2025-11-18T12:00:00.000Z"
    },
    {
      "language_id": 1,
      "code": "en",
      "name": "English",
      "native_name": "English",
      "is_active": true,
      "created_at": "2025-11-18T12:00:00.000Z"
    },
    {
      "language_id": 2,
      "code": "es",
      "name": "Spanish",
      "native_name": "Español",
      "is_active": true,
      "created_at": "2025-11-18T12:00:00.000Z"
    },
    {
      "language_id": 4,
      "code": "tr",
      "name": "Turkish",
      "native_name": "Türkçe",
      "is_active": true,
      "created_at": "2025-11-18T12:00:00.000Z"
    }
  ]
}
```

**Notes:**
- Returns only active languages (`is_active: true`)
- Languages are ordered alphabetically by name (English name)
- No authentication required - perfect for registration/login screens
- Use this to populate language selector dropdowns

**Example Request:**

```bash
curl -X GET https://api.example.com/public/languages
```

**Frontend Usage:**

```javascript
// Fetch languages for dropdown
async function fetchLanguages() {
  try {
    const response = await fetch('/public/languages');
    const data = await response.json();
    
    // Create options for language selector
    const languageOptions = data.languages.map(lang => ({
      value: lang.language_id,
      label: `${lang.native_name} (${lang.name})`,
      code: lang.code
    }));
    
    console.log(languageOptions);
    // [
    //   { value: 5, label: 'العربية (Arabic)', code: 'ar' },
    //   { value: 3, label: '中文 (Chinese)', code: 'zh' },
    //   { value: 1, label: 'English (English)', code: 'en' },
    //   { value: 2, label: 'Español (Spanish)', code: 'es' },
    //   { value: 4, label: 'Türkçe (Turkish)', code: 'tr' }
    // ]
    
    return languageOptions;
  } catch (error) {
    console.error('Error fetching languages:', error);
    return [];
  }
}
```

---

## Language in Authentication

### User Registration

When a user registers, they can optionally specify their preferred language. If not provided, Turkish (language_id = 4) is used as default.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "phone_number": "555-0100",
  "language_id": 1
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "user_id": 123,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone_number": "555-0100",
    "is_verified": false,
    "language_id": 1,
    "created_at": "2025-11-18T12:00:00.000Z",
    "language": {
      "language_id": 1,
      "code": "en",
      "name": "English",
      "native_name": "English"
    }
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Notes:**
- `language_id` is optional in the request body
- If omitted, defaults to 4 (Turkish)
- The response includes the full `language` object with details

---

### User Login

When a user logs in, their language preference is automatically included in the response.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "user_id": 123,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone_number": "555-0100",
    "is_verified": false,
    "language_id": 1,
    "created_at": "2025-11-18T12:00:00.000Z",
    "language": {
      "language_id": 1,
      "code": "en",
      "name": "English",
      "native_name": "English"
    }
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Notes:**
- Language information is automatically included in the login response
- No need to make a separate API call to get the user's language preference
- Frontend can use this to set the app's language immediately after login

---

## Update Language Preference

Authenticated users can update their language preference at any time.

**Endpoint:** `PATCH /public/language`

**Authentication:** Required (Bearer token)

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "language_id": 4
}
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| language_id | integer | Yes | The ID of the desired language (1-5) |

**Response:** `200 OK`
```json
{
  "message": "Language preference updated successfully",
  "user": {
    "user_id": 123,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone_number": "555-0100",
    "is_verified": false,
    "language_id": 4,
    "created_at": "2025-11-18T12:00:00.000Z",
    "language": {
      "language_id": 4,
      "code": "tr",
      "name": "Turkish",
      "native_name": "Türkçe"
    }
  }
}
```

**Error Responses:**

`400 Bad Request` - Missing language_id
```json
{
  "message": "language_id is required"
}
```

`400 Bad Request` - Invalid language_id format
```json
{
  "message": "language_id must be a valid number"
}
```

`401 Unauthorized` - Missing or invalid token
```json
{
  "error": "Access token required"
}
```

`403 Forbidden` - Not a user account
```json
{
  "message": "Access denied. User account required."
}
```

---

## Usage Examples

### Example 1: Register with English Language

```bash
curl -X POST https://api.example.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "password": "securepass123",
    "phone_number": "555-0100",
    "language_id": 1
  }'
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "user_id": 123,
    "language_id": 1,
    "language": {
      "language_id": 1,
      "code": "en",
      "name": "English",
      "native_name": "English"
    },
    ...
  },
  "accessToken": "...",
  "refreshToken": "..."
}
```

---

### Example 2: Register with Default Language (Turkish)

```bash
curl -X POST https://api.example.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Ahmet",
    "last_name": "Yılmaz",
    "email": "ahmet@example.com",
    "password": "securepass123"
  }'
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "user_id": 124,
    "language_id": 4,
    "language": {
      "language_id": 4,
      "code": "tr",
      "name": "Turkish",
      "native_name": "Türkçe"
    },
    ...
  },
  "accessToken": "...",
  "refreshToken": "..."
}
```

---

### Example 3: Login and Get Language

```bash
curl -X POST https://api.example.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepass123"
  }'
```

**Response:**
```json
{
  "user": {
    "user_id": 123,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "language_id": 1,
    "language": {
      "language_id": 1,
      "code": "en",
      "name": "English",
      "native_name": "English"
    }
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "..."
}
```

---

### Example 4: Update Language to Spanish

```bash
curl -X PATCH https://api.example.com/public/language \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "language_id": 2
  }'
```

**Response:**
```json
{
  "message": "Language preference updated successfully",
  "user": {
    "user_id": 123,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "language_id": 2,
    "language": {
      "language_id": 2,
      "code": "es",
      "name": "Spanish",
      "native_name": "Español"
    }
  }
}
```

---

### Example 5: Update Language to Chinese

```bash
curl -X PATCH https://api.example.com/public/language \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "language_id": 3
  }'
```

**Response:**
```json
{
  "message": "Language preference updated successfully",
  "user": {
    "user_id": 123,
    "language_id": 3,
    "language": {
      "language_id": 3,
      "code": "zh",
      "name": "Chinese",
      "native_name": "中文"
    }
  }
}
```

---

### Example 6: Update Language to Arabic

```bash
curl -X PATCH https://api.example.com/public/language \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "language_id": 5
  }'
```

**Response:**
```json
{
  "message": "Language preference updated successfully",
  "user": {
    "user_id": 123,
    "language_id": 5,
    "language": {
      "language_id": 5,
      "code": "ar",
      "name": "Arabic",
      "native_name": "العربية"
    }
  }
}
```

---

## Frontend Integration

### React Example - Language Selector

```javascript
import { useState, useEffect } from 'react';

function LanguageSelector({ user, accessToken, onLanguageChange }) {
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(user?.language_id || 4);
  const [loading, setLoading] = useState(false);

  // Fetch available languages on mount
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch('/public/languages');
        if (response.ok) {
          const data = await response.json();
          setLanguages(data.languages);
        }
      } catch (error) {
        console.error('Error fetching languages:', error);
      }
    };

    fetchLanguages();
  }, []);

  const handleLanguageChange = async (languageId) => {
    setLoading(true);
    
    try {
      const response = await fetch('/public/language', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language_id: languageId }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedLanguage(languageId);
        
        // Update app language
        if (onLanguageChange) {
          onLanguageChange(data.user.language);
        }
        
        alert('Language updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating language:', error);
      alert('Failed to update language preference');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="language-selector">
      <label htmlFor="language">Language Preference:</label>
      <select
        id="language"
        value={selectedLanguage}
        onChange={(e) => handleLanguageChange(parseInt(e.target.value))}
        disabled={loading}
      >
        {languages.map((lang) => (
          <option key={lang.language_id} value={lang.language_id}>
            {lang.native_name} ({lang.name})
          </option>
        ))}
      </select>
    </div>
  );
}

export default LanguageSelector;
```

### JavaScript Example - Update Language

```javascript
async function updateUserLanguage(languageId, accessToken) {
  try {
    const response = await fetch('https://api.example.com/public/language', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language_id: languageId
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update language');
    }

    const data = await response.json();
    console.log('Language updated:', data.user.language);
    
    // Store the new language preference
    localStorage.setItem('userLanguage', data.user.language.code);
    
    // Update your app's i18n settings
    // i18n.changeLanguage(data.user.language.code);
    
    return data.user;
  } catch (error) {
    console.error('Error updating language:', error);
    throw error;
  }
}

// Usage
updateUserLanguage(2, 'your-access-token-here')
  .then(user => console.log('User updated:', user))
  .catch(error => console.error('Error:', error));
```

---

## Integration with i18n Libraries

### Using with react-i18next

```javascript
import { useTranslation } from 'react-i18next';

function App({ user }) {
  const { i18n } = useTranslation();

  // Set language from user preference on mount
  useEffect(() => {
    if (user?.language?.code) {
      i18n.changeLanguage(user.language.code);
    }
  }, [user, i18n]);

  const updateLanguage = async (languageId) => {
    const response = await fetch('/public/language', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ language_id: languageId }),
    });

    if (response.ok) {
      const data = await response.json();
      // Update i18n language
      i18n.changeLanguage(data.user.language.code);
    }
  };

  return (
    // Your app content
  );
}
```

---

## Notes

1. **Automatic Inclusion:** Language information is automatically included in:
   - Registration response
   - Login response
   - Profile update response
   - Language preference update response

2. **Default Language:** Turkish (language_id = 4) is the default for new users who don't specify a language

3. **Security:** The `/public/language` endpoint requires authentication and users can only update their own language preference

4. **Validation:** The system validates that the `language_id` is a valid number before updating

5. **Language Codes:** Use the `code` field (e.g., "en", "tr", "es") for i18n library integration

6. **Frontend Storage:** Consider storing the user's language preference in localStorage for quick access

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success - Language updated successfully |
| 201 | Created - User registered with language preference |
| 400 | Bad Request - Missing or invalid language_id |
| 401 | Unauthorized - Authentication required or token invalid |
| 403 | Forbidden - Not a user account |
| 404 | Not Found - User not found |
| 500 | Internal Server Error - Server error occurred |

---

## Summary

- ✅ Use `GET /public/languages` to fetch available languages (no auth required)
- ✅ Language is automatically returned during registration
- ✅ Language is automatically returned during login
- ✅ Use `PATCH /public/language` to update language preference (requires auth)
- ✅ Supports 5 languages: English, Spanish, Chinese, Turkish, Arabic
- ✅ Default language is Turkish (language_id = 4)
- ✅ Response includes full language object with id, code, name, and native_name
- ✅ Perfect for building language selector dropdowns

