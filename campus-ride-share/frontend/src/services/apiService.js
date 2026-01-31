// frontend/src/services/apiService.js
import axios from 'axios';
import { getCurrentUserToken } from './firebase';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getCurrentUserToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'An error occurred';
    console.error('API Error:', message);
    return Promise.reject(error.response?.data || error);
  }
);

/**
 * Authentication APIs
 */
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  loginWithFirebase: (idToken) => api.post('/auth/login/firebase', { idToken }),
  getProfile: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  verifyPhone: (phone) => api.post('/auth/verify-phone', { phone })
};

/**
 * User APIs
 */
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  toggleCaptainMode: (active) => api.post('/users/toggle-captain', { active }),
  registerVehicle: (vehicleData) => api.post('/users/vehicle/register', vehicleData),
  uploadDocument: (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post('/users/upload-document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

/**
 * Ride APIs
 */
export const rideAPI = {
  create: (rideData) => api.post('/rides/create', rideData),
  getDetails: (rideId) => api.get(`/rides/${rideId}`),
  cancel: (rideId, reason) => api.post(`/rides/${rideId}/cancel`, { reason }),
  getActiveRide: () => api.get('/rides/active/current'),
  getHistory: (page = 1, limit = 10) => 
    api.get(`/rides/history/list?page=${page}&limit=${limit}`),
  rate: (rideId, rating, review) => 
    api.post(`/rides/${rideId}/rate`, { rating, review }),
  getNearbyRequests: (longitude, latitude) => 
    api.get(`/rides/nearby/requests?longitude=${longitude}&latitude=${latitude}`)
};

/**
 * Payment APIs
 */
export const paymentAPI = {
  createOrder: (rideId) => api.post('/payments/order', { rideId }),
  verifyPayment: (paymentData) => api.post('/payments/verify', paymentData),
  getHistory: (page = 1, limit = 10) => 
    api.get(`/payments/history?page=${page}&limit=${limit}`),
  requestPayout: (amount, bankAccountId) => 
    api.post('/payments/payout/request', { amount, bankAccountId }),
  getEarnings: () => api.get('/payments/earnings')
};

/**
 * Google Maps APIs
 */
export const mapsAPI = {
  getDirections: async (origin, destination) => {
    // This should call your backend which calls Google Maps API
    return api.post('/maps/directions', { origin, destination });
  },
  
  getDistanceMatrix: async (origins, destinations) => {
    return api.post('/maps/distance-matrix', { origins, destinations });
  },
  
  geocode: async (address) => {
    return api.post('/maps/geocode', { address });
  }
};

/**
 * Razorpay Payment Handler
 */
export const handleRazorpayPayment = (orderData, onSuccess, onFailure) => {
  const options = {
    key: orderData.keyId,
    amount: orderData.amount,
    currency: orderData.currency,
    name: 'Campus Ride-Share',
    description: `Ride from ${orderData.ride.pickup} to ${orderData.ride.dropoff}`,
    order_id: orderData.orderId,
    handler: function (response) {
      // Verify payment on backend
      paymentAPI.verifyPayment({
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
        rideId: orderData.ride.id
      })
      .then((data) => {
        onSuccess(data);
      })
      .catch((error) => {
        onFailure(error);
      });
    },
    prefill: {
      name: orderData.userName || '',
      email: orderData.userEmail || '',
      contact: orderData.userPhone || ''
    },
    theme: {
      color: '#FBBF24' // Yellow-400
    }
  };

  const razorpay = new window.Razorpay(options);
  
  razorpay.on('payment.failed', function (response) {
    onFailure(response.error);
  });

  razorpay.open();
};

/**
 * Utility function to calculate fare estimate
 */
export const calculateFareEstimate = (distance, vehicleType = 'bike') => {
  const baseFares = {
    bike: { base: 15, perKm: 3 },
    scooter: { base: 15, perKm: 3 },
    auto: { base: 25, perKm: 8 },
    car: { base: 40, perKm: 12 }
  };

  const pricing = baseFares[vehicleType];
  const baseFare = pricing.base + (distance * pricing.perKm);
  const platformFee = baseFare * 0.10;
  const gst = platformFee * 0.18;
  const total = baseFare + platformFee + gst;

  return {
    baseFare: Math.round(baseFare),
    platformFee: Math.round(platformFee),
    gst: Math.round(gst),
    total: Math.round(total)
  };
};

export default api;