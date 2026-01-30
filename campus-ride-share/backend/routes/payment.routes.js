// backend/routes/payment.routes.js
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Ride = require('../models/Ride');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth.middleware');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order for ride payment
router.post('/order', authMiddleware, async (req, res) => {
  try {
    const { rideId } = req.body;

    // Fetch ride details
    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Verify that the user is the rider
    if (ride.rider.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Check if payment already completed
    if (ride.payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this ride'
      });
    }

    // Create Razorpay order
    const options = {
      amount: ride.fare.finalAmount * 100, // Amount in paise
      currency: 'INR',
      receipt: `ride_${rideId}_${Date.now()}`,
      notes: {
        rideId: rideId,
        riderId: req.userId,
        pickupAddress: ride.pickup.address,
        dropoffAddress: ride.dropoff.address
      }
    };

    const order = await razorpay.orders.create(options);

    // Update ride with Razorpay order ID
    ride.payment.razorpayOrderId = order.id;
    await ride.save();

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        ride: {
          id: ride._id,
          pickup: ride.pickup.address,
          dropoff: ride.dropoff.address,
          fare: ride.fare
        }
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order'
    });
  }
});

// Verify Razorpay payment
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      rideId
    } = req.body;

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Update ride payment status
    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    ride.payment.status = 'completed';
    ride.payment.razorpayPaymentId = razorpayPaymentId;
    ride.payment.razorpaySignature = razorpaySignature;
    ride.payment.paidAt = new Date();
    await ride.save();

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        rideId: ride._id,
        paymentStatus: ride.payment.status
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
});

// Get payment history for user
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const rides = await Ride.find({
      $or: [
        { rider: req.userId },
        { captain: req.userId }
      ],
      'payment.status': 'completed'
    })
      .sort({ 'payment.paidAt': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('rider', 'firstName lastName profileImage')
      .populate('captain', 'firstName lastName profileImage')
      .populate('vehicle');

    const total = await Ride.countDocuments({
      $or: [
        { rider: req.userId },
        { captain: req.userId }
      ],
      'payment.status': 'completed'
    });

    res.json({
      success: true,
      data: {
        payments: rides.map(ride => ({
          rideId: ride._id,
          date: ride.payment.paidAt,
          amount: ride.fare.finalAmount,
          pickup: ride.pickup.address,
          dropoff: ride.dropoff.address,
          rider: ride.rider,
          captain: ride.captain,
          vehicle: ride.vehicle,
          paymentMethod: ride.payment.method,
          transactionId: ride.payment.razorpayPaymentId
        })),
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: rides.length
        }
      }
    });
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
});

// Request payout for captain earnings
router.post('/payout/request', authMiddleware, async (req, res) => {
  try {
    const { amount, bankAccountId } = req.body;

    const user = await User.findById(req.userId);

    if (!user.captainVerified) {
      return res.status(403).json({
        success: false,
        message: 'Captain verification required'
      });
    }

    if (user.earnings.available < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Minimum payout amount
    if (amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum payout amount is ₹100'
      });
    }

    // In production, integrate with Razorpay Payouts API
    // For now, just update the user's balance

    user.earnings.available -= amount;
    user.earnings.withdrawn += amount;
    await user.save();

    res.json({
      success: true,
      message: 'Payout request submitted successfully',
      data: {
        amount: amount,
        status: 'processing',
        estimatedTransferDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days
      }
    });
  } catch (error) {
    console.error('Payout request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payout request'
    });
  }
});

// Get earnings summary for captain
router.get('/earnings', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user.captainVerified) {
      return res.status(403).json({
        success: false,
        message: 'Captain verification required'
      });
    }

    // Get ride statistics
    const completedRides = await Ride.find({
      captain: req.userId,
      status: 'completed',
      'payment.status': 'completed'
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRides = completedRides.filter(
      ride => ride.completedAt >= today
    );

    const todayEarnings = todayRides.reduce(
      (sum, ride) => sum + ride.calculateCaptainEarnings(),
      0
    );

    res.json({
      success: true,
      data: {
        total: user.earnings.total,
        available: user.earnings.available,
        withdrawn: user.earnings.withdrawn,
        todayEarnings: todayEarnings,
        todayRides: todayRides.length,
        totalRides: completedRides.length
      }
    });
  } catch (error) {
    console.error('Earnings fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch earnings'
    });
  }
});

module.exports = router;