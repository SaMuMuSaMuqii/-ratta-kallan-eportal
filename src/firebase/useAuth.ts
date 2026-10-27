import { useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './config';

export interface VillageUserProfile {
  uid: string;
  displayName: string;
  phoneOrUsername: string;
  email: string;
  role: 'admin' | 'member';
  createdAt: string;
}

const LOCAL_AUTH_STORAGE_KEY = 'ratta_kallan_local_auth_user_v1';

// Helper to convert phone number or username into a valid Firebase email format
const toPseudoEmail = (input: string): string => {
  const clean = input.trim().toLowerCase();
  if (clean.includes('@')) return clean;
  // Remove spaces and special chars
  const sanitized = clean.replace(/[^a-z0-9]/g, '');
  return `${sanitized || 'user'}@rattakallan.local`;
};

export function useAuth() {
  const [user, setUser] = useState<VillageUserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: User | null) => {
      if (fbUser) {
        try {
          if (db) {
            const userDocRef = doc(db, 'users', fbUser.uid);
            const snap = await getDoc(userDocRef);
            if (snap.exists()) {
              const data = snap.data() as VillageUserProfile;
              setUser(data);
              localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(data));
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.warn('Error fetching user document:', err);
        }

        const fallbackProfile: VillageUserProfile = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          phoneOrUsername: fbUser.email?.replace('@rattakallan.local', '') || '',
          email: fbUser.email || '',
          role: 'member',
          createdAt: new Date().toISOString(),
        };
        setUser(fallbackProfile);
        localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(fallbackProfile));
      } else {
        // Keep local fallback user if offline mode was used, otherwise clear
        const localSaved = localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          if (!parsed.uid.startsWith('local-')) {
            setUser(null);
            localStorage.removeItem(LOCAL_AUTH_STORAGE_KEY);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Register with Name + Phone/Username + Password
  const registerWithCredentials = async (
    displayName: string,
    phoneOrUsername: string,
    password: string
  ): Promise<boolean> => {
    setAuthError(null);
    const email = toPseudoEmail(phoneOrUsername);

    if (isFirebaseConfigured() && auth) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: displayName.trim() });

        const newProfile: VillageUserProfile = {
          uid: cred.user.uid,
          displayName: displayName.trim(),
          phoneOrUsername: phoneOrUsername.trim(),
          email,
          role: 'member',
          createdAt: new Date().toISOString(),
        };

        if (db) {
          await setDoc(doc(db, 'users', cred.user.uid), newProfile);
        }

        setUser(newProfile);
        localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(newProfile));
        return true;
      } catch (err: any) {
        console.warn('Firebase registration error, falling back to local account:', err);
        // Fallback to local registration if Email/Password provider isn't enabled in Firebase console
      }
    }

    // Local Storage Account Fallback (Always works smoothly)
    try {
      const localAccountsRaw = localStorage.getItem('ratta_kallan_local_accounts_db');
      const localAccounts = localAccountsRaw ? JSON.parse(localAccountsRaw) : {};

      const key = phoneOrUsername.trim().toLowerCase();
      if (localAccounts[key]) {
        setAuthError('This username is already registered. Please sign in.');
        return false;
      }

      const newProfile: VillageUserProfile = {
        uid: `local-${Date.now()}`,
        displayName: displayName.trim(),
        phoneOrUsername: phoneOrUsername.trim(),
        email,
        role: 'member',
        createdAt: new Date().toISOString(),
      };

      localAccounts[key] = {
        profile: newProfile,
        password,
      };

      localStorage.setItem('ratta_kallan_local_accounts_db', JSON.stringify(localAccounts));
      setUser(newProfile);
      localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(newProfile));
      return true;
    } catch (e: any) {
      setAuthError('An error occurred during account registration.');
      return false;
    }
  };

  // Sign In with Phone/Username + Password
  const loginWithCredentials = async (
    phoneOrUsername: string,
    password: string
  ): Promise<boolean> => {
    setAuthError(null);
    const email = toPseudoEmail(phoneOrUsername);

    if (isFirebaseConfigured() && auth) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        return true;
      } catch (err: any) {
        // Check local fallback accounts before failing
      }
    }

    try {
      const localAccountsRaw = localStorage.getItem('ratta_kallan_local_accounts_db');
      const localAccounts = localAccountsRaw ? JSON.parse(localAccountsRaw) : {};
      const key = phoneOrUsername.trim().toLowerCase();

      if (localAccounts[key] && localAccounts[key].password === password) {
        const foundProfile = localAccounts[key].profile;
        setUser(foundProfile);
        localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(foundProfile));
        return true;
      } else {
        setAuthError('Invalid username or password.');
        return false;
      }
    } catch {
      setAuthError('Sign in failed. Please try again.');
      return false;
    }
  };

  // Google Sign-In
  const loginWithGoogle = async (): Promise<boolean> => {
    setAuthError(null);
    if (!isFirebaseConfigured() || !auth) {
      setAuthError('Google Sign-In is currently unavailable.');
      return false;
    }
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      const newProfile: VillageUserProfile = {
        uid: fbUser.uid,
        displayName: fbUser.displayName || 'User',
        phoneOrUsername: fbUser.email || '',
        email: fbUser.email || '',
        role: 'member',
        createdAt: new Date().toISOString(),
      };

      if (db) {
        await setDoc(doc(db, 'users', fbUser.uid), newProfile, { merge: true });
      }

      setUser(newProfile);
      localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(newProfile));
      return true;
    } catch (err: any) {
      setAuthError(err.message || 'Google Sign-In failed.');
      return false;
    }
  };

  const logout = async (skipConfirm = false) => {
    if (!skipConfirm) {
      const confirmed = window.confirm('Are you sure you want to sign out of your account?');
      if (!confirmed) return;
    }
    if (isFirebaseConfigured() && auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn('Error signing out:', e);
      }
    }
    setUser(null);
    localStorage.removeItem(LOCAL_AUTH_STORAGE_KEY);
  };

  return {
    user,
    loading,
    authError,
    setAuthError,
    registerWithCredentials,
    loginWithCredentials,
    loginWithGoogle,
    logout,
  };
}
