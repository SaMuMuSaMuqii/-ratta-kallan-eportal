import { useState, useEffect } from 'react';
import {
  auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateAuthProfile,
  isFirebaseConfigured,
  type User,
} from './config';
import { AuthUserSession, UserRoles, VillageProfile } from '../types';

export function useFirebaseAuth(profiles: VillageProfile[]) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<AuthUserSession | null>(() => {
    try {
      const saved = localStorage.getItem('rk_active_auth_session_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string>('');

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult();
          const claims = tokenResult.claims as any;
          const roles: UserRoles = {
            admin: Boolean(claims.admin || claims.role === 'admin'),
            mosqueEditor: Boolean(claims.mosqueEditor),
            schoolEditor: Boolean(claims.schoolEditor),
            hospitalEditor: Boolean(claims.hospitalEditor),
            transportEditor: Boolean(claims.transportEditor),
          };

          // Find associated profile
          const matchedProfile = profiles.find(
            (p) => (p as any).ownerId === user.uid || (p.email && p.email.toLowerCase() === user.email?.toLowerCase())
          );

          const session: AuthUserSession = {
            type: roles.admin ? 'admin' : matchedProfile ? 'profile_owner' : 'user',
            id: matchedProfile ? matchedProfile.id : user.uid,
            uid: user.uid,
            username: user.email?.split('@')[0] || matchedProfile?.username || 'user',
            name: user.displayName || matchedProfile?.name || 'صارف',
            email: user.email || '',
            mobile: matchedProfile?.mobile || '',
            profileId: matchedProfile?.id,
            avatar: matchedProfile?.personImage,
            loginTime: new Date().toISOString(),
            roles,
          };

          setActiveSession(session);
          localStorage.setItem('rk_active_auth_session_v1', JSON.stringify(session));
        } catch (e) {
          console.warn('Error reading user claims:', e);
        }
      } else {
        // Logged out
        setActiveSession(null);
        localStorage.removeItem('rk_active_auth_session_v1');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profiles]);

  // Sign up with Email and Password
  const register = async (email: string, pass: string, displayName: string, mobile?: string) => {
    setAuthError('');
    if (!isFirebaseConfigured()) {
      // Local fallback session
      const fallbackSession: AuthUserSession = {
        type: 'profile_owner',
        id: `local-user-${Date.now()}`,
        username: email.split('@')[0],
        name: displayName,
        email,
        mobile,
        loginTime: new Date().toISOString(),
      };
      setActiveSession(fallbackSession);
      localStorage.setItem('rk_active_auth_session_v1', JSON.stringify(fallbackSession));
      return fallbackSession;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateAuthProfile(cred.user, { displayName });
      try {
        await sendEmailVerification(cred.user);
      } catch (e) {
        console.warn('Verification email send notice:', e);
      }
      return cred.user;
    } catch (err: any) {
      setAuthError(err.message || 'رجسٹریشن میں خرابی پیش آئی');
      throw err;
    }
  };

  // Sign in with Email and Password
  const login = async (emailOrMobile: string, pass: string) => {
    setAuthError('');
    let emailToUse = emailOrMobile.trim();

    // If mobile number was entered instead of email, lookup email from profiles
    if (!emailToUse.includes('@')) {
      const cleanPhone = emailToUse.replace(/\D/g, '');
      const found = profiles.find((p) => p.mobile.replace(/\D/g, '').includes(cleanPhone));
      if (found && found.email) {
        emailToUse = found.email;
      } else {
        emailToUse = `${emailToUse.replace(/\s+/g, '')}@ratta.pk`;
      }
    }

    if (!isFirebaseConfigured()) {
      // In local demo mode, match against profiles
      const matched = profiles.find(
        (p) =>
          (p.email && p.email.toLowerCase() === emailToUse.toLowerCase()) ||
          p.mobile.replace(/\D/g, '') === emailOrMobile.replace(/\D/g, '')
      );
      if (matched && matched.password && matched.password === pass) {
        const session: AuthUserSession = {
          type: 'profile_owner',
          id: matched.id,
          username: matched.username || matched.name,
          name: matched.name,
          email: matched.email,
          mobile: matched.mobile,
          profileId: matched.id,
          avatar: matched.personImage,
          loginTime: new Date().toISOString(),
        };
        setActiveSession(session);
        localStorage.setItem('rk_active_auth_session_v1', JSON.stringify(session));
        return session;
      }
      throw new Error('غلط یوزر نیم یا پاس ورڈ');
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, emailToUse, pass);
      return cred.user;
    } catch (err: any) {
      setAuthError(err.message || 'لاگ ان ناکام رہا');
      throw err;
    }
  };

  // Sign out
  const logout = async (confirm = true) => {
    if (confirm) {
      const ans = window.confirm('کیا آپ واقعی اپنے اکاؤنٹ سے لاگ آؤٹ کرنا چاہتے ہیں؟');
      if (!ans) return false;
    }
    if (isFirebaseConfigured()) {
      await signOut(auth);
    }
    setActiveSession(null);
    localStorage.removeItem('rk_active_auth_session_v1');
    return true;
  };

  // Password reset email
  const resetPassword = async (email: string) => {
    if (isFirebaseConfigured()) {
      await sendPasswordResetEmail(auth, email);
    }
    return true;
  };

  // Resend verification email
  const resendVerification = async () => {
    if (currentUser) {
      await sendEmailVerification(currentUser);
      return true;
    }
    return false;
  };

  return {
    currentUser,
    activeSession,
    setActiveSession,
    loading,
    authError,
    register,
    login,
    logout,
    resetPassword,
    resendVerification,
    isEmailVerified: currentUser?.emailVerified ?? true,
  };
}
