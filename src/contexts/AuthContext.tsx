import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Detect if we're on a mobile device
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔵 AuthProvider: Initializing...');
    let unsubscribe: (() => void) | undefined;

    // Check for redirect result when component mounts
    console.log('🔵 Checking for redirect result...');
    getRedirectResult(auth)
      .then((result) => {
        console.log('🔵 Redirect result received:', result ? 'User signed in' : 'No redirect');
        // If there's a redirect result, the user just signed in
        if (result) {
          console.log('✅ Sign-in successful:', result.user.email);
          console.log('✅ User UID:', result.user.uid);
        } else {
          console.log('ℹ️ No redirect result (normal page load)');
        }
        // Set up auth state listener after checking redirect result
        console.log('🔵 Setting up onAuthStateChanged listener...');
        unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log('🔵 Auth state changed:', user ? `Signed in as ${user.email}` : 'Not signed in');
          setUser(user);
          setLoading(false);
        });
      })
      .catch((error) => {
        console.error('❌ Auth redirect error:', error.code, error.message);
        console.error('❌ Full error:', error);
        // Still set up the listener even if there's an error
        unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log('🔵 Auth state changed (after error):', user ? `Signed in as ${user.email}` : 'Not signed in');
          setUser(user);
          setLoading(false);
        });
      });

    return () => {
      console.log('🔵 AuthProvider: Cleaning up...');
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const mobile = isMobile();
      console.log('🟢 Starting sign-in - Mobile:', mobile);

      if (mobile) {
        console.log('🟢 Using redirect for mobile...');
        await signInWithRedirect(auth, googleProvider);
      } else {
        console.log('🟢 Using popup for desktop...');
        await signInWithPopup(auth, googleProvider);
        console.log('✅ Popup sign-in completed');
      }
    } catch (error: any) {
      console.error('❌ Sign-in error:', error.code, error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
