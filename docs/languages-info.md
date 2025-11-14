# Languages Implementation Guide

## Overview
This document describes the languages feature that has been added to support multi-language preferences for users and providers.

---

## Database Schema

### Languages Table
```sql
CREATE TABLE languages (
    language_id BIGSERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,      -- ISO 639-1 code (en, tr, es, etc.)
    name VARCHAR(100) NOT NULL,            -- English name
    native_name VARCHAR(100) NOT NULL,     -- Native name (Türkçe, English, etc.)
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Default Languages
The system includes 5 commonly used languages:

| ID | Code | Name     | Native Name |
|----|------|----------|-------------|
| 1  | en   | English  | English     |
| 2  | es   | Spanish  | Español     |
| 3  | zh   | Chinese  | 中文        |
| 4  | tr   | Turkish  | Türkçe      |
| 5  | ar   | Arabic   | العربية     |

**Default Language:** Turkish (tr) - language_id = 4

---

## Model Updates

### User Model
Added `language_id` field:
```javascript
language_id: {
  type: DataTypes.BIGINT,
  allowNull: false,
  defaultValue: 4, // Turkish (tr) as default
  references: {
    model: 'languages',
    key: 'language_id',
  },
}
```

### Provider Model
Added `language_id` field:
```javascript
language_id: {
  type: DataTypes.BIGINT,
  allowNull: false,
  defaultValue: 4, // Turkish (tr) as default
  references: {
    model: 'languages',
    key: 'language_id',
  },
}
```

---

## Relationships

### Language → User (One-to-Many)
```javascript
Language.hasMany(User, {
  foreignKey: 'language_id',
  as: 'users',
});

User.belongsTo(Language, {
  foreignKey: 'language_id',
  as: 'language',
});
```

### Language → Provider (One-to-Many)
```javascript
Language.hasMany(Provider, {
  foreignKey: 'language_id',
  as: 'providers',
});

Provider.belongsTo(Language, {
  foreignKey: 'language_id',
  as: 'language',
});
```

---

## Migration

### For Existing Databases
If you already have a database with users and providers, use the migration file:

**File:** `docs/migration-add-languages.sql`

#### Steps:
1. **Backup your database first!**
2. Run the migration:
   ```bash
   psql -U your_username -d your_database -f docs/migration-add-languages.sql
   ```

#### What the migration does:
1. Creates the `languages` table
2. Inserts 5 default languages
3. Adds `language_id` column to `users` table
4. Adds `language_id` column to `providers` table
5. Sets all existing users/providers to Turkish (language_id = 4)
6. Creates foreign key constraints
7. Creates performance indexes

### For Fresh Database Setup
Use the updated schema file:

**File:** `docs/db-schema-v1.sql`

This includes the languages table and all relationships from the start.

---

## Usage Examples

### Creating a User with Language
```javascript
const user = await User.create({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  language_id: 1, // English
  // ... other fields
});
```

### Creating a Provider with Default Language (Turkish)
```javascript
const provider = await Provider.create({
  first_name: 'Ahmet',
  last_name: 'Yılmaz',
  email: 'ahmet@example.com',
  // language_id will default to 4 (Turkish)
  role_id: 2,
  // ... other fields
});
```

### Fetching User with Language
```javascript
const user = await User.findByPk(userId, {
  include: [{
    model: Language,
    as: 'language',
  }],
});

console.log(user.language.name); // "English"
console.log(user.language.native_name); // "English"
console.log(user.language.code); // "en"
```

### Updating User's Language
```javascript
await user.update({
  language_id: 4, // Change to Turkish
});
```

### Getting All Active Languages
```javascript
const { Language } = require('./models');

const languages = await Language.findAll({
  where: { is_active: true },
  order: [['name', 'ASC']],
});
```

### Using Language Service
```javascript
const languageService = require('./services/languageService');

// Get all active languages
const activeLanguages = await languageService.getActiveLanguages();

// Get specific language
const turkish = await languageService.getLanguageById(4);

