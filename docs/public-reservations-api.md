# Public Reservations API Documentation

## Overview
This endpoint provides public access to reservation data without exposing sensitive user information. It's designed for public-facing calendars, availability displays, or scheduling interfaces.

---

## Endpoint

### Get Public Reservations by Date Range
**Endpoint:** `GET /reservations/public`

**Access:** Public (no authentication required)

**Description:** Returns sanitized reservation data for confirmed and completed reservations only, without exposing user personal information.

---

## Query Parameters

| Parameter   | Type   | Required | Description                                      |
|-------------|--------|----------|--------------------------------------------------|
| start_date  | String | No       | Start date in ISO format (e.g., "2024-11-13")   |
| end_date    | String | No       | End date in ISO format (e.g., "2024-11-19")     |
| provider_id | Number | No       | Filter by specific provider ID                   |

**Note:** If `start_date` and `end_date` are not provided, returns current week's reservations (Monday to Sunday).

---

## Example Requests

```bash
# Get current week's public reservations
GET /reservations/public

# Get specific date range
GET /reservations/public?start_date=2024-11-13&end_date=2024-11-19

# Get reservations for specific provider
GET /reservations/public?provider_id=1

# Get specific provider's reservations for a date range
GET /reservations/public?start_date=2024-11-01&end_date=2024-11-30&provider_id=2
```

---

## Response Structure

```json
{
  "date_range": {
    "start": "2024-11-11T00:00:00.000Z",
    "end": "2024-11-17T23:59:59.999Z"
  },
  "count": 3,
  "reservations": [
    {
      "reservation_id": 1,
      "provider_id": 1,
      "service_id": 1,
      "start_time": "2024-11-13T09:00:00.000Z",
      "end_time": "2024-11-13T10:30:00.000Z",
      "status": "confirmed",
      "provider": {
        "provider_id": 1,
        "first_name": "Jane",
        "last_name": "Smith",
        "title": "Senior Therapist"
      },
      "service": {
        "service_id": 1,
        "name": "Deep Tissue Massage",
        "description": "Therapeutic massage targeting deep muscle layers",
        "duration_minutes": 90,
        "price": "75.00"
      }
    }
  ],
  "services": [
    {
      "service_id": 1,
      "name": "Deep Tissue Massage",
      "description": "Therapeutic massage targeting deep muscle layers",
      "duration_minutes": 90,
      "price": "75.00"
    },
    {
      "service_id": 2,
      "name": "Swedish Massage",
      "description": "Relaxing full body massage",
      "duration_minutes": 60,
      "price": "60.00"
    }
  ]
}
```

---

## Data Sanitization

### What's Included ✅
- Reservation ID
- Provider ID and basic info (first name, last name, title)
- Service details (name, description, duration, price)
- Start and end times
- Status (only confirmed/completed)

### What's Excluded ❌
- **User Information** (user_id, email, phone, personal details)
- **Reservation Notes** (private notes)
- **Provider Email/Phone** (contact information)
- **Provider Bio** (internal information)
- **Total Price** (may differ from service price due to discounts)
- **Pending/Cancelled Reservations** (only confirmed and completed shown)

---

## Differences from `/reservations/index`

| Feature              | `/reservations/index`              | `/reservations/public`                    |
|----------------------|-----------------------------------|-------------------------------------------|
| Authentication       | Required (internal use)           | None (public access)                      |
| User Data            | Full user details returned        | ❌ No user data                          |
| All Users List       | ✅ Returns all users              | ❌ Not included                          |
| Reservation Statuses | All statuses                      | Only confirmed & completed                |
| Provider Details     | Full provider data                | Basic info only (name, title)             |
| Notes                | ✅ Included                       | ❌ Hidden                                |
| User Filtering       | ✅ Can filter by user_id          | ❌ No user filtering                     |

---

## Use Cases

### 1. Public Booking Calendar
Display available time slots to potential clients:

```javascript
const response = await fetch('/reservations/public?provider_id=1&start_date=2024-11-13&end_date=2024-11-19');
const data = await response.json();

// Show busy times on calendar
data.reservations.forEach(reservation => {
  markTimeAsBusy(reservation.start_time, reservation.end_time);
});
```

### 2. Provider Availability Display
Show when providers are busy without exposing client details:

