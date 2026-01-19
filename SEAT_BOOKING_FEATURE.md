# Seat Booking Management System - Feature Documentation

## Overview

A comprehensive admin panel for managing seat bookings with bulk operations, calendar view, and individual booking controls.

## Features Implemented

### 1. **Multi-User Selection**

- Admin can select multiple users for bulk booking
- Visual user cards with checkboxes
- Display selected users with badges
- Search and filter capabilities

### 2. **Weekday Selection**

- Select multiple weekdays (Monday through Friday)
- Checkbox interface for easy selection
- Automatically skips weekends in booking calendar

### 3. **Specific Day Pattern**

- Configure recurring bookings for specific days (e.g., every Wednesday)
- Dropdown selection for day patterns
- Can be combined with regular weekday selection

### 4. **Bulk Booking Creation**

- Automatically books seats for selected users
- Books for current month and next month (configurable date range)
- Smart seat allocation algorithm
- Validates capacity before booking
- Creates bookings marked as "booked_by_admin"

### 5. **Excel-Like Calendar Layout**

- **Header Row**: Displays month, date, and day name (e.g., "Mon (19 Jan)")
- **User Rows**: Each row represents a user with avatar and details
- **Booking Cells**:
  - **Green**: Booked seats (shows seat number)
  - **Grey**: Available slots
  - **Darker Grey**: Weekends (non-bookable)
- Sticky header and user column for easy navigation
- Responsive scrolling for large datasets

### 6. **Click-to-Book Individual Cells**

- Click any cell to toggle booking status
- Instant feedback with toast notifications
- Auto-refreshes calendar after changes
- Prevents double-booking

### 7. **Capacity Management**

- Validates against total available seats
- Prevents overbooking
- Shows real-time availability
- Displays capacity warnings

### 8. **Flexible Seat Allocation**

- Any table/seat can be assigned to any user
- Automatic seat number assignment
- Smart allocation algorithm finds first available seat
- Booking limit enforced globally, not per seat

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   └── seat-booking/
│   │       ├── page.tsx                  # Main booking management page
│   │       ├── booking-form.tsx          # Bulk booking configuration form
│   │       └── booking-calendar.tsx      # Excel-like calendar view
│   └── api/
│       └── (seat-booking)/
│           └── admin/
│               ├── bulk-book/
│               │   └── route.ts          # Bulk booking API endpoint
│               ├── toggle-booking/
│               │   └── route.ts          # Individual cell booking API
│               └── bookings-calendar/
│                   └── route.ts          # Calendar data API
```

## API Endpoints

### 1. `/api/admin/bulk-book` (POST)

Creates multiple bookings based on configuration.

**Request Body:**

```json
{
  "userIds": ["user1", "user2"],
  "weekdays": ["Mon", "Tue", "Wed"],
  "specificDay": "Wed",
  "startDate": "2026-01-19",
  "endDate": "2026-03-19"
}
```

**Response:**

```json
{
  "message": "Bulk booking completed successfully",
  "bookingsCreated": 45,
  "bookings": [...]
}
```

### 2. `/api/admin/toggle-booking` (POST)

Toggles booking for a specific user and date.

**Request Body:**

```json
{
  "userId": "user123",
  "date": "2026-01-20"
}
```

**Response:**

```json
{
  "message": "Booking created",
  "action": "booked",
  "booking": {...}
}
```

### 3. `/api/admin/bookings-calendar` (GET)

Retrieves calendar data for specified date range.

**Query Parameters:**

- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

**Response:**

```json
{
  "users": [...],
  "dates": ["2026-01-19", "2026-01-20", ...],
  "bookingMap": {
    "user123": {
      "2026-01-19": { "_id": "...", "seatNumber": 5, ... },
      "2026-01-20": null
    }
  }
}
```

## Components

### BookingForm Component

**Location:** `src/app/admin/seat-booking/booking-form.tsx`

**Props:**

- `onSuccess`: Callback function called after successful bulk booking

**Features:**

- Form validation using Zod
- Multi-user selection with visual feedback
- Weekday checkboxes
- Date range picker
- Loading states
- Error handling

### BookingCalendar Component

**Location:** `src/app/admin/seat-booking/booking-calendar.tsx`

**Props:**

- `startDate`: Calendar start date
- `endDate`: Calendar end date
- `refreshKey`: Key to trigger calendar refresh
- `onCellClick`: Callback for cell click events

**Features:**

- Excel-like grid layout
- Sticky headers and user column
- Color-coded cells (green/grey/dark grey)
- Hover effects
- Responsive design
- Auto-refresh on data changes

### Main Page Component

**Location:** `src/app/admin/seat-booking/page.tsx`

**Features:**

- Tabbed interface (Calendar View / Bulk Booking)
- Statistics cards showing:
  - Total seats available
  - Bookings today
  - Total users
- Date range selection
- Refresh button
- Legend for booking status colors

## Usage Guide

### Bulk Booking Workflow

1. **Navigate** to Admin > Seat Booking
2. **Switch** to "Bulk Booking" tab
3. **Select Users:**
   - Click on user cards to select/deselect
   - Multiple selections allowed
4. **Choose Weekdays:**
   - Check desired weekdays (Mon-Fri)
5. **Optional: Set Specific Day Pattern:**
   - Select a recurring day from dropdown
6. **Set Date Range:**
   - Choose start and end dates
   - Defaults to current date through 2 months ahead
7. **Submit:**
   - Click "Create Bulk Bookings"
   - View confirmation with number of bookings created

### Individual Booking Management

1. **Navigate** to Calendar View tab
2. **Select Date Range:**
   - Use date pickers to adjust visible range
3. **Click Cell:**
   - Click any grey cell to book
   - Click any green cell to cancel
4. **View Changes:**
   - Cell updates immediately
   - Toast notification confirms action

## Booking Rules

1. **Weekends**: Automatically excluded from bookings
2. **Capacity**: Cannot exceed total available seats per day
3. **Duplicates**: Prevents duplicate bookings for same user/date
4. **Seat Assignment**: Automatic allocation to first available seat
5. **Status**: Admin bookings marked as "booked_by_admin"

## Styling & Design

- **Modern UI**: Uses shadcn/ui components
- **Gradient Accents**: Primary color gradients throughout
- **Responsive**: Mobile-friendly design
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Color Scheme**:
  - Primary: Blue tones
  - Success: Green for booked
  - Neutral: Grey for available
  - Disabled: Dark grey for weekends

## Database Schema

### SeatBooking Document

```typescript
{
  seatId: string;
  seatNumber: number;
  userId: string;
  userName: string;
  avator: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: "booked" |
    "cancelled" |
    "booked_by_admin" |
    "cancelled_by_admin" |
    "not_came";
}
```

## Performance Considerations

- **Batch Operations**: Bulk booking uses insertMany for efficiency
- **Lean Queries**: Uses `.lean()` for read-only operations
- **Indexed Queries**: Queries on userId, startDate, endDate should be indexed
- **Frontend Caching**: Calendar data cached until refresh
- **Optimistic UI**: Immediate visual feedback on actions

## Future Enhancements

Potential improvements:

1. Export calendar to CSV/Excel
2. Email notifications for bookings
3. Recurring patterns (e.g., alternating weeks)
4. Team-based booking quotas
5. Booking history and analytics
6. Seat preferences per user
7. Bulk cancellation operations
8. Calendar print view

## Troubleshooting

### Common Issues

**Issue**: Bookings not showing in calendar

- **Solution**: Check date range, ensure dates are within selected range

**Issue**: Cannot create booking - "No seats available"

- **Solution**: Verify total seat capacity in Seat management, check if all seats are already booked

**Issue**: Bulk booking creates fewer bookings than expected

- **Solution**: Some dates may be fully booked or users may already have bookings

**Issue**: Weekend cells are clickable

- **Solution**: This is prevented in the code; ensure weekend detection logic is working

## Support

For issues or questions:

1. Check browser console for errors
2. Verify MongoDB connection
3. Ensure all dependencies are installed
4. Check API response in Network tab
