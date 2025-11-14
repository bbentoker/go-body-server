# Reservation API Examples

## Quick Reference Guide

### Date/Time Format for `start_time`

The `start_time` parameter must be in **ISO 8601** format. Here are various ways to format it:

#### Format Examples:
```javascript
// Full ISO 8601 format with timezone (RECOMMENDED)
"2024-11-15T09:00:00Z"           // 9:00 AM UTC
"2024-11-15T14:30:00Z"           // 2:30 PM UTC
"2024-11-15T09:00:00+00:00"      // 9:00 AM UTC (alternative)
"2024-11-15T09:00:00-05:00"      // 9:00 AM EST (UTC-5)

// ISO format without timezone (assumes local server time)
"2024-11-15T09:00:00"
"2024-11-15T14:30:00"

// JavaScript Date object (in code)
new Date("2024-11-15T09:00:00Z").toISOString()
// Returns: "2024-11-15T09:00:00.000Z"
```

---

## 1. Create Reservation Examples

### Example 1: Basic Morning Appointment (9:00 AM)
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

### Example 2: Half-Hour Slot (9:30 AM)
```bash
curl -X POST http://localhost:3000/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 2,
    "provider_id": 1,
    "service_id": 2,
    "start_time": "2024-11-15T09:30:00Z"
  }'
```

### Example 3: Afternoon Appointment (2:00 PM)
```bash
curl -X POST http://localhost:3000/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 3,
    "provider_id": 2,
    "service_id": 1,
    "start_time": "2024-11-15T14:00:00Z",
    "notes": "Afternoon session"
  }'
```

### Example 4: Late Evening (8:00 PM - last valid slot)
```bash
curl -X POST http://localhost:3000/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "provider_id": 1,
    "service_id": 3,
    "start_time": "2024-11-15T20:00:00Z",
    "notes": "Evening appointment"
  }'
```

**Note:** If the service duration is 60 minutes or less, this will end at or before 9:00 PM (valid). If the service is longer, it will be rejected.

---

## 2. Get Reservations by Date Range Examples

### Example 1: Get Current Week's Reservations (No params)
```bash
# Returns Monday-Sunday of current week
curl -X GET http://localhost:3000/reservations/index
```

**Response:**
```json
{
  "date_range": {
    "start": "2024-11-11T00:00:00.000Z",
    "end": "2024-11-17T23:59:59.999Z"
  },
  "count": 5,
  "reservations": [...],
  "services": [
    {
      "service_id": 1,
      "name": "Deep Tissue Massage",
      "duration_minutes": 90,
      "price": "75.00",
      "is_active": true
    }
  ],
  "users": [
    {
      "user_id": 1,
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone_number": "+1234567890"
    }
  ]
}
```

**Note:** The response includes all active services and all users in addition to the filtered reservations.

### Example 2: Get Specific Week
```bash
# Get reservations for the week of Nov 13-19, 2024
curl -X GET "http://localhost:3000/reservations/index?start_date=2024-11-13&end_date=2024-11-19"
```

### Example 3: Get Entire Month
```bash
# Get all November 2024 reservations
curl -X GET "http://localhost:3000/reservations/index?start_date=2024-11-01&end_date=2024-11-30"
```

### Example 4: Get Week for Specific Provider
```bash
# Get current week's reservations for provider #2
curl -X GET "http://localhost:3000/reservations/index?provider_id=2"
```

### Example 5: Get Month for Specific User
```bash
# Get December 2024 reservations for user #1
curl -X GET "http://localhost:3000/reservations/index?start_date=2024-12-01&end_date=2024-12-31&user_id=1"
```

### Example 6: Combined Filters
```bash
# Get specific date range for a specific provider and user
curl -X GET "http://localhost:3000/reservations/index?start_date=2024-11-15&end_date=2024-11-20&provider_id=1&user_id=2"
```

---

## 3. Valid Time Slots

Reservations can **ONLY** start at these times:
```
09:00  09:30
10:00  10:30
11:00  11:30
12:00  12:30
13:00  13:30
14:00  14:30
15:00  15:30
16:00  16:30
17:00  17:30
18:00  18:30
19:00  19:30
20:00  20:30
```

❌ **Invalid start times:**
```
08:45  (before 9 AM)
09:15  (not on hour or half-hour)
09:20  (not on hour or half-hour)
21:00  (reservation would end after 9 PM)
```

---

## 4. Business Rules Examples

### Rule 1: No Past Dates
```javascript
// ✅ VALID
"start_time": "2024-11-15T09:00:00Z"  // Future date

// ❌ INVALID
"start_time": "2024-11-10T09:00:00Z"  // Past date (if today is after Nov 10)
"start_time": "2024-11-14T08:00:00Z"  // Earlier today (if current time is 10 AM)
```

### Rule 2: Time Slot Validation
```javascript
// ✅ VALID
"start_time": "2024-11-15T09:00:00Z"  // On the hour
"start_time": "2024-11-15T09:30:00Z"  // On the half-hour

// ❌ INVALID
"start_time": "2024-11-15T09:15:00Z"  // Not on hour/half-hour
"start_time": "2024-11-15T09:45:00Z"  // Not on hour/half-hour
```

### Rule 3: Business Hours
```javascript
// ✅ VALID (assuming 60-minute service)
"start_time": "2024-11-15T09:00:00Z"  // 9:00 AM - 10:00 AM
"start_time": "2024-11-15T20:00:00Z"  // 8:00 PM - 9:00 PM (ends exactly at 9 PM)

// ❌ INVALID
"start_time": "2024-11-15T08:30:00Z"  // Before 9 AM
"start_time": "2024-11-15T20:30:00Z"  // Would end at 9:30 PM (after 9 PM)
```

### Rule 4: 1-Hour Gap Between Reservations
```javascript
// Timeline for Provider #1:
// Existing: 9:00 AM - 10:30 AM

// ✅ VALID - Next reservation
"start_time": "2024-11-15T11:30:00Z"  // Starts 1 hour after previous ends

// ❌ INVALID - Too close
"start_time": "2024-11-15T11:00:00Z"  // Only 30 min gap
"start_time": "2024-11-15T10:30:00Z"  // No gap
```

---

## 5. Update Reservation Examples

### Example 1: Change Time
```bash
curl -X PUT http://localhost:3000/reservations/1 \
  -H "Content-Type: application/json" \
  -d '{
    "start_time": "2024-11-15T14:00:00Z"
  }'
```

### Example 2: Change Status
```bash
curl -X PUT http://localhost:3000/reservations/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed"
  }'
```

### Example 3: Change Service (recalculates end time)
```bash
curl -X PUT http://localhost:3000/reservations/1 \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": 2
  }'
```

---

## 6. Error Handling Examples

### Past Date Error
```json
{
  "error": "Cannot create reservations for past dates or times"
}
```

### Invalid Date Format Error
```json
{
  "error": "Invalid date format for start_time"
}
```

### Invalid Time Slot Error
```json
{
  "error": "Reservation time must be on the hour (e.g., 9:00) or half-hour (e.g., 9:30)"
}
```

### Business Hours Error
```json
{
  "error": "Reservations must start at 9:00 AM or later"
}
```
```json
{
  "error": "Reservations must end by 9:00 PM"
}
```

### Gap Violation Error
```json
{
  "error": "There must be at least 1 hour gap between reservations for this provider"
}
```

---

## 7. JavaScript Frontend Examples

### Using Fetch API
```javascript
// Create a reservation for tomorrow at 2:30 PM
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(14, 30, 0, 0);

const response = await fetch('http://localhost:3000/reservations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    user_id: 1,
    provider_id: 1,
    service_id: 1,
    start_time: tomorrow.toISOString(),
    notes: 'Afternoon appointment'
  })
});

const reservation = await response.json();
console.log(reservation);
```

### Get Current Week's Reservations
```javascript
const response = await fetch('http://localhost:3000/reservations/index');
const data = await response.json();

console.log(`Found ${data.count} reservations`);
console.log(`Week: ${data.date_range.start} to ${data.date_range.end}`);
console.log(`Available services: ${data.services.length}`);
console.log(`Total users: ${data.users.length}`);

data.reservations.forEach(res => {
  console.log(`- ${res.service.name} at ${res.start_time}`);
});

// Access all services for dropdown
const serviceOptions = data.services.map(s => ({
  id: s.service_id,
  name: s.name,
  price: s.price
}));

// Access all users
const userList = data.users.map(u => ({
  id: u.user_id,
  name: u.full_name
}));
```

### Get Custom Date Range
```javascript
const startDate = '2024-11-01';
const endDate = '2024-11-30';

const response = await fetch(
  `http://localhost:3000/reservations/index?start_date=${startDate}&end_date=${endDate}`
);
const data = await response.json();
console.log(`November has ${data.count} reservations`);
```

---

## 8. Testing Checklist

When testing the reservation API, verify:

- [ ] Cannot create reservation for past date
- [ ] Cannot create reservation for earlier time today
- [ ] Can create reservation for future date
- [ ] Can create reservation at 9:00 AM (start of day)
- [ ] Can create reservation at 8:00 PM (last valid slot for 1-hour service)
- [ ] Cannot create reservation before 9:00 AM
- [ ] Cannot create reservation that ends after 9:00 PM
- [ ] Cannot create reservation at 9:15 (not on hour/half-hour)
- [ ] Cannot create reservation 30 minutes after another ends (needs 1 hour gap)
- [ ] Can create reservation exactly 1 hour after another ends
- [ ] Cannot update reservation to past date
- [ ] Can update reservation time with same validations
- [ ] Can filter by date range
- [ ] Default date range is current week (Monday-Sunday)
- [ ] Can filter by provider and user

---

## Status Values

Available reservation statuses:
- `pending` - Initial state
- `confirmed` - Confirmed by provider/system
- `cancelled` - Cancelled
- `completed` - Service completed
- `no_show` - Client did not show up

Change status with PUT request:
```bash
curl -X PUT http://localhost:3000/reservations/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

