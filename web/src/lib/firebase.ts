import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCQk31bQqK1_giLYuMblLJyyWHociIFRIE",
  authDomain: "carlsmoviesite.firebaseapp.com",
  projectId: "carlsmoviesite",
  storageBucket: "carlsmoviesite.firebasestorage.app",
  messagingSenderId: "582235357083",
  appId: "1:582235357083:web:79fe05b1fa7f682d3ceb3e",
  measurementId: "G-RKLK25PGR8"
};

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