// Get language by code
const languages = await languageService.getLanguages({
  where: { code: 'en' }
});
```

---

## API Integration Example

### Adding Language to User Registration
```javascript
// In userController.js or authController.js
async function register(req, res) {
  const { first_name, last_name, email, password, language_id } = req.body;
  
  const userData = {
    first_name,
    last_name,
    email,
    password_hash: await hashPassword(password),
    language_id: language_id || 4, // Default to Turkish if not provided
  };
  
  const user = await User.create(userData);
  // ... rest of registration logic
}
```

### Getting User Profile with Language
```javascript
async function getUserProfile(req, res) {
  const user = await User.findByPk(req.userId, {
    include: [{
      model: Language,
      as: 'language',
      attributes: ['language_id', 'code', 'name', 'native_name'],
    }],
  });
  
  res.json({
    user_id: user.user_id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    language: {
      id: user.language.language_id,
      code: user.language.code,
      name: user.language.name,
      native_name: user.language.native_name,
    },
  });
}
```

---

## Frontend Integration

### Language Selector Dropdown
```javascript
// Fetch available languages
const response = await fetch('/api/languages');
const languages = await response.json();

// Create dropdown
const languageSelect = languages.map(lang => ({
  value: lang.language_id,
  label: `${lang.native_name} (${lang.name})`,
  code: lang.code
}));

// Example options:
// - English (English) - en
// - Español (Spanish) - es
// - 中文 (Chinese) - zh
// - Türkçe (Turkish) - tr
// - العربية (Arabic) - ar
```

### Update User Language Preference
```javascript
async function updateLanguagePreference(languageId) {
  const response = await fetch('/api/users/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language_id: languageId })
  });
  
  const updatedUser = await response.json();
  console.log(`Language updated to: ${updatedUser.language.name}`);
}
```

---

## Adding More Languages

### SQL Method
```sql
INSERT INTO languages (code, name, native_name) VALUES
    ('fr', 'French', 'Français'),
    ('de', 'German', 'Deutsch'),
    ('ru', 'Russian', 'Русский');
```

### Using Service
```javascript
const languageService = require('./services/languageService');

await languageService.createLanguage({
  code: 'fr',
  name: 'French',
  native_name: 'Français',
  is_active: true,
});
```

---

## Testing

### Verify Migration Success
```sql
-- Check languages table
SELECT * FROM languages ORDER BY language_id;

-- Check users with their language
SELECT u.user_id, u.first_name, u.last_name, l.code, l.native_name 
FROM users u
JOIN languages l ON u.language_id = l.language_id
LIMIT 10;

-- Check providers with their language
SELECT p.provider_id, p.first_name, p.last_name, l.code, l.native_name 
FROM providers p
JOIN languages l ON p.language_id = l.language_id
LIMIT 10;
```

### Verify No Null Values
```sql
-- Should return 0
SELECT COUNT(*) FROM users WHERE language_id IS NULL;
SELECT COUNT(*) FROM providers WHERE language_id IS NULL;
```

---

## Important Notes

1. **Default Language:** Turkish (tr) is set as default for all new users and providers
2. **Foreign Key Constraint:** Users and providers cannot be assigned to non-existent languages
3. **ON DELETE RESTRICT:** Languages cannot be deleted if they are in use by any user or provider
4. **Active Languages:** Use `is_active` flag to hide languages without deleting them
5. **ISO 639-1 Codes:** The `code` field uses standard two-letter language codes
6. **Performance:** Indexes are created on `language_id` columns for fast queries

---

## Rollback

If you need to rollback the migration (remove language support):

**WARNING:** This will remove all language data!

```sql
-- See the commented ROLLBACK section in migration-add-languages.sql
```

---

## Files Created/Modified

### Created:
- `src/models/language.js` - Language model
- `src/services/languageService.js` - Language service layer
- `docs/migration-add-languages.sql` - Migration for existing databases
- `docs/languages-info.md` - This documentation

### Modified:
- `src/models/user.js` - Added language_id field
- `src/models/provider.js` - Added language_id field
- `src/models/index.js` - Added Language model and relationships
- `docs/db-schema-v1.sql` - Updated schema with languages table

---

## Support for Different Language Codes

If you need different language code standards:

- **ISO 639-1** (2 letters): en, tr, es (currently used)
- **ISO 639-2** (3 letters): eng, tur, spa
- **ISO 639-3** (3 letters, more specific): eng, tur, spa

To support multiple standards:
```sql
ALTER TABLE languages 
ADD COLUMN code_iso639_2 VARCHAR(3),
ADD COLUMN code_iso639_3 VARCHAR(3);
```

