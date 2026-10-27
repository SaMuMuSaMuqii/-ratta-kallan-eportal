import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Plus,
  Volume2,
  FileDown,
  FileUp,
  KeyRound,
  Megaphone,
  Calendar,
  Clock,
  MapPin,
  Settings,
  Image as ImageIcon,
  Upload,
  Compass,
  GraduationCap,
  Bus,
  Edit,
  Save,
  Copy,
  Check,
  Phone,
  User,
  RotateCcw,
  HeartPulse,
  Stethoscope,
  Mail,
  Play,
  Pause,
} from 'lucide-react';
import {
  VillageProfile,
  VillageMessage,
  VillageAnnouncement,
  VillageNewsEvent,
  VillageMosque,
  VillageInstitute,
  VillageTransport,
  VillageHospital,
  EventCategory,
  Language,
  AdminAlertItem,
  DeletedMessageArchiveItem,
  AuthUserSession,
} from '../types';
import { translations } from '../data/translations';
import { speakText } from '../utils/speech';
import {
  compressBannerImageToUnder80KB,
  saveBannerSlideImageDoc,
  getBannerSlideImageDoc,
  deleteBannerSlideImageDoc,
  fetchUserRolesDoc,
  saveRoleAssignmentToFirestore,
} from '../firebase/firestoreService';
import { auth, isFirebaseConfigured } from '../firebase/config';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import {
  isAuthorizedSuperAdminResetEmail,
  getSuperAdminCredentials,
  saveSuperAdminCredentials,
  verifySuperAdminCredentials,
  STORAGE_SUPER_ADMIN_CREDS_V2_KEY,
} from '../utils/privacySanitizer';
import { dispatchPasswordResetEmail } from '../firebase/emailNotificationService';

// Official Facebook Icon SVG
export const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const STORAGE_ADMIN_CREDS_KEY = STORAGE_SUPER_ADMIN_CREDS_V2_KEY;
const LOCAL_ADMIN_PASS_VERIFIER_MAP_KEY = 'rk_admin_email_pass_verifiers_v1';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSession?: AuthUserSession | null;
  onAdminLoginSuccess?: (session: AuthUserSession) => void;
  onOpenFullSupervision?: () => void;
  profiles: VillageProfile[];
  messages: VillageMessage[];
  announcements: VillageAnnouncement[];
  newsEvents: VillageNewsEvent[];
  mosques: VillageMosque[];
  institutes: VillageInstitute[];
  transports?: VillageTransport[];
  hospitals?: VillageHospital[];
  alerts?: AdminAlertItem[];
  facebookPageUrl: string;
  onUpdateFacebookPageUrl: (url: string) => void;
  villageBgImage: string;
  onUpdateVillageBgImage: (url: string) => void;
  onToggleVerifyProfile: (id: string) => void;
  onDeleteProfile: (id: string) => void;
  onSaveProfile?: (profile: VillageProfile) => void;
  onAddNewsEvent: (
    event: Omit<VillageNewsEvent, 'id' | 'createdAt' | 'author'>,
    compressedBannerDoc?: { dataUrl: string; width: number; height: number; byteSize: number } | null
  ) => void;
  onUpdateNewsEvent?: (event: VillageNewsEvent) => void;
  onBannerImagesChanged?: () => void;
  onDeleteNewsEvent: (id: string) => void;
  onTogglePopupNewsEvent: (id: string) => void;
  onUpdateMosqueCredentials?: (id: string, username: string, pass: string) => void;
  onUpdateInstituteCredentials?: (id: string, username: string, pass: string) => void;
  onSaveMosque?: (mosque: VillageMosque) => void;
  onDeleteMosque?: (id: string) => void;
  onSaveInstitute?: (institute: VillageInstitute) => void;
  onDeleteInstitute?: (id: string) => void;
  onSaveTransport?: (transport: VillageTransport) => void;
  onDeleteTransport?: (id: string) => void;
  onSaveHospital?: (hospital: VillageHospital) => void;
  onDeleteHospital?: (id: string) => void;
  onDeleteMessage?: (id: string) => void;
  deletedMessagesArchive?: DeletedMessageArchiveItem[];
  onRestoreDeletedMessage?: (archiveId: string) => void;
  onPermanentDeleteArchivedMessage?: (archiveId: string) => void;
  onResolveAlert?: (id: string) => void;
  onDeleteAlert?: (id: string) => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  lang: Language;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  activeSession,
  onAdminLoginSuccess,
  onOpenFullSupervision,
  profiles,
  messages,
  newsEvents,
  mosques,
  institutes,
  transports = [],
  hospitals = [],
  alerts = [],
  deletedMessagesArchive = [],
  onRestoreDeletedMessage,
  onPermanentDeleteArchivedMessage,
  facebookPageUrl,
  onUpdateFacebookPageUrl,
  villageBgImage,
  onUpdateVillageBgImage,
  onToggleVerifyProfile,
  onDeleteProfile,
  onSaveProfile,
  onAddNewsEvent,
  onUpdateNewsEvent,
  onBannerImagesChanged,
  onDeleteNewsEvent,
  onTogglePopupNewsEvent,
  onUpdateMosqueCredentials,
  onUpdateInstituteCredentials,
  onSaveMosque,
  onDeleteMosque,
  onSaveInstitute,
  onDeleteInstitute,
  onSaveTransport,
  onDeleteTransport,
  onSaveHospital,
  onDeleteHospital,
  onDeleteMessage,
  onResolveAlert,
  onDeleteAlert,
  onExportData,
  onImportData,
  lang,
}) => {
  const t = translations[lang];

  // Admin credentials in localStorage or config (never displayed in UI)
  const [adminCreds, setAdminCreds] = useState<{ username: string; pin: string }>(() =>
    getSuperAdminCredentials()
  );

  // Admin authentication state (Sign In + Reset Password)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authSubTab, setAuthSubTab] = useState<'email_login' | 'password_recovery'>('email_login');
  const [usernameInput, setUsernameInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [recoveryEmailInput, setRecoveryEmailInput] = useState('');
  const [recoveryNewPassInput, setRecoveryNewPassInput] = useState('');
  const [recoveryConfirmPassInput, setRecoveryConfirmPassInput] = useState('');
  const [recoveryNotice, setRecoveryNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [authError, setAuthError] = useState('');

  // Audio player for admin listening to messages & archives
  const [adminAudioId, setAdminAudioId] = useState<string | null>(null);
  const [adminAudioPlayer, setAdminAudioPlayer] = useState<HTMLAudioElement | null>(null);

  const handlePlayAdminAudio = (id: string, audioData: string) => {
    if (adminAudioId === id && adminAudioPlayer) {
      adminAudioPlayer.pause();
      setAdminAudioId(null);
      return;
    }
    if (adminAudioPlayer) {
      adminAudioPlayer.pause();
    }
    const audio = new Audio(audioData);
    setAdminAudioPlayer(audio);
    setAdminAudioId(id);
    audio.onended = () => setAdminAudioId(null);
    audio.onerror = () => setAdminAudioId(null);
    audio.play();
  };

  // Active tab in admin panel
  const [activeTab, setActiveTab] = useState<
    'alerts' | 'events' | 'profiles' | 'mosques' | 'institutes' | 'transports' | 'hospitals' | 'messages' | 'deleted_vault' | 'credentials' | 'settings' | 'admin_creds'
  >('events');

  // Edit states for inline admin modifications
  const [editingProfile, setEditingProfile] = useState<VillageProfile | null>(null);
  const [editingMosque, setEditingMosque] = useState<VillageMosque | null>(null);
  const [editingInstitute, setEditingInstitute] = useState<VillageInstitute | null>(null);
  const [editingTransport, setEditingTransport] = useState<VillageTransport | null>(null);
  const [editingHospital, setEditingHospital] = useState<VillageHospital | null>(null);

  // Super Admin credentials reset form (inputs start empty so credentials are never shown on screen)
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');
  const [confirmAdminPin, setConfirmAdminPin] = useState('');
  const [adminCredsError, setAdminCredsError] = useState('');
  const [adminCredsSuccess, setAdminCredsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (activeSession?.type === 'admin' || activeSession?.roles?.admin === true) {
        setIsAuthenticated(true);
      }
      setAdminCreds(getSuperAdminCredentials());
      setNewAdminUser('');
      setNewAdminPin('');
      setConfirmAdminPin('');
    }
  }, [isOpen, activeSession]);

  // New Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventCategory, setEventCategory] = useState<EventCategory>('general');
  const [eventContent, setEventContent] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('رتہ کلاں، جھنگ');
  const [isPopupOnLaunch, setIsPopupOnLaunch] = useState(true);
  const [newEventImageMode, setNewEventImageMode] = useState<'skip' | 'with_image'>('skip');
  const [newEventCompressedDoc, setNewEventCompressedDoc] = useState<{
    dataUrl: string;
    width: number;
    height: number;
    byteSize: number;
  } | null>(null);
  const [bannerStatusMsg, setBannerStatusMsg] = useState<string>('');

  // Facebook link form state
  const [fbInput, setFbInput] = useState(facebookPageUrl);
  const [fbSaveMsg, setFbSaveMsg] = useState(false);

  // Background Image State
  const [bgInput, setBgInput] = useState(villageBgImage);
  const [bgSaveMsg, setBgSaveMsg] = useState(false);

  // Copied indicator state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const enteredPin = pinInput.trim();
    const enteredUser = usernameInput.trim().toLowerCase();

    if (!enteredUser || !enteredPin) {
      setAuthError('Please enter both your Username and Password.');
      return;
    }

    // 1. Direct Super Admin Verification (digitalworldonline777@gmail.com + samumusa@1999 or updated password)
    if (verifySuperAdminCredentials(enteredUser, enteredPin, adminCreds)) {
      const uid = `uid-${enteredUser.replace(/[^a-z0-9]/g, '_')}`;
      setIsAuthenticated(true);
      setAuthError('');
      if (onAdminLoginSuccess) {
        onAdminLoginSuccess({
          type: 'admin',
          id: 'super-admin',
          uid,
          username: 'Super Admin',
          name: 'Samar Saeed (Super Admin)',
          email: adminCreds.username,
          loginTime: new Date().toISOString(),
          roles: {
            admin: true,
            alertManager: true,
            mosqueEditor: true,
            schoolEditor: true,
            hospitalEditor: true,
            transportEditor: true,
          },
        });
      }
      return;
    }

    // 2. Check Email + Password Login against Firebase Auth & `roles` collection / email verifier
    if (enteredUser.includes('@')) {
      if (isAuthorizedSuperAdminResetEmail(enteredUser)) {
        setAuthError(
          'Invalid Password. If you forgot your password, click "Forgot Password?" or "Reset Password" above.'
        );
        return;
      }

      let uid = `uid-${enteredUser.replace(/[^a-z0-9]/g, '_')}`;
      if (isFirebaseConfigured()) {
        try {
          const cred = await signInWithEmailAndPassword(auth, enteredUser, enteredPin);
          uid = cred.user.uid;
        } catch (err) {
          console.warn('Admin modal Firebase sign-in check:', err);
        }
      }

      // Check stored email verifier if set
      try {
        const rawMap = localStorage.getItem(LOCAL_ADMIN_PASS_VERIFIER_MAP_KEY);
        const map = rawMap ? JSON.parse(rawMap) : {};
        const savedEncoded = map[enteredUser];
        if (savedEncoded) {
          const expectedPass = decodeURIComponent(escape(atob(savedEncoded)));
          if (expectedPass !== enteredPin) {
            setAuthError(
              'Invalid Password. If you forgot your password, click "Forgot Password?" or "Reset Password" above.'
            );
            return;
          }
        }
      } catch {}

      const roleDoc = (await fetchUserRolesDoc(uid)) || (await fetchUserRolesDoc(enteredUser));
      if (roleDoc && roleDoc.admin === true && !roleDoc.disabled) {
        setIsAuthenticated(true);
        setAuthError('');
        if (onAdminLoginSuccess) {
          onAdminLoginSuccess({
            type: 'admin',
            id: roleDoc.uid || uid,
            uid: roleDoc.uid || uid,
            username: roleDoc.name || 'Portal Admin',
            name: roleDoc.name || 'Portal Admin',
            email: enteredUser,
            loginTime: new Date().toISOString(),
            roles: {
              admin: true,
              alertManager: true,
              mosqueEditor: true,
              schoolEditor: true,
              hospitalEditor: true,
              transportEditor: true,
            },
          });
        }
        return;
      }

      setAuthError(
        'Access Denied: This account does not have administrator privileges.'
      );
      return;
    }

    setAuthError(
      'Invalid Username or Password. Please verify your credentials or click "Forgot Password?" to reset.'
    );
  };

  // Handle Admin Password Recovery via Email Reset Link + New Password Setup
  const handleAdminPasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryNotice(null);
    const cleanEmail = (recoveryEmailInput || usernameInput).trim().toLowerCase();
    const newPass = recoveryNewPassInput.trim();
    const confirmPass = recoveryConfirmPassInput.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setRecoveryNotice({
        type: 'error',
        text: 'Please enter a valid Admin Email Address.',
      });
      return;
    }

    if (!isAuthorizedSuperAdminResetEmail(cleanEmail)) {
      setRecoveryNotice({
        type: 'error',
        text: 'Access Denied: Only the authorized Super Admin email address is permitted to reset the Admin password.',
      });
      return;
    }

    if (newPass) {
      if (newPass.length < 6) {
        setRecoveryNotice({
          type: 'error',
          text: 'New Password must be at least 6 characters long.',
        });
        return;
      }
      if (confirmPass && newPass !== confirmPass) {
        setRecoveryNotice({
          type: 'error',
          text: 'New Password and Confirm New Password do not match.',
        });
        return;
      }
    }

    // Save new recovery password & ensure role doc exists for this admin email
    if (newPass) {
      try {
        const rawMap = localStorage.getItem(LOCAL_ADMIN_PASS_VERIFIER_MAP_KEY);
        const map = rawMap ? JSON.parse(rawMap) : {};
        map[cleanEmail] = btoa(unescape(encodeURIComponent(newPass)));
        localStorage.setItem(LOCAL_ADMIN_PASS_VERIFIER_MAP_KEY, JSON.stringify(map));
      } catch {}

      saveSuperAdminCredentials({ username: cleanEmail, pin: newPass, email: cleanEmail });
      setAdminCreds(getSuperAdminCredentials());

      const uid = `uid-${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
      await saveRoleAssignmentToFirestore({
        uid,
        email: cleanEmail,
        name: 'Samar Saeed (Super Admin)',
        admin: true,
        updatedAt: new Date().toISOString(),
        updatedBy: 'super-admin',
      });

      setUsernameInput('');
      setPinInput('');
    }

    try {
      await dispatchPasswordResetEmail({
        email: cleanEmail,
        username: 'Super Admin',
        accountRole: 'Super Admin',
      });
      if (isFirebaseConfigured()) {
        await sendPasswordResetEmail(auth, cleanEmail);
      }
      setRecoveryNotice({
        type: 'success',
        text: newPass
          ? 'A password reset link has been sent and your New Password has been saved! Click "Back to Sign In" to sign in.'
          : 'A password reset link has been sent to your registered email address. Check your inbox or enter a New Password below.',
      });
    } catch {
      setRecoveryNotice({
        type: 'success',
        text: newPass
          ? 'Your Admin password has been reset successfully! Click "Back to Sign In" to sign in.'
          : 'Password reset request verified. You may also enter a New Password below to complete recovery.',
      });
    }
  };

  const handleResetAdminCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminCredsError('');
    setAdminCredsSuccess(false);
    const candidateEmail = newAdminUser.trim().toLowerCase();
    const cleanPass = newAdminPin.trim();
    const cleanConfirm = confirmAdminPin.trim();

    if (!candidateEmail || !cleanPass) {
      setAdminCredsError('Please enter both Email Address and New Password.');
      return;
    }
    if (!isAuthorizedSuperAdminResetEmail(candidateEmail)) {
      setAdminCredsError(
        'Access Denied: Only the authorized Super Admin email address is permitted to reset Admin credentials.'
      );
      return;
    }
    if (cleanPass.length < 4) {
      setAdminCredsError('New Password must be at least 4 characters long.');
      return;
    }
    if (cleanConfirm && cleanPass !== cleanConfirm) {
      setAdminCredsError('New Password and Confirm New Password do not match.');
      return;
    }
    saveSuperAdminCredentials({ username: candidateEmail, pin: cleanPass, email: candidateEmail });
    setAdminCreds(getSuperAdminCredentials());
    setNewAdminUser('');
    setNewAdminPin('');
    setConfirmAdminPin('');
    setAdminCredsSuccess(true);
    setTimeout(() => setAdminCredsSuccess(false), 3000);
  };

  const handleCopyCredentials = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleNewEventBannerFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressBannerImageToUnder80KB(file);
      setNewEventCompressedDoc(compressed);
      setNewEventImageMode('with_image');
      setBannerStatusMsg(
        `تصویر تیار ہے (${compressed.width}x${compressed.height} px، سائز: ${Math.round(
          compressed.byteSize / 1024
        )} KB — 80 KB سے کم)`
      );
    } catch (err) {
      console.error('Banner compress error:', err);
      setBannerStatusMsg('تصویر کمپریس کرنے میں مسئلہ پیش آیا۔');
    }
  };

  const handleExistingSlideUploadImage = async (
    ev: VillageNewsEvent,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressBannerImageToUnder80KB(file);
      await saveBannerSlideImageDoc(ev.id, {
        eventId: ev.id,
        imageData: compressed.dataUrl,
        width: compressed.width,
        height: compressed.height,
        byteSize: compressed.byteSize,
        updatedAt: new Date().toISOString(),
      });
      if (onUpdateNewsEvent) {
        onUpdateNewsEvent({
          ...ev,
          hasBannerImage: true,
          skipBannerImage: false,
          imageUrl: undefined,
        });
      }
      if (onBannerImagesChanged) onBannerImagesChanged();
      setBannerStatusMsg(
        `بینر "${ev.title}" کی تصویر محفوظ ہو گئی (${Math.round(compressed.byteSize / 1024)} KB — الگ چھوٹے ڈاکومنٹ میں)`
      );
    } catch (err) {
      console.error('Existing slide image upload error:', err);
      setBannerStatusMsg('بینر تصویر محفوظ کرنے میں مسئلہ پیش آیا۔');
    }
  };

  const handleExistingSlideSkipImage = async (ev: VillageNewsEvent) => {
    await deleteBannerSlideImageDoc(ev.id);
    if (onUpdateNewsEvent) {
      onUpdateNewsEvent({
        ...ev,
        hasBannerImage: false,
        skipBannerImage: true,
        imageUrl: undefined,
      });
    }
    if (onBannerImagesChanged) onBannerImagesChanged();
    setBannerStatusMsg(`بینر "${ev.title}" کو بغیر تصویر (صرف اردو تحریر اور رنگین بیک گراؤنڈ) پر سیٹ کر دیا گیا۔`);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventContent.trim()) return;

    const hasImg = newEventImageMode === 'with_image' && Boolean(newEventCompressedDoc);

    onAddNewsEvent(
      {
        title: eventTitle.trim(),
        category: eventCategory,
        content: eventContent.trim(),
        date: eventDate.trim() || 'آج کا دن',
        time: eventTime.trim(),
        location: eventLocation.trim() || 'رتہ کلاں جھنگ',
        hasBannerImage: hasImg,
        skipBannerImage: !hasImg,
        isPopupOnLaunch,
        voiceAudioText: `رتہ کلاں جھنگ خبر: ${eventTitle}۔ تاریخ: ${eventDate}۔ مقام: ${eventLocation}۔ تفصیل: ${eventContent}`,
      },
      hasImg ? newEventCompressedDoc : null
    );

    setEventTitle('');
    setEventContent('');
    setEventDate('');
    setEventTime('');
    setNewEventCompressedDoc(null);
    setNewEventImageMode('skip');
    setBannerStatusMsg('نیا بینر سلائیڈ کامیابی سے شائع ہو گیا!');
  };

  const handleSaveFacebookUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (fbInput.trim()) {
      onUpdateFacebookPageUrl(fbInput.trim());
      setFbSaveMsg(true);
      setTimeout(() => setFbSaveMsg(false), 2000);
    }
  };

  const handleBgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setBgInput(dataUrl);
      onUpdateVillageBgImage(dataUrl);
      setBgSaveMsg(true);
      setTimeout(() => setBgSaveMsg(false), 2000);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border-2 border-emerald-700 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-stone-900 text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold font-nastaliq">
                سپر ایڈمن کنٹرول پینل
              </h2>
              <p className="text-[11px] sm:text-xs text-amber-200">
                پورٹل کا تمام ڈیٹا، مساجد، اسکولز، گاڑیاں، ایڈمن پاس ورڈ ری سیٹ اور نگرانی
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-300 hover:text-white rounded-full bg-black/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Barrier: Admin Sign In & Password Reset */}
        {!isAuthenticated ? (
          <div
            dir="ltr"
            lang="en"
            className="p-5 sm:p-7 max-w-md w-full mx-auto text-left space-y-4 my-auto font-sans"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
              <KeyRound className="w-7 h-7" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg text-stone-900">
                Admin Sign In & Password Reset
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                Sign in with your Admin credentials or reset your password via your registered Email Address.
              </p>
            </div>

            {/* Sub-Tabs: Sign In vs Reset Password */}
            <div className="grid grid-cols-2 rounded-2xl overflow-hidden border border-emerald-700 bg-stone-100 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthSubTab('email_login');
                  setAuthError('');
                }}
                className={`py-2.5 px-2 cursor-pointer transition ${
                  authSubTab === 'email_login'
                    ? 'bg-emerald-800 text-white shadow'
                    : 'text-stone-700 hover:bg-stone-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthSubTab('password_recovery');
                  setRecoveryEmailInput(usernameInput.includes('@') ? usernameInput : '');
                  setRecoveryNotice(null);
                }}
                className={`py-2.5 px-2 cursor-pointer transition ${
                  authSubTab === 'password_recovery'
                    ? 'bg-amber-400 text-stone-950 shadow'
                    : 'text-stone-700 hover:bg-stone-200'
                }`}
              >
                Reset Password
              </button>
            </div>

            {authSubTab === 'email_login' ? (
              <form onSubmit={handleLogin} className="space-y-3 pt-1 text-left" noValidate>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Enter admin username or email address"
                    className="w-full text-left text-sm font-sans rounded-xl border border-stone-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-stone-50"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-800">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthSubTab('password_recovery');
                        setRecoveryEmailInput(usernameInput.includes('@') ? usernameInput : '');
                        setRecoveryNotice(null);
                      }}
                      className="text-xs text-amber-700 hover:text-amber-900 underline font-bold cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Enter your admin password"
                    className="w-full text-left text-sm font-sans rounded-xl border border-stone-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-stone-50"
                    required
                  />
                </div>

                {authError && (
                  <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-2.5 font-semibold">
                    {authError}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow cursor-pointer transition"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAdminPasswordRecovery} className="space-y-3 pt-1 text-left" noValidate>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-950 leading-relaxed">
                  Enter your authorized Admin <strong>Email Address</strong> to receive a password reset link, or set a <strong>New Password</strong> below.
                </div>

                {recoveryNotice && (
                  <div
                    role="alert"
                    className={`p-2.5 rounded-xl text-xs font-bold border ${
                      recoveryNotice.type === 'success'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                        : 'bg-red-50 border-red-300 text-red-800'
                    }`}
                  >
                    {recoveryNotice.text}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={recoveryEmailInput}
                    onChange={(e) => setRecoveryEmailInput(e.target.value)}
                    placeholder="Enter your admin email address"
                    className="w-full text-left text-sm font-sans rounded-xl border border-stone-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={recoveryNewPassInput}
                    onChange={(e) => setRecoveryNewPassInput(e.target.value)}
                    placeholder="Optional: Enter new password (min. 6 characters)"
                    className="w-full text-left text-sm font-sans rounded-xl border border-stone-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={recoveryConfirmPassInput}
                    onChange={(e) => setRecoveryConfirmPassInput(e.target.value)}
                    placeholder="Optional: Confirm your new password"
                    className="w-full text-left text-sm font-sans rounded-xl border border-stone-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold shadow cursor-pointer transition"
                >
                  Send Reset Link
                </button>

                <button
                  type="button"
                  onClick={() => setAuthSubTab('email_login')}
                  className="w-full py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer transition"
                >
                  Back to Sign In
                </button>
              </form>
            )}

            {onOpenFullSupervision && (
              <div className="pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={onOpenFullSupervision}
                  className="w-full py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Open Full Admin Supervision Console</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Super Admin Status Ribbon */}
            <div className="bg-amber-50 border-b border-amber-300 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-nastaliq text-stone-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>سپر ایڈمن پینل: <strong>رتہ کلاں پورٹل کنٹرول</strong></span>
                <span className="text-[10px] text-stone-500 hidden sm:inline">| ایڈمن اختیارات فعال</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <a
                  href="tel:03270019099"
                  className="bg-red-700 hover:bg-red-800 text-white px-2 py-0.5 rounded-lg flex items-center gap-1 font-bold"
                  title="آفیشل ہیلپ لائن"
                >
                  <Phone className="w-3 h-3 text-amber-200" />
                  <span>0327-0019099</span>
                </a>
              </div>
            </div>

            {/* Tabs Bar */}
            <div className="bg-stone-100 border-b border-stone-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto text-xs font-bold scrollbar-none shrink-0 font-nastaliq">
              <button
                onClick={() => setActiveTab('alerts')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                  activeTab === 'alerts'
                    ? 'bg-rose-700 text-white shadow-sm ring-2 ring-rose-400'
                    : alerts.length > 0
                    ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 ring-1 ring-rose-400 animate-pulse'
                    : 'text-stone-700 hover:bg-stone-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                <span>نوٹیفیکیشنز و شکایات ({alerts.length})</span>
                {alerts.some((a) => !a.isResolved) && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('events')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                  activeTab === 'events'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-stone-700 hover:bg-stone-200'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>گاؤں کے واقعات ({newsEvents.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('profiles')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                  activeTab === 'profiles'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-stone-700 hover:bg-stone-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>پروفائلز ({profiles.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('mosques')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                  activeTab === 'mosques'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-stone-700 hover:bg-stone-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>مساجد اوقات ({mosques.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('institutes')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                  activeTab === 'institutes'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-stone-700 hover:bg-stone-200'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>اسکولز و کالجز ({institutes.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('transports')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                  activeTab === 'transports'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-stone-700 hover:bg-stone-200'
                }`}
              >
                <Bus className="w-3.5 h-3.5" />
                <span>گاڑیاں و وینز ({transports.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('hospitals')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                  activeTab === 'hospitals'
                    ? 'bg-red-700 text-white shadow-sm'
                    : 'text-stone-700 hover:bg-stone-200'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5 text-red-500" />
                <span>ہسپتال و ایمرجنسی ({hospitals.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('credentials')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 whitespace-nowrap cursor-pointer font-sans ${
                  activeTab === 'credentials'
                    ? 'bg-indigo-700 text-white shadow-sm'
                    : 'text-stone-700 hover:bg-stone-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Section Passwords</span>
              </button>

              <button
                onClick={() => setActiveTab('messages')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                  activeTab === 'messages'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-stone-700 hover:bg-stone-200'
                }`}
              >
                <span>پیغامات ({messages.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('deleted_vault')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                  activeTab === 'deleted_vault'
                    ? 'bg-rose-900 text-white shadow-sm ring-1 ring-rose-400'
                    : (deletedMessagesArchive?.length || 0) > 0
                    ? 'bg-rose-100 text-rose-900 hover:bg-rose-200 border border-rose-300'
                    : 'text-stone-700 hover:bg-stone-200'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>ڈیلیٹ شدہ ریکارڈ ({deletedMessagesArchive?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('admin_creds')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 whitespace-nowrap cursor-pointer font-sans ${
                  activeTab === 'admin_creds'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Reset Password</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-stone-700 hover:bg-stone-200'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>بیک گراؤنڈ تصویر و فیس بک</span>
              </button>
            </div>

            {/* Main Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* TAB 0: NOTIFICATION ALERTS & VIOLATION REPORTS */}
              {activeTab === 'alerts' && (
                <div className="space-y-4 max-w-4xl mx-auto font-nastaliq">
                  {/* Info Header Banner */}
                  <div className="bg-gradient-to-r from-red-950 via-rose-900 to-amber-950 text-white rounded-3xl p-4 sm:p-5 border-2 border-red-500 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-red-600/50 flex items-center justify-center border border-red-400">
                        <AlertTriangle className="w-6 h-6 text-amber-300" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base sm:text-lg text-amber-200 leading-tight">
                          سپر ایڈمن الرٹ و نوٹیفیکیشن سینٹر (ثمر سعید)
                        </h3>
                        <p className="text-xs text-rose-200">
                          نئے کاروباروں کی رجسٹریشن اور شہریوں کی طرف سے بھیجی گئی خلاف ورزی کی رپورٹس
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs">
                      <a
                        href="tel:03270019099"
                        className="bg-black/40 hover:bg-black/60 text-amber-300 px-3 py-1.5 rounded-xl border border-amber-400/40 flex items-center gap-1 font-sans text-xs transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>0327-0019099</span>
                      </a>
                    </div>
                  </div>

                  {alerts.length === 0 ? (
                    <div className="bg-stone-50 border-2 border-stone-200 rounded-3xl p-8 text-center space-y-2">
                      <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
                      <h4 className="font-bold text-base text-stone-800">
                        ماشاء اللہ! اس وقت کوئی نئی شکایت یا غیر حل شدہ الرٹ موجود نہیں ہے
                      </h4>
                      <p className="text-xs text-stone-500">
                        جب بھی کوئی شہری پورٹل پر نیا کاروبار رجسٹر کرے گا یا کسی خلاف ورزی کی رپورٹ بھیجے گا، تو وہ فوراً یہاں اور ای میل پر نظر آئے گی۔
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`rounded-2xl border-2 p-4 transition shadow-sm ${
                            alert.isResolved
                              ? 'bg-stone-100 border-stone-300 opacity-75'
                              : alert.type === 'violation_report'
                              ? 'bg-rose-50 border-rose-400'
                              : 'bg-amber-50 border-amber-400'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2 mb-2">
                            <div className="flex items-center gap-2">
                              {alert.type === 'violation_report' ? (
                                <span className="p-1.5 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>خلاف ورزی کی رپورٹ</span>
                                </span>
                              ) : (
                                <span className="p-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>نئی رجسٹریشن</span>
                                </span>
                              )}
                              <h4 className="font-bold text-sm text-stone-900">{alert.title}</h4>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-stone-500 font-mono">
                              <span>{alert.createdAt}</span>
                              {alert.isResolved && (
                                <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold text-[10px] font-nastaliq">
                                  حل شدہ
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-stone-800 leading-relaxed font-sans font-medium mb-3">
                            {alert.details}
                          </p>

                          {/* Quick Admin Actions */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                            <div className="flex items-center gap-1.5">
                              {alert.targetProfileId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm('کیا آپ واقعی اس متنازعہ پروفائل کو پورٹل سے فوری ڈیلیٹ کرنا چاہتے ہیں؟')) {
                                      onDeleteProfile(alert.targetProfileId!);
                                      if (onResolveAlert) onResolveAlert(alert.id);
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer transition shadow-sm"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>پروفائل ڈیلیٹ کریں</span>
                                </button>
                              )}

                              {!alert.isResolved && onResolveAlert && (
                                <button
                                  type="button"
                                  onClick={() => onResolveAlert(alert.id)}
                                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer transition shadow-sm"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>حل شدہ مارک کریں</span>
                                </button>
                              )}

                              {onDeleteAlert && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteAlert(alert.id)}
                                  className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>ہٹائیں</span>
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <a
                                href="tel:03270019099"
                                className="px-2.5 py-1 bg-stone-800 hover:bg-black text-white rounded-lg font-bold font-mono flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3 text-amber-300" />
                                <span>0327-0019099</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 1: ADMIN LOGIN RESET */}
              {activeTab === 'admin_creds' && (
                <div
                  dir="ltr"
                  lang="en"
                  className="space-y-4 max-w-lg mx-auto font-sans text-left"
                >
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-4 space-y-2">
                    <h4 className="font-bold text-amber-950 text-base flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-600" />
                      <span>Super Admin — Reset Password & Credentials</span>
                    </h4>
                    <p className="text-xs text-amber-900 leading-relaxed">
                      Update the Super Admin <strong>Email Address</strong> / <strong>Username</strong> and <strong>New Password</strong>. Only the authorized Super Admin account is permitted to update these credentials.
                    </p>
                  </div>

                  {adminCredsError && (
                    <div
                      role="alert"
                      className="bg-red-50 border-2 border-red-400 text-red-900 p-3 rounded-2xl text-xs font-bold flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{adminCredsError}</span>
                    </div>
                  )}

                  {adminCredsSuccess && (
                    <div
                      role="status"
                      className="bg-emerald-50 border-2 border-emerald-500 text-emerald-950 p-3 rounded-2xl text-xs font-bold flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Super Admin Username and Password have been updated successfully!</span>
                    </div>
                  )}

                  <form
                    onSubmit={handleResetAdminCredentials}
                    className="bg-white border-2 border-stone-200 rounded-3xl p-5 space-y-4 shadow-sm"
                    noValidate
                  >
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={newAdminUser}
                        onChange={(e) => setNewAdminUser(e.target.value)}
                        placeholder="Enter authorized admin email address"
                        className="w-full px-3.5 py-2.5 border rounded-xl font-sans text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newAdminPin}
                        onChange={(e) => setNewAdminPin(e.target.value)}
                        placeholder="Enter your new password"
                        className="w-full px-3.5 py-2.5 border rounded-xl font-sans text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmAdminPin}
                        onChange={(e) => setConfirmAdminPin(e.target.value)}
                        placeholder="Re-enter your new password"
                        className="w-full px-3.5 py-2.5 border rounded-xl font-sans text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Reset Password</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: PROFILES MANAGEMENT (Edit & Remove) */}
              {activeTab === 'profiles' && (
                <div className="space-y-3 font-nastaliq">
                  <div className="flex items-center justify-between text-xs text-stone-600 bg-amber-50 p-2.5 rounded-2xl border border-amber-200">
                    <span>ہر پروفائل ایڈٹ یا ڈیلیٹ کرنے کا مکمل اختیار سپر ایڈمن کے پاس ہے۔</span>
                    <span className="font-bold text-emerald-800">کل پروفائلز: {profiles.length}</span>
                  </div>

                  {editingProfile && (
                    <div className="bg-emerald-50 border-2 border-emerald-500 rounded-3xl p-4 space-y-3 shadow-md mb-4">
                      <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                        <strong className="text-emerald-950 text-sm">پروفائل ایڈٹ کریں: {editingProfile.name}</strong>
                        <button onClick={() => setEditingProfile(null)} className="text-stone-400 hover:text-stone-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-[11px] text-stone-700">نام:</label>
                          <input
                            type="text"
                            value={editingProfile.name}
                            onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-stone-700">موبائل نمبر:</label>
                          <input
                            type="text"
                            value={editingProfile.mobile}
                            onChange={(e) => setEditingProfile({ ...editingProfile, mobile: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-stone-700">کاروبار / ہنر:</label>
                          <input
                            type="text"
                            value={editingProfile.businessName}
                            onChange={(e) => setEditingProfile({ ...editingProfile, businessName: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-stone-700">پتہ / محلہ:</label>
                          <input
                            type="text"
                            value={editingProfile.address}
                            onChange={(e) => setEditingProfile({ ...editingProfile, address: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingProfile(null)}
                          className="px-3 py-1.5 bg-stone-200 text-stone-800 rounded-xl text-xs font-bold"
                        >
                          منسوخ
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onSaveProfile && editingProfile) {
                              onSaveProfile(editingProfile);
                              setEditingProfile(null);
                              alert('پروفائل میں کی گئی تبدیلیاں محفوظ ہو گئیں!');
                            }
                          }}
                          className="px-4 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
                        >
                          محفوظ کریں
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="divide-y divide-stone-200">
                    {profiles.map((p) => (
                      <div
                        key={p.id}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={p.personImage}
                            alt={p.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-emerald-300 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-stone-900">{p.name}</h4>
                              {p.isVerified ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                                  ✓ تصدیق شدہ
                                </span>
                              ) : (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                                  زیر جائزہ
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-600">
                              {p.businessName} • فون: <span className="font-mono text-stone-800 font-bold">{p.mobile}</span>
                            </p>
                            <p className="text-[11px] text-stone-400">{p.address}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          <button
                            onClick={() => setEditingProfile(p)}
                            className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>ایڈٹ</span>
                          </button>
                          <button
                            onClick={() => onToggleVerifyProfile(p.id)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                              p.isVerified
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : 'bg-emerald-700 text-white hover:bg-emerald-800'
                            }`}
                          >
                            {p.isVerified ? 'تصدیق ہٹائیں' : 'تصدیق کریں'}
                          </button>
                          {p.id !== 'admin' && (
                            <button
                              onClick={() => {
                                if (window.confirm(`کیا آپ واقعی ${p.name} کا ریکارڈ ڈیلیٹ کرنا چاہتے ہیں؟`)) {
                                  onDeleteProfile(p.id);
                                }
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl transition"
                              title="ڈیلیٹ کریں"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: MOSQUES MANAGEMENT (Edit & Remove Mosques) */}
              {activeTab === 'mosques' && (
                <div className="space-y-4 font-nastaliq">
                  <div className="flex items-center justify-between text-xs text-stone-600 bg-amber-50 p-2.5 rounded-2xl border border-amber-200">
                    <span>رتہ کلاں کی تمام مساجد کے اوقات، امام صاحب کا نام اور لائیو لوکیشن ایڈٹ یا ڈیلیٹ کریں۔</span>
                    <span className="font-bold text-emerald-800">کل مساجد: {mosques.length}</span>
                  </div>

                  {/* Mosque Edit Drawer/Box */}
                  {editingMosque && (
                    <div className="bg-emerald-50 border-2 border-emerald-500 rounded-3xl p-4 space-y-3 shadow-md">
                      <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                        <strong className="text-emerald-950 text-sm">مسجد ایڈٹ کریں: {editingMosque.name}</strong>
                        <button onClick={() => setEditingMosque(null)} className="text-stone-400 hover:text-stone-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-[11px] text-stone-700">مسجد کا نام:</label>
                          <input
                            type="text"
                            value={editingMosque.name}
                            onChange={(e) => setEditingMosque({ ...editingMosque, name: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-stone-700">امام کا نام:</label>
                          <input
                            type="text"
                            value={editingMosque.imamName}
                            onChange={(e) => setEditingMosque({ ...editingMosque, imamName: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-stone-700">رابطہ فون نمبر:</label>
                          <input
                            type="text"
                            value={editingMosque.contact || ''}
                            onChange={(e) => setEditingMosque({ ...editingMosque, contact: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-stone-700">لوکیشن:</label>
                          <input
                            type="text"
                            value={editingMosque.location}
                            onChange={(e) => setEditingMosque({ ...editingMosque, location: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                          />
                        </div>
                      </div>

                      {/* Prayer Times Grid */}
                      <div className="bg-white p-3 rounded-2xl border border-emerald-200">
                        <span className="text-xs font-bold text-emerald-900 block mb-2">نمازوں کے اوقات:</span>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                          <div>
                            <span className="text-[10px] text-stone-500 block">فجر</span>
                            <input
                              type="text"
                              value={editingMosque.prayerTimes.fajr}
                              onChange={(e) =>
                                setEditingMosque({
                                  ...editingMosque,
                                  prayerTimes: { ...editingMosque.prayerTimes, fajr: e.target.value },
                                })
                              }
                              className="w-full px-1.5 py-1 border rounded text-center font-mono text-xs"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-500 block">ظہر</span>
                            <input
                              type="text"
                              value={editingMosque.prayerTimes.dhuhr}
                              onChange={(e) =>
                                setEditingMosque({
                                  ...editingMosque,
                                  prayerTimes: { ...editingMosque.prayerTimes, dhuhr: e.target.value },
                                })
                              }
                              className="w-full px-1.5 py-1 border rounded text-center font-mono text-xs"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-500 block">عصر</span>
                            <input
                              type="text"
                              value={editingMosque.prayerTimes.asr}
                              onChange={(e) =>
                                setEditingMosque({
                                  ...editingMosque,
                                  prayerTimes: { ...editingMosque.prayerTimes, asr: e.target.value },
                                })
                              }
                              className="w-full px-1.5 py-1 border rounded text-center font-mono text-xs"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-500 block">مغرب</span>
                            <input
                              type="text"
                              value={editingMosque.prayerTimes.maghrib}
                              onChange={(e) =>
                                setEditingMosque({
                                  ...editingMosque,
                                  prayerTimes: { ...editingMosque.prayerTimes, maghrib: e.target.value },
                                })
                              }
                              className="w-full px-1.5 py-1 border rounded text-center font-mono text-xs"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-500 block">عشاء</span>
                            <input
                              type="text"
                              value={editingMosque.prayerTimes.isha}
                              onChange={(e) =>
                                setEditingMosque({
                                  ...editingMosque,
                                  prayerTimes: { ...editingMosque.prayerTimes, isha: e.target.value },
                                })
                              }
                              className="w-full px-1.5 py-1 border rounded text-center font-mono text-xs"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-500 block">جمعہ</span>
                            <input
                              type="text"
                              value={editingMosque.prayerTimes.jummah}
                              onChange={(e) =>
                                setEditingMosque({
                                  ...editingMosque,
                                  prayerTimes: { ...editingMosque.prayerTimes, jummah: e.target.value },
                                })
                              }
                              className="w-full px-1.5 py-1 border rounded text-center font-mono text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingMosque(null)}
                          className="px-3 py-1.5 bg-stone-200 text-stone-800 rounded-xl text-xs font-bold"
                        >
                          منسوخ
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onSaveMosque && editingMosque) {
                              onSaveMosque(editingMosque);
                              setEditingMosque(null);
                              alert(`مسجد "${editingMosque.name}" کی معلومات محفوظ ہو گئیں!`);
                            }
                          }}
                          className="px-4 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
                        >
                          تبدیلیاں محفوظ کریں
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Mosques List */}
                  <div className="space-y-2.5">
                    {mosques.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-stone-900">{m.name}</h4>
                            <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                              امام: {m.imamName}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">
                            📍 {m.location} • فون: {m.contact || 'موجود نہیں'}
                          </p>
                          <p className="text-[11px] text-stone-600 mt-1">
                            فجر: {m.prayerTimes.fajr} | ظہر: {m.prayerTimes.dhuhr} | عصر: {m.prayerTimes.asr} | مغرب: {m.prayerTimes.maghrib} | عشاء: {m.prayerTimes.isha} | جمعہ: {m.prayerTimes.jummah}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => setEditingMosque(m)}
                            className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>ایڈٹ</span>
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`کیا آپ واقعی مسجد "${m.name}" کو حذف کرنا چاہتے ہیں؟`)) {
                                if (onDeleteMosque) onDeleteMosque(m.id);
                              }
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl"
                            title="ڈیلیٹ کریں"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: INSTITUTES MANAGEMENT (Edit & Remove Schools) */}
              {activeTab === 'institutes' && (
                <div className="space-y-4 font-nastaliq">
                  <div className="flex items-center justify-between text-xs text-stone-600 bg-amber-50 p-2.5 rounded-2xl border border-amber-200">
                    <span>اسکولز و کالجز کے پرنسپل، فون، ٹائم ٹیبل اور لوکیشن ایڈٹ یا ڈیلیٹ کریں۔</span>
                    <span className="font-bold text-blue-800">کل ادارے: {institutes.length}</span>
                  </div>

                  {editingInstitute && (
                    <div className="bg-blue-50 border-2 border-blue-400 rounded-3xl p-4 space-y-3 shadow-md">
                      <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                        <strong className="text-blue-950 text-sm">ادارہ ایڈٹ کریں: {editingInstitute.name}</strong>
                        <button onClick={() => setEditingInstitute(null)} className="text-stone-400 hover:text-stone-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-[11px] text-stone-700">ادارے کا نام:</label>
                          <input
                            type="text"
                            value={editingInstitute.name}
                            onChange={(e) => setEditingInstitute({ ...editingInstitute, name: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-stone-700">پرنسپل / ہیڈ کا نام:</label>
                          <input
                            type="text"
                            value={editingInstitute.headName}
                            onChange={(e) => setEditingInstitute({ ...editingInstitute, headName: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-stone-700">رابطہ فون نمبر:</label>
                          <input
                            type="text"
                            value={editingInstitute.contact || ''}
                            onChange={(e) => setEditingInstitute({ ...editingInstitute, contact: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-stone-700">کلاسیں:</label>
                          <input
                            type="text"
                            value={editingInstitute.classesOffered}
                            onChange={(e) => setEditingInstitute({ ...editingInstitute, classesOffered: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingInstitute(null)}
                          className="px-3 py-1.5 bg-stone-200 text-stone-800 rounded-xl text-xs font-bold"
                        >
                          منسوخ
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onSaveInstitute && editingInstitute) {
                              onSaveInstitute(editingInstitute);
                              setEditingInstitute(null);
                              alert(`ادارہ "${editingInstitute.name}" کامیابی سے محفوظ ہو گیا!`);
                            }
                          }}
                          className="px-4 py-1.5 bg-blue-700 text-white rounded-xl text-xs font-bold shadow"
                        >
                          محفوظ کریں
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {institutes.map((inst) => (
                      <div
                        key={inst.id}
                        className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-stone-900">{inst.name}</h4>
                            <span className="text-[10px] text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full font-bold">
                              پرنسپل: {inst.headName}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">
                            📍 {inst.location} • فون: {inst.contact || 'موجود نہیں'} • کلاسیں: {inst.classesOffered}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => setEditingInstitute(inst)}
                            className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>ایڈٹ</span>
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`کیا آپ واقعی "${inst.name}" کو حذف کرنا چاہتے ہیں؟`)) {
                                if (onDeleteInstitute) onDeleteInstitute(inst.id);
                              }
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl"
                            title="ڈیلیٹ کریں"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: TRANSPORTS MANAGEMENT (Edit & Remove Vehicles) */}
              {activeTab === 'transports' && (
                <div className="space-y-4 font-nastaliq">
                  <div className="flex items-center justify-between text-xs text-stone-600 bg-amber-50 p-2.5 rounded-2xl border border-amber-200">
                    <span>رتہ کلاں کی وینز، بسوں اور رکشوں کا کرایہ، روٹ اور ڈرائیور فون ایڈٹ یا ڈیلیٹ کریں۔</span>
                    <span className="font-bold text-emerald-800">کل گاڑیاں: {transports.length}</span>
                  </div>

                  {editingTransport && (
                    <div className="bg-emerald-50 border-2 border-emerald-400 rounded-3xl p-4 space-y-3 shadow-md">
                      <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                        <strong className="text-emerald-950 text-sm">گاڑی ایڈٹ کریں: {editingTransport.title}</strong>
                        <button onClick={() => setEditingTransport(null)} className="text-stone-400 hover:text-stone-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-[11px] text-stone-700">عنوان:</label>
                          <input
                            type="text"
                            value={editingTransport.title}
                            onChange={(e) => setEditingTransport({ ...editingTransport, title: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-stone-700">ڈرائیور کا نام:</label>
                          <input
                            type="text"
                            value={editingTransport.driverName}
                            onChange={(e) => setEditingTransport({ ...editingTransport, driverName: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-stone-700">ڈرائیور فون نمبر:</label>
                          <input
                            type="text"
                            value={editingTransport.driverMobile}
                            onChange={(e) => setEditingTransport({ ...editingTransport, driverMobile: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-stone-700">کرایہ:</label>
                          <input
                            type="text"
                            value={editingTransport.fare}
                            onChange={(e) => setEditingTransport({ ...editingTransport, fare: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-stone-700">روٹ:</label>
                          <input
                            type="text"
                            value={editingTransport.route}
                            onChange={(e) => setEditingTransport({ ...editingTransport, route: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-white"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingTransport(null)}
                          className="px-3 py-1.5 bg-stone-200 text-stone-800 rounded-xl text-xs font-bold"
                        >
                          منسوخ
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onSaveTransport && editingTransport) {
                              onSaveTransport(editingTransport);
                              setEditingTransport(null);
                              alert(`گاڑی "${editingTransport.title}" محفوظ ہو گئی!`);
                            }
                          }}
                          className="px-4 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
                        >
                          محفوظ کریں
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {transports.map((tr) => (
                      <div
                        key={tr.id}
                        className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-stone-900">{tr.title}</h4>
                            <span className="text-[10px] text-stone-700 bg-stone-200 px-2 py-0.5 rounded-full font-mono">
                              {tr.vehicleNumber}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">
                            ڈرائیور: {tr.driverName} • فون: <span className="font-mono text-stone-800 font-bold">{tr.driverMobile}</span> • کرایہ: {tr.fare}
                          </p>
                          <p className="text-[11px] text-stone-400">{tr.route}</p>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => setEditingTransport(tr)}
                            className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>ایڈٹ</span>
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`کیا آپ واقعی گاڑی "${tr.title}" کو حذف کرنا چاہتے ہیں؟`)) {
                                if (onDeleteTransport) onDeleteTransport(tr.id);
                              }
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl"
                            title="ڈیلیٹ کریں"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: HOSPITALS & EMERGENCY */}
              {activeTab === 'hospitals' && (
                <div className="space-y-4 font-nastaliq text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-red-50 rounded-2xl border border-red-200 text-red-950">
                    <div>
                      <span className="font-bold text-sm block flex items-center gap-1.5 text-red-900">
                        <HeartPulse className="w-4 h-4 text-red-600" />
                        <span>ہسپتال اور ایمرجنسی طبی خدمات کا انتظام:</span>
                      </span>
                      <p className="leading-relaxed text-[11px] text-red-800">
                        سپر ایڈمن یہاں سے ہسپتال، RHC، ریسکیو 1122، کلینکس اور فارمیسی کے فون نمبر اور ریکارڈ تبدیل یا ڈیلیٹ کر سکتے ہیں۔
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setEditingHospital({
                          id: `hosp-${Date.now()}`,
                          name: 'نیا کلینک یا ایمبولینس',
                          category: 'clinic',
                          categoryUrdu: 'پرائیویٹ کلینک',
                          contact: '0300-1234567',
                          emergencyPhone: '',
                          address: 'رتہ کلاں، جھنگ',
                          distance: 'گاؤں میں',
                          timing: '24 گھنٹے دستیاب',
                          doctorInCharge: 'ڈاکٹر صاحب',
                          services: ['او پی ڈی', 'ابتدائی طبی امداد', 'ڈرپ و انجکشن'],
                          image: '',
                          is24Hours: true,
                        })
                      }
                      className="px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold flex items-center justify-center gap-1 shadow-sm shrink-0 transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ نیا ہسپتال یا ایمبولینس شامل کریں</span>
                    </button>
                  </div>

                  {/* Inline Edit / Add Hospital Form */}
                  {editingHospital && (
                    <div className="p-4 bg-white rounded-2xl border-2 border-red-400 shadow-md space-y-3">
                      <h4 className="font-bold text-sm text-red-900 flex items-center gap-1">
                        <Edit className="w-4 h-4 text-red-600" />
                        <span>ہسپتال / ایمرجنسی سروس میں ترمیم:</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] text-stone-700 font-bold mb-0.5">نام ادارہ / سروس:</label>
                          <input
                            type="text"
                            value={editingHospital.name}
                            onChange={(e) => setEditingHospital({ ...editingHospital, name: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-stone-50"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-stone-700 font-bold mb-0.5">قسم (Category):</label>
                          <select
                            value={editingHospital.category}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              const urduMap: Record<string, string> = {
                                hospital: 'سرکاری جنرل ہسپتال',
                                rhc: 'مرکزِ صحت (RHC)',
                                ambulance: 'ایمرجنسی ایمبولینس',
                                clinic: 'کلینک و ڈاکٹر',
                                pharmacy: 'میڈیکل اسٹور و فارمیسی',
                              };
                              setEditingHospital({
                                ...editingHospital,
                                category: val,
                                categoryUrdu: urduMap[val] || 'طبی مرکز',
                              });
                            }}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-stone-50"
                          >
                            <option value="hospital">ہسپتال (Hospital)</option>
                            <option value="rhc">مرکزِ صحت (RHC)</option>
                            <option value="ambulance">ایمبولینس (Ambulance)</option>
                            <option value="clinic">کلینک (Clinic)</option>
                            <option value="pharmacy">میڈیکل اسٹور (Pharmacy)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] text-stone-700 font-bold mb-0.5">فون نمبر (رابطہ نمبر):</label>
                          <input
                            type="text"
                            value={editingHospital.contact}
                            onChange={(e) => setEditingHospital({ ...editingHospital, contact: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-stone-50 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-stone-700 font-bold mb-0.5">متبادل ایمرجنسی نمبر:</label>
                          <input
                            type="text"
                            value={editingHospital.emergencyPhone || ''}
                            onChange={(e) => setEditingHospital({ ...editingHospital, emergencyPhone: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-stone-50 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-stone-700 font-bold mb-0.5">اوقات (Timing):</label>
                          <input
                            type="text"
                            value={editingHospital.timing}
                            onChange={(e) => setEditingHospital({ ...editingHospital, timing: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-stone-50"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-stone-700 font-bold mb-0.5">فاصلہ (Distance):</label>
                          <input
                            type="text"
                            value={editingHospital.distance}
                            onChange={(e) => setEditingHospital({ ...editingHospital, distance: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-stone-50"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-stone-700 font-bold mb-0.5">پتہ و لوکیشن:</label>
                          <input
                            type="text"
                            value={editingHospital.address}
                            onChange={(e) => setEditingHospital({ ...editingHospital, address: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg bg-stone-50"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800">
                            <input
                              type="checkbox"
                              checked={editingHospital.is24Hours}
                              onChange={(e) => setEditingHospital({ ...editingHospital, is24Hours: e.target.checked })}
                              className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                            />
                            <span>24 گھنٹے کھلی ایمرجنسی سہولت ہے</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t">
                        <button
                          type="button"
                          onClick={() => setEditingHospital(null)}
                          className="px-3 py-1.5 bg-stone-200 text-stone-800 rounded-xl text-xs font-bold"
                        >
                          منسوخ
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onSaveHospital && editingHospital) {
                              onSaveHospital(editingHospital);
                              setEditingHospital(null);
                              alert(`ہسپتال/سروس "${editingHospital.name}" محفوظ ہو گئی!`);
                            }
                          }}
                          className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow"
                        >
                          محفوظ کریں
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Hospital List */}
                  <div className="space-y-2.5">
                    {hospitals.map((hosp) => (
                      <div
                        key={hosp.id}
                        className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-stone-900">{hosp.name}</h4>
                            <span className="text-[10px] text-red-800 bg-red-100 px-2 py-0.5 rounded-full font-bold">
                              {hosp.categoryUrdu}
                            </span>
                            {hosp.is24Hours && (
                              <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                                24/7 الرٹ
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">
                            📍 {hosp.address} • فون: <span className="font-mono text-stone-900 font-bold">{hosp.contact}</span> • اوقات: {hosp.timing}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => setEditingHospital(hosp)}
                            className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>ایڈٹ</span>
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`کیا آپ واقعی "${hosp.name}" کو حذف کرنا چاہتے ہیں؟`)) {
                                if (onDeleteHospital) onDeleteHospital(hosp.id);
                              }
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl"
                            title="ڈیلیٹ کریں"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: CREDENTIALS (Distinct Usernames & Passwords for each Mosque & School) */}
              {activeTab === 'credentials' && (
                <div
                  dir="ltr"
                  lang="en"
                  className="space-y-4 font-sans text-xs text-left"
                >
                  <div className="p-3.5 bg-indigo-50 rounded-2xl border border-indigo-200 text-indigo-950 space-y-1">
                    <span className="font-bold text-sm flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-indigo-700" />
                      <span>Section Manager Account Credentials (Username & Password)</span>
                    </span>
                    <p className="leading-relaxed">
                      Assign dedicated <strong>Username</strong> and <strong>Password</strong> credentials to each Mosque, School, Hospital, and Transport route manager so they can sign in and update their schedules securely.
                    </p>
                  </div>

                  {/* Mosques Section */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-emerald-800" />
                      <span>Mosque Credentials (Username & Password)</span>
                    </h4>

                    {mosques.map((m) => (
                      <div
                        key={m.id}
                        className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-stone-900 text-xs sm:text-sm">{m.name}</strong>
                          <span className="text-[11px] text-stone-600 font-bold">Imam: {m.imamName}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[11px] font-bold text-stone-700 block mb-1">Username</label>
                            <input
                              type="text"
                              defaultValue={m.username || `mosque_${m.id}`}
                              id={`user-mosque-${m.id}`}
                              placeholder="Enter username"
                              className="w-full px-3 py-1.5 border rounded-xl bg-white font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-stone-700 block mb-1">Password</label>
                            <input
                              type="text"
                              defaultValue={m.password || 'mosque123'}
                              id={`pass-mosque-${m.id}`}
                              placeholder="Enter password"
                              className="w-full px-3 py-1.5 border rounded-xl bg-white font-mono text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const u = (document.getElementById(`user-mosque-${m.id}`) as HTMLInputElement)?.value;
                              const p = (document.getElementById(`pass-mosque-${m.id}`) as HTMLInputElement)?.value;
                              if (onUpdateMosqueCredentials && u && p) {
                                onUpdateMosqueCredentials(m.id, u.trim(), p.trim());
                                alert(`Credentials saved for "${m.name}".\nUsername: ${u}\nPassword: ${p}`);
                              }
                            }}
                            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm flex items-center gap-1"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Reset Password</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const u = (document.getElementById(`user-mosque-${m.id}`) as HTMLInputElement)?.value;
                              const p = (document.getElementById(`pass-mosque-${m.id}`) as HTMLInputElement)?.value;
                              handleCopyCredentials(`Mosque: ${m.name}\nUsername: ${u}\nPassword: ${p}\nPortal: Ratta Kallan e-Portal`, m.id);
                            }}
                            className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1"
                          >
                            {copiedKey === m.id ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey === m.id ? 'Copied' : 'Copy Credentials'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Institutes Section */}
                  <div className="space-y-3 pt-3 border-t border-stone-200">
                    <h4 className="font-bold text-sm text-blue-950 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-blue-800" />
                      <span>School & Institute Credentials (Username & Password)</span>
                    </h4>

                    {institutes.map((inst) => (
                      <div
                        key={inst.id}
                        className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-stone-900 text-xs sm:text-sm">{inst.name}</strong>
                          <span className="text-[11px] text-stone-600 font-bold">Principal: {inst.headName}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[11px] font-bold text-stone-700 block mb-1">Username</label>
                            <input
                              type="text"
                              defaultValue={inst.username || `inst_${inst.id}`}
                              id={`user-inst-${inst.id}`}
                              placeholder="Enter username"
                              className="w-full px-3 py-1.5 border rounded-xl bg-white font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-stone-700 block mb-1">Password</label>
                            <input
                              type="text"
                              defaultValue={inst.password || 'school123'}
                              id={`pass-inst-${inst.id}`}
                              placeholder="Enter password"
                              className="w-full px-3 py-1.5 border rounded-xl bg-white font-mono text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const u = (document.getElementById(`user-inst-${inst.id}`) as HTMLInputElement)?.value;
                              const p = (document.getElementById(`pass-inst-${inst.id}`) as HTMLInputElement)?.value;
                              if (onUpdateInstituteCredentials && u && p) {
                                onUpdateInstituteCredentials(inst.id, u.trim(), p.trim());
                                alert(`Credentials saved for "${inst.name}".\nUsername: ${u}\nPassword: ${p}`);
                              }
                            }}
                            className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm flex items-center gap-1"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Reset Password</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const u = (document.getElementById(`user-inst-${inst.id}`) as HTMLInputElement)?.value;
                              const p = (document.getElementById(`pass-inst-${inst.id}`) as HTMLInputElement)?.value;
                              handleCopyCredentials(`School: ${inst.name}\nUsername: ${u}\nPassword: ${p}\nPortal: Ratta Kallan e-Portal`, inst.id);
                            }}
                            className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1"
                          >
                            {copiedKey === inst.id ? <Check className="w-3.5 h-3.5 text-blue-700" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey === inst.id ? 'Copied' : 'Copy Credentials'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Hospitals & Medical Services Section */}
                  <div className="space-y-3 pt-3 border-t border-stone-200">
                    <h4 className="font-bold text-sm text-red-950 flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-red-700" />
                      <span>Hospital & Emergency Service Credentials (Username & Password)</span>
                    </h4>

                    {hospitals.map((hosp) => (
                      <div
                        key={hosp.id}
                        className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-stone-900 text-xs sm:text-sm">{hosp.name}</strong>
                          <span className="text-[11px] text-red-700 font-bold">{hosp.categoryUrdu}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[11px] font-bold text-stone-700 block mb-1">Username</label>
                            <input
                              type="text"
                              defaultValue={hosp.username || `hosp_${hosp.id}`}
                              id={`user-hosp-${hosp.id}`}
                              placeholder="Enter username"
                              className="w-full px-3 py-1.5 border rounded-xl bg-white font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-stone-700 block mb-1">Password</label>
                            <input
                              type="text"
                              defaultValue={hosp.password || 'hosp123'}
                              id={`pass-hosp-${hosp.id}`}
                              placeholder="Enter password"
                              className="w-full px-3 py-1.5 border rounded-xl bg-white font-mono text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const u = (document.getElementById(`user-hosp-${hosp.id}`) as HTMLInputElement)?.value;
                              const p = (document.getElementById(`pass-hosp-${hosp.id}`) as HTMLInputElement)?.value;
                              if (onSaveHospital && u && p) {
                                onSaveHospital({ ...hosp, username: u.trim(), password: p.trim() });
                                alert(`Credentials saved for "${hosp.name}".\nUsername: ${u}\nPassword: ${p}`);
                              }
                            }}
                            className="px-3.5 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm flex items-center gap-1"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Reset Password</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const u = (document.getElementById(`user-hosp-${hosp.id}`) as HTMLInputElement)?.value;
                              const p = (document.getElementById(`pass-hosp-${hosp.id}`) as HTMLInputElement)?.value;
                              handleCopyCredentials(`Hospital: ${hosp.name}\nUsername: ${u}\nPassword: ${p}\nPortal: Ratta Kallan e-Portal`, hosp.id);
                            }}
                            className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1"
                          >
                            {copiedKey === hosp.id ? <Check className="w-3.5 h-3.5 text-red-700" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey === hosp.id ? 'Copied' : 'Copy Credentials'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Transports Section */}
                  <div className="space-y-3 pt-3 border-t border-stone-200">
                    <h4 className="font-bold text-sm text-amber-950 flex items-center gap-1.5">
                      <Bus className="w-4 h-4 text-amber-700" />
                      <span>Transport Route Credentials (Username & Password)</span>
                    </h4>

                    {transports.map((veh) => (
                      <div
                        key={veh.id}
                        className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-stone-900 text-xs sm:text-sm">{veh.title}</strong>
                          <span className="text-[11px] text-stone-600 font-bold">Driver: {veh.driverName} ({veh.vehicleNumber})</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[11px] font-bold text-stone-700 block mb-1">Username</label>
                            <input
                              type="text"
                              defaultValue={veh.username || `trans_${veh.id}`}
                              id={`user-veh-${veh.id}`}
                              placeholder="Enter username"
                              className="w-full px-3 py-1.5 border rounded-xl bg-white font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-stone-700 block mb-1">Password</label>
                            <input
                              type="text"
                              defaultValue={veh.password || 'van123'}
                              id={`pass-veh-${veh.id}`}
                              placeholder="Enter password"
                              className="w-full px-3 py-1.5 border rounded-xl bg-white font-mono text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const u = (document.getElementById(`user-veh-${veh.id}`) as HTMLInputElement)?.value;
                              const p = (document.getElementById(`pass-veh-${veh.id}`) as HTMLInputElement)?.value;
                              if (onSaveTransport && u && p) {
                                onSaveTransport({ ...veh, username: u.trim(), password: p.trim() });
                                alert(`Credentials saved for "${veh.title}".\nUsername: ${u}\nPassword: ${p}`);
                              }
                            }}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm flex items-center gap-1"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Reset Password</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const u = (document.getElementById(`user-veh-${veh.id}`) as HTMLInputElement)?.value;
                              const p = (document.getElementById(`pass-veh-${veh.id}`) as HTMLInputElement)?.value;
                              handleCopyCredentials(`Transport: ${veh.title}\nVehicle: ${veh.vehicleNumber}\nUsername: ${u}\nPassword: ${p}\nPortal: Ratta Kallan e-Portal`, veh.id);
                            }}
                            className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1"
                          >
                            {copiedKey === veh.id ? <Check className="w-3.5 h-3.5 text-amber-700" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey === veh.id ? 'Copied' : 'Copy Credentials'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: VILLAGE EVENTS & ADMIN-ONLY BANNER SLIDES CONTROL */}
              {activeTab === 'events' && (
                <div className="space-y-4 font-nastaliq">
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3 text-xs text-amber-950 flex items-center justify-between gap-2">
                    <span>
                      🔒 <strong>صرف ایڈمن اختیار:</strong> بینر کی تصویر لگانا، بدلنا، ہٹانا یا بغیر تصویر رکھنا صرف ایڈمن کر سکتا ہے۔
                    </span>
                  </div>

                  {bannerStatusMsg && (
                    <div className="bg-emerald-50 border border-emerald-400 text-emerald-950 px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center justify-between">
                      <span>✓ {bannerStatusMsg}</span>
                      <button
                        type="button"
                        onClick={() => setBannerStatusMsg('')}
                        className="text-stone-500 hover:text-stone-800"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Create New Event / Banner Slide Form */}
                  <form onSubmit={handleCreateEvent} className="bg-stone-50 border border-stone-200 rounded-3xl p-4 space-y-3">
                    <h4 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-emerald-700" />
                      <span>نیا بینر سلائیڈ / واقعہ شائع کریں:</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <input
                        type="text"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        placeholder="خبر یا واقعے کا عنوان *"
                        className="px-3 py-2 border rounded-xl bg-white"
                        required
                      />
                      <select
                        value={eventCategory}
                        onChange={(e) => setEventCategory(e.target.value as EventCategory)}
                        className="px-3 py-2 border rounded-xl bg-white"
                      >
                        <option value="general">عام واقعہ / اعلان</option>
                        <option value="medical">طبی کیمپ / صحت</option>
                        <option value="bijli_pani">بجلی و پانی</option>
                        <option value="sports">کھیل (والی بال / نیزہ بازی / کرکٹ)</option>
                        <option value="janaza">جنازہ / فوتگی</option>
                        <option value="shadi">شادی / تقریب</option>
                        <option value="panchayat">پنچایت / مشاورت</option>
                      </select>
                    </div>

                    <textarea
                      value={eventContent}
                      onChange={(e) => setEventContent(e.target.value)}
                      placeholder="واقعے کی مکمل تفصیل لکھیں..."
                      rows={2}
                      className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                      required
                    />

                    {/* Admin-Only Single Banner Image Choice: "تصویر لگائیں" OR "بغیر تصویر (Skip)" */}
                    <div className="p-3 bg-white rounded-2xl border border-stone-200 space-y-2">
                      <span className="text-xs font-bold text-stone-800 block">
                        بینر سلائیڈ کی تصویر کا انتخاب (صرف ایک تصویر فی سلائیڈ):
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition">
                          <ImageIcon className="w-4 h-4" />
                          <span>تصویر لگائیں</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleNewEventBannerFileSelect}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            setNewEventImageMode('skip');
                            setNewEventCompressedDoc(null);
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            newEventImageMode === 'skip'
                              ? 'bg-amber-400 text-stone-950 border-amber-500 shadow-sm'
                              : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
                          }`}
                        >
                          بغیر تصویر (Skip) — صرف رنگین بیک گراؤنڈ پر اردو تحریر
                        </button>
                      </div>

                      {newEventCompressedDoc && newEventImageMode === 'with_image' && (
                        <div className="flex items-center gap-3 pt-1">
                          <img
                            src={newEventCompressedDoc.dataUrl}
                            alt="Preview"
                            className="w-20 h-12 object-cover rounded-xl border border-emerald-400"
                          />
                          <span className="text-[11px] text-emerald-800 font-bold">
                            کمپریس شدہ سائز: {Math.round(newEventCompressedDoc.byteSize / 1024)} KB ({newEventCompressedDoc.width}x{newEventCompressedDoc.height} px)
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPopupOnLaunch}
                          onChange={(e) => setIsPopupOnLaunch(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span>ایپ کھلتے ہی اسکرین پر خود بخود پوپ اپ نظر آئے</span>
                      </label>

                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow cursor-pointer"
                      >
                        شائع کریں
                      </button>
                    </div>
                  </form>

                  {/* Existing Events / Banner Slides List with Admin Image Controls */}
                  <div className="space-y-2.5">
                    <h5 className="font-bold text-xs text-stone-700">
                      موجودہ بینر سلائیڈز و واقعات ({newsEvents.length}):
                    </h5>
                    {newsEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <strong className="text-stone-900 text-sm">{ev.title}</strong>
                            {ev.isPopupOnLaunch && (
                              <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                پوپ اپ فعال
                              </span>
                            )}
                            {ev.hasBannerImage && !ev.skipBannerImage ? (
                              <span className="bg-emerald-100 text-emerald-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                🖼️ تصویر لگی ہے
                              </span>
                            ) : (
                              <span className="bg-stone-200 text-stone-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                بغیر تصویر (رنگین بیک گراؤنڈ)
                              </span>
                            )}
                          </div>
                          <p className="text-stone-600 text-[11px] line-clamp-1">{ev.content}</p>
                        </div>

                        <div className="flex items-center flex-wrap gap-1.5 shrink-0">
                          {/* Admin Option 1: تصویر لگائیں */}
                          <label className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1 cursor-pointer shadow-xs">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>تصویر لگائیں</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleExistingSlideUploadImage(ev, e)}
                            />
                          </label>

                          {/* Admin Option 2: بغیر تصویر (Skip) */}
                          <button
                            type="button"
                            onClick={() => handleExistingSlideSkipImage(ev)}
                            className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 cursor-pointer"
                          >
                            بغیر تصویر (Skip)
                          </button>

                          <button
                            type="button"
                            onClick={() => onTogglePopupNewsEvent(ev.id)}
                            className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-stone-200 hover:bg-stone-300 cursor-pointer"
                          >
                            {ev.isPopupOnLaunch ? 'پوپ اپ بند' : 'پوپ اپ لگائیں'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              deleteBannerSlideImageDoc(ev.id);
                              onDeleteNewsEvent(ev.id);
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="حذف کریں"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 8: MESSAGES */}
              {activeTab === 'messages' && (
                <div className="space-y-3 font-nastaliq text-xs">
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-emerald-900 flex items-center justify-between">
                    <span>
                      سپر ایڈمن نگرانی: تمام پیغامات پڑھ سکتے ہیں اور غیر مناسب پیغام ڈیلیٹ کر سکتے ہیں۔
                    </span>
                    <span className="font-mono font-bold bg-emerald-200 px-2 py-0.5 rounded-full text-emerald-950">
                      کل پیغامات: {messages.length}
                    </span>
                  </div>
                  {messages.length === 0 ? (
                    <p className="text-center py-8 text-stone-500">ابھی کوئی پیغام نہیں آیا ہے۔</p>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl space-y-2 shadow-sm"
                      >
                        <div className="flex justify-between items-center text-stone-600 font-semibold border-b pb-1.5 text-[11px]">
                          <span>
                            بھیجنے والا: <strong className="text-stone-900">{m.senderName}</strong> ({m.senderMobile}) ➔ برائے: <strong className="text-stone-900">{m.targetProfileName}</strong>
                          </span>
                          <button
                            onClick={() => {
                              if (window.confirm('کیا آپ واقعی یہ پیغام ڈیلیٹ کرنا چاہتے ہیں؟')) {
                                if (onDeleteMessage) onDeleteMessage(m.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 cursor-pointer"
                            title="پیغام ڈیلیٹ کریں"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="font-medium text-stone-900 leading-relaxed">{m.messageText}</p>

                        {/* Voice Note Player if any */}
                        {m.audioData && (
                          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 p-2 rounded-xl w-fit">
                            <button
                              type="button"
                              onClick={() => handlePlayAdminAudio(`m-${m.id}`, m.audioData!)}
                              className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center cursor-pointer"
                            >
                              {adminAudioId === `m-${m.id}` ? (
                                <Pause className="w-3 h-3" />
                              ) : (
                                <Play className="w-3 h-3 fill-white ml-0.5" />
                              )}
                            </button>
                            <span className="text-[10px] font-bold text-emerald-950">
                              صوتی پیغام سنیں ({m.audioDurationSeconds || 5}s)
                            </span>
                          </div>
                        )}

                        {/* Discussion thread if present */}
                        {m.discussionThread && m.discussionThread.length > 0 && (
                          <div className="pt-1.5 border-t border-stone-200 space-y-1">
                            <span className="text-[10px] font-bold text-stone-500">
                              باہمی گفتگو ({m.discussionThread.length} جوابات):
                            </span>
                            <div className="space-y-1 pl-2 border-r-2 border-emerald-400">
                              {m.discussionThread.map((dt) => (
                                <div key={dt.id} className="bg-white p-2 rounded-xl text-[11px] border border-stone-200">
                                  <div className="flex justify-between text-stone-500 text-[10px] font-bold">
                                    <span>{dt.senderName} ({dt.senderRole})</span>
                                    <span>{new Date(dt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <p className="text-stone-800">{dt.text}</p>
                                  {dt.audioData && (
                                    <button
                                      type="button"
                                      onClick={() => handlePlayAdminAudio(`m-dt-${dt.id}`, dt.audioData!)}
                                      className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-700 cursor-pointer"
                                    >
                                      {adminAudioId === `m-dt-${dt.id}` ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                      <span>آڈیو سنیں</span>
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB: DELETED MESSAGES AUDIT VAULT */}
              {activeTab === 'deleted_vault' && (
                <div className="space-y-3 font-nastaliq text-xs">
                  <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-stone-900 text-white p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-md">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shrink-0">
                        <Trash2 className="w-4 h-4 text-amber-300" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-amber-200">
                          سپر ایڈمن آڈٹ والٹ (حذف شدہ پیغامات کا ریکارڈ)
                        </h4>
                        <p className="text-[11px] text-rose-200">
                          اگر کوئی بھیجنے والا یا وصول کنندہ اپنے ان باکس سے پیغام ڈیلیٹ کر دے، ثمر سعید کے پاس اس کا مکمل ریکارڈ محفوظ رہتا ہے۔
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-rose-800 px-3 py-1 rounded-xl font-mono text-amber-200 font-bold">
                      {deletedMessagesArchive.length} محفوظ ریکارڈز
                    </span>
                  </div>

                  {deletedMessagesArchive.length === 0 ? (
                    <div className="text-center py-12 px-4 space-y-2 bg-stone-50 rounded-2xl border border-stone-200">
                      <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                      <p className="font-bold text-stone-700 text-sm">کوئی ڈیلیٹ شدہ مواد موجود نہیں ہے۔</p>
                      <p className="text-stone-400 text-[11px]">
                        جب کوئی صارف اپنا میسج ڈیلیٹ کرے گا، تو اس کا اصل مواد، باہمی گفتگو اور آڈیو یہاں محفوظ ہوگی۔
                      </p>
                    </div>
                  ) : (
                    deletedMessagesArchive.map((arc) => (
                      <div
                        key={arc.id}
                        className="p-3.5 bg-rose-50/70 border border-rose-300 rounded-2xl space-y-2.5 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200 pb-2 text-[11px]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-rose-200 text-rose-950 font-bold px-2.5 py-0.5 rounded-full">
                              ڈیلیٹ کنندہ: {arc.deletedBy} (
                              {arc.deletedByRole === 'sender'
                                ? 'بھیجنے والا'
                                : arc.deletedByRole === 'receiver'
                                ? 'وصول کنندہ'
                                : 'ایڈمن'}
                              )
                            </span>
                            <span className="text-stone-500 font-mono">
                              تاریخ و وقت: {new Date(arc.deletedAt).toLocaleString('ur-PK')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {onRestoreDeletedMessage && (
                              <button
                                onClick={() => {
                                  if (window.confirm('کیا آپ یہ پیغام دوبارہ ان باکس میں بحال کرنا چاہتے ہیں؟')) {
                                    onRestoreDeletedMessage(arc.id);
                                  }
                                }}
                                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>واپس بحال کریں</span>
                              </button>
                            )}

                            {onPermanentDeleteArchivedMessage && (
                              <button
                                onClick={() => {
                                  if (window.confirm('سپر ایڈمن ثمر سعید: کیا آپ یہ ریکارڈ والٹ سے مستقل حذف کرنا چاہتے ہیں؟')) {
                                    onPermanentDeleteArchivedMessage(arc.id);
                                  }
                                }}
                                className="px-2.5 py-1 bg-stone-200 hover:bg-red-700 hover:text-white text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                title="والٹ سے مستقل ڈیلیٹ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Message details */}
                        <div className="text-stone-900 text-xs space-y-1.5">
                          <p className="font-bold text-stone-700">
                            بھیجنے والا: <span className="text-emerald-900 font-bold">{arc.senderName} ({arc.senderMobile})</span> ➔ برائے: <span className="text-blue-900 font-bold">{arc.targetProfileName} ({arc.targetMobile})</span>
                          </p>

                          <div className="bg-white p-3 rounded-xl border border-stone-200 text-stone-800 space-y-1">
                            <span className="font-bold text-stone-600 block text-[11px]">اصل پیغام:</span>
                            <p className="font-medium">{arc.messageText}</p>
                            {arc.audioData && (
                              <div className="mt-2 flex items-center gap-2 bg-emerald-50 border border-emerald-300 p-2 rounded-xl w-fit">
                                <button
                                  type="button"
                                  onClick={() => handlePlayAdminAudio(arc.id, arc.audioData!)}
                                  className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center cursor-pointer"
                                >
                                  {adminAudioId === arc.id ? (
                                    <Pause className="w-3 h-3" />
                                  ) : (
                                    <Play className="w-3 h-3 fill-white ml-0.5" />
                                  )}
                                </button>
                                <span className="text-[10px] font-bold text-stone-700">
                                  صوتی پیغام سنیں ({arc.audioDurationSeconds || 5} سیکنڈ)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Discussion thread if any */}
                        {arc.discussionThread && arc.discussionThread.length > 0 && (
                          <div className="mt-2 pl-3 border-r-2 border-stone-400 space-y-1.5 text-[11px]">
                            <p className="font-bold text-stone-700">باہمی خفیہ گفتگو کا ریکارڈ ({arc.discussionThread.length} جوابات):</p>
                            {arc.discussionThread.map((item) => (
                              <div
                                key={item.id}
                                className="bg-white/90 p-2 rounded-xl border border-stone-200 text-stone-800"
                              >
                                <div className="flex justify-between font-bold text-[10px] text-stone-600">
                                  <span>{item.senderName} ({item.senderRole})</span>
                                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p>{item.text}</p>
                                {item.audioData && (
                                  <div className="mt-1 flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handlePlayAdminAudio(`arc-dt-${item.id}`, item.audioData!)}
                                      className="w-5 h-5 rounded-full bg-stone-700 text-white flex items-center justify-center cursor-pointer"
                                    >
                                      {adminAudioId === `arc-dt-${item.id}` ? (
                                        <Pause className="w-2.5 h-2.5" />
                                      ) : (
                                        <Play className="w-2.5 h-2.5 fill-white ml-0.5" />
                                      )}
                                    </button>
                                    <span className="text-[10px] text-stone-500">وائس جواب سنیں</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 9: SETTINGS & BACKGROUND IMAGE & FACEBOOK */}
              {activeTab === 'settings' && (
                <div className="space-y-4 font-nastaliq">
                  {/* Village Background Image Upload Box */}
                  <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-3xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                      <ImageIcon className="w-5 h-5 text-emerald-700" />
                      <span>پورٹل کی بیک گراؤنڈ تصویر (Village Background Image)</span>
                    </div>

                    <p className="text-xs text-stone-700 leading-relaxed">
                      اپنے گاؤں رتہ کلاں کی خوبصورت تصویر موبائل سے اپلوڈ کریں، یہ پوری ایپ کے پس منظر میں نظر آئے گی۔
                    </p>

                    {/* Preview */}
                    <div className="relative h-32 w-full rounded-2xl overflow-hidden bg-stone-900 border border-stone-300">
                      {bgInput ? (
                        <img
                          src={bgInput}
                          alt="Village Background"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-stone-400 text-xs">
                          کوئی بیک گراؤنڈ تصویر منتخب نہیں ہے
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition">
                        <Upload className="w-4 h-4" />
                        <span>موبائل گیلری سے نئی تصویر لگائیں</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleBgFileUpload}
                        />
                      </label>
                      {bgSaveMsg && (
                        <span className="text-xs text-emerald-700 font-bold">تصویر تبدیل ہو گئی!</span>
                      )}
                    </div>
                  </div>

                  {/* Official Facebook Page Link Box */}
                  <form onSubmit={handleSaveFacebookUrl} className="bg-blue-50/70 border-2 border-blue-300 rounded-3xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-blue-950 font-bold text-sm">
                      <FacebookIcon className="w-5 h-5 text-blue-600" />
                      <span>رتہ کلاں آفیشل فیس بک پیج لنک:</span>
                    </div>

                    <input
                      type="url"
                      value={fbInput}
                      onChange={(e) => setFbInput(e.target.value)}
                      placeholder="https://facebook.com/groups/rattakallan..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono text-xs bg-white text-stone-900"
                      dir="ltr"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow"
                      >
                        فیس بک لنک محفوظ کریں
                      </button>
                      {fbSaveMsg && (
                        <span className="text-xs text-blue-700 font-bold">لنک محفوظ ہو گیا!</span>
                      )}
                    </div>
                  </form>

                  {/* Data Export & Backup */}
                  <div className="p-4 bg-stone-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <strong className="text-xs text-stone-800 block">پورٹل کا مکمل بیک اپ (Data Backup)</strong>
                      <span className="text-[11px] text-stone-500">تمام مساجد، اسکول اور پروفائلز کا ڈیٹا محفوظ کریں</span>
                    </div>
                    <button
                      type="button"
                      onClick={onExportData}
                      className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>بیک اپ ڈاؤنلوڈ کریں</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
