# Task Reminder System

This project is a task reminder system developed using the MERN stack (MongoDB, Express.js, React.js, Node.js).

## Technologies

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication

### Frontend
- React.js
- Material-UI
- Axios
- React Router

## Features

### User Management
- User registration and login
- JWT-based authentication
- User session management

### Task Management
- Task creation
- Task editing
- Task deletion
- Task details viewing
- Task card view

### Reminder System
- Set reminder time for tasks
- Automatic reminder when due
- Reminder options:
  - Complete
  - Cancel
  - Postpone
    - 5 minutes
    - 10 minutes
    - 15 minutes
    - 30 minutes
    - 1 hour
    - Tomorrow
    - Custom date/time

### Activity Tracking
- Activity history in right panel
- Icons for different activity types:
  - Reminder notifications
  - Task creation
  - Task completion
  - Task postponement
  - Reminder cancellation

### Time Management
- Live clock display in top right corner
- Minute-based reminder system
- Timezone compatible operation

## Technical Details

### Backend Structure
- Models:
  - User Model (user information)
  - Task Model (task details)
- Routes:
  - User Routes (authentication)
  - Task Routes (CRUD operations)

### Frontend Structure
- Pages:
  - Login
  - Dashboard
- Components:
  - Task Cards
  - Task Creation Modal
  - Task Detail Modal
  - Reminder Dialog
  - Activity Log Sidebar

## Installation

1. To start the Backend:
```bash
cd TaskRemainder
node server.js
```

2. To start the Frontend:
```bash
cd TaskRemainder/client
npm start
```

3. Make sure MongoDB is running:
- Check if MongoDB is running in Windows Services

4. Open the application in browser:
- If not automatic: http://10.102.37.150:3000

## Issues Resolved During Development

1. Timezone Issues:
- Display problems due to time differences
- Reminder scheduling issues

2. Reminder System Improvements:
- Removed second precision
- Added minute-based control system
- Fixed multiple task reminder issues

3. UI/UX Improvements:
- Added activity log sidebar
- Added dynamic clock display
- Improved task card view

## Notes

- Frontend won't be fully functional without the backend running
- Backend cannot start without MongoDB connection
- Both services (backend and frontend) must be running 