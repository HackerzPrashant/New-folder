# Campus Ride-Share

A MERN stack campus ride-sharing application for students.

## Overview
- **Purpose**: Safe ride-sharing platform for university students
- **Frontend**: React with Tailwind CSS (port 5000)
- **Backend**: Node.js/Express with MongoDB (port 3001)
- **Status**: Development environment configured for Replit

## Project Structure
```
campus-ride-share/
├── frontend/         # React frontend (create-react-app)
│   ├── src/
│   │   ├── App.jsx   # Main app component
│   │   └── services/ # API and Firebase services
│   └── public/
├── backend/          # Express API server
│   ├── server.js     # Main server file
│   ├── routes/       # API routes
│   ├── models/       # MongoDB models
│   └── middleware/   # Auth middleware
└── README.md
```

## Configuration
- Frontend runs on port 5000 (0.0.0.0)
- Backend runs on port 3001 (localhost)
- Frontend proxies API calls to backend
- Host checking disabled for Replit proxy compatibility

## Dependencies
- Firebase for authentication
- MongoDB/Mongoose for database
- Socket.io for real-time features
- Razorpay for payments
- Google Maps for location services

## Running the App
The Frontend workflow starts the React development server automatically.

## Recent Changes
- 2026-01-31: Initial Replit environment setup
  - Configured frontend on port 5000
  - Configured backend on port 3001
  - Set up host checking bypass for Replit proxy
