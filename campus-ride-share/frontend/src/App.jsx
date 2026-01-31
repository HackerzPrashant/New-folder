import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, User, Car, Menu, X, Phone, Mail, Star, Clock, Wallet, LogOut } from 'lucide-react';

// Main App Component
const App = () => {
  const [currentView, setCurrentView] = useState('home');
  const [userRole, setUserRole] = useState('rider'); // 'rider' or 'captain'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Mock user data
  const [user, setUser] = useState({
    name: 'John Doe',
    email: 'john.doe@youruniversity.edu',
    phone: '+91 98765 43210',
    profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    rating: 4.8,
    totalRides: 42,
    balance: 1250
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {!isAuthenticated ? (
        <LandingPage onLogin={() => setIsAuthenticated(true)} />
      ) : (
        <>
            <Navbar 
            user={user}
            userRole={userRole}
            setUserRole={setUserRole}
            showMenu={showMenu}
            setShowMenu={setShowMenu}
            setCurrentView={setCurrentView}
            setIsAuthenticated={setIsAuthenticated}
          />
          
          <AnimatePresence mode="wait">
            {currentView === 'home' && (
              <MainDashboard 
                key="dashboard"
                userRole={userRole}
                user={user}
                setCurrentView={setCurrentView}
              />
            )}
            {currentView === 'profile' && (
              <ProfileView 
                key="profile"
                user={user}
                userRole={userRole}
                setIsAuthenticated={setIsAuthenticated}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

// Landing Page
const LandingPage = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="inline-block mb-4"
          >
            <Car className="w-16 h-16 text-yellow-400" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Campus Ride-Share
          </h1>
          <p className="text-gray-300">
            Safe rides for students, by students
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <button
            onClick={onLogin}
            className="w-full bg-white text-gray-900 py-4 rounded-xl font-semibold mb-4 hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            <span>Sign in with Google</span>
          </button>
          
          <button 
            onClick={onLogin}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
          >
            <Phone className="w-5 h-5" />
            <span>Sign in with Phone</span>
          </button>

          <div className="mt-6 text-center text-sm text-gray-400">
            <p>By continuing, you agree to use your</p>
            <p className="text-yellow-400 font-semibold">@youruniversity.edu</p>
            <p>email address</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: MapPin, text: 'Safe Routes' },
            { icon: Star, text: 'Verified Users' },
            { icon: Wallet, text: 'Low Fares' }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 backdrop-blur rounded-xl p-4"
            >
              <item.icon className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-white text-sm">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// Navbar Component
const Navbar = ({ user, userRole, setUserRole, showMenu, setShowMenu, setCurrentView, setIsAuthenticated }) => {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Car className="w-8 h-8 text-yellow-400" />
            <span className="text-white font-bold text-xl">CampusRide</span>
          </div>

          {/* Role Toggle */}
          <div className="flex items-center space-x-4">
            <div className="bg-white/10 rounded-full p-1 flex">
              <button
                onClick={() => setUserRole('rider')}
                className={`px-6 py-2 rounded-full transition-all ${
                  userRole === 'rider'
                    ? 'bg-yellow-400 text-gray-900 font-semibold'
                    : 'text-white'
                }`}
              >
                Rider
              </button>
              <button
                onClick={() => setUserRole('captain')}
                className={`px-6 py-2 rounded-full transition-all ${
                  userRole === 'captain'
                    ? 'bg-yellow-400 text-gray-900 font-semibold'
                    : 'text-white'
                }`}
              >
                Captain
              </button>
            </div>

            {/* Desktop Logout Button */}
            <button 
              onClick={() => setIsAuthenticated(false)}
              className="hidden md:flex items-center space-x-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-xl transition-all border border-red-500/20 mr-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-semibold text-sm">Logout</span>
            </button>

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-white p-2 hover:bg-white/10 rounded-lg"
            >
              {showMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white/10 backdrop-blur-lg border-t border-white/20 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
              <button
                onClick={() => {
                  setCurrentView('home');
                  setShowMenu(false);
                }}
                className="w-full text-left text-white py-3 px-4 rounded-lg hover:bg-white/10"
              >
                Home
              </button>
              <button
                onClick={() => {
                  setCurrentView('profile');
                  setShowMenu(false);
                }}
                className="w-full text-left text-white py-3 px-4 rounded-lg hover:bg-white/10"
              >
                Profile
              </button>
              <button className="w-full text-left text-white py-3 px-4 rounded-lg hover:bg-white/10">
                Ride History
              </button>
              <button 
                onClick={() => {
                  setIsAuthenticated(false);
                  setShowMenu(false);
                }}
                className="w-full flex items-center space-x-3 text-red-400 py-3 px-4 rounded-lg hover:bg-white/10"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-semibold">Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

// Main Dashboard
const MainDashboard = ({ userRole, user, setCurrentView }) => {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [showBooking, setShowBooking] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 py-8"
    >
      <div className="grid md:grid-cols-2 gap-8">
        {/* Map View */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 h-[600px]">
          <div className="relative w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <p className="text-white text-lg">Google Maps Integration</p>
              <p className="text-gray-400 text-sm mt-2">
                Real-time tracking will appear here
              </p>
            </div>
          </div>
        </div>

        {/* Booking Panel */}
        <div className="space-y-6">
          {userRole === 'rider' ? (
            <RiderPanel
              pickup={pickup}
              setPickup={setPickup}
              dropoff={dropoff}
              setDropoff={setDropoff}
              showBooking={showBooking}
              setShowBooking={setShowBooking}
            />
          ) : (
            <CaptainPanel user={user} />
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <Star className="w-8 h-8" />
                <span className="text-3xl font-bold">{user.rating}</span>
              </div>
              <p className="text-sm opacity-90">Rating</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8" />
                <span className="text-3xl font-bold">{user.totalRides}</span>
              </div>
              <p className="text-sm opacity-90">Total Rides</p>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Rider Panel
const RiderPanel = ({ pickup, setPickup, dropoff, setDropoff, showBooking, setShowBooking }) => {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <h2 className="text-white text-2xl font-bold mb-6">Book a Ride</h2>
      
      <div className="space-y-4">
        <div>
          <label className="text-white text-sm mb-2 block">Pickup Location</label>
          <div className="relative">
            <Navigation className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              placeholder="Main Gate, Campus"
              className="w-full bg-white/20 text-white placeholder-gray-400 border border-white/30 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        </div>

        <div>
          <label className="text-white text-sm mb-2 block">Drop-off Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
              placeholder="Hostel Block A"
              className="w-full bg-white/20 text-white placeholder-gray-400 border border-white/30 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowBooking(true)}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 font-bold py-4 rounded-xl shadow-lg"
        >
          Find Captain
        </motion.button>
      </div>

      {showBooking && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl"
        >
          <p className="text-white text-center">
            🚗 Finding nearby captains...
          </p>
        </motion.div>
      )}
    </div>
  );
};

// Captain Panel
const CaptainPanel = ({ user }) => {
  const [isOnline, setIsOnline] = useState(false);

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-2xl font-bold">Captain Mode</h2>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOnline(!isOnline)}
          className={`px-6 py-3 rounded-full font-semibold transition-all ${
            isOnline
              ? 'bg-green-500 text-white'
              : 'bg-gray-600 text-white'
          }`}
        >
          {isOnline ? 'Online' : 'Offline'}
        </motion.button>
      </div>

      <div className="space-y-4">
        <div className="bg-white/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white">Today's Earnings</span>
            <Wallet className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-white text-3xl font-bold">₹{user.balance}</p>
        </div>

        {isOnline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4"
          >
            <p className="text-white text-center mb-2">
              Waiting for ride requests...
            </p>
            <div className="flex justify-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-3 h-3 bg-blue-400 rounded-full"
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Profile View
const ProfileView = ({ user, userRole, setIsAuthenticated }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
        <div className="flex items-center space-x-6 mb-8">
          <img
            src={user.profileImage}
            alt={user.name}
            className="w-24 h-24 rounded-full border-4 border-yellow-400"
          />
          <div>
            <h1 className="text-white text-3xl font-bold">{user.name}</h1>
            <p className="text-gray-400">{user.email}</p>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-1">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="text-white font-semibold">{user.rating}</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-white">{user.totalRides} rides</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-white text-xl font-bold">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-white">{user.phone}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-white">{user.email}</span>
              </div>
            </div>
          </div>

          {userRole === 'captain' && (
            <div className="space-y-4">
              <h3 className="text-white text-xl font-bold">Vehicle Info</h3>
              <div className="bg-white/20 rounded-xl p-4">
                <p className="text-white font-semibold">Honda Activa</p>
                <p className="text-gray-400 text-sm">DL 01 AB 1234</p>
                <p className="text-yellow-400 text-sm mt-2">Verified ✓</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 flex justify-center">
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-8 py-3 rounded-xl transition-all border border-red-500/50 font-bold"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};



export default App;