// backend/routes/user.routes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const { authMiddleware } = require('../middleware/auth.middleware');

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
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

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, phone, profileImage } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        firstName,
        lastName,
        phone,
        profileImage
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
});

// Toggle captain mode
router.post('/toggle-captain', authMiddleware, async (req, res) => {
  try {
    const { active } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.toggleCaptainMode(active);

    res.json({
      success: true,
      message: `Captain mode ${active ? 'activated' : 'deactivated'}`,
      data: {
        role: user.role,
        isCaptainActive: user.isCaptainActive
      }
    });
  } catch (error) {
    console.error('Toggle captain error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to toggle captain mode'
    });
  }
});

// Register vehicle
router.post('/vehicle/register', authMiddleware, async (req, res) => {
  try {
    const vehicleData = {
      ...req.body,
      owner: req.userId
    };

    // Check if user already has a vehicle
    const existingVehicle = await Vehicle.findOne({ owner: req.userId });
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle already registered. Please update existing vehicle.'
      });
    }

    const vehicle = new Vehicle(vehicleData);
    await vehicle.save();

    // Update user with vehicle reference
    await User.findByIdAndUpdate(req.userId, { vehicle: vehicle._id });

    res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully. Awaiting verification.',
      data: { vehicle }
    });
  } catch (error) {
    console.error('Vehicle registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to register vehicle'
    });
  }
});

module.exports = router;