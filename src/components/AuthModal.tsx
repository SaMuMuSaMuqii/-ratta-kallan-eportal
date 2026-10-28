import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  User,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  LogIn,
  LogOut,
  Volume2,
  ArrowLeft,
} from 'lucide-react';
import { VillageProfile, AuthUserSession, Language } from '../types';
import { speakText } from '../utils/speech';
import {
  verifyOwnerPasswordInVault,
  emailMatchesOwnerVault,
  saveOwnerCredentialVault,
  SUPER_ADMIN_RECOVERY_EMAIL,
  isAuthorizedSuperAdminResetEmail,
  verifySuperAdminCredentials,
  saveSuperAdminCredentials,
} from '../utils/privacySanitizer';
import { dispatchPasswordResetEmail } from '../firebase/emailNotificationService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'reset' | 'admin';
  profiles: VillageProfile[];
  adminCreds: {
    username: string;
    pin?: string;
    password?: string;
    email?: string;
    recoveryEmail?: string;
  };
  activeSession?: AuthUserSession | null;
  onLoginSuccess: (session: AuthUserSession) => void;
  onLogout?: () => void;
  onUpdateProfile?: (profile: VillageProfile) => void;
  onUpdateProfilePassword?: (profile: VillageProfile) => void;
  onUpdateAdminCreds?: (creds: { username: string; pin: string; email?: string }) => void;
  onUpdateAdminPassword?: (newUsername: string, newPassword: string, newEmail?: string) => void;
  onOpenAdminEntrance?: () => void;
  lang?: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  profiles,
  adminCreds,
  activeSession,
  onLoginSuccess,
  onLogout,
  onUpdateProfile,
  onUpdateProfilePassword,
  onUpdateAdminCreds,
  onUpdateAdminPassword,
}) => {
  const resolvedInitialMode: 'login' | 'reset' = initialMode === 'reset' ? 'reset' : 'login';
  const [mode, setMode] = useState<'login' | 'reset'>(resolvedInitialMode);
  const [resetStep, setResetStep] = useState<'send_link' | 'set_password'>('send_link');

  // Sign In fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Reset Password fields
  const [resetUsername, setResetUsername] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode === 'reset' ? 'reset' : 'login');
      setResetStep('send_link');
      setErrorMsg('');
      setSuccessMsg('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const switchMode = (targetMode: 'login' | 'reset') => {
    setMode(targetMode);
    setResetStep('send_link');
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Sign In Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanUser = loginUsername.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMsg('Please enter both your Username and Password.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Check Super Admin credentials (Username/Email: digitalworldonline777@gmail.com, Password: samumusa@1999)
      if (verifySuperAdminCredentials(cleanUser, cleanPass, adminCreds)) {
        const session: AuthUserSession = {
          type: 'admin',
          id: 'super-admin',
          uid: 'super-admin',
          username: 'Super Admin',
          name: 'Samar Saeed (Super Admin)',
          email: SUPER_ADMIN_RECOVERY_EMAIL,
          loginTime: new Date().toISOString(),
          roles: {
            admin: true,
            alertManager: true,
            mosqueEditor: true,
            schoolEditor: true,
            hospitalEditor: true,
            transportEditor: true,
          },
        };
        setSuccessMsg('Welcome, Super Admin! You have signed in successfully.');
        speakText('Welcome Super Admin. You have signed in successfully.', 'en');
        setTimeout(() => {
          onLoginSuccess(session);
          onClose();
        }, 700);
        return;
      }

      // 2. Check Profile Owners (by username, mobile, or full name)
      const matchedProfile = profiles.find((p) => {
        const pUser = (p.username || '').trim().toLowerCase();
        const pName = p.name.trim().toLowerCase();
        const pMobile = p.mobile.replace(/\D/g, '');
        const cleanDigits = cleanUser.replace(/\D/g, '');
        return (
          (pUser && pUser === cleanUser) ||
          pName === cleanUser ||
          (cleanDigits.length >= 10 && pMobile.endsWith(cleanDigits.slice(-10)))
        );
      });

      if (!matchedProfile) {
        setErrorMsg(
          'No account was found with this Username. Please check your Username and try again.'
        );
        return;
      }

      const isPasswordValid = await verifyOwnerPasswordInVault(
        matchedProfile.id,
        cleanPass,
        matchedProfile.password
      );
      if (!isPasswordValid) {
        setErrorMsg(
          'Invalid Password. If you forgot your password, click "Forgot Password?" below.'
        );
        return;
      }

      const session: AuthUserSession = {
        type: 'profile_owner',
        id: matchedProfile.id,
        username: matchedProfile.username || matchedProfile.name,
        name: matchedProfile.name,
        email: matchedProfile.email,
        profileId: matchedProfile.id,
        avatar: matchedProfile.personImage,
        loginTime: new Date().toISOString(),
      };

      setSuccessMsg(`Welcome, ${matchedProfile.name}! You have signed in successfully.`);
      speakText(`Welcome ${matchedProfile.name}. You have signed in successfully.`, 'en');

      setTimeout(() => {
        onLoginSuccess(session);
        onClose();
      }, 700);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1 of Reset Password: Verify Username + Email Address & Send Reset Link
  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanUser = resetUsername.trim().toLowerCase();
    const cleanEmail = resetEmail.trim().toLowerCase();

    if (!cleanUser || !cleanEmail) {
      setErrorMsg('Please enter both your Username and Email Address.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Please enter a valid Email Address.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Check if resetting Super Admin password
      const isSuperAdminAccount =
        isAuthorizedSuperAdminResetEmail(cleanUser) ||
        cleanUser === adminCreds.username.trim().toLowerCase() ||
        cleanUser === 'admin';

      if (isSuperAdminAccount) {
        if (!isAuthorizedSuperAdminResetEmail(cleanEmail)) {
          setErrorMsg(
            'Access Denied: Only the authorized Super Admin email address can reset the Admin password.'
          );
          return;
        }

        await dispatchPasswordResetEmail({
          email: SUPER_ADMIN_RECOVERY_EMAIL,
          username: 'Super Admin',
          accountRole: 'Super Admin',
        });

        setResetStep('set_password');
        setSuccessMsg(
          'Password reset link and verification sent to your registered email address. Please enter and confirm your New Password below.'
        );
        speakText(
          'Password reset link verified. Please enter your new password below.',
          'en'
        );
        return;
      }

      // 2. Check Profile Owner account
      const targetProfile = profiles.find((p) => {
        const pUser = (p.username || '').trim().toLowerCase();
        const pName = p.name.trim().toLowerCase();
        const pMobile = p.mobile.replace(/\D/g, '');
        const cleanDigits = cleanUser.replace(/\D/g, '');
        return (
          (pUser && pUser === cleanUser) ||
          pName === cleanUser ||
          (cleanDigits.length >= 10 && pMobile.endsWith(cleanDigits.slice(-10)))
        );
      });

      if (!targetProfile) {
        setErrorMsg('No account was found matching this Username.');
        return;
      }

      const emailMatch = await emailMatchesOwnerVault(
        targetProfile.id,
        cleanEmail,
        targetProfile.email
      );

      if (!emailMatch.hasRegisteredEmail) {
        setErrorMsg(
          'No recovery Email Address is registered for this account. Please contact the portal administrator for assistance.'
        );
        return;
      }

      if (!emailMatch.matches) {
        setErrorMsg(
          'The Email Address you entered does not match the registered Email Address for this account.'
        );
        return;
      }

      await dispatchPasswordResetEmail({
        email: cleanEmail,
        username: targetProfile.username || targetProfile.name,
        accountRole: 'Profile Owner',
      });

      setResetStep('set_password');
      setSuccessMsg(
        `A password reset link has been sent to ${cleanEmail}. Email verification succeeded — you may now set your New Password below.`
      );
      speakText('Password reset link sent. Please enter your new password.', 'en');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 of Reset Password: Confirm New Password & Save
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanUser = resetUsername.trim().toLowerCase();
    const cleanEmail = resetEmail.trim().toLowerCase();
    const cleanNewPass = newPassword.trim();
    const cleanConfirmPass = confirmNewPassword.trim();

    if (!cleanNewPass || !cleanConfirmPass) {
      setErrorMsg('Please enter both New Password and Confirm New Password.');
      return;
    }

    if (cleanNewPass.length < 4) {
      setErrorMsg('New Password must be at least 4 characters long.');
      return;
    }

    if (cleanNewPass !== cleanConfirmPass) {
      setErrorMsg('New Password and Confirm New Password do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const isSuperAdminAccount =
        isAuthorizedSuperAdminResetEmail(cleanUser) ||
        cleanUser === adminCreds.username.trim().toLowerCase() ||
        cleanUser === 'admin';

      if (isSuperAdminAccount) {
        if (!isAuthorizedSuperAdminResetEmail(cleanEmail)) {
          setErrorMsg(
            'Access Denied: Only the authorized Super Admin email address can reset the Admin password.'
          );
          return;
        }

        saveSuperAdminCredentials({
          username: SUPER_ADMIN_RECOVERY_EMAIL,
          pin: cleanNewPass,
          email: SUPER_ADMIN_RECOVERY_EMAIL,
        });

        if (onUpdateAdminPassword) {
          onUpdateAdminPassword(SUPER_ADMIN_RECOVERY_EMAIL, cleanNewPass, SUPER_ADMIN_RECOVERY_EMAIL);
        } else if (onUpdateAdminCreds) {
          onUpdateAdminCreds({
            username: SUPER_ADMIN_RECOVERY_EMAIL,
            pin: cleanNewPass,
            email: SUPER_ADMIN_RECOVERY_EMAIL,
          });
        }
        setSuccessMsg(
          'Admin password has been reset successfully! You can now sign in with your new password.'
        );
        speakText('Admin password has been reset successfully.', 'en');

        setTimeout(() => {
          setLoginUsername('');
          setLoginPassword('');
          setNewPassword('');
          setConfirmNewPassword('');
          switchMode('login');
        }, 1400);
        return;
      }

      const targetProfile = profiles.find((p) => {
        const pUser = (p.username || '').trim().toLowerCase();
        const pName = p.name.trim().toLowerCase();
        const pMobile = p.mobile.replace(/\D/g, '');
        const cleanDigits = cleanUser.replace(/\D/g, '');
        return (
          (pUser && pUser === cleanUser) ||
          pName === cleanUser ||
          (cleanDigits.length >= 10 && pMobile.endsWith(cleanDigits.slice(-10)))
        );
      });

      if (!targetProfile) {
        setErrorMsg('Account not found. Please verify your Username and try again.');
        return;
      }

      const updatedProfile: VillageProfile = {
        ...targetProfile,
        username:
          targetProfile.username || targetProfile.name.toLowerCase().replace(/\s+/g, '_'),
        password: cleanNewPass,
        email: cleanEmail,
      };

      await saveOwnerCredentialVault(targetProfile.id, {
        username: updatedProfile.username,
        password: cleanNewPass,
        email: cleanEmail,
        mobile: targetProfile.mobile,
        whatsapp: targetProfile.whatsapp,
      });

      if (onUpdateProfilePassword) {
        onUpdateProfilePassword(updatedProfile);
      } else if (onUpdateProfile) {
        onUpdateProfile(updatedProfile);
      }

      setSuccessMsg(
        `Password for "${targetProfile.name}" has been reset successfully! Signing you in...`
      );
      speakText('Your password has been reset successfully.', 'en');

      setTimeout(() => {
        const session: AuthUserSession = {
          type: 'profile_owner',
          id: updatedProfile.id,
          username: updatedProfile.username || updatedProfile.name,
          name: updatedProfile.name,
          email: updatedProfile.email,
          profileId: updatedProfile.id,
          avatar: updatedProfile.personImage,
          loginTime: new Date().toISOString(),
        };
        onLoginSuccess(session);
        onClose();
      }, 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      dir="ltr"
      lang="en"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto font-sans text-left"
    >
      <div className="bg-white border-2 border-emerald-600 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-950 text-white p-5 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow-md shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white font-sans leading-tight">
                {mode === 'login' ? 'Sign In to Account' : 'Reset Password'}
              </h2>
              <p className="text-xs text-emerald-200 font-sans leading-tight mt-0.5">
                {mode === 'login'
                  ? 'Ratta Kallan e-Portal Authentication'
                  : 'Account Password Recovery & Reset'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                speakText(
                  mode === 'login'
                    ? 'Enter your username and password to sign in to your account.'
                    : 'Enter your username and registered email address to receive a password reset link.',
                  'en'
                )
              }
              className="p-2 rounded-full bg-emerald-800/80 hover:bg-amber-400 hover:text-stone-950 text-amber-300 transition cursor-pointer"
              title="Listen to audio instructions"
              aria-label="Listen to audio instructions"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-emerald-200 hover:text-white rounded-full bg-black/20 cursor-pointer"
              title="Close authentication window"
              aria-label="Close authentication window"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Active Session Banner (if currently signed in) */}
        {activeSession && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex items-center justify-between gap-2 text-xs">
            <div className="truncate text-emerald-950">
              <span className="font-semibold">Signed in as: </span>
              <span className="font-bold">{activeSession.name}</span>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        )}

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-2 gap-2 bg-stone-100 border-b border-stone-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${
              mode === 'login'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'bg-white text-stone-700 hover:bg-stone-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => switchMode('reset')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${
              mode === 'reset'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-white text-stone-700 hover:bg-stone-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Password</span>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Error Alert */}
          {errorMsg && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-300 rounded-2xl text-red-800 text-xs font-semibold flex items-start gap-2 animate-in fade-in"
            >
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMsg && (
            <div
              role="status"
              className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-semibold flex items-start gap-2 animate-in fade-in"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{successMsg}</span>
            </div>
          )}

          {/* MODE 1: SIGN IN */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5" noValidate>
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-2.5 text-xs text-emerald-950 font-sans leading-snug">
                Sign in with your <strong>Username</strong> and <strong>Password</strong> to
                manage your profile or access administrator controls.
              </div>

              <div>
                <label
                  htmlFor="auth-login-username"
                  className="block text-xs font-bold text-stone-800 mb-1.5"
                >
                  Username
                </label>
                <div className="relative">
                  <input
                    id="auth-login-username"
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Enter your username (e.g., master_aslam)"
                    autoComplete="username"
                    className="w-full pl-10 pr-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:border-emerald-600 focus:outline-none bg-stone-50 focus:bg-white transition"
                    required
                  />
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="auth-login-password"
                    className="block text-xs font-bold text-stone-800"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (loginUsername.trim()) {
                        setResetUsername(loginUsername.trim());
                      }
                      switchMode('reset');
                    }}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="auth-login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:border-emerald-600 focus:outline-none bg-stone-50 focus:bg-white transition"
                    required
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer p-0.5"
                    title={showLoginPassword ? 'Hide password' : 'Show password'}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold rounded-2xl shadow-lg cursor-pointer text-sm flex items-center justify-center gap-2 transition active:scale-98"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
              </button>
            </form>
          )}

          {/* MODE 2: RESET PASSWORD */}
          {mode === 'reset' && (
            <div className="space-y-4">
              {resetStep === 'send_link' ? (
                <form onSubmit={handleSendResetLink} className="space-y-3.5" noValidate>
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 text-xs text-amber-950 font-sans leading-snug">
                    Enter your <strong>Username</strong> and registered{' '}
                    <strong>Email Address</strong> to verify your account and receive a password
                    reset link.
                  </div>

                  <div>
                    <label
                      htmlFor="auth-reset-username"
                      className="block text-xs font-bold text-stone-800 mb-1"
                    >
                      Username
                    </label>
                    <div className="relative">
                      <input
                        id="auth-reset-username"
                        type="text"
                        value={resetUsername}
                        onChange={(e) => setResetUsername(e.target.value)}
                        placeholder="Enter your username"
                        autoComplete="username"
                        className="w-full pl-10 pr-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:border-amber-500 focus:outline-none bg-stone-50 focus:bg-white transition"
                        required
                      />
                      <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="auth-reset-email"
                      className="block text-xs font-bold text-stone-800 mb-1"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        id="auth-reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="Enter your registered email address"
                        autoComplete="email"
                        className="w-full pl-10 pr-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:border-amber-500 focus:outline-none bg-stone-50 focus:bg-white transition"
                        required
                      />
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    </div>
                    <p className="text-[11px] text-stone-500 leading-tight mt-1">
                      Note: Password reset is only permitted using the Email Address registered
                      to your account.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-stone-950 font-bold rounded-2xl shadow-lg cursor-pointer text-sm flex items-center justify-center gap-2 transition active:scale-98"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{isSubmitting ? 'Sending Reset Link...' : 'Send Reset Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5" noValidate>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5 text-xs text-emerald-950 font-sans leading-snug">
                    Account verified for <strong>{resetUsername}</strong> ({resetEmail}). Enter
                    and confirm your new password below.
                  </div>

                  <div>
                    <label
                      htmlFor="auth-new-password"
                      className="block text-xs font-bold text-stone-800 mb-1.5"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="auth-new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min. 4 characters)"
                        autoComplete="new-password"
                        className="w-full pl-10 pr-10 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:border-emerald-600 focus:outline-none bg-stone-50 focus:bg-white transition"
                        required
                      />
                      <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer p-0.5"
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="auth-confirm-new-password"
                      className="block text-xs font-bold text-stone-800 mb-1.5"
                    >
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        id="auth-confirm-new-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Re-enter your new password"
                        autoComplete="new-password"
                        className="w-full pl-10 pr-10 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:border-emerald-600 focus:outline-none bg-stone-50 focus:bg-white transition"
                        required
                      />
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer p-0.5"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold rounded-2xl shadow-lg cursor-pointer text-sm flex items-center justify-center gap-2 transition active:scale-98"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{isSubmitting ? 'Resetting Password...' : 'Reset Password'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
