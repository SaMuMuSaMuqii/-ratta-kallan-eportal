import React, { useState } from 'react';
import {
  X,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { VillageProfile, Language, AuthUserSession } from '../types';
import { playNotificationChime, speakText } from '../utils/speech';

interface ProfileAuthChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: VillageProfile | null;
  actionType: 'edit' | 'delete';
  activeSession: AuthUserSession | null;
  adminCreds: { username: string; pin: string };
  onAuthorized: (profile: VillageProfile, action: 'edit' | 'delete') => void;
  onOpenForgotPassword: (profile: VillageProfile) => void;
  lang: Language;
}

export const ProfileAuthChallengeModal: React.FC<ProfileAuthChallengeModalProps> = ({
  isOpen,
  onClose,
  profile,
  actionType,
  activeSession,
  adminCreds,
  onAuthorized,
  onOpenForgotPassword,
  lang,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmDeleteStep, setConfirmDeleteStep] = useState(false);

  React.useEffect(() => {
    setPasswordInput('');
    setErrorMessage('');
    setConfirmDeleteStep(false);
  }, [isOpen, profile, actionType]);

  if (!isOpen || !profile) return null;

  // Check if current user is already authorized
  const isAlreadyOwner = activeSession && activeSession.profileId === profile.id;
  const isSuperAdmin = activeSession && activeSession.type === 'admin';

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const entered = passwordInput.trim();
    if (!entered) {
      setErrorMessage('براہ کرم پاس ورڈ درج کریں۔');
      return;
    }

    const validProfilePassword = profile.password || '';
    const isProfileMatch = validProfilePassword && entered === validProfilePassword;
    const isMasterMatch = activeSession?.type === 'admin' || Boolean(activeSession?.roles?.admin);

    if (isProfileMatch || isMasterMatch) {
      playNotificationChime('success');
      if (actionType === 'delete') {
        setConfirmDeleteStep(true);
      } else {
        onAuthorized(profile, 'edit');
        onClose();
      }
    } else {
      setErrorMessage('غلط پاس ورڈ! آپ کو یہ پروفائل تبدیل یا حذف کرنے کی اجازت نہیں ہے۔');
      playNotificationChime('alert');
      speakText('غلط پاس ورڈ ہے!', lang);
    }
  };

  const handleFinalDelete = () => {
    onAuthorized(profile, 'delete');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border-2 border-emerald-600 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className={`text-white p-4 flex items-center justify-between ${
            actionType === 'delete'
              ? 'bg-gradient-to-r from-red-950 via-red-900 to-stone-950'
              : 'bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              {actionType === 'delete' ? (
                <Trash2 className="w-5 h-5 text-red-300" />
              ) : (
                <Edit className="w-5 h-5 text-amber-300" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold font-nastaliq leading-tight">
                {actionType === 'delete' ? 'پروفائل حذف کرنے کی تصدیق' : 'پروفائل میں ترمیم کی اجازت'}
              </h3>
              <p className="text-[11px] text-stone-300 font-nastaliq">
                صرف متعلقہ کاریگر یا سپر ایڈمن کو اختیار ہے
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-300 hover:text-white rounded-full bg-black/20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 font-nastaliq">
          {/* Target Profile summary (Name & Business, strictly NO username or password visible) */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 flex items-center gap-3">
            <img
              src={profile.personImage}
              alt={profile.name}
              className="w-12 h-12 rounded-xl object-cover border border-amber-400 bg-stone-200 shrink-0"
            />
            <div className="text-right">
              <h4 className="font-bold text-stone-900 text-sm leading-tight">{profile.name}</h4>
              <p className="text-xs text-emerald-800 font-semibold">{profile.businessName}</p>
              <p className="text-[11px] text-stone-500 font-mono">{profile.mobile}</p>
            </div>
          </div>

          {confirmDeleteStep ? (
            <div className="space-y-4 text-center">
              <div className="p-3 bg-red-50 border-2 border-red-300 rounded-2xl text-red-900 text-xs leading-relaxed">
                <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-1.5 animate-bounce" />
                <strong className="block text-sm mb-1">کیا آپ واقعی یہ پروفائل حذف کرنا چاہتے ہیں؟</strong>
                <span>یہ عمل ناقابلِ واپسی ہے اور اس کاریگر کا تمام ریکارڈ پورٹل سے مٹ جائے گا۔</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteStep(false)}
                  className="flex-1 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold cursor-pointer"
                >
                  منسوخ کریں
                </button>
                <button
                  type="button"
                  onClick={handleFinalDelete}
                  className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ہاں، مکمل حذف کریں</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-3.5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 leading-relaxed">
                اس پروفائل کی معلومات تبدیل یا حذف کرنے کے لیے پروفائل کا محفوظ پاس ورڈ درج کریں۔
              </div>

              {errorMessage && (
                <div className="p-2.5 bg-red-50 border border-red-300 text-red-700 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1 text-right">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenForgotPassword(profile);
                    }}
                    className="text-[11px] text-amber-700 hover:text-amber-900 underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>پاس ورڈ بھول گئے؟ ای میل سے ری سیٹ کریں</span>
                  </button>
                  <label className="text-xs font-bold text-stone-700">پاس ورڈ درج کریں:</label>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="پروفائل پاس ورڈ"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-600 focus:bg-white"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute left-3 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold cursor-pointer"
                >
                  منسوخ کریں
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer ${
                    actionType === 'delete'
                      ? 'bg-red-700 hover:bg-red-800'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>تصدیق کریں اور آگے بڑھیں</span>
                </button>
              </div>

              <div className="text-center pt-1 border-t border-stone-200">
                <span className="text-[10px] text-stone-400">
                  سیکیورٹی پروٹیکشن: کسی کا پاس ورڈ یا یوزر نیم کارڈ پر ظاہر نہیں ہوتا۔
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