```javascript
const response = await fetch('/reservations/public?start_date=2024-11-13&end_date=2024-11-13');
const { reservations } = await response.json();

// Group by provider
const providerSchedule = reservations.reduce((acc, res) => {
  if (!acc[res.provider_id]) {
    acc[res.provider_id] = [];
  }
  acc[res.provider_id].push({
    from: res.start_time,
    to: res.end_time,
    service: res.service.name
  });
  return acc;
}, {});
```

### 3. Service Availability Widget
Embed on public website to show service availability:

```html
<div id="availability-widget"></div>

<script>
  async function loadAvailability() {
    const response = await fetch('/reservations/public');
    const { reservations, services } = await response.json();
    
    // Display services and their next available times
    services.forEach(service => {
      const serviceTimes = reservations
        .filter(r => r.service_id === service.service_id)
        .map(r => ({ start: r.start_time, end: r.end_time }));
      
      displayServiceAvailability(service, serviceTimes);
    });
  }
</script>
```

---

## Security Considerations

### Privacy Protection
- **No User PII**: User personal information is completely excluded
- **No Contact Info**: Provider email and phone numbers are hidden
- **No Internal Notes**: Private notes between staff and clients are excluded
- **Status Filtering**: Only confirmed/completed reservations are shown (not pending/cancelled)

### Rate Limiting Recommended
Since this is a public endpoint, consider implementing rate limiting:

```javascript
// Example with express-rate-limit
const rateLimit = require('express-rate-limit');

const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

router.get('/public', publicApiLimiter, reservationController.getPublicReservationsByDateRange);
```

---

## CORS Configuration

If exposing this endpoint to external domains, configure CORS appropriately:

```javascript
// In app.js
const cors = require('cors');

app.use('/reservations/public', cors({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
  methods: ['GET'],
}));
```

---

## Response Time Optimization

### Caching Strategy
Consider caching public reservation data since it changes infrequently:

```javascript
// Example with redis
const redis = require('redis');
const client = redis.createClient();

async function getPublicReservationsWithCache(startDate, endDate, providerId) {
  const cacheKey = `public_reservations:${startDate}:${endDate}:${providerId || 'all'}`;
  
  // Try cache first
  const cached = await client.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from database
  const data = await getPublicReservations(startDate, endDate, providerId);
  
  // Cache for 5 minutes
  await client.setex(cacheKey, 300, JSON.stringify(data));
  
  return data;
}
```

---

## Error Responses

### 400 Bad Request - Invalid Date Format
```json
{
  "error": "Invalid date format"
}
```

### 400 Bad Request - Invalid Date Range
```json
{
  "error": "start_date must be before or equal to end_date"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch reservations"
}
```

---

## Example Integration: React Calendar

```jsx
import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';

function PublicAvailabilityCalendar({ providerId }) {
  const [busyTimes, setBusyTimes] = useState([]);
  
  useEffect(() => {
    async function fetchReservations() {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // Next 30 days
      
      const response = await fetch(
        `/reservations/public?` +
        `start_date=${startDate.toISOString().split('T')[0]}&` +
        `end_date=${endDate.toISOString().split('T')[0]}&` +
        `provider_id=${providerId}`
      );
      
      const data = await response.json();
      setBusyTimes(data.reservations);
    }
    
    fetchReservations();
  }, [providerId]);
  
  function isTimeBusy(date, time) {
    const checkTime = new Date(date);
    checkTime.setHours(time.split(':')[0], time.split(':')[1]);
    
    return busyTimes.some(reservation => {
      const start = new Date(reservation.start_time);
      const end = new Date(reservation.end_time);
      return checkTime >= start && checkTime < end;
    });
  }
  
  return (
    <div>
      <Calendar 
        tileClassName={({ date }) => {
          // Mark dates with reservations
          const hasReservation = busyTimes.some(r => 
            new Date(r.start_time).toDateString() === date.toDateString()
          );
          return hasReservation ? 'has-reservation' : null;
        }}
      />
      <TimeSlotSelector 
        busyTimes={busyTimes}
        isTimeBusy={isTimeBusy}
      />
    </div>
  );
}
```

---

## Summary

The `/reservations/public` endpoint provides a secure, privacy-focused way to expose reservation data for public consumption. It's ideal for:

- Public booking calendars
- Availability displays
- Service scheduling widgets
- Provider busy-time indicators

All while protecting user privacy and internal business information.

