// // backend/server.js
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const http = require('http');
// const socketIO = require('socket.io');
// const dotenv = require('dotenv');

// // Load environment variables
// dotenv.config();

// // Import routes
// const authRoutes = require('./routes/auth.routes');
// const userRoutes = require('./routes/user.routes');
// const rideRoutes = require('./routes/ride.routes');
// const paymentRoutes = require('./routes/payment.routes');

// // Import socket service
// const initializeSocket = require('./services/socket.service');

// // Create Express app
// const app = express();
// const server = http.createServer(app);

// // Initialize Socket.IO
// const io = socketIO(server, {
//   cors: {
//     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//     methods: ['GET', 'POST'],
//     credentials: true
//   }
// });

// // Middleware
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true
// }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Request logging middleware
// app.use((req, res, next) => {
//   console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
//   next();
// });

// // Database connection
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-rideshare', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
// .then(() => console.log('✅ MongoDB connected successfully'))
// .catch(err => console.error('❌ MongoDB connection error:', err));

// // Initialize Socket.IO handlers
// initializeSocket(io);

// // Make io accessible to routes
// app.set('io', io);

// // Health check route
// app.get('/health', (req, res) => {
//   res.json({
//     status: 'OK',
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime(),
//     mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
//   });
// });

// // API Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/rides', rideRoutes);
// app.use('/api/payments', paymentRoutes);

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found'
//   });
// });

// // Global error handler
// app.use((err, req, res, next) => {
//   console.error('Error:', err);
  
//   res.status(err.status || 500).json({
//     success: false,
//     message: err.message || 'Internal server error',
//     ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
//   });
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
//   console.log(`📡 Socket.IO ready for real-time connections`);
//   console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
// });

// // Graceful shutdown
// process.on('SIGTERM', () => {
//   console.log('SIGTERM signal received: closing HTTP server');
//   server.close(() => {
//     console.log('HTTP server closed');
//     mongoose.connection.close(false, () => {
//       console.log('MongoDB connection closed');
//       process.exit(0);
//     });
//   });
// });

// module.exports = { app, server, io };
// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIO(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// --- DATABASE CONNECTION ---
// Using a fallback local URI if .env is not set up yet
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus-rideshare';
mongoose.connect(mongoURI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// --- BYPASS SECTION: MOCK ROUTES ---
// Instead of requiring empty files, we define simple routes here for testing
const router = express.Router();

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        message: 'Bypass active - Internal routes working'
    });
});

// Mocking the API structure so your frontend doesn't 404
app.use('/api/auth', router.get('/test', (req, res) => res.json({ msg: "Auth bypass working" })));
app.use('/api/users', router.get('/test', (req, res) => res.json({ msg: "User bypass working" })));
app.use('/api/rides', router.get('/test', (req, res) => res.json({ msg: "Ride bypass working" })));

// --- TEMPORARY SOCKET HANDLER ---
io.on('connection', (socket) => {
    console.log('👤 New client connected:', socket.id);
    socket.on('disconnect', () => console.log('👤 Client disconnected'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, 'localhost', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`👉 Test the health check: http://localhost:${PORT}/health`);
});