// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters'],
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@(student\.)?youruniversity\.edu$/,
      'Please use a valid university email address'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number']
  },
  profileImage: {
    type: String,
    default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
  },

  // Authentication
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    select: false,
    minlength: [8, 'Password must be at least 8 characters']
  },

  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  collegeIdImage: {
    type: String,
    required: [true, 'College ID photo is required for verification']
  },
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true
  },
  department: {
    type: String,
    required: true
  },
  graduationYear: {
    type: Number,
    required: true
  },

  // Role Management
  role: {
    type: String,
    enum: ['rider', 'captain'],
    default: 'rider'
  },
  isCaptainActive: {
    type: Boolean,
    default: false
  },

  // Captain-specific fields
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  captainVerified: {
    type: Boolean,
    default: false
  },
  drivingLicense: {
    number: String,
    image: String,
    expiryDate: Date
  },

  // Location
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    address: String,
    lastUpdated: Date
  },

  // Ratings and Stats
  rating: {
    average: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  totalRides: {
    asRider: {
      type: Number,
      default: 0
    },
    asCaptain: {
      type: Number,
      default: 0
    }
  },
  earnings: {
    total: {
      type: Number,
      default: 0
    },
    available: {
      type: Number,
      default: 0
    },
    withdrawn: {
      type: Number,
      default: 0
    }
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: String,

  // Socket ID for real-time communication
  socketId: {
    type: String,
    select: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ studentId: 1 });
userSchema.index({ 'currentLocation.coordinates': '2dsphere' });
userSchema.index({ role: 1, isCaptainActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to toggle captain mode
userSchema.methods.toggleCaptainMode = async function(active) {
  if (!this.captainVerified) {
    throw new Error('Captain verification required');
  }
  if (!this.vehicle) {
    throw new Error('Vehicle registration required');
  }
  this.isCaptainActive = active;
  this.role = active ? 'captain' : 'rider';
  return await this.save();
};

// Method to update location
userSchema.methods.updateLocation = async function(longitude, latitude, address) {
  this.currentLocation = {
    type: 'Point',
    coordinates: [longitude, latitude],
    address: address || this.currentLocation.address,
    lastUpdated: new Date()
  };
  return await this.save();
};

// Static method to find nearby captains
userSchema.statics.findNearbyCaptains = async function(longitude, latitude, maxDistance = 5000) {
  return await this.find({
    role: 'captain',
    isCaptainActive: true,
    isVerified: true,
    isBanned: false,
    'currentLocation.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    }
  }).populate('vehicle');
};

const User = mongoose.model('User', userSchema);

module.exports = User;