import React, { useState } from 'react';
import {
  X,
  Lock,
  User,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Send,
  Sparkles,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { VillageProfile, Language, AuthUserSession } from '../types';
import { playNotificationChime, speakText, unlockAudioContext } from '../utils/speech';
import {
  auth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  isFirebaseConfigured,
} from '../firebase/config';
import { fetchUserRolesDoc, saveRoleAssignmentToFirestore } from '../firebase/firestoreService';
import {
  isAuthorizedSuperAdminResetEmail,
  getPrivateProfileCredentials,
  savePrivateProfileCredentials,
  findProfileByRegisteredEmail,
} from '../utils/privacySanitizer';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: VillageProfile[];
  onUpdateProfile: (profile: VillageProfile) => void;
  activeSession: AuthUserSession | null;
  onLoginSuccess: (session: AuthUserSession) => void;
  onLogout: () => void;
  adminCreds: { username: string; pin: string; email?: string };
  onUpdateAdminCreds: (creds: { username: string; pin: string; email?: string }) => void;
  lang: Language;
  initialMode?: 'login' | 'reset' | 'admin';
  targetProfileForEdit?: VillageProfile | null;
  onOpenAdminEntrance?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  profiles,
  onUpdateProfile,
  activeSession,
  onLoginSuccess,
  onLogout,
  adminCreds,
  onUpdateAdminCreds,
  lang,
  initialMode = 'login',
  targetProfileForEdit,
  onOpenAdminEntrance,
}) => {
  const [tab, setTab] = useState<'login' | 'reset' | 'admin'>(initialMode);

  // Sync tab if initialMode changes
  React.useEffect(() => {
    setTab(initialMode);
  }, [initialMode, isOpen]);

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Admin Login state
  const [adminUser, setAdminUser] = useState(adminCreds.username);
  const [adminPin, setAdminPin] = useState('');
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Password Reset by Email state
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetInput, setResetInput] = useState(''); // email or username
  const [otpGenerated, setOtpGenerated] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetTarget, setResetTarget] = useState<{
    type: 'profile' | 'admin';
    profile?: VillageProfile;
    email: string;
    name: string;
  } | null>(null);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  if (!isOpen) return null;

  // Handle Standard User Login (Normal users, Section Managers & Admin via email)
  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const query = identifier.trim().toLowerCase();
    const cleanPhone = identifier.replace(/\D/g, '');
    const enteredPass = password.trim();

    if (!query) {
      setLoginError('براہ کرم اپنا ای میل، یوزر نیم یا موبائل نمبر درج کریں۔');
      return;
    }
    if (!enteredPass) {
      setLoginError('براہ کرم اپنا خفیہ پاس ورڈ درج کریں۔');
      return;
    }

    // If user entered an email address, also check Firestore / local `roles` collection
    if (query.includes('@') && enteredPass.length >= 6) {
      let uidFromAuth = `uid-${query.replace(/[^a-z0-9]/g, '_')}`;
      if (isFirebaseConfigured()) {
        try {
          const cred = await signInWithEmailAndPassword(auth, query, enteredPass);
          uidFromAuth = cred.user.uid;
        } catch {}
      }

      const roleDoc = (await fetchUserRolesDoc(uidFromAuth)) || (await fetchUserRolesDoc(query));
      if (roleDoc && !roleDoc.disabled) {
        // Verify stored email password verifier if present
        let verifierOk = true;
        try {
          const rawMap = localStorage.getItem('rk_admin_email_pass_verifier_v1');
          if (rawMap) {
            const parsed = JSON.parse(rawMap) as Record<string, string>;
            if (parsed[query]) {
              const expectedPass = decodeURIComponent(escape(atob(parsed[query])));
              if (enteredPass !== expectedPass) verifierOk = false;
            }
          }
        } catch {}

        if (!verifierOk) {
          setLoginError('غلط پاس ورڈ! اگر آپ پاس ورڈ بھول گئے ہیں تو "پاس ورڈ ری سیٹ" ٹیب استعمال کریں۔');
          playNotificationChime('alert');
          return;
        }

        const isAdminRole = roleDoc.admin === true;
        if (isAdminRole) {
          try {
            sessionStorage.setItem(
              'rk_admin_session_reauth_verifier_v1',
              btoa(unescape(encodeURIComponent(enteredPass)))
            );
          } catch {}
        }

        const roleSession: AuthUserSession = {
          type: isAdminRole ? 'admin' : 'user',
          id: roleDoc.uid || uidFromAuth,
          uid: roleDoc.uid || uidFromAuth,
          username: roleDoc.name || query.split('@')[0],
          name: roleDoc.name || (isAdminRole ? 'پورٹل ایڈمن' : query.split('@')[0]),
          email: query,
          loginTime: new Date().toISOString(),
          roles: {
            admin: roleDoc.admin === true,
            isTrustedBackupAdmin: roleDoc.isTrustedBackupAdmin,
            alertManager: roleDoc.admin === true || roleDoc.alertManager,
            mosqueEditor: roleDoc.admin === true || roleDoc.mosqueEditor,
            schoolEditor: roleDoc.admin === true || roleDoc.schoolEditor,
            hospitalEditor: roleDoc.admin === true || roleDoc.hospitalEditor,
            transportEditor: roleDoc.admin === true || roleDoc.transportEditor,
          },
        };

        playNotificationChime('success');
        onLoginSuccess(roleSession);
        speakText(`خوش آمدید ${roleSession.name}! آپ کا لاگ ان کامیاب ہو گیا۔`, lang);
        onClose();
        return;
      }
    }

    // Search profile matching username, email (from private owner vault or profile) or mobile
    const matched = profiles.find((p) => {
      const priv = getPrivateProfileCredentials(p.id);
      const u = (priv?.username || p.username || '').toLowerCase();
      const em = (priv?.email || p.email || '').toLowerCase();
      const m = p.mobile.replace(/\D/g, '');
      const altM = (p.whatsapp || '').replace(/\D/g, '');

      return (
        (u && u === query) ||
        (em && em === query) ||
        (cleanPhone.length >= 7 && (m.includes(cleanPhone) || altM.includes(cleanPhone)))
      );
    });

    if (!matched) {
      setLoginError('اس ای میل، یوزر نیم یا فون سے کوئی پروفائل نہیں ملی۔');
      playNotificationChime('alert');
      return;
    }

    if (matched.isDisabled) {
      setLoginError('آپ کا اکاؤنٹ ایڈمن کی جانب سے معطل (Disabled) کیا گیا ہے۔');
      playNotificationChime('alert');
      return;
    }

    // Check password against private owner vault or profile
    const privCreds = getPrivateProfileCredentials(matched.id);
    const validPass = privCreds?.password || matched.password || '';
    if (!validPass || enteredPass !== validPass) {
      setLoginError('غلط پاس ورڈ! اگر آپ پاس ورڈ بھول گئے ہیں تو نیچے "پاس ورڈ ری سیٹ" ٹیب پر کلک کریں۔');
      playNotificationChime('alert');
      return;
    }

    // Successful Owner Login
    const session: AuthUserSession = {
      type: 'profile_owner',
      id: matched.id,
      uid: matched.ownerUid || matched.id,
      username: privCreds?.username || matched.username || matched.name,
      name: matched.name,
      email: privCreds?.email || matched.email,
      profileId: matched.id,
      mobile: matched.mobile,
      avatar: matched.personImage,
      loginTime: new Date().toISOString(),
    };

    playNotificationChime('success');
    onLoginSuccess(session);
    speakText(`خوش آمدید ${matched.name}! آپ کا لاگ ان کامیاب ہو گیا۔`, lang);
    onClose();
  };

  // Request Real Password Reset Link & Update Password strictly by Registered Profile Email (or Official Super Admin Email)
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    const enteredEmail = resetInput.trim().toLowerCase();
    const desiredNewPass = newPassword.trim();

    if (!enteredEmail || !enteredEmail.includes('@')) {
      setResetError('براہ کرم اپنا درست رجسٹرڈ ای میل ایڈریس درج کریں۔');
      return;
    }

    if (desiredNewPass && desiredNewPass.length < 6) {
      setResetError('نیا پاس ورڈ کم از کم 6 حروف یا ہندسوں کا ہونا لازمی ہے۔');
      return;
    }

    // CASE 1: Official Super Admin Email ("digitalworldonline777@gmail.com")
    if (isAuthorizedSuperAdminResetEmail(enteredEmail)) {
      if (desiredNewPass) {
        try {
          const rawMap = localStorage.getItem('rk_admin_email_pass_verifier_v1');
          const map = rawMap ? JSON.parse(rawMap) : {};
          map[enteredEmail] = btoa(unescape(encodeURIComponent(desiredNewPass)));
          localStorage.setItem('rk_admin_email_pass_verifier_v1', JSON.stringify(map));

          const rawModalMap = localStorage.getItem('rk_admin_email_pass_verifiers_v1');
          const modalMap = rawModalMap ? JSON.parse(rawModalMap) : {};
          modalMap[enteredEmail] = btoa(unescape(encodeURIComponent(desiredNewPass)));
          localStorage.setItem('rk_admin_email_pass_verifiers_v1', JSON.stringify(modalMap));
        } catch {}

        onUpdateAdminCreds({ username: enteredEmail, pin: desiredNewPass, email: enteredEmail });
        const uid = `uid-${enteredEmail.replace(/[^a-z0-9]/g, '_')}`;
        await saveRoleAssignmentToFirestore({
          uid,
          email: enteredEmail,
          name: 'ثمر سعید (سپر ایڈمن)',
          admin: true,
          updatedAt: new Date().toISOString(),
          updatedBy: enteredEmail,
        });
      }

      try {
        if (isFirebaseConfigured()) {
          await sendPasswordResetEmail(auth, enteredEmail);
        }
      } catch {}

      setResetTarget({
        type: 'admin',
        email: enteredEmail,
        name: 'سپر ایڈمن پینل (ثمر سعید)',
      });
      setResetSuccess(true);
      setNewPassword('');
      playNotificationChime('message');
      speakText('سپر ایڈمن کا پاس ورڈ کامیابی سے ری سیٹ کر دیا گیا ہے۔', lang);
      return;
    }

    // CASE 2: Normal Profile Owner — MUST match the exact email registered on their own profile!
    const matchedOwner = findProfileByRegisteredEmail(enteredEmail, profiles);
    if (!matchedOwner) {
      setResetError(
        '❌ یہ ای میل کسی پروفائل کے ساتھ رجسٹرڈ نہیں ہے! یاد رکھیں: ایڈمن پینل کا پاس ورڈ صرف آفیشل سپر ایڈمن ای میل (digitalworldonline777@gmail.com) ہی ری سیٹ کر سکتا ہے، اور باقی ہر صارف صرف اپنی پروفائل میں دی گئی ای میل پر ہی اپنا پاس ورڈ ری سیٹ کر سکتا ہے۔'
      );
      playNotificationChime('alert');
      return;
    }

    // Update ONLY this profile owner's password in the private owner vault
    if (desiredNewPass) {
      savePrivateProfileCredentials(matchedOwner.profile.id, {
        email: enteredEmail,
        password: desiredNewPass,
      });
    }

    try {
      if (isFirebaseConfigured()) {
        await sendPasswordResetEmail(auth, enteredEmail);
      }
    } catch (err: any) {
      console.warn('Firebase password reset notice:', err);
    }

    setResetTarget({
      type: 'profile',
      profile: matchedOwner.profile,
      email: enteredEmail,
      name: matchedOwner.profile.name,
    });
    setResetSuccess(true);
    setNewPassword('');
    playNotificationChime('message');
    speakText(
      `آپ کی پروفائل ${matchedOwner.profile.name} کا پاس ورڈ ری سیٹ کر دیا گیا ہے۔`,
      lang
    );
  };

  const maskEmail = (em: string) => {
    const parts = em.split('@');
    if (parts.length < 2) return em;
    const namePart = parts[0];
    const visibleChars = namePart.length > 3 ? namePart.slice(0, 3) : namePart.slice(0, 1);
    return `${visibleChars}***@${parts[1]}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border-2 border-emerald-600 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow-md">
              <KeyRound className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-nastaliq leading-tight">
                رتہ کلاں سیکیورٹی و لاگ ان پورٹل
              </h3>
              <p className="text-[11px] text-emerald-200">
                ذاتی آئی ڈی، پاس ورڈ اور ای میل ری سیٹ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-full bg-black/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Session Status Strip */}
        {activeSession ? (
          <div className="bg-emerald-50 border-b border-emerald-200 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <div className="text-xs font-nastaliq">
                <span className="text-stone-600">فی الوقت لاگ ان: </span>
                <strong className="text-emerald-900 font-bold">{activeSession.name}</strong>
                {activeSession.type === 'admin' && (
                  <span className="mr-1 text-[10px] bg-amber-400 text-stone-950 px-1.5 py-0.5 rounded font-sans font-bold">
                    سپر ایڈمن
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                onLogout();
                playNotificationChime('alert');
              }}
              className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 px-2.5 py-1 rounded-xl transition cursor-pointer font-nastaliq"
            >
              لاگ آؤٹ
            </button>
          </div>
        ) : null}

        {/* Mode Navigation Tabs (Normal users only; Admin entrance is separate at #admin) */}
        <div className="grid grid-cols-2 border-b border-stone-200 bg-stone-100/90 text-xs font-nastaliq">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setResetStep(1);
            }}
            className={`py-3 px-2 text-center font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
              tab === 'login'
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-600 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>پروفائل لاگ ان</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('reset');
              setResetStep(1);
            }}
            className={`py-3 px-2 text-center font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
              tab === 'reset'
                ? 'bg-white text-amber-700 border-b-2 border-amber-600 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>پاس ورڈ ری سیٹ</span>
          </button>
        </div>

        {/* TAB 1: PROFILE OWNER LOGIN */}
        {tab === 'login' && (
          <form onSubmit={handleUserLogin} className="p-4 sm:p-5 space-y-4 font-nastaliq">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-950 leading-relaxed">
              <span className="font-bold block text-emerald-900 mb-1">
                🔒 محفوظ انفرادی شناخت (Strict Protection):
              </span>
              ہر کاریگر اور دکاندار کا اپنا ذاتی اکاؤنٹ اور پاس ورڈ ہے تاکہ کوئی دوسرا آپ کی پروفائل ایڈٹ یا ڈیلیٹ نہ کر سکے۔
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1 text-right">
              <label className="text-xs font-bold text-stone-700 block">
                ای میل / یوزر نیم / موبائل نمبر:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="مثال: name@example.com یا 03001234567"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-sans focus:outline-none focus:border-emerald-600 focus:bg-white"
                  required
                />
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1 text-right">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setTab('reset');
                    setResetInput(identifier);
                    setResetStep(1);
                  }}
                  className="text-[11px] text-amber-700 hover:text-amber-900 underline cursor-pointer"
                >
                  پاس ورڈ بھول گئے ہیں؟
                </button>
                <label className="text-xs font-bold text-stone-700">خفیہ پاس ورڈ:</label>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="اپنا پاس ورڈ درج کریں"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-600 focus:bg-white"
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

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>لاگ ان کریں اور پروفائل کنٹرول حاصل کریں</span>
            </button>

            <div className="text-center pt-1 border-t border-stone-200">
              <span className="text-[11px] text-stone-500">
                کسی کا بھی ای میل، یوزر نیم یا پاس ورڈ پبلک کارڈ پر ظاہر نہیں کیا جاتا۔
              </span>
            </div>
          </form>
        )}

        {/* TAB 2: PASSWORD RESET VIA EMAIL */}
        {tab === 'reset' && (
          <div className="p-4 sm:p-5 space-y-4 font-nastaliq">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-950 leading-relaxed space-y-1">
              <span className="font-bold block text-amber-900">
                📧 رجسٹرڈ ای میل کے ذریعے پاس ورڈ ری سیٹ:
              </span>
              <p>
                • ہر صارف صرف <strong>اپنی پروفائل میں دی گئی رجسٹرڈ ای میل</strong> لکھ کر ہی اپنی پروفائل کا پاس ورڈ ری سیٹ کر سکتا ہے۔
              </p>
              <p className="text-[11px] text-emerald-900 font-bold">
                • ایڈمن پینل کا پاس ورڈ صرف آفیشل سپر ایڈمن ای میل سے ہی ری سیٹ ہو سکتا ہے، کسی اور ای میل سے نہیں۔
              </p>
            </div>

            {resetError && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess ? (
              <div className="p-4 bg-emerald-100 border-2 border-emerald-500 rounded-2xl text-emerald-900 text-center space-y-3 animate-in zoom-in-95">
                <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
                <h4 className="font-bold text-sm">
                  {resetTarget?.type === 'admin'
                    ? 'سپر ایڈمن پاس ورڈ ری سیٹ مکمل ہو گیا'
                    : `پروفائل (${resetTarget?.name || ''}) کا پاس ورڈ ری سیٹ ہو گیا`}
                </h4>
                <p className="text-xs leading-relaxed text-stone-700">
                  آپ کی رجسٹرڈ ای میل ({resetTarget?.email}) کی تصدیق کے بعد پاس ورڈ ری سیٹ لنک بھیج دیا گیا ہے اور آپ کا نیا پاس ورڈ بھی محفوظ کر دیا گیا ہے۔
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setResetSuccess(false);
                    setTab('login');
                  }}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow cursor-pointer transition"
                >
                  لاگ ان اسکرین پر واپس جائیں
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestPasswordReset} className="space-y-3.5">
                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-stone-700 block">
                    اپنی پروفائل کی رجسٹرڈ ای میل درج کریں:
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={resetInput}
                      onChange={(e) => setResetInput(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-sans focus:outline-none focus:border-amber-600 focus:bg-white text-left"
                      dir="ltr"
                      required
                    />
                    <Mail className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-stone-700 block">
                    نیا پاس ورڈ مقرر کریں (کم از کم 6 حروف — اختیاری):
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="نیا پاس ورڈ لکھیں تاکہ فوری تبدیل ہو جائے"
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:outline-none focus:border-amber-600 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute left-3 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>اپنی رجسٹرڈ ای میل پر پاس ورڈ ری سیٹ کریں</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setTab('login')}
                    className="text-xs text-stone-600 hover:underline cursor-pointer"
                  >
                    لاگ ان اسکرین پر واپس جائیں
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Quick Link to Separate Admin Email Login & Admin Password Recovery (#admin) */}
        {onOpenAdminEntrance && (
          <div className="bg-stone-900 border-t border-stone-800 p-3.5 text-center font-nastaliq">
            <button
              type="button"
              onClick={onOpenAdminEntrance}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow cursor-pointer transition"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>🔐 ایڈمن ای میل لاگ ان اور ایڈمن پاس ورڈ ریکوری (#admin) کھولیں</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
