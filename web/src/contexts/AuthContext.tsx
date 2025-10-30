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
import { isMobile } from '@/lib/device';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    console.log('[AuthContext] Initializing on domain:', window.location.hostname);
    console.log('[AuthContext] Pending redirect flag:', localStorage.getItem('pendingRedirect'));

    // Check for redirect result when component mounts
    getRedirectResult(auth)
      .then((result) => {
        console.log('[AuthContext] Redirect result:', result ? 'User signed in' : 'No redirect result');
        if (result) {
          console.log('[AuthContext] User:', result.user?.email);
        }

        // Clear the pending redirect flag
        localStorage.removeItem('pendingRedirect');

        // Set up auth state listener
        unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log('[AuthContext] Auth state changed:', user ? user.email : 'No user');
          setUser(user);
          setLoading(false);
        });
      })
      .catch((error) => {
        console.error('[AuthContext] Auth error:', error.code, error.message);
        localStorage.removeItem('pendingRedirect');

        // Still set up the listener even if there's an error
        unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log('[AuthContext] Auth state changed (after error):', user ? user.email : 'No user');
          setUser(user);
          setLoading(false);
        });
      });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const mobile = isMobile();
      console.log('[AuthContext] Sign in initiated - Device type:', mobile ? 'mobile' : 'desktop');
      console.log('[AuthContext] Current hostname:', window.location.hostname);
      console.log('[AuthContext] Auth domain:', auth.config.authDomain);

      if (mobile) {
        // Set a flag so we know we initiated a redirect
        localStorage.setItem('pendingRedirect', 'true');
        console.log('[AuthContext] Using signInWithRedirect');
        await signInWithRedirect(auth, googleProvider);
      } else {
        console.log('[AuthContext] Using signInWithPopup');
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error: any) {
      console.error('[AuthContext] Sign-in error:', error.code, error.message);
      localStorage.removeItem('pendingRedirect');
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
