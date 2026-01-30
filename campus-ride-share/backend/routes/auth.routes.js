// backend/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth.middleware');

// Initialize Firebase Admin (add this to config/firebase.js in production)
const serviceAccount = require('../config/firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Register new user
router.post('/register', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      studentId,
      department,
      graduationYear,
      collegeIdImage,
      firebaseUid
    } = req.body;

    // Validate university email domain
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(student\.)?youruniversity\.edu$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please use your university email address'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }, { studentId }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email, phone, or student ID already exists'
      });
    }

    // Verify Firebase token
    let firebaseUser;
    if (firebaseUid) {
      try {
        firebaseUser = await admin.auth().getUser(firebaseUid);
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Invalid Firebase authentication'
        });
      }
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      studentId,
      department,
      graduationYear,
      collegeIdImage,
      firebaseUid: firebaseUser ? firebaseUser.uid : null,
      profileImage: firebaseUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
    });

    await user.save();

    // Generate token (or use Firebase token)
    const token = firebaseUid; // In production, generate JWT

    res.status(201).json({
      success: true,
      message: 'Registration successful. Awaiting verification.',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          profileImage: user.profileImage,
          isVerified: user.isVerified,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
});

// Login with Firebase
router.post('/login/firebase', async (req, res) => {
  try {
    const { idToken } = req.body;

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;

    // Find user by Firebase UID
    let user = await User.findOne({ firebaseUid }).populate('vehicle');

    if (!user) {
      // Try to find by email
      user = await User.findOne({ email: decodedToken.email }).populate('vehicle');
      
      if (user) {
        // Link Firebase UID to existing account
        user.firebaseUid = firebaseUid;
        await user.save();
      } else {
        return res.status(404).json({
          success: false,
          message: 'User not found. Please register first.',
          needsRegistration: true
        });
      }
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: `Account banned: ${user.banReason}`
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          profileImage: user.profileImage,
          isVerified: user.isVerified,
          role: user.role,
          isCaptainActive: user.isCaptainActive,
          captainVerified: user.captainVerified,
          vehicle: user.vehicle,
          rating: user.rating,
          totalRides: user.totalRides
        },
        token: idToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('vehicle')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // Clear socket connection
    await User.findByIdAndUpdate(req.userId, {
      socketId: null,
      isCaptainActive: false
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// Verify phone number (for OTP verification)
router.post('/verify-phone', authMiddleware, async (req, res) => {
  try {
    const { phone } = req.body;

    // In production, send OTP via SMS service (Twilio, Firebase)
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Store OTP temporarily (use Redis in production)
    // For now, just send it in response (INSECURE - for development only)

    res.json({
      success: true,
      message: 'OTP sent successfully',
      otp: otp // Remove this in production
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
});

module.exports = router;