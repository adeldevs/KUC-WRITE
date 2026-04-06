import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { getMe, createUser } from '../lib/api';
import type { User, OnboardingPayload } from '../types';

// ─── DEMO MODE ────────────────────────────────────────────────────────────────
// Set to true to bypass Firebase auth for UI preview. Set false for production.
export const DEMO_MODE = false;
// ─────────────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  dbUser: User | null;
  isLoading: boolean;
  needsOnboarding: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (payload: OnboardingPayload) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchDbUser = async () => {
    console.log('[Auth] fetchDbUser → calling getMe() from Firestore');
    try {
      const user = await getMe();
      console.log('%c[Auth] ✅ DB user loaded →', 'color: #16a34a; font-weight: bold;', user);
      setDbUser(user);
      setNeedsOnboarding(false);
    } catch (err: unknown) {
      if ((err as { response?: { status: number } })?.response?.status === 404) {
        console.warn('[Auth] ⚠️ User not in Firestore yet → needsOnboarding = true');
        setNeedsOnboarding(true);
      } else {
        console.error('[Auth] ❌ fetchDbUser failed →', err);
      }
    }
  };

  useEffect(() => {
    console.log('[Auth] Subscribing to Firebase onAuthStateChanged...');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('%c[Auth] Auth state changed →', 'color: #3b82f6; font-weight: bold;',
        user ? `signed in as ${user.email}` : 'signed out');
      setFirebaseUser(user);
      if (user) {
        await fetchDbUser();
      } else {
        setDbUser(null);
        setNeedsOnboarding(false);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    console.log('[Auth] signInWithGoogle → opening Google popup...');
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log('%c[Auth] ✅ Google sign-in success →', 'color: #16a34a; font-weight: bold;', result.user.email);
    } catch (err) {
      console.error('[Auth] ❌ Google sign-in failed →', err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log('[Auth] logout → signing out...');
    await signOut(auth);
    setDbUser(null);
    setNeedsOnboarding(false);
    console.log('[Auth] ✅ Signed out successfully');
  };

  const completeOnboarding = async (payload: OnboardingPayload) => {
    if (!firebaseUser) return;
    console.log('[Auth] completeOnboarding → payload:', payload);
    try {
      const user = await createUser({
        ...payload,
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        photoURL: firebaseUser.photoURL || undefined,
      });
      console.log('%c[Auth] ✅ Onboarding complete → user created in Firestore:', 'color: #16a34a; font-weight: bold;', user);
      setDbUser(user);
      setNeedsOnboarding(false);
    } catch (err) {
      console.error('[Auth] ❌ completeOnboarding failed →', err);
      throw err;
    }
  };

  const refreshUser = async () => {
    await fetchDbUser();
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        dbUser,
        isLoading,
        needsOnboarding,
        signInWithGoogle,
        logout,
        completeOnboarding,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
