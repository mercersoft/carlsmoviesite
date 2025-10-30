import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Use the current hostname as authDomain to ensure redirects work correctly
// This fixes issues when accessing the site via different Firebase domains
// (carlsmoviesite.firebaseapp.com vs carlsmovie.web.app)
const getAuthDomain = () => {
  // In production, use the current hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Only use the current hostname if it's a Firebase domain
    if (hostname.includes('firebaseapp.com') || hostname.includes('web.app')) {
      return hostname;
    }
  }
  // Fallback to the default authDomain for localhost/custom domains
  return "carlsmoviesite.firebaseapp.com";
};

const firebaseConfig = {
  apiKey: "AIzaSyCQk31bQqK1_giLYuMblLJyyWHociIFRIE",
  authDomain: getAuthDomain(),
  projectId: "carlsmoviesite",
  storageBucket: "carlsmoviesite.firebasestorage.app",
  messagingSenderId: "582235357083",
  appId: "1:582235357083:web:79fe05b1fa7f682d3ceb3e",
  measurementId: "G-RKLK25PGR8"
};

console.log('[Firebase] Initializing with authDomain:', firebaseConfig.authDomain);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
