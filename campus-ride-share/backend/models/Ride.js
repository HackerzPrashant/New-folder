// backend/models/Ride.js
const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  // Ride Participants
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null
  },

  // Location Details
  pickup: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      required: true
    },
    landmark: String
  },
  dropoff: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      required: true
    },
    landmark: String
  },

  // Route Information
  distance: {
    type: Number, // in kilometers
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  route: {
    polyline: String, // Encoded polyline from Google Maps
    waypoints: [
      {
        location: {
          type: [Number] // [longitude, latitude]
        },
        timestamp: Date
      }
    ]
  },

  // Pricing
  fare: {
    baseFare: {
      type: Number,
      required: true
    },
    platformFee: {
      type: Number,
      required: true
    },
    gst: {
      type: Number,
      required: true
    },
    total: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      default: 0
    },
    finalAmount: {
      type: Number,
      required: true
    }
  },

  // Payment
  payment: {
    method: {
      type: String,
      enum: ['cash', 'razorpay', 'stripe', 'wallet'],
      default: 'razorpay'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    paidAt: Date
  },

  // Ride Status
  status: {
    type: String,
    enum: [
      'requesting',      // Rider has requested, waiting for captain
      'accepted',        // Captain accepted, on the way to pickup
      'arrived',         // Captain arrived at pickup
      'started',         // Ride in progress
      'completed',       // Ride completed successfully
      'cancelled_rider', // Cancelled by rider
      'cancelled_captain', // Cancelled by captain
      'expired'          // No captain found within timeout
    ],
    default: 'requesting'
  },

  // Timestamps
  requestedAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: Date,
  arrivedAt: Date,
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date,

  // OTP for ride verification
  otp: {
    type: String,
    select: false
  },
  otpVerified: {
    type: Boolean,
    default: false
  },

  // Ratings and Reviews
  riderRating: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    ratedAt: Date
  },
  captainRating: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    ratedAt: Date
  },

  // Additional Info
  passengerCount: {
    type: Number,
    default: 1,
    min: 1
  },
  specialRequests: String,
  cancellationReason: String,

  // Nearby captains who were notified
  notifiedCaptains: [
    {
      captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      notifiedAt: Date,
      viewed: {
        type: Boolean,
        default: false
      },
      viewedAt: Date
    }
  ],

  // Ride expiry (auto-cancel if no captain accepts within 5 minutes)
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
rideSchema.index({ rider: 1, status: 1 });
rideSchema.index({ captain: 1, status: 1 });
rideSchema.index({ status: 1, expiresAt: 1 });
rideSchema.index({ 'pickup.coordinates': '2dsphere' });
rideSchema.index({ 'dropoff.coordinates': '2dsphere' });
rideSchema.index({ createdAt: -1 });

// Generate 4-digit OTP
rideSchema.methods.generateOTP = function() {
  this.otp = Math.floor(1000 + Math.random() * 9000).toString();
  return this.otp;
};

// Verify OTP
rideSchema.methods.verifyOTP = function(otp) {
  if (this.otp === otp) {
    this.otpVerified = true;
    return true;
  }
  return false;
};

// Calculate captain earnings (90% of fare after platform fee)
rideSchema.methods.calculateCaptainEarnings = function() {
  const fareAfterPlatformFee = this.fare.baseFare;
  return Math.round(fareAfterPlatformFee * 0.90);
};

// Cancel ride
rideSchema.methods.cancelRide = async function(cancelledBy, reason) {
  if (this.status === 'completed') {
    throw new Error('Cannot cancel completed ride');
  }
  
  this.status = cancelledBy === 'rider' ? 'cancelled_rider' : 'cancelled_captain';
  this.cancellationReason = reason;
  this.cancelledAt = new Date();
  
  // Refund logic if payment was made
  if (this.payment.status === 'completed') {
    this.payment.status = 'refunded';
  }
  
  return await this.save();
};

// Complete ride
rideSchema.methods.completeRide = async function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return await this.save();
};

// Static method to find active rides for a user
rideSchema.statics.findActiveRide = async function(userId, userRole) {
  const query = {
    status: { $in: ['requesting', 'accepted', 'arrived', 'started'] }
  };
  
  if (userRole === 'rider') {
    query.rider = userId;
  } else {
    query.captain = userId;
  }
  
  return await this.findOne(query)
    .populate('rider', 'firstName lastName phone profileImage rating')
    .populate('captain', 'firstName lastName phone profileImage rating vehicle')
    .populate('vehicle');
};

// Static method to find nearby ride requests for captains
rideSchema.statics.findNearbyRequests = async function(longitude, latitude, maxDistance = 5000) {
  return await this.find({
    status: 'requesting',
    expiresAt: { $gt: new Date() },
    'pickup.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    }
  })
  .populate('rider', 'firstName lastName phone profileImage rating')
  .sort({ requestedAt: 1 });
};

// Auto-expire rides after 5 minutes if no captain accepts
rideSchema.pre('save', function(next) {
  if (this.status === 'requesting' && new Date() > this.expiresAt) {
    this.status = 'expired';
  }
  next();
});

const Ride = mongoose.model('Ride', rideSchema);

module.exports = Ride;