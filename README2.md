# Task Reminder System - Development Process

## Initial Phase

**Request**: Development of a custom task reminder system for the company was requested.

**Response**: MERN stack (MongoDB, Express.js, React.js, Node.js) was suggested because:
- Easy development
- Modern technologies
- Real-time updates
- Efficient database management

## Backend Development

### 1. Model Creation
**Request**: Creation of required models for the backend.

**Response**: Two main models were created:
- `User.js`: For user information
  - username (unique)
  - password (hashed)
  - name
  - role (user/admin)
  - createdAt

- `Task.js`: For task information
  - title
  - description
  - assignedTo (User reference)
  - createdBy (User reference)
  - status
  - dueDateTime
  - reminderDateTime
  - createdAt

### 2. Route Configuration
**Request**: Creation of API endpoints.

**Response**: Two main route groups were created:
- `userRoutes.js`: User operations
  - Registration
  - Login
  - JWT authentication

- `taskRoutes.js`: Task operations
  - CRUD operations
  - Task assignment
  - Status updates

## Frontend Development

### 1. Basic Structure
**Request**: Creation of user interface.

**Response**: Using Material-UI:
- Login page
- Dashboard
- Task cards
- Modals were created

### 2. Reminder System
**Request**: Addition of task reminder feature.

**Response**: 
- Reminder window
- Postpone options
- Complete/Cancel buttons were added

## Encountered Problems and Solutions

### 1. Timezone Issue
**Problem**: There was a 3-hour difference between selected time and displayed time.

**Solution**: 
```javascript
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().slice(0, 16);
};
```

### 2. Reminder Window Issue
**Problem**: Complete/Cancel buttons weren't working and window kept reopening.

**Solution**:
- Fixed state management
- Task status updated instantly
- Removed second precision

### 3. Multiple Task Reminders
**Problem**: Wrong task reminder was being shown.

**Solution**:
- Tasks sorted by date
- Added active reminder check
```javascript
const sortedTasks = [...tasks].sort((a, b) => 
  new Date(a.reminderDateTime) - new Date(b.reminderDateTime)
);
```

## Final Improvements

### 1. Activity Log
**Request**: Display of all activities.

**Response**: 
- Added activity log to right panel
- Custom icons for each operation
- Chronological ordering

### 2. Time Management
**Request**: Minute-based control was requested.

**Response**:
- Removed second precision
- Check at the start of minutes
- Dynamic clock display

## Startup Instructions

For each session:
1. Make sure MongoDB service is running
2. Start backend: `node server.js`
3. Start frontend: `npm start`
4. Go to `http://10.102.37.150:3000`

## Important Notes

- System won't work without backend and MongoDB running
- All changes appear in activity log
- Reminders are checked at the start of minutes
- Timezone settings configured for Turkey 