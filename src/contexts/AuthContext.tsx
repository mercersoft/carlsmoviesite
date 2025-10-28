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
    let unsubscribe: (() => void) | undefined;

    // First check for redirect result (important for mobile)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('Redirect result: User signed in', result.user.email);
          setUser(result.user);
        } else {
          console.log('Redirect result: No user (normal page load)');
        }
      })
      .catch((error) => {
        console.error('Error getting redirect result:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
      })
      .finally(() => {
        // Set up auth state listener after handling redirect
        unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log('Auth state changed:', user?.email || 'No user');
          setUser(user);
          setLoading(false);
        });
      });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const mobile = isMobile();
      console.log('Sign in attempt - Mobile:', mobile);

      if (mobile) {
        // Use redirect on mobile devices
        console.log('Using signInWithRedirect');
        await signInWithRedirect(auth, googleProvider);
      } else {
        // Use popup on desktop
        console.log('Using signInWithPopup');
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
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
