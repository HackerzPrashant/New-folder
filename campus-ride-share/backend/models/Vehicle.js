// backend/models/Vehicle.js
const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  // Owner Information
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Vehicle Details
  vehicleType: {
    type: String,
    enum: ['bike', 'scooter', 'car', 'auto'],
    required: [true, 'Vehicle type is required']
  },
  brand: {
    type: String,
    required: [true, 'Vehicle brand is required'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Vehicle model is required'],
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: [2000, 'Vehicle must be from year 2000 or later'],
    max: [new Date().getFullYear() + 1, 'Invalid vehicle year']
  },
  color: {
    type: String,
    required: true,
    trim: true
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    uppercase: true,
    match: [/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/, 'Invalid registration number format']
  },

  // Capacity
  capacity: {
    type: Number,
    required: true,
    min: [1, 'Capacity must be at least 1'],
    max: [7, 'Maximum capacity is 7 passengers']
  },

  // Documents
  registrationCertificate: {
    image: {
      type: String,
      required: true
    },
    expiryDate: {
      type: Date,
      required: true
    }
  },
  insurance: {
    policyNumber: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    expiryDate: {
      type: Date,
      required: true
    }
  },
  pollutionCertificate: {
    image: String,
    expiryDate: Date
  },

  // Vehicle Images
  images: {
    front: {
      type: String,
      required: true
    },
    back: String,
    side: String,
    interior: String
  },

  // Features
  features: {
    ac: {
      type: Boolean,
      default: false
    },
    musicSystem: {
      type: Boolean,
      default: false
    },
    helmetProvided: {
      type: Boolean,
      default: false // For bikes/scooters
    }
  },

  // Pricing
  baseFare: {
    type: Number,
    required: true,
    min: [0, 'Base fare cannot be negative']
  },
  perKmRate: {
    type: Number,
    required: true,
    min: [0, 'Per km rate cannot be negative']
  },

  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationNotes: String,

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  currentStatus: {
    type: String,
    enum: ['available', 'on_ride', 'offline', 'maintenance'],
    default: 'offline'
  },

  // Stats
  totalRides: {
    type: Number,
    default: 0
  },
  totalDistance: {
    type: Number,
    default: 0 // in kilometers
  },
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
  }
}, {
  timestamps: true
});

// Indexes
vehicleSchema.index({ owner: 1 });
vehicleSchema.index({ registrationNumber: 1 });
vehicleSchema.index({ isVerified: 1, isActive: 1 });

// Virtual for full vehicle name
vehicleSchema.virtual('fullName').get(function() {
  return `${this.brand} ${this.model} (${this.year})`;
});

// Method to check if documents are valid
vehicleSchema.methods.areDocumentsValid = function() {
  const now = new Date();
  
  const rcValid = this.registrationCertificate.expiryDate > now;
  const insuranceValid = this.insurance.expiryDate > now;
  const pcValid = !this.pollutionCertificate.expiryDate || 
                   this.pollutionCertificate.expiryDate > now;
  
  return rcValid && insuranceValid && pcValid;
};

// Method to calculate fare
vehicleSchema.methods.calculateFare = function(distance) {
  // distance in kilometers
  const fare = this.baseFare + (distance * this.perKmRate);
  
  // Platform fee (10%)
  const platformFee = fare * 0.10;
  
  // GST (18% on platform fee)
  const gst = platformFee * 0.18;
  
  return {
    baseFare: Math.round(fare),
    platformFee: Math.round(platformFee),
    gst: Math.round(gst),
    total: Math.round(fare + platformFee + gst)
  };
};

// Pre-save hook to set default pricing based on vehicle type
vehicleSchema.pre('save', function(next) {
  if (this.isNew && !this.baseFare) {
    const defaultPricing = {
      bike: { baseFare: 15, perKmRate: 3 },
      scooter: { baseFare: 15, perKmRate: 3 },
      auto: { baseFare: 25, perKmRate: 8 },
      car: { baseFare: 40, perKmRate: 12 }
    };
    
    const pricing = defaultPricing[this.vehicleType];
    if (pricing) {
      this.baseFare = pricing.baseFare;
      this.perKmRate = pricing.perKmRate;
    }
  }
  next();
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;