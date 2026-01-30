// frontend/src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut
} from 'firebase/auth';

// Your web app's Firebase configuration
// Get this from Firebase Console > Project Settings
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "campus-rideshare.firebaseapp.com",
  projectId: "campus-rideshare",
  storageBucket: "campus-rideshare.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Sign in with Google
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Get ID token
    const idToken = await user.getIdToken();
    
    return {
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber
      },
      idToken
    };
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

/**
 * Sign in with Phone Number
 */
export const setupRecaptcha = (containerId) => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      containerId,
      {
        size: 'invisible',
        callback: (response) => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
        }
      },
      auth
    );
  }
};

export const sendPhoneOTP = async (phoneNumber) => {
  try {
    setupRecaptcha('recaptcha-container');
    const appVerifier = window.recaptchaVerifier;
    
    // Phone number must be in E.164 format (+919876543210)
    const formattedPhone = phoneNumber.startsWith('+') 
      ? phoneNumber 
      : `+91${phoneNumber}`;
    
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      formattedPhone,
      appVerifier
    );
    
    return confirmationResult;
  } catch (error) {
    console.error('Phone OTP error:', error);
    throw error;
  }
};

export const verifyPhoneOTP = async (confirmationResult, otp) => {
  try {
    const result = await confirmationResult.confirm(otp);
    const user = result.user;
    
    // Get ID token
    const idToken = await user.getIdToken();
    
    return {
      user: {
        uid: user.uid,
        phoneNumber: user.phoneNumber
      },
      idToken
    };
  } catch (error) {
    console.error('OTP verification error:', error);
    throw error;
  }
};

/**
 * Sign out
 */
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Get current user ID token
 */
export const getCurrentUserToken = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  
  return await user.getIdToken();
};

/**
 * Auth state listener
 */
export const onAuthStateChange = (callback) => {
  return auth.onAuthStateChanged(callback);
};

export { auth };
export default app;