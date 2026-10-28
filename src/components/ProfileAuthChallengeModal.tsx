import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  KeyRound,
  AlertTriangle,
  ShieldCheck,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  RefreshCw,
  LogIn,
  ArrowLeft,
} from 'lucide-react';
import { VillageProfile, AuthUserSession, Language } from '../types';
import {
  verifyOwnerPasswordInVault,
  verifySuperAdminPasswordOnly,
} from '../utils/privacySanitizer';

interface ProfileAuthChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: VillageProfile | null;
  actionType: 'edit' | 'delete';
  activeSession?: AuthUserSession | null;
  adminPassword?: string;
  adminCreds?: { username: string; pin?: string; password?: string; email?: string };
  onAuthorized: (profile: VillageProfile, action: 'edit' | 'delete') => void;
  onOpenForgotPassword: (profile?: VillageProfile) => void;
  lang?: Language;
}

export const ProfileAuthChallengeModal: React.FC<ProfileAuthChallengeModalProps> = ({
  isOpen,
  onClose,
  profile,
  actionType,
  adminPassword,
  adminCreds,
  onAuthorized,
  onOpenForgotPassword,
}) => {
  const [enteredUsername, setEnteredUsername] = useState('');
  const [enteredPassword, setEnteredPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isConfirmStep, setIsConfirmStep] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (isOpen && profile) {
      setEnteredUsername(profile.username || profile.name);
      setEnteredPassword('');
      setErrorMsg('');
      setIsConfirmStep(false);
      setIsVerifying(false);
    }
  }, [isOpen, profile]);

  if (!isOpen || !profile) return null;

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPass = enteredPassword.trim();
    if (!cleanPass) {
      setErrorMsg('Please enter your Password to continue.');
      return;
    }

    setIsVerifying(true);
    try {
      const isProfileMatch = await verifyOwnerPasswordInVault(
        profile.id,
        cleanPass,
        profile.password
      );
      const effectiveAdminPass = (adminPassword || adminCreds?.password || adminCreds?.pin || '').trim();
      const isAdminMatch =
        Boolean(effectiveAdminPass && cleanPass === effectiveAdminPass) ||
        verifySuperAdminPasswordOnly(cleanPass, adminCreds);

      if (!isProfileMatch && !isAdminMatch) {
        setErrorMsg(
          'Incorrect Password. Only the account owner or Super Admin can modify or delete this profile.'
        );
        return;
      }

      setIsConfirmStep(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmFinalAction = () => {
    onAuthorized(profile, actionType);
    onClose();
  };

  return (
    <div
      dir="ltr"
      lang="en"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto font-sans text-left"
    >
      <div className="bg-white border-2 border-emerald-600 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className={`p-4 text-white flex items-center justify-between border-b-2 border-amber-400 ${
            actionType === 'delete'
              ? 'bg-gradient-to-r from-red-950 via-red-900 to-rose-950'
              : 'bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow">
              {actionType === 'delete' ? (
                <Trash2 className="w-5 h-5" />
              ) : (
                <Edit className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold font-sans leading-tight tracking-tight">
                {actionType === 'delete'
                  ? 'Authentication Required to Delete'
                  : 'Authentication Required to Edit'}
              </h3>
              <p className="text-xs text-amber-200 font-sans leading-tight mt-0.5">
                Account Verification for {profile.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-full bg-black/20 cursor-pointer"
            title="Close verification dialog"
            aria-label="Close verification dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Profile Summary Box */}
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200">
            <img
              src={profile.personImage}
              alt={profile.name}
              className="w-12 h-12 rounded-xl object-cover border border-emerald-500 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-stone-900 truncate">{profile.name}</h4>
              <p className="text-xs text-stone-500 truncate">{profile.businessName}</p>
            </div>
          </div>

          {!isConfirmStep ? (
            <form onSubmit={handleVerifyPassword} className="space-y-3.5" noValidate>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 text-xs text-amber-950 font-sans leading-snug flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  This account is password-protected. Please enter your{' '}
                  <strong>Username</strong> and <strong>Password</strong> to verify ownership.
                </span>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="p-3 bg-red-50 border border-red-300 rounded-2xl text-red-700 text-xs font-bold flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="challenge-username"
                  className="block text-xs font-bold text-stone-800 mb-1.5"
                >
                  Username
                </label>
                <input
                  id="challenge-username"
                  type="text"
                  value={enteredUsername}
                  onChange={(e) => setEnteredUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  className="w-full px-3.5 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:border-emerald-600 focus:outline-none bg-stone-50 focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="challenge-password"
                    className="block text-xs font-bold text-stone-800"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenForgotPassword(profile);
                    }}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Forgot Password?</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    id="challenge-password"
                    type={showPassword ? 'text' : 'password'}
                    value={enteredPassword}
                    onChange={(e) => setEnteredPassword(e.target.value)}
                    placeholder="Enter your account password"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 border-2 border-stone-200 rounded-xl text-sm focus:border-emerald-600 focus:outline-none bg-stone-50 focus:bg-white transition"
                    autoFocus
                    required
                  />
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isVerifying}
                  className={`flex-1 py-3 font-bold rounded-2xl text-white shadow-lg cursor-pointer text-sm flex items-center justify-center gap-2 transition ${
                    actionType === 'delete'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isVerifying ? 'Verifying...' : 'Sign In'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-2xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* Step 2: Confirmation After Authentication */
            <div className="space-y-4 text-center py-2 animate-in fade-in">
              <div
                className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
                  actionType === 'delete'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {actionType === 'delete' ? (
                  <AlertTriangle className="w-7 h-7" />
                ) : (
                  <ShieldCheck className="w-7 h-7" />
                )}
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-base text-stone-900 font-sans leading-tight tracking-tight">
                  {actionType === 'delete'
                    ? 'Are you sure you want to delete this profile?'
                    : 'Authentication Successful! Proceed to Edit?'}
                </h4>
                <p className="text-xs text-stone-600 font-sans leading-snug">
                  {actionType === 'delete'
                    ? `Deleting the profile for "${profile.name}" will remove it from the directory.`
                    : `Your Password has been verified. You can now edit the profile details for "${profile.name}".`}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmFinalAction}
                  className={`flex-1 py-3 font-bold rounded-2xl text-white shadow-lg cursor-pointer text-xs transition ${
                    actionType === 'delete'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  {actionType === 'delete'
                    ? 'Yes, Delete Profile'
                    : 'Continue to Edit Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmStep(false)}
                  className="px-4 py-3 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-2xl text-xs cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
