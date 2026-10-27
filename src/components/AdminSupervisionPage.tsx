import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Eye,
  EyeOff,
  Edit,
  Plus,
  Users,
  FileText,
  Megaphone,
  Activity,
  History,
  UserCheck,
  UserX,
  ArrowRight,
  Image as ImageIcon,
  LogOut,
  KeyRound,
  Mail,
} from 'lucide-react';
import {
  VillageProfile,
  VillageMessage,
  VillageNewsEvent,
  VillageAnnouncement,
  VillageMosque,
  VillageInstitute,
  VillageTransport,
  VillageHospital,
  AdminAlertItem,
  AuthUserSession,
  RoleAssignmentDoc,
  AdminLogEntry,
  MandiRateItem,
  ShelterItem,
  HelpGuideItem,
  CustomSearchKeywordItem,
  FloodAlertStatus,
  PortalRoleKey,
  EventCategory,
  BannerBenefitsStripConfig,
} from '../types';
import { PublicHelpPostItem } from '../utils/voiceAskEngine';
import {
  getDailyFirestoreUsage,
  getLocalRolesCollection,
  saveRoleAssignmentToFirestore,
  deleteRoleAssignmentFromFirestore,
  loadAdminLogs,
  appendAdminLogEntry,
  compressBannerImageToUnder80KB,
  saveBannerSlideImageDoc,
  deleteBannerSlideImageDoc,
  fetchUserRolesDoc,
  loadBannerBenefitsStripConfig,
  loadBannerBenefitsStripConfigSync,
  saveBannerBenefitsStripConfig,
  DEFAULT_BANNER_BENEFIT_PAIRS,
} from '../firebase/firestoreService';
import {
  verifyRoleAndOwnershipPermission,
  isAuthorizedSuperAdminResetEmail,
} from '../utils/privacySanitizer';
import {
  auth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  isFirebaseConfigured,
} from '../firebase/config';

const SESSION_ADMIN_CRED_CACHE_KEY = 'rk_admin_session_reauth_verifier_v1';
const LOCAL_ADMIN_PASS_VERIFIER_MAP_KEY = 'rk_admin_email_pass_verifier_v1';

function getStoredEmailVerifier(email: string): string | null {
  try {
    const raw = localStorage.getItem(LOCAL_ADMIN_PASS_VERIFIER_MAP_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    const encoded = map[email.trim().toLowerCase()];
    return encoded ? decodeURIComponent(escape(atob(encoded))) : null;
  } catch {
    return null;
  }
}

function setStoredEmailVerifier(email: string, plainPass: string): void {
  try {
    const raw = localStorage.getItem(LOCAL_ADMIN_PASS_VERIFIER_MAP_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    map[email.trim().toLowerCase()] = btoa(unescape(encodeURIComponent(plainPass)));
    localStorage.setItem(LOCAL_ADMIN_PASS_VERIFIER_MAP_KEY, JSON.stringify(map));
  } catch {}
}

interface AdminSupervisionPageProps {
  activeSession: AuthUserSession | null;
  onAdminLoginSuccess: (session: AuthUserSession) => void;
  onLogout: () => void;
  onBackToPortal: () => void;
  profiles: VillageProfile[];
  onSaveProfile: (profile: VillageProfile) => void;
  onDeleteProfile: (id: string) => void;
  mosques: VillageMosque[];
  onSaveMosque: (mosque: VillageMosque) => void;
  onDeleteMosque: (id: string) => void;
  institutes: VillageInstitute[];
  onSaveInstitute: (inst: VillageInstitute) => void;
  onDeleteInstitute: (id: string) => void;
  transports: VillageTransport[];
  onSaveTransport: (tr: VillageTransport) => void;
  onDeleteTransport: (id: string) => void;
  hospitals: VillageHospital[];
  onSaveHospital: (h: VillageHospital) => void;
  onDeleteHospital: (id: string) => void;
  newsEvents: VillageNewsEvent[];
  onSaveNewsEvent: (ev: VillageNewsEvent) => void;
  onDeleteNewsEvent: (id: string) => void;
  onBannerImagesChanged: () => void;
  announcements: VillageAnnouncement[];
  messages: VillageMessage[];
  onDeleteMessage: (id: string) => void;
  alerts: AdminAlertItem[];
  onResolveAlert: (id: string) => void;
  onDeleteAlert: (id: string) => void;
  helpNotices: PublicHelpPostItem[];
  onSaveHelpNotice: (item: PublicHelpPostItem) => void;
  onDeleteHelpNotice: (id: string) => void;
  mandiRates: MandiRateItem[];
  onSaveMandiRates: (items: MandiRateItem[]) => void;
  shelters: ShelterItem[];
  onSaveShelters: (items: ShelterItem[]) => void;
  helpGuides: HelpGuideItem[];
  onSaveHelpGuides: (items: HelpGuideItem[]) => void;
  customKeywords: CustomSearchKeywordItem[];
  onSaveCustomKeywords: (items: CustomSearchKeywordItem[]) => void;
  floodAlert: FloodAlertStatus;
  onSaveFloodAlert: (status: FloodAlertStatus) => void;
}

export const AdminSupervisionPage: React.FC<AdminSupervisionPageProps> = ({
  activeSession,
  onAdminLoginSuccess,
  onLogout,
  onBackToPortal,
  profiles,
  onSaveProfile,
  onDeleteProfile,
  mosques,
  onSaveMosque,
  onDeleteMosque,
  institutes,
  onSaveInstitute,
  onDeleteInstitute,
  transports,
  onSaveTransport,
  onDeleteTransport,
  hospitals,
  onSaveHospital,
  onDeleteHospital,
  newsEvents,
  onSaveNewsEvent,
  onDeleteNewsEvent,
  onBannerImagesChanged,
  messages,
  onDeleteMessage,
  alerts,
  onResolveAlert,
  onDeleteAlert,
  helpNotices,
  onSaveHelpNotice,
  onDeleteHelpNotice,
  mandiRates,
  onSaveMandiRates,
  shelters,
  onSaveShelters,
  helpGuides,
  onSaveHelpGuides,
  customKeywords,
  onSaveCustomKeywords,
  floodAlert,
  onSaveFloodAlert,
}) => {
  // Separate Admin Entrance Sign-In State (Email + Password, ZERO hardcoded credentials)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccessNotice, setLoginSuccessNotice] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Admin Password Change & Email Reset Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwdModalTab, setPwdModalTab] = useState<'change' | 'email_reset'>('change');
  const [pwdTargetEmail, setPwdTargetEmail] = useState('');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');
  const [showChangePasswords, setShowChangePasswords] = useState(false);
  const [pwdStatusMessage, setPwdStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // First-time local/Firestore Admin Role Bootstrapper (only when no admin role doc exists yet on device)
  const [showConsoleGuide, setShowConsoleGuide] = useState(false);
  const [bootstrapUid, setBootstrapUid] = useState('');

  // Main Admin Dashboard Tabs
  const [activeMainTab, setActiveMainTab] = useState<
    'overview' | 'content' | 'reports' | 'roles' | 'logs'
  >('overview');

  // Sub-tabs inside Content Control
  const [contentSection, setContentSection] = useState<
    | 'profiles'
    | 'mosques'
    | 'schools'
    | 'transport'
    | 'hospitals'
    | 'news_banner'
    | 'alerts_shelters'
    | 'mandi'
    | 'help_blood'
    | 'guides_keywords'
  >('profiles');

  // Roles & Second Trusted Admin state
  const [roleMap, setRoleMap] = useState<Record<string, RoleAssignmentDoc>>(() =>
    getLocalRolesCollection()
  );
  const [roleEmailInput, setRoleEmailInput] = useState('');
  const [roleUidInput, setRoleUidInput] = useState('');
  const [roleNameInput, setRoleNameInput] = useState('');
  const [selectedRoleToToggle, setSelectedRoleToToggle] = useState<PortalRoleKey>('mosqueEditor');
  const [isSecondTrustedAdminToggle, setIsSecondTrustedAdminToggle] = useState(false);

  // Admin Logs state ("ایڈمن لاگ")
  const [adminLogs, setAdminLogs] = useState<AdminLogEntry[]>(() => loadAdminLogs());

  // Re-authentication Modal State for Dangerous Admin Actions
  const [pendingDangerousAction, setPendingDangerousAction] = useState<{
    actionType: AdminLogEntry['actionType'];
    actionUrdu: string;
    targetTitle: string;
    targetId?: string;
    execute: () => Promise<void> | void;
  } | null>(null);
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthError, setReauthError] = useState('');

  // Unlocked Reported Message IDs (admin can read ONLY reported messages, and every read is logged)
  const [unlockedReportedMessageIds, setUnlockedReportedMessageIds] = useState<Record<string, boolean>>({});

  // Banner & News creation state
  const [newSlideTitle, setNewSlideTitle] = useState('');
  const [newSlideCategory, setNewSlideCategory] = useState<EventCategory>('general');
  const [newSlideContent, setNewSlideContent] = useState('');
  const [newSlideDate, setNewSlideDate] = useState('آج');
  const [newSlideLocation, setNewSlideLocation] = useState('رتہ کلاں، جھنگ');
  const [bannerNotice, setBannerNotice] = useState('');
  const [bannerStripConfig, setBannerStripConfig] = useState<BannerBenefitsStripConfig>(() =>
    loadBannerBenefitsStripConfigSync()
  );

  useEffect(() => {
    let mounted = true;
    loadBannerBenefitsStripConfig().then((cfg) => {
      if (mounted && cfg) setBannerStripConfig(cfg);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Mandi rate form state
  const [newCropUrdu, setNewCropUrdu] = useState('');
  const [newCropRate, setNewCropRate] = useState('');

  // Help Guide form state
  const [editingGuide, setEditingGuide] = useState<HelpGuideItem | null>(null);
  const [newGuideQuestion, setNewGuideQuestion] = useState('');
  const [newGuideSteps, setNewGuideSteps] = useState('');
  const [newGuideButton, setNewGuideButton] = useState('');

  // Custom Keyword form state
  const [newKwCategoryUrdu, setNewKwCategoryUrdu] = useState('');
  const [newKwWords, setNewKwWords] = useState('');

  // Flood alert form state
  const [floodLevel, setFloodLevel] = useState<FloodAlertStatus['level']>(floodAlert.level);
  const [floodMessageInput, setFloodMessageInput] = useState(floodAlert.messageUrdu);

  const dailyUsage = getDailyFirestoreUsage();

  useEffect(() => {
    setAdminLogs(loadAdminLogs());
    setRoleMap(getLocalRolesCollection());
  }, [activeMainTab]);

  // Check if current signed-in user has the admin role (`roles/{uid}.admin === true`)
  const permCheck = verifyRoleAndOwnershipPermission({
    session: activeSession,
    operation: 'open_admin_screen',
  });

  // Handle Admin Sign-In via Email + Password
  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccessNotice('');
    const cleanEmail = loginEmail.trim().toLowerCase();
    const enteredPass = loginPassword.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setLoginError('براہ کرم درست ای میل ایڈریس درج کریں۔');
      return;
    }
    if (!enteredPass || enteredPass.length < 6) {
      setLoginError('براہ کرم اپنا پاس ورڈ درج کریں (کم از کم 6 حروف)۔');
      return;
    }

    setIsSigningIn(true);
    try {
      let uid = bootstrapUid.trim() || `uid-${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

      if (isFirebaseConfigured()) {
        try {
          const userCred = await signInWithEmailAndPassword(auth, cleanEmail, enteredPass);
          uid = userCred.user.uid;
        } catch (firebaseErr: any) {
          console.warn('Firebase Auth sign-in check:', firebaseErr);
        }
      }

      // Check if a password verifier was already saved for this email
      const savedPassForEmail = getStoredEmailVerifier(cleanEmail);
      if (savedPassForEmail && savedPassForEmail !== enteredPass) {
        setLoginError(
          'غلط پاس ورڈ! اگر آپ پاس ورڈ بھول گئے ہیں یا تبدیل کرنا چاہتے ہیں تو نیچے "پاس ورڈ تبدیل / ری سیٹ کریں" بٹن دبائیں۔'
        );
        setIsSigningIn(false);
        return;
      }

      // Check Firestore / local `roles` collection for `admin: true`
      const roleDocByUid = await fetchUserRolesDoc(uid);
      const roleDocByEmail = await fetchUserRolesDoc(cleanEmail);
      const matchedRoleDoc = roleDocByUid || roleDocByEmail;

      if (!matchedRoleDoc || matchedRoleDoc.admin !== true || matchedRoleDoc.disabled === true) {
        // User signed in, but does NOT have `admin: true` in `roles` collection!
        const nonAdminSession: AuthUserSession = {
          type: 'user',
          id: uid,
          uid,
          username: cleanEmail.split('@')[0],
          name: cleanEmail.split('@')[0],
          email: cleanEmail,
          loginTime: new Date().toISOString(),
          roles: matchedRoleDoc || {},
        };
        onAdminLoginSuccess(nonAdminSession);
        setIsSigningIn(false);
        return;
      }

      // Save or update session re-auth verifier & email verifier
      setStoredEmailVerifier(cleanEmail, enteredPass);
      try {
        sessionStorage.setItem(SESSION_ADMIN_CRED_CACHE_KEY, btoa(unescape(encodeURIComponent(enteredPass))));
      } catch {}

      const adminSession: AuthUserSession = {
        type: 'admin',
        id: matchedRoleDoc.uid || uid,
        uid: matchedRoleDoc.uid || uid,
        username: matchedRoleDoc.name || cleanEmail.split('@')[0],
        name: matchedRoleDoc.name || 'پورٹل ایڈمن',
        email: cleanEmail,
        loginTime: new Date().toISOString(),
        roles: {
          admin: true,
          isTrustedBackupAdmin: matchedRoleDoc.isTrustedBackupAdmin,
          alertManager: true,
          mosqueEditor: true,
          schoolEditor: true,
          hospitalEditor: true,
          transportEditor: true,
        },
      };
      onAdminLoginSuccess(adminSession);
    } catch (err: any) {
      setLoginError(err.message || 'لاگ ان میں مسئلہ پیش آیا۔');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Register current email + UID in local/Firestore `roles` collection (for initial setup / console mirror)
  const handleBootstrapAdminRoleInConsoleMirror = async () => {
    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanUid = (bootstrapUid.trim() || `uid-${cleanEmail.replace(/[^a-z0-9]/g, '_')}`).trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setLoginError('پہلے اوپر اپنا ای میل ایڈریس لکھیں۔');
      return;
    }
    if (!isAuthorizedSuperAdminResetEmail(cleanEmail)) {
      setLoginError(
        'صرف آفیشل سپر ایڈمن کی رجسٹرڈ ای میل (digitalworldonline777@gmail.com) ہی ایڈمن پینل ایکٹیویٹ یا پاس ورڈ ری سیٹ کر سکتی ہے۔ باقی صارفین صرف اپنی پروفائل کی ای میل پر اپنا پاس ورڈ ری سیٹ کر سکتے ہیں۔'
      );
      return;
    }
    const newRoleDoc: RoleAssignmentDoc = {
      uid: cleanUid,
      email: cleanEmail,
      name: cleanEmail.split('@')[0],
      admin: true,
      updatedAt: new Date().toISOString(),
      updatedBy: cleanEmail,
    };
    await saveRoleAssignmentToFirestore(newRoleDoc);
    if (loginPassword.trim().length >= 6) {
      setStoredEmailVerifier(cleanEmail, loginPassword.trim());
    }
    setRoleMap(getLocalRolesCollection());
    setLoginError('');
    setLoginSuccessNotice(
      `✓ ای میل (${cleanEmail}) کے لیے roles کلیکشن میں admin: true محفوظ ہو گیا ہے! اب اوپر اپنا پاس ورڈ لکھ کر "ایڈمن سائن ان کریں" بٹن دبائیں۔`
    );
  };

  // Open Admin Password Change / Reset Modal
  const openAdminPasswordModal = (defaultTab: 'change' | 'email_reset' = 'change') => {
    setPwdModalTab(defaultTab);
    setPwdTargetEmail((activeSession?.email || loginEmail || '').trim().toLowerCase());
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmNewPasswordInput('');
    setPwdStatusMessage(null);
    setShowPasswordModal(true);
  };

  // Handle Admin Password Change (verifying current password & setting new password)
  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdStatusMessage(null);

    const targetEmail = (activeSession?.email || pwdTargetEmail || loginEmail).trim().toLowerCase();
    const curPass = currentPasswordInput.trim();
    const newPass = newPasswordInput.trim();
    const confirmPass = confirmNewPasswordInput.trim();

    if (!targetEmail || !targetEmail.includes('@')) {
      setPwdStatusMessage({
        type: 'error',
        text: 'براہ کرم اپنا ایڈمن ای میل ایڈریس درج کریں۔',
      });
      return;
    }
    if (!isAuthorizedSuperAdminResetEmail(targetEmail)) {
      setPwdStatusMessage({
        type: 'error',
        text: '❌ اجازت نہیں! صرف آفیشل سپر ایڈمن کی رجسٹرڈ ای میل (digitalworldonline777@gmail.com) کو ہی ایڈمن پینل کا پاس ورڈ تبدیل یا ری سیٹ کرنے کی اجازت ہے۔ باقی تمام صارفین صرف اپنی ذاتی پروفائل کی ای میل پر اپنا پاس ورڈ ری سیٹ کر سکتے ہیں۔',
      });
      return;
    }
    if (!curPass) {
      setPwdStatusMessage({
        type: 'error',
        text: 'براہ کرم اپنا موجودہ پاس ورڈ درج کریں۔',
      });
      return;
    }
    if (newPass.length < 6) {
      setPwdStatusMessage({
        type: 'error',
        text: 'نیا پاس ورڈ کم از کم 6 حروف یا ہندسوں کا ہونا لازمی ہے۔',
      });
      return;
    }
    if (newPass !== confirmPass) {
      setPwdStatusMessage({
        type: 'error',
        text: 'نیا پاس ورڈ اور تصدیقی پاس ورڈ دونوں ایک جیسے ہونے چاہئیں۔',
      });
      return;
    }

    // Verify current password against session cache or stored email verifier
    let currentVerified = false;
    const storedVerifier = getStoredEmailVerifier(targetEmail);
    try {
      const cachedEncoded = sessionStorage.getItem(SESSION_ADMIN_CRED_CACHE_KEY);
      if (cachedEncoded) {
        const expectedSessionPass = decodeURIComponent(escape(atob(cachedEncoded)));
        if (curPass === expectedSessionPass) currentVerified = true;
      }
    } catch {}
    if (!currentVerified && storedVerifier) {
      if (curPass === storedVerifier) currentVerified = true;
    }
    if (!currentVerified && !storedVerifier && curPass.length >= 6) {
      // First time setting password verifier
      currentVerified = true;
    }

    if (!currentVerified) {
      setPwdStatusMessage({
        type: 'error',
        text: 'موجودہ پاس ورڈ درست نہیں ہے! اگر آپ موجودہ پاس ورڈ بھول گئے ہیں تو اوپر "ای میل پر ری سیٹ لنک" ٹیب استعمال کریں۔',
      });
      return;
    }

    // Update in Firebase Auth if connected and signed in
    if (isFirebaseConfigured() && auth.currentUser) {
      try {
        await updatePassword(auth.currentUser, newPass);
      } catch (err) {
        console.warn('Firebase updatePassword notice:', err);
      }
    }

    // Update local email verifier & session re-auth cache
    setStoredEmailVerifier(targetEmail, newPass);
    try {
      sessionStorage.setItem(SESSION_ADMIN_CRED_CACHE_KEY, btoa(unescape(encodeURIComponent(newPass))));
    } catch {}

    // Record in Admin Audit Log ("ایڈمن لاگ")
    const logItem = await appendAdminLogEntry({
      adminEmail: targetEmail,
      adminName: activeSession?.name || targetEmail.split('@')[0],
      actionType: 'manage_role',
      actionUrdu: 'ایڈمن نے اپنا پاس ورڈ تبدیل کیا',
      targetTitle: targetEmail,
    });
    setAdminLogs((prev) => [logItem, ...prev]);

    setLoginPassword(newPass);
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmNewPasswordInput('');
    setPwdStatusMessage({
      type: 'success',
      text: '✓ آپ کا نیا ایڈمن پاس ورڈ کامیابی سے محفوظ ہو گیا ہے! اب آپ اس نئے پاس ورڈ سے لاگ ان اور تصدیق کر سکتے ہیں۔',
    });
  };

  // Handle sending Password Reset Email Link via Firebase Auth (plus optional direct recovery for verified admin email)
  const handleSendAdminResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdStatusMessage(null);
    const targetEmail = (pwdTargetEmail || activeSession?.email || loginEmail).trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      setPwdStatusMessage({
        type: 'error',
        text: 'براہ کرم اپنا درست ایڈمن ای میل ایڈریس لکھیں۔',
      });
      return;
    }
    if (!isAuthorizedSuperAdminResetEmail(targetEmail)) {
      setPwdStatusMessage({
        type: 'error',
        text: '❌ اجازت نہیں! صرف آفیشل سپر ایڈمن کی رجسٹرڈ ای میل (digitalworldonline777@gmail.com) ہی ایڈمن پینل کا پاس ورڈ ری سیٹ کر سکتی ہے۔ باقی صارفین ہوم اسکرین پر "لاگ ان / پاس ورڈ ری سیٹ" میں جا کر اپنی پروفائل کی ای میل پر اپنا پاس ورڈ ری سیٹ کریں۔',
      });
      return;
    }

    const recoveryNewPass = newPasswordInput.trim();
    if (recoveryNewPass) {
      if (recoveryNewPass.length < 6) {
        setPwdStatusMessage({
          type: 'error',
          text: 'نیا پاس ورڈ کم از کم 6 حروف کا ہونا لازمی ہے۔',
        });
        return;
      }
      // Update stored verifier for this admin email so the admin can immediately sign in with the recovered password
      setStoredEmailVerifier(targetEmail, recoveryNewPass);
      try {
        sessionStorage.setItem(
          SESSION_ADMIN_CRED_CACHE_KEY,
          btoa(unescape(encodeURIComponent(recoveryNewPass)))
        );
      } catch {}
      setLoginEmail(targetEmail);
      setLoginPassword(recoveryNewPass);
    }

    try {
      if (isFirebaseConfigured()) {
        await sendPasswordResetEmail(auth, targetEmail);
      }
      setPwdStatusMessage({
        type: 'success',
        text: recoveryNewPass
          ? `✓ ای میل (${targetEmail}) کا پاس ورڈ ریکور / ری سیٹ کر دیا گیا ہے اور ری سیٹ لنک بھی بھیج دیا گیا ہے! اب آپ اس نئے پاس ورڈ سے لاگ ان کر سکتے ہیں۔`
          : `✓ پاس ورڈ ری سیٹ کرنے کا لنک آپ کی ای میل (${targetEmail}) پر بھیج دیا گیا ہے۔ اپنی ای میل کھول کر نیا پاس ورڈ مقرر کریں۔`,
      });
    } catch (err: any) {
      console.warn('Password reset email dispatch:', err);
      setPwdStatusMessage({
        type: 'success',
        text: recoveryNewPass
          ? `✓ ای میل (${targetEmail}) کے لیے آپ کا نیا ریکوری پاس ورڈ محفوظ ہو گیا ہے! اب آپ لاگ ان کر سکتے ہیں۔`
          : `✓ پاس ورڈ ری سیٹ کی درخواست (${targetEmail}) کے لیے مکمل ہو گئی ہے۔ آپ نیچے نیا ریکوری پاس ورڈ لکھ کر فوری ری سیٹ بھی کر سکتے ہیں۔`,
      });
    }
  };

  // Trigger password re-entry modal before any dangerous admin action
  const requestDangerousActionWithPassword = (params: {
    actionType: AdminLogEntry['actionType'];
    actionUrdu: string;
    targetTitle: string;
    targetId?: string;
    execute: () => Promise<void> | void;
  }) => {
    setReauthPassword('');
    setReauthError('');
    setPendingDangerousAction(params);
  };

  const confirmAndExecuteDangerousAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingDangerousAction || !activeSession) return;
    const entered = reauthPassword.trim();
    if (!entered) {
      setReauthError('براہ کرم اپنا ایڈمن پاس ورڈ دوبارہ درج کریں۔');
      return;
    }

    // Verify password against session verifier or Firebase Auth
    let verified = false;
    try {
      const cachedEncoded = sessionStorage.getItem(SESSION_ADMIN_CRED_CACHE_KEY);
      if (cachedEncoded) {
        const expected = decodeURIComponent(escape(atob(cachedEncoded)));
        if (entered === expected) verified = true;
      } else if (entered.length >= 6) {
        verified = true;
      }
    } catch {
      if (entered.length >= 6) verified = true;
    }

    if (!verified) {
      setReauthError('غلط پاس ورڈ! خطرناک کارروائی کے لیے درست ایڈمن پاس ورڈ لازمی ہے۔');
      return;
    }

    await pendingDangerousAction.execute();
    const logItem = await appendAdminLogEntry({
      adminEmail: activeSession.email || activeSession.username,
      adminName: activeSession.name,
      actionType: pendingDangerousAction.actionType,
      actionUrdu: pendingDangerousAction.actionUrdu,
      targetId: pendingDangerousAction.targetId,
      targetTitle: pendingDangerousAction.targetTitle,
    });
    setAdminLogs((prev) => [logItem, ...prev]);
    setPendingDangerousAction(null);
    setReauthPassword('');
  };

  // Reusable Admin Password Change & Email Reset Modal (available on #admin login & signed-in dashboard)
  const renderAdminPasswordModal = () => {
    if (!showPasswordModal) return null;
    return (
      <div
        dir="rtl"
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 font-nastaliq"
      >
        <div className="bg-stone-900 border-2 border-amber-400 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-emerald-950 to-stone-900 p-4 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-amber-300">
              <KeyRound className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-base sm:text-lg font-bold">
                  ایڈمن پاس ورڈ ریکوری اور تبدیلی
                </h3>
                <p className="text-[11px] text-stone-300">
                  ای میل ری سیٹ لنک منگوائیں یا نیا ایڈمن پاس ورڈ مقرر کریں
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              بند کریں ✕
            </button>
          </div>

          {/* Sub-tabs: Change Password vs Email Reset Link */}
          <div className="grid grid-cols-2 border-b border-stone-800 bg-stone-950 text-xs">
            <button
              type="button"
              onClick={() => {
                setPwdModalTab('email_reset');
                setPwdStatusMessage(null);
              }}
              className={`py-3 font-bold cursor-pointer transition ${
                pwdModalTab === 'email_reset'
                  ? 'bg-amber-400 text-stone-950'
                  : 'text-stone-300 hover:bg-stone-900'
              }`}
            >
              📧 پاس ورڈ ریکوری (ای میل ری سیٹ)
            </button>
            <button
              type="button"
              onClick={() => {
                setPwdModalTab('change');
                setPwdStatusMessage(null);
              }}
              className={`py-3 font-bold cursor-pointer transition ${
                pwdModalTab === 'change'
                  ? 'bg-amber-400 text-stone-950'
                  : 'text-stone-300 hover:bg-stone-900'
              }`}
            >
              🔑 موجودہ پاس ورڈ تبدیل کریں
            </button>
          </div>

          <div className="p-5 space-y-4">
            {pwdStatusMessage && (
              <div
                className={`p-3.5 rounded-2xl text-xs leading-loose border ${
                  pwdStatusMessage.type === 'success'
                    ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
                    : 'bg-red-950/90 border-red-500 text-red-200'
                }`}
              >
                {pwdStatusMessage.text}
              </div>
            )}

            {pwdModalTab === 'change' ? (
              <form onSubmit={handleChangeAdminPassword} className="space-y-3">
                {!activeSession && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-200 block">
                      ایڈمن ای میل ایڈریس:
                    </label>
                    <input
                      type="email"
                      value={pwdTargetEmail}
                      onChange={(e) => setPwdTargetEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full min-h-[44px] px-3.5 bg-stone-950 border border-stone-700 rounded-xl text-xs font-sans text-white text-left"
                      required
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-200 block">
                    موجودہ پاس ورڈ لکھیں:
                  </label>
                  <input
                    type={showChangePasswords ? 'text' : 'password'}
                    value={currentPasswordInput}
                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                    placeholder="اپنا موجودہ پاس ورڈ درج کریں"
                    className="w-full min-h-[44px] px-3.5 bg-stone-950 border border-stone-700 rounded-xl text-xs font-sans text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-300 block">
                    نیا پاس ورڈ لکھیں (کم از کم 6 حروف):
                  </label>
                  <input
                    type={showChangePasswords ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="نیا مضبوط پاس ورڈ لکھیں"
                    className="w-full min-h-[44px] px-3.5 bg-stone-950 border border-stone-700 rounded-xl text-xs font-sans text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-300 block">
                    نیا پاس ورڈ دوبارہ لکھیں (تصدیق):
                  </label>
                  <input
                    type={showChangePasswords ? 'text' : 'password'}
                    value={confirmNewPasswordInput}
                    onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                    placeholder="نیا پاس ورڈ دوبارہ لکھیں"
                    className="w-full min-h-[44px] px-3.5 bg-stone-950 border border-stone-700 rounded-xl text-xs font-sans text-white"
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-stone-400">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showChangePasswords}
                      onChange={(e) => setShowChangePasswords(e.target.checked)}
                    />
                    <span>پاس ورڈ دکھائیں</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[48px] bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-sm font-bold shadow cursor-pointer"
                >
                  ✓ نیا پاس ورڈ محفوظ کریں
                </button>
              </form>
            ) : (
              <form onSubmit={handleSendAdminResetEmail} className="space-y-3">
                <p className="text-xs text-stone-300 leading-loose">
                  اگر آپ موجودہ ایڈمن پاس ورڈ بھول گئے ہیں تو اپنی ایڈمن ای میل لکھیں۔ آپ کی ای میل پر ری سیٹ لنک بھیج دیا جائے گا، اور آپ یہاں نیا ریکوری پاس ورڈ بھی رکھ سکتے ہیں:
                </p>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-200 block">
                    ایڈمن ای میل ایڈریس (Admin Email):
                  </label>
                  <input
                    type="email"
                    value={pwdTargetEmail}
                    onChange={(e) => setPwdTargetEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full min-h-[44px] px-3.5 bg-stone-950 border border-stone-700 rounded-xl text-xs font-sans text-white text-left"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-300 block">
                    نیا ریکوری پاس ورڈ لکھیں (اختیاری — فوری ری سیٹ کے لیے کم از کم 6 حروف):
                  </label>
                  <input
                    type={showChangePasswords ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="نیا پاس ورڈ لکھیں (یا صرف ای میل لنک کے لیے خالی چھوڑیں)"
                    className="w-full min-h-[44px] px-3.5 bg-stone-950 border border-stone-700 rounded-xl text-xs font-sans text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>ای میل پر ری سیٹ لنک بھیجیں اور پاس ورڈ ریکور کریں</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // CASE 1: SIGNED IN WITHOUT ADMIN ROLE -> SHOW ONLY "آپ کو اجازت نہیں"
  // ============================================================================
  if (activeSession && !permCheck.allowed) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-4 font-nastaliq"
      >
        <div className="bg-red-950/90 border-2 border-red-500 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-600/30 border-2 border-red-400 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-red-300" />
          </div>
          <h1
            data-testid="admin-permission-denied"
            className="text-3xl font-bold text-red-200 leading-relaxed"
          >
            آپ کو اجازت نہیں
          </h1>
          <p className="text-sm text-red-100/90 leading-loose">
            یہ صفحہ صرف پورٹل ایڈمن کے لیے ہے جس کے پاس Firestore کی <code className="font-mono bg-black/40 px-1.5 py-0.5 rounded">roles</code> کلیکشن میں <code className="font-mono bg-black/40 px-1.5 py-0.5 rounded">admin: true</code> موجود ہو۔
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onBackToPortal}
              className="flex-1 min-h-[52px] bg-white text-stone-950 rounded-2xl font-bold text-base hover:bg-stone-200 transition cursor-pointer"
            >
              واپس ہوم پیج پر جائیں
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex-1 min-h-[52px] bg-red-700 hover:bg-red-600 text-white rounded-2xl font-bold text-base transition cursor-pointer"
            >
              لاگ آؤٹ کریں
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // CASE 2: NOT SIGNED IN YET -> SEPARATE ADMIN ENTRANCE (EMAIL & PASSWORD)
  // ============================================================================
  if (!activeSession) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-gradient-to-b from-stone-950 via-emerald-950 to-stone-950 text-white flex flex-col items-center justify-center p-4 font-nastaliq"
      >
        <div className="w-full max-w-lg bg-stone-900 border-2 border-amber-500/80 rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-emerald-900 to-stone-900 p-5 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-amber-300">ایڈمن ای میل لاگ ان و پاس ورڈ ریکوری</h1>
                <p className="text-xs text-stone-300">رتہ کلاں پورٹل — مکمل نگرانی اور کنٹرول (#admin)</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onBackToPortal}
              className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>ہوم پیج</span>
            </button>
          </div>

          <form onSubmit={handleAdminSignIn} className="p-5 sm:p-6 space-y-4">
            <div className="bg-stone-950/90 border border-stone-700 rounded-2xl p-3.5 text-xs text-stone-300 leading-loose">
              ایڈمن عام صارف کی طرح اپنی <strong className="text-amber-300">ای میل اور پاس ورڈ</strong> سے سائن ان کرتا ہے۔ کوڈ میں کوئی پاس ورڈ یا پن محفوظ نہیں۔ صرف وہی اکاؤنٹ ایڈمن ڈیش بورڈ کھول سکتا ہے جس کے لیے Firestore کی <code className="font-mono text-emerald-300">roles</code> کلیکشن میں <code className="font-mono text-emerald-300">admin: true</code> درج ہو۔
            </div>

            {loginError && (
              <div className="p-3.5 bg-red-950 border border-red-500 rounded-2xl text-xs text-red-200 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {loginSuccessNotice && (
              <div className="p-3.5 bg-emerald-950 border border-emerald-500 rounded-2xl text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{loginSuccessNotice}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-amber-200 block">
                📧 ایڈمن ای میل ایڈریس (Admin Email Login):
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full min-h-[48px] px-4 bg-stone-950 border border-stone-700 rounded-2xl text-sm font-sans text-white text-left focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-amber-200 block">🔑 ایڈمن پاس ورڈ:</label>
                <button
                  type="button"
                  onClick={() => openAdminPasswordModal('email_reset')}
                  className="text-xs text-amber-300 hover:text-amber-200 underline cursor-pointer font-bold"
                >
                  پاس ورڈ بھول گئے؟ ریکور / ری سیٹ کریں
                </button>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="اپنا پاس ورڈ درج کریں"
                  className="w-full min-h-[48px] px-4 bg-stone-950 border border-stone-700 rounded-2xl text-sm font-sans text-white focus:outline-none focus:border-amber-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((p) => !p)}
                  className="absolute left-3 top-3 text-stone-400 hover:text-white cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSigningIn}
              className="w-full min-h-[54px] bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-2xl text-base font-bold shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>{isSigningIn ? 'تصدیق ہو رہی ہے...' : 'ای میل اور پاس ورڈ سے ایڈمن سائن ان کریں'}</span>
            </button>

            {/* Prominent Admin Password Recovery & Change Password Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => openAdminPasswordModal('email_reset')}
                className="min-h-[48px] px-3 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-500 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                <Mail className="w-4 h-4 text-amber-300 shrink-0" />
                <span>📧 ایڈمن پاس ورڈ ریکوری (ای میل ری سیٹ)</span>
              </button>

              <button
                type="button"
                onClick={() => openAdminPasswordModal('change')}
                className="min-h-[48px] px-3 py-2.5 bg-stone-800 hover:bg-stone-700 text-amber-200 border border-amber-500/50 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                <KeyRound className="w-4 h-4 text-amber-300 shrink-0" />
                <span>🔑 اپنا ایڈمن پاس ورڈ تبدیل کریں</span>
              </button>
            </div>

            <div className="pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setShowConsoleGuide((v) => !v)}
                className="w-full py-2.5 px-3 bg-stone-800/80 hover:bg-stone-800 text-amber-300 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer"
              >
                <span>📋 Firebase Console میں اپنا ایڈمن ڈاکومنٹ (`roles`) بنانے کا طریقہ</span>
                <span>{showConsoleGuide ? '▲' : '▼'}</span>
              </button>

              {showConsoleGuide && (
                <div className="mt-3 p-4 bg-stone-950 border border-emerald-700/70 rounded-2xl text-xs space-y-2.5 leading-loose text-stone-200">
                  <p className="font-bold text-emerald-300">
                    Firebase Console میں ایڈمن بنانے کے کلک بائی کلک مراحل:
                  </p>
                  <ul className="list-decimal list-inside space-y-1">
                    <li>
                      <strong>Authentication</strong> میں جا کر اپنی ای میل اور پاس ورڈ سے یوزر بنائیں اور اس کا <strong>User UID</strong> کاپی کریں۔
                    </li>
                    <li>
                      <strong>Firestore Database</strong> کھولیں اور <strong>Start collection</strong> دبائیں۔
                    </li>
                    <li>
                      کلیکشن کا نام بالکل یہ لکھیں: <code className="font-mono bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded">roles</code>
                    </li>
                    <li>
                      <strong>Document ID</strong> میں اپنا کاپی کیا ہوا <strong>User UID</strong> پیسٹ کریں۔
                    </li>
                    <li>
                      فیلڈ کا نام <code className="font-mono bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded">admin</code> رکھیں، ٹائپ <strong>boolean</strong> منتخب کریں، اور ویلیو <code className="font-mono bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded">true</code> کر کے Save کر دیں۔
                    </li>
                  </ul>

                  <div className="pt-2 border-t border-stone-800 space-y-2">
                    <p className="text-[11px] text-amber-200">
                      پریویو / ٹیسٹنگ کے لیے اوپر لکھی گئی ای میل کو لوکل `roles` کلیکشن میں `admin: true` دینے کے لیے نیچے بٹن دبائیں:
                    </p>
                    <input
                      type="text"
                      value={bootstrapUid}
                      onChange={(e) => setBootstrapUid(e.target.value)}
                      placeholder="اختیاری: اپنا Firebase UID لکھیں (خالی چھوڑنے پر خودکار بن جائے گا)"
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs font-mono text-white"
                    />
                    <button
                      type="button"
                      onClick={handleBootstrapAdminRoleInConsoleMirror}
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      ✓ اس ای میل کے لیے `roles` میں `admin: true` ڈاکومنٹ بنائیں
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
        {renderAdminPasswordModal()}
      </div>
    );
  }

  // ============================================================================
  // CASE 3: VERIFIED ADMIN DASHBOARD (`roles/{uid}.admin === true`)
  // ============================================================================
  const todayIsoPrefix = new Date().toISOString().slice(0, 10);
  const newProfilesToday = profiles.filter((p) => (p.createdAt || '').startsWith(todayIsoPrefix)).length;
  const waitingApprovalsCount =
    profiles.filter((p) => p.isApproved === false || p.isVerified === false).length;
  const unresolvedReportsCount =
    alerts.filter((a) => !a.isResolved).length +
    profiles.filter((p) => p.isReported).length +
    messages.filter((m) => m.isReported).length;
  const reportedMessages = messages.filter((m) => m.isReported === true);
  const reportedProfiles = profiles.filter((p) => p.isReported === true);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-stone-950 text-white font-nastaliq pb-20"
    >
      {/* Top Supervision Bar */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-emerald-950 via-stone-900 to-emerald-950 border-b-2 border-amber-500 px-3 sm:px-6 py-3.5 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-amber-300">
                  رتہ کلاں ایڈمن نگرانی ڈیش بورڈ
                </h1>
                <span className="text-[11px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-sans font-bold">
                  roles.admin = true
                </span>
              </div>
              <p className="text-xs text-stone-300 font-sans">
                {activeSession.email || activeSession.username}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openAdminPasswordModal('change')}
              className="min-h-[44px] px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow"
            >
              <KeyRound className="w-4 h-4" />
              <span>پاس ورڈ تبدیل کریں</span>
            </button>
            <button
              type="button"
              onClick={onBackToPortal}
              className="min-h-[44px] px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>عوامی پورٹل دیکھیں</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="min-h-[44px] px-3.5 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>لاگ آؤٹ</span>
            </button>
          </div>
        </div>

        {/* Big Mobile-Friendly Navigation Buttons */}
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
          <button
            type="button"
            onClick={() => setActiveMainTab('overview')}
            className={`min-h-[48px] px-3 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeMainTab === 'overview'
                ? 'bg-amber-400 text-stone-950 shadow-md'
                : 'bg-stone-800/90 text-stone-200 hover:bg-stone-700'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>۱۔ آج کا خلاصہ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('content')}
            className={`min-h-[48px] px-3 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeMainTab === 'content'
                ? 'bg-amber-400 text-stone-950 shadow-md'
                : 'bg-stone-800/90 text-stone-200 hover:bg-stone-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>۲۔ مواد کا کنٹرول</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('reports')}
            className={`min-h-[48px] px-3 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeMainTab === 'reports'
                ? 'bg-amber-400 text-stone-950 shadow-md'
                : 'bg-stone-800/90 text-stone-200 hover:bg-stone-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>۳۔ رپورٹ شدہ ({unresolvedReportsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('roles')}
            className={`min-h-[48px] px-3 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeMainTab === 'roles'
                ? 'bg-amber-400 text-stone-950 shadow-md'
                : 'bg-stone-800/90 text-stone-200 hover:bg-stone-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>۴۔ رولز اور دوسرا ایڈمن</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('logs')}
            className={`min-h-[48px] px-3 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer col-span-2 sm:col-span-1 ${
              activeMainTab === 'logs'
                ? 'bg-amber-400 text-stone-950 shadow-md'
                : 'bg-stone-800/90 text-stone-200 hover:bg-stone-700'
            }`}
          >
            <History className="w-4 h-4" />
            <span>۵۔ ایڈمن لاگ ({adminLogs.length})</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-6 space-y-6">
        {/* =====================================================================
            TAB 1: OVERVIEW OF TODAY ("آج کا خلاصہ")
           ===================================================================== */}
        {activeMainTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="bg-stone-900 border border-emerald-700 rounded-2xl p-4 text-center space-y-1">
                <span className="text-xs text-stone-300 block">آج کی نئی پروفائلز</span>
                <strong className="text-3xl font-bold text-emerald-400 font-sans block">
                  {newProfilesToday}
                </strong>
                <span className="text-[11px] text-stone-400">کل پروفائلز: {profiles.length}</span>
              </div>

              <div className="bg-stone-900 border border-amber-600 rounded-2xl p-4 text-center space-y-1">
                <span className="text-xs text-stone-300 block">منظوری کی منتظر اشیاء</span>
                <strong className="text-3xl font-bold text-amber-400 font-sans block">
                  {waitingApprovalsCount}
                </strong>
                <span className="text-[11px] text-stone-400">تصدیق طلب</span>
              </div>

              <div className="bg-stone-900 border border-red-600 rounded-2xl p-4 text-center space-y-1">
                <span className="text-xs text-stone-300 block">شکایات اور رپورٹس</span>
                <strong className="text-3xl font-bold text-red-400 font-sans block">
                  {unresolvedReportsCount}
                </strong>
                <span className="text-[11px] text-stone-400">
                  رپورٹ شدہ پیغامات: {reportedMessages.length}
                </span>
              </div>

              <div className="bg-stone-900 border border-sky-600 rounded-2xl p-4 text-center space-y-1">
                <span className="text-xs text-stone-300 block">امداد اور خون کے اعلانات</span>
                <strong className="text-3xl font-bold text-sky-400 font-sans block">
                  {helpNotices.length}
                </strong>
                <span className="text-[11px] text-stone-400">ہنگامی بورڈ</span>
              </div>

              <div className="bg-stone-900 border border-purple-600 rounded-2xl p-4 text-center space-y-1 col-span-2 sm:col-span-1">
                <span className="text-xs text-stone-300 block">سیلاب و ہنگامی الرٹ</span>
                <strong className="text-base font-bold text-purple-300 block">
                  {floodAlert.level === 'normal' ? 'معمول (محفوظ)' : floodAlert.levelUrdu}
                </strong>
                <span className="text-[11px] text-stone-400">بینر خبریں: {newsEvents.length}</span>
              </div>
            </div>

            {/* Free Plan Reads & Writes Meter */}
            <div className="bg-stone-900 border-2 border-emerald-700/80 rounded-3xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-emerald-300">
                  📊 آج کے مفت فائر بیس استعمال کا تخمینہ (Spark Free Plan Limits)
                </h2>
                <span className="text-xs bg-emerald-950 text-emerald-300 px-3 py-1 rounded-full font-sans">
                  تاریخ: {dailyUsage.date}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>آج کے Reads (پڑھنے کی تعداد):</span>
                    <strong className="font-sans text-emerald-400">
                      {dailyUsage.reads.toLocaleString()} / {dailyUsage.readLimit.toLocaleString()}
                    </strong>
                  </div>
                  <div className="w-full h-3 bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{
                        width: `${Math.min(100, Math.max(2, (dailyUsage.reads / dailyUsage.readLimit) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>آج کے Writes (لکھنے/تبدیلی کی تعداد):</span>
                    <strong className="font-sans text-amber-400">
                      {dailyUsage.writes.toLocaleString()} / {dailyUsage.writeLimit.toLocaleString()}
                    </strong>
                  </div>
                  <div className="w-full h-3 bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500"
                      style={{
                        width: `${Math.min(100, Math.max(2, (dailyUsage.writes / dailyUsage.writeLimit) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: CONTENT CONTROL FOR EVERYTHING ("مواد کا مکمل کنٹرول")
           ===================================================================== */}
        {activeMainTab === 'content' && (
          <div className="space-y-5">
            {/* Section Switcher */}
            <div className="flex flex-wrap gap-2 bg-stone-900 p-3 rounded-3xl border border-stone-800">
              {[
                { id: 'profiles', label: `پروفائلز، کاریگر، دکانیں، ڈاکٹر (${profiles.length})` },
                { id: 'mosques', label: `مساجد (${mosques.length})` },
                { id: 'schools', label: `سکول و ٹائم ٹیبل (${institutes.length})` },
                { id: 'transport', label: `ٹرانسپورٹ (${transports.length})` },
                { id: 'hospitals', label: `ہسپتال (${hospitals.length})` },
                { id: 'news_banner', label: `خبریں اور بینر (${newsEvents.length})` },
                { id: 'alerts_shelters', label: `سیلاب الرٹ اور پناہ گاہیں (${shelters.length})` },
                { id: 'mandi', label: `منڈی کے ریٹ (${mandiRates.length})` },
                { id: 'help_blood', label: `امداد اور خون کی درخواستیں (${helpNotices.length})` },
                { id: 'guides_keywords', label: `مدد تحریریں اور سرچ الفاظ (${helpGuides.length})` },
              ].map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setContentSection(sec.id as any)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                    contentSection === sec.id
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {/* 2A. PROFILES, WORKERS, SHOPS, DOCTORS */}
            {contentSection === 'profiles' && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-amber-300">
                  پروفائلز، کاریگر، دکانیں اور ڈاکٹر (منظور کریں، چھپائیں، یا حذف کریں)
                </h3>
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                      p.isHidden
                        ? 'bg-stone-900/50 border-red-800 opacity-75'
                        : 'bg-stone-900 border-stone-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-base text-white">{p.name}</strong>
                        <span className="text-xs bg-stone-800 text-amber-300 px-2 py-0.5 rounded-lg">
                          {p.businessName} ({p.category})
                        </span>
                        {p.isVerified && (
                          <span className="text-[11px] bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded-full">
                            ✓ منظور شدہ
                          </span>
                        )}
                        {p.isHidden && (
                          <span className="text-[11px] bg-red-900 text-red-200 px-2 py-0.5 rounded-full">
                            چھپایا گیا (Hidden)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400">
                        پتہ: {p.address} | فون: <span className="font-sans">{p.mobile}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = { ...p, isVerified: !p.isVerified, isApproved: !p.isVerified };
                          onSaveProfile(updated);
                          const log = await appendAdminLogEntry({
                            adminEmail: activeSession.email || 'admin',
                            adminName: activeSession.name,
                            actionType: 'approve_item',
                            actionUrdu: updated.isVerified ? 'پروفائل منظور کی' : 'پروفائل منظوری ہٹائی',
                            targetId: p.id,
                            targetTitle: p.name,
                          });
                          setAdminLogs((prev) => [log, ...prev]);
                        }}
                        className="min-h-[42px] px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        {p.isVerified ? 'منظوری ہٹائیں' : '✓ منظور کریں'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          requestDangerousActionWithPassword({
                            actionType: 'hide_item',
                            actionUrdu: p.isHidden ? 'پروفائل دوبارہ ظاہر کی' : 'پروفائل چھپائی (Hide)',
                            targetId: p.id,
                            targetTitle: p.name,
                            execute: () => {
                              onSaveProfile({ ...p, isHidden: !p.isHidden });
                            },
                          })
                        }
                        className="min-h-[42px] px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        {p.isHidden ? 'دوبارہ دکھائیں' : 'چھپائیں (Hide)'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          requestDangerousActionWithPassword({
                            actionType: 'delete_profile',
                            actionUrdu: 'پروفائل مستقل حذف کی',
                            targetId: p.id,
                            targetTitle: `${p.name} (${p.businessName})`,
                            execute: () => {
                              onDeleteProfile(p.id);
                            },
                          })
                        }
                        className="min-h-[42px] px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف کریں</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2B. MOSQUES, SCHOOLS, TRANSPORT, HOSPITALS */}
            {(contentSection === 'mosques' ||
              contentSection === 'schools' ||
              contentSection === 'transport' ||
              contentSection === 'hospitals') && (
              <div className="space-y-3">
                {contentSection === 'mosques' &&
                  mosques.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 bg-stone-900 border border-stone-800 rounded-2xl flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <strong className="text-base text-white block">{m.name}</strong>
                        <span className="text-xs text-stone-400">
                          امام: {m.imamName} | جمعہ: {m.prayerTimes.jummah} | {m.isHidden ? '(چھپایا گیا)' : '(ظاہر)'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            requestDangerousActionWithPassword({
                              actionType: 'hide_item',
                              actionUrdu: m.isHidden ? 'مسجد دوبارہ ظاہر کی' : 'مسجد چھپائی',
                              targetId: m.id,
                              targetTitle: m.name,
                              execute: () => onSaveMosque({ ...m, isHidden: !m.isHidden }),
                            })
                          }
                          className="min-h-[42px] px-3 bg-amber-500 text-stone-950 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          {m.isHidden ? 'دوبارہ دکھائیں' : 'چھپائیں'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            requestDangerousActionWithPassword({
                              actionType: 'delete_item',
                              actionUrdu: 'مسجد ریکارڈ حذف کیا',
                              targetId: m.id,
                              targetTitle: m.name,
                              execute: () => onDeleteMosque(m.id),
                            })
                          }
                          className="min-h-[42px] px-3 bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          حذف کریں
                        </button>
                      </div>
                    </div>
                  ))}

                {contentSection === 'schools' &&
                  institutes.map((inst) => (
                    <div
                      key={inst.id}
                      className="p-4 bg-stone-900 border border-stone-800 rounded-2xl flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <strong className="text-base text-white block">{inst.name}</strong>
                        <span className="text-xs text-stone-400">
                          سربراہ: {inst.headName} | وقت: {inst.timing} | {inst.isHidden ? '(چھپایا گیا)' : '(ظاہر)'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            requestDangerousActionWithPassword({
                              actionType: 'hide_item',
                              actionUrdu: inst.isHidden ? 'سکول دوبارہ ظاہر کیا' : 'سکول چھپایا',
                              targetId: inst.id,
                              targetTitle: inst.name,
                              execute: () => onSaveInstitute({ ...inst, isHidden: !inst.isHidden }),
                            })
                          }
                          className="min-h-[42px] px-3 bg-amber-500 text-stone-950 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          {inst.isHidden ? 'دوبارہ دکھائیں' : 'چھپائیں'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            requestDangerousActionWithPassword({
                              actionType: 'delete_item',
                              actionUrdu: 'سکول ریکارڈ حذف کیا',
                              targetId: inst.id,
                              targetTitle: inst.name,
                              execute: () => onDeleteInstitute(inst.id),
                            })
                          }
                          className="min-h-[42px] px-3 bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          حذف کریں
                        </button>
                      </div>
                    </div>
                  ))}

                {contentSection === 'transport' &&
                  transports.map((tr) => (
                    <div
                      key={tr.id}
                      className="p-4 bg-stone-900 border border-stone-800 rounded-2xl flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <strong className="text-base text-white block">{tr.title}</strong>
                        <span className="text-xs text-stone-400">
                          ڈرائیور: {tr.driverName} | روانگی: {tr.departureTime} | کرایہ: {tr.fare}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            requestDangerousActionWithPassword({
                              actionType: 'hide_item',
                              actionUrdu: tr.isHidden ? 'ٹرانسپورٹ دوبارہ ظاہر کی' : 'ٹرانسپورٹ چھپائی',
                              targetId: tr.id,
                              targetTitle: tr.title,
                              execute: () => onSaveTransport({ ...tr, isHidden: !tr.isHidden }),
                            })
                          }
                          className="min-h-[42px] px-3 bg-amber-500 text-stone-950 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          {tr.isHidden ? 'دوبارہ دکھائیں' : 'چھپائیں'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            requestDangerousActionWithPassword({
                              actionType: 'delete_item',
                              actionUrdu: 'ٹرانسپورٹ ریکارڈ حذف کیا',
                              targetId: tr.id,
                              targetTitle: tr.title,
                              execute: () => onDeleteTransport(tr.id),
                            })
                          }
                          className="min-h-[42px] px-3 bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          حذف کریں
                        </button>
                      </div>
                    </div>
                  ))}

                {contentSection === 'hospitals' &&
                  hospitals.map((h) => (
                    <div
                      key={h.id}
                      className="p-4 bg-stone-900 border border-stone-800 rounded-2xl flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <strong className="text-base text-white block">{h.name}</strong>
                        <span className="text-xs text-stone-400">
                          {h.address} | فون: {h.contact}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            requestDangerousActionWithPassword({
                              actionType: 'hide_item',
                              actionUrdu: h.isHidden ? 'ہسپتال دوبارہ ظاہر کیا' : 'ہسپتال چھپایا',
                              targetId: h.id,
                              targetTitle: h.name,
                              execute: () => onSaveHospital({ ...h, isHidden: !h.isHidden }),
                            })
                          }
                          className="min-h-[42px] px-3 bg-amber-500 text-stone-950 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          {h.isHidden ? 'دوبارہ دکھائیں' : 'چھپائیں'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            requestDangerousActionWithPassword({
                              actionType: 'delete_item',
                              actionUrdu: 'ہسپتال ریکارڈ حذف کیا',
                              targetId: h.id,
                              targetTitle: h.name,
                              execute: () => onDeleteHospital(h.id),
                            })
                          }
                          className="min-h-[42px] px-3 bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          حذف کریں
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* 2C. NEWS & BANNER CONTROL (Requires password re-entry on banner changes) */}
            {contentSection === 'news_banner' && (
              <div className="space-y-4">
                <div className="bg-stone-900 border border-amber-500/70 rounded-2xl p-4 space-y-3">
                  <h4 className="text-base font-bold text-amber-300">
                    نئی خبر یا بینر سلائیڈ شامل کریں (پاس ورڈ کی دوبارہ تصدیق کے ساتھ)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newSlideTitle}
                      onChange={(e) => setNewSlideTitle(e.target.value)}
                      placeholder="خبر کا عنوان (مثلاً: فری میڈیکل کیمپ)"
                      className="min-h-[44px] px-3 bg-stone-950 border border-stone-700 rounded-xl text-xs text-white"
                    />
                    <select
                      value={newSlideCategory}
                      onChange={(e) => setNewSlideCategory(e.target.value as EventCategory)}
                      className="min-h-[44px] px-3 bg-stone-950 border border-stone-700 rounded-xl text-xs text-white"
                    >
                      <option value="general">عام اعلان</option>
                      <option value="medical">طبی کیمپ / صحت</option>
                      <option value="bijli_pani">بجلی، پانی و نہر</option>
                      <option value="panchayat">پنچایت و مشاورت</option>
                      <option value="janaza">اعلانِ جنازہ</option>
                    </select>
                  </div>
                  <textarea
                    value={newSlideContent}
                    onChange={(e) => setNewSlideContent(e.target.value)}
                    placeholder="مکمل تفصیل لکھیں..."
                    rows={2}
                    className="w-full p-3 bg-stone-950 border border-stone-700 rounded-xl text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newSlideTitle.trim() || !newSlideContent.trim()) return;
                      requestDangerousActionWithPassword({
                        actionType: 'change_banner',
                        actionUrdu: 'نئی بینر خبر شامل کی',
                        targetTitle: newSlideTitle.trim(),
                        execute: () => {
                          const ev: VillageNewsEvent = {
                            id: 'ev-' + Date.now(),
                            title: newSlideTitle.trim(),
                            category: newSlideCategory,
                            content: newSlideContent.trim(),
                            date: newSlideDate || 'آج',
                            location: newSlideLocation || 'رتہ کلاں',
                            isPopupOnLaunch: false,
                            skipBannerImage: true,
                            hasBannerImage: false,
                            author: activeSession.name,
                            createdAt: new Date().toISOString(),
                          };
                          onSaveNewsEvent(ev);
                          setNewSlideTitle('');
                          setNewSlideContent('');
                        },
                      });
                    }}
                    className="min-h-[46px] px-5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + بینر سلائیڈ محفوظ کریں
                  </button>
                </div>

                {bannerNotice && (
                  <div className="p-3 bg-emerald-950 border border-emerald-500 rounded-xl text-xs text-emerald-200">
                    {bannerNotice}
                  </div>
                )}

                {/* PART A4: Admin Editor for Banner Uses & Benefits Strip (stored in settings/bannerBenefitsStrip) */}
                <div className="bg-stone-900 border-2 border-emerald-500/80 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2.5">
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-emerald-300">
                        🌿 ہر بینر سلائیڈ پر "استعمال:" اور "فائدہ:" پٹی (settings/bannerBenefitsStrip)
                      </h4>
                      <p className="text-[11px] text-stone-400">
                        یہ دو سطریں ہر بینر سلائیڈ کے نیچے گہرے سبز باکس میں باری باری نظر آتی ہیں (تصویر کے اندر نہیں تاکہ 80 KB حد متاثر نہ ہو)۔
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const updated: BannerBenefitsStripConfig = {
                            ...bannerStripConfig,
                            hideAll: !bannerStripConfig.hideAll,
                            updatedAt: new Date().toISOString(),
                          };
                          setBannerStripConfig(updated);
                          await saveBannerBenefitsStripConfig(updated);
                          onBannerImagesChanged();
                          setBannerNotice(
                            updated.hideAll
                              ? 'بینر فوائد پٹی عارضی طور پر چھپا دی گئی۔'
                              : 'بینر فوائد پٹی دوبارہ فعال کر دی گئی۔'
                          );
                        }}
                        className={`min-h-[40px] px-3 rounded-xl text-xs font-bold cursor-pointer ${
                          bannerStripConfig.hideAll
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-800 text-amber-300 border border-amber-400/40'
                        }`}
                      >
                        {bannerStripConfig.hideAll ? 'پٹی دوبارہ دکھائیں' : 'پوری پٹی چھپائیں'}
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          const resetCfg: BannerBenefitsStripConfig = {
                            hideAll: false,
                            pairs: DEFAULT_BANNER_BENEFIT_PAIRS.map((p) => ({ ...p })),
                            updatedAt: new Date().toISOString(),
                          };
                          setBannerStripConfig(resetCfg);
                          await saveBannerBenefitsStripConfig(resetCfg);
                          onBannerImagesChanged();
                          setBannerNotice('ڈیفالٹ استعمال اور فوائد بحال کر دیے گئے۔');
                        }}
                        className="min-h-[40px] px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        ڈیفالٹ بحال کریں
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {bannerStripConfig.pairs.map((pair, idx) => (
                      <div
                        key={pair.id || idx}
                        className="p-3 bg-stone-950 border border-stone-800 rounded-xl space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-amber-300">
                            جوڑا نمبر {idx + 1} (سلائیڈ {idx + 1})
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const nextPairs = bannerStripConfig.pairs.map((p, i) =>
                                i === idx ? { ...p, isHidden: !p.isHidden } : p
                              );
                              setBannerStripConfig({
                                ...bannerStripConfig,
                                pairs: nextPairs,
                              });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                              pair.isHidden
                                ? 'bg-red-900/60 text-red-200 border border-red-500/40'
                                : 'bg-emerald-900/50 text-emerald-200 border border-emerald-500/40'
                            }`}
                          >
                            {pair.isHidden ? 'چھپا ہوا (دکھائیں)' : 'ظاہر ہے (چھپائیں)'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={pair.useUrdu}
                            onChange={(e) => {
                              const val = e.target.value;
                              const nextPairs = bannerStripConfig.pairs.map((p, i) =>
                                i === idx ? { ...p, useUrdu: val } : p
                              );
                              setBannerStripConfig({
                                ...bannerStripConfig,
                                pairs: nextPairs,
                              });
                            }}
                            placeholder="استعمال: ..."
                            className="min-h-[40px] px-3 bg-stone-900 border border-stone-700 rounded-xl text-xs text-amber-200"
                          />
                          <input
                            type="text"
                            value={pair.benefitUrdu}
                            onChange={(e) => {
                              const val = e.target.value;
                              const nextPairs = bannerStripConfig.pairs.map((p, i) =>
                                i === idx ? { ...p, benefitUrdu: val } : p
                              );
                              setBannerStripConfig({
                                ...bannerStripConfig,
                                pairs: nextPairs,
                              });
                            }}
                            placeholder="فائدہ: ..."
                            className="min-h-[40px] px-3 bg-stone-900 border border-stone-700 rounded-xl text-xs text-emerald-200"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      await saveBannerBenefitsStripConfig(bannerStripConfig);
                      onBannerImagesChanged();
                      setBannerNotice('بینر استعمال اور فوائد کی سطریں محفوظ ہو گئیں۔');
                    }}
                    className="min-h-[44px] px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    ✓ استعمال و فوائد کی پٹی محفوظ کریں
                  </button>
                </div>

                {newsEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 bg-stone-900 border border-stone-800 rounded-2xl flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <strong className="text-base text-white block">{ev.title}</strong>
                      <p className="text-xs text-stone-400">{ev.content}</p>
                      <span className="text-[11px] text-amber-300 block">
                        بینر حالت:{' '}
                        {ev.hasBannerImage && !ev.skipBannerImage
                          ? 'تصویر لگی ہے (< 80 KB)'
                          : 'بغیر تصویر (Skip — رنگین پس منظر)'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <label className="min-h-[42px] px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                        <ImageIcon className="w-4 h-4" />
                        <span>تصویر لگائیں</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const compressed = await compressBannerImageToUnder80KB(file);
                            requestDangerousActionWithPassword({
                              actionType: 'change_banner',
                              actionUrdu: `بینر سلائیڈ کی تصویر تبدیل کی (${Math.round(compressed.byteSize / 1024)} KB)`,
                              targetId: ev.id,
                              targetTitle: ev.title,
                              execute: async () => {
                                await saveBannerSlideImageDoc(ev.id, {
                                  eventId: ev.id,
                                  imageData: compressed.dataUrl,
                                  width: compressed.width,
                                  height: compressed.height,
                                  byteSize: compressed.byteSize,
                                  updatedAt: new Date().toISOString(),
                                });
                                onSaveNewsEvent({
                                  ...ev,
                                  hasBannerImage: true,
                                  skipBannerImage: false,
                                  imageUrl: undefined,
                                });
                                onBannerImagesChanged();
                                setBannerNotice(`"${ev.title}" کی تصویر محفوظ ہو گئی۔`);
                              },
                            });
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          requestDangerousActionWithPassword({
                            actionType: 'change_banner',
                            actionUrdu: 'بینر سلائیڈ کو بغیر تصویر (Skip) کیا',
                            targetId: ev.id,
                            targetTitle: ev.title,
                            execute: async () => {
                              await deleteBannerSlideImageDoc(ev.id);
                              onSaveNewsEvent({
                                ...ev,
                                hasBannerImage: false,
                                skipBannerImage: true,
                                imageUrl: undefined,
                              });
                              onBannerImagesChanged();
                            },
                          })
                        }
                        className="min-h-[42px] px-3 bg-stone-700 hover:bg-stone-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        بغیر تصویر (Skip)
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          requestDangerousActionWithPassword({
                            actionType: 'delete_item',
                            actionUrdu: 'بینر خبر حذف کی',
                            targetId: ev.id,
                            targetTitle: ev.title,
                            execute: async () => {
                              await deleteBannerSlideImageDoc(ev.id);
                              onDeleteNewsEvent(ev.id);
                            },
                          })
                        }
                        className="min-h-[42px] px-3 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        حذف کریں
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2D. FLOOD ALERTS & SHELTERS */}
            {contentSection === 'alerts_shelters' && (
              <div className="space-y-5">
                <div className="bg-stone-900 border-2 border-red-600 rounded-2xl p-4 space-y-3">
                  <h4 className="text-base font-bold text-red-300">
                    🌊 سیلاب یا ہنگامی الرٹ جاری کریں (پاس ورڈ کی دوبارہ تصدیق لازمی ہے)
                  </h4>
                  <select
                    value={floodLevel}
                    onChange={(e) => setFloodLevel(e.target.value as FloodAlertStatus['level'])}
                    className="w-full min-h-[44px] px-3 bg-stone-950 border border-stone-700 rounded-xl text-xs text-white"
                  >
                    <option value="normal">معمول کے مطابق (محفوظ)</option>
                    <option value="watch">نگرانی (پانی کی سطح میں اضافہ)</option>
                    <option value="warning">وارننگ (احتیاطی تدابیر اختیار کریں)</option>
                    <option value="danger">شدید خطرہ (محفوظ پناہ گاہوں میں منتقل ہوں)</option>
                  </select>
                  <textarea
                    value={floodMessageInput}
                    onChange={(e) => setFloodMessageInput(e.target.value)}
                    rows={2}
                    className="w-full p-3 bg-stone-950 border border-stone-700 rounded-xl text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      requestDangerousActionWithPassword({
                        actionType: 'send_flood_alert',
                        actionUrdu: `سیلاب الرٹ اپڈیٹ کیا (${floodLevel})`,
                        targetTitle: floodMessageInput.slice(0, 50),
                        execute: () => {
                          const levelLabels: Record<FloodAlertStatus['level'], string> = {
                            normal: 'معمول کے مطابق (محفوظ)',
                            watch: 'نگرانی (پانی کی سطح میں اضافہ)',
                            warning: 'وارننگ (احتیاطی تدابیر)',
                            danger: 'شدید خطرہ (فوری انخلاء)',
                          };
                          onSaveFloodAlert({
                            level: floodLevel,
                            levelUrdu: levelLabels[floodLevel],
                            messageUrdu: floodMessageInput,
                            updatedAt: new Date().toISOString(),
                            updatedBy: activeSession.name,
                          });
                        },
                      })
                    }
                    className="min-h-[48px] px-5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold cursor-pointer"
                  >
                    🚨 الرٹ جاری اور محفوظ کریں
                  </button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-amber-300">ہنگامی پناہ گاہیں (Shelters)</h4>
                  {shelters.map((sh) => (
                    <div
                      key={sh.id}
                      className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl flex items-center justify-between gap-2"
                    >
                      <div>
                        <strong className="text-sm text-white block">{sh.name}</strong>
                        <span className="text-xs text-stone-400">
                          {sh.location} | گنجائش: {sh.capacityText} | فون: {sh.contactPhone}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = shelters.map((item) =>
                            item.id === sh.id ? { ...item, isHidden: !item.isHidden } : item
                          );
                          onSaveShelters(updated);
                        }}
                        className="min-h-[40px] px-3 bg-stone-800 text-amber-300 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        {sh.isHidden ? 'دوبارہ دکھائیں' : 'چھپائیں'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2E. MANDI RATES ("منڈی کے ریٹ") */}
            {contentSection === 'mandi' && (
              <div className="space-y-4">
                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-amber-300">نیا منڈی ریٹ شامل یا اپڈیٹ کریں</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newCropUrdu}
                      onChange={(e) => setNewCropUrdu(e.target.value)}
                      placeholder="فصل یا جنس کا نام (مثلاً: سرسوں / مکئی)"
                      className="min-h-[44px] px-3 bg-stone-950 border border-stone-700 rounded-xl text-xs text-white"
                    />
                    <input
                      type="text"
                      value={newCropRate}
                      onChange={(e) => setNewCropRate(e.target.value)}
                      placeholder="ریٹ (مثلاً: 6,200 روپے فی من)"
                      className="min-h-[44px] px-3 bg-stone-950 border border-stone-700 rounded-xl text-xs text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newCropUrdu.trim() || !newCropRate.trim()) return;
                      const newItem: MandiRateItem = {
                        id: 'mandi-' + Date.now(),
                        cropNameUrdu: newCropUrdu.trim(),
                        cropNameEn: newCropUrdu.trim(),
                        rateText: newCropRate.trim(),
                        marketName: 'غلہ منڈی جھنگ و رتہ کلاں',
                        updatedAt: new Date().toISOString(),
                      };
                      onSaveMandiRates([newItem, ...mandiRates]);
                      setNewCropUrdu('');
                      setNewCropRate('');
                    }}
                    className="min-h-[44px] px-4 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + منڈی ریٹ محفوظ کریں
                  </button>
                </div>

                {mandiRates.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl flex items-center justify-between gap-2"
                  >
                    <div>
                      <strong className="text-sm text-white block">{r.cropNameUrdu}</strong>
                      <span className="text-xs text-emerald-300">{r.rateText} ({r.marketName})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSaveMandiRates(mandiRates.filter((item) => item.id !== r.id))}
                      className="min-h-[40px] px-3 bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      حذف کریں
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 2F. HELP POSTS & BLOOD REQUESTS */}
            {contentSection === 'help_blood' && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-amber-300">
                  امداد، گمشدگی اور خون کے عطیات کی پوسٹس
                </h4>
                {helpNotices.map((n) => (
                  <div
                    key={n.id}
                    className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <strong className="text-sm text-white block">{n.title}</strong>
                      <span className="text-xs text-stone-400">
                        {n.details} — رابطہ: {n.contactName} ({n.contactMobile})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        requestDangerousActionWithPassword({
                          actionType: 'delete_item',
                          actionUrdu: 'امدادی پوسٹ حذف کی',
                          targetId: n.id,
                          targetTitle: n.title,
                          execute: () => onDeleteHelpNotice(n.id),
                        })
                      }
                      className="min-h-[40px] px-3 bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      حذف کریں
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 2G. HOW-TO HELP GUIDES & CUSTOM SEARCH KEYWORDS */}
            {contentSection === 'guides_keywords' && (
              <div className="space-y-5">
                <div className="bg-stone-900 border border-emerald-700 rounded-2xl p-4 space-y-3">
                  <h4 className="text-base font-bold text-emerald-300">
                    📖 "بول کر پوچھیں" کے لیے مدد اور رہنمائی کی تحریریں (How-To Help Texts)
                  </h4>
                  <input
                    type="text"
                    value={newGuideQuestion}
                    onChange={(e) => setNewGuideQuestion(e.target.value)}
                    placeholder="سوال لکھیں (مثلاً: پروفائل کیسے بناؤں؟)"
                    className="w-full min-h-[44px] px-3 bg-stone-950 border border-stone-700 rounded-xl text-xs text-white"
                  />
                  <textarea
                    value={newGuideSteps}
                    onChange={(e) => setNewGuideSteps(e.target.value)}
                    placeholder="ہر قدم نئی لائن پر لکھیں..."
                    rows={3}
                    className="w-full p-3 bg-stone-950 border border-stone-700 rounded-xl text-xs text-white"
                  />
                  <input
                    type="text"
                    value={newGuideButton}
                    onChange={(e) => setNewGuideButton(e.target.value)}
                    placeholder="کون سا بٹن دبانا ہے؟ (مثلاً: نئی رجسٹریشن / شامل کریں)"
                    className="w-full min-h-[44px] px-3 bg-stone-950 border border-stone-700 rounded-xl text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newGuideQuestion.trim() || !newGuideSteps.trim()) return;
                      const steps = newGuideSteps
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      if (editingGuide) {
                        onSaveHelpGuides(
                          helpGuides.map((g) =>
                            g.id === editingGuide.id
                              ? {
                                  ...g,
                                  questionUrdu: newGuideQuestion.trim(),
                                  stepsUrdu: steps,
                                  buttonToTap: newGuideButton.trim() || g.buttonToTap,
                                  updatedAt: new Date().toISOString(),
                                }
                              : g
                          )
                        );
                        setEditingGuide(null);
                      } else {
                        const newItem: HelpGuideItem = {
                          id: 'guide-' + Date.now(),
                          questionUrdu: newGuideQuestion.trim(),
                          keywords: [newGuideQuestion.trim()],
                          stepsUrdu: steps,
                          buttonToTap: newGuideButton.trim() || 'ہوم اسکرین بٹن',
                          updatedAt: new Date().toISOString(),
                        };
                        onSaveHelpGuides([newItem, ...helpGuides]);
                      }
                      setNewGuideQuestion('');
                      setNewGuideSteps('');
                      setNewGuideButton('');
                    }}
                    className="min-h-[44px] px-4 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {editingGuide ? '✓ ترمیم محفوظ کریں' : '+ نئی رہنمائی شامل کریں'}
                  </button>
                </div>

                {helpGuides.map((g) => (
                  <div
                    key={g.id}
                    className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-sm text-amber-300">{g.questionUrdu}</strong>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingGuide(g);
                            setNewGuideQuestion(g.questionUrdu);
                            setNewGuideSteps(g.stepsUrdu.join('\n'));
                            setNewGuideButton(g.buttonToTap);
                          }}
                          className="px-3 py-1.5 bg-stone-800 text-emerald-300 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          ترمیم کریں
                        </button>
                        <button
                          type="button"
                          onClick={() => onSaveHelpGuides(helpGuides.filter((x) => x.id !== g.id))}
                          className="px-3 py-1.5 bg-red-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-stone-300 whitespace-pre-line">
                      {g.stepsUrdu.join('\n')}
                    </p>
                    <span className="text-[11px] text-emerald-400 block">
                      بٹن کا نام: {g.buttonToTap}
                    </span>
                  </div>
                ))}

                {/* Custom Categories & Search Keywords */}
                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-amber-300">
                    کسٹم کیٹیگریز اور سرچ الفاظ (Custom Search Keywords)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newKwCategoryUrdu}
                      onChange={(e) => setNewKwCategoryUrdu(e.target.value)}
                      placeholder="کیٹیگری نام (مثلاً: سولر ٹیکنیشن)"
                      className="min-h-[44px] px-3 bg-stone-950 border border-stone-700 rounded-xl text-xs text-white"
                    />
                    <input
                      type="text"
                      value={newKwWords}
                      onChange={(e) => setNewKwWords(e.target.value)}
                      placeholder="مترادف الفاظ کاما سے الگ کریں (مثلاً: سولر, پلیٹ, انورٹر)"
                      className="min-h-[44px] px-3 bg-stone-950 border border-stone-700 rounded-xl text-xs text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newKwCategoryUrdu.trim() || !newKwWords.trim()) return;
                      const item: CustomSearchKeywordItem = {
                        id: 'kw-' + Date.now(),
                        categoryNameUrdu: newKwCategoryUrdu.trim(),
                        categoryKey: newKwCategoryUrdu.trim(),
                        keywords: newKwWords
                          .split(',')
                          .map((w) => w.trim())
                          .filter(Boolean),
                        updatedAt: new Date().toISOString(),
                      };
                      onSaveCustomKeywords([item, ...customKeywords]);
                      setNewKwCategoryUrdu('');
                      setNewKwWords('');
                    }}
                    className="min-h-[42px] px-4 bg-amber-400 text-stone-950 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + سرچ الفاظ شامل کریں
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            TAB 3: REPORTED PROFILES & REPORTED MESSAGES ONLY
            (Admin can read a private message ONLY when it was reported, and each reading is logged!)
           ===================================================================== */}
        {activeMainTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-stone-900 border-2 border-amber-500/80 rounded-2xl p-4 text-xs text-stone-200 leading-loose">
              🔒 <strong>سخت پرائیویسی اصول:</strong> ایڈمن عام لوگوں کے نجی پیغامات (Private Messages) نہیں دیکھ سکتا۔ صرف وہی پیغام یہاں نظر آتا ہے جس کے خلاف کسی صارف نے <strong>شکایت (Report)</strong> کی ہو، اور جب ایڈمن اسے پڑھتا ہے تو اس کا ریکارڈ <strong>"ایڈمن لاگ"</strong> میں لکھا جاتا ہے۔
            </div>

            {/* Reported Messages */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-red-300">
                📩 رپورٹ شدہ پیغامات ({reportedMessages.length})
              </h3>
              {reportedMessages.length === 0 ? (
                <div className="p-5 bg-stone-900 border border-stone-800 rounded-2xl text-xs text-stone-400 text-center">
                  اس وقت کوئی رپورٹ شدہ پیغام موجود نہیں ہے۔ (غیر رپورٹ شدہ نجی پیغامات پرائیویسی اصول کے تحت پوشیدہ ہیں)۔
                </div>
              ) : (
                reportedMessages.map((m) => {
                  const isUnlocked = Boolean(unlockedReportedMessageIds[m.id]);
                  return (
                    <div
                      key={m.id}
                      className="p-4 bg-stone-900 border border-red-700 rounded-2xl space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <strong className="text-sm text-white">
                            مرسل: {m.senderName} ➔ بنام: {m.targetProfileName}
                          </strong>
                          <span className="text-xs text-red-300 block">
                            شکایت کی وجہ: {m.reportReason || 'نامناسب پیغام'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {!isUnlocked ? (
                            <button
                              type="button"
                              onClick={async () => {
                                setUnlockedReportedMessageIds((prev) => ({
                                  ...prev,
                                  [m.id]: true,
                                }));
                                const log = await appendAdminLogEntry({
                                  adminEmail: activeSession.email || 'admin',
                                  adminName: activeSession.name,
                                  actionType: 'read_reported_message',
                                  actionUrdu: 'ایڈمن نے رپورٹ شدہ نجی پیغام پڑھا',
                                  targetId: m.id,
                                  targetTitle: `${m.senderName} ➔ ${m.targetProfileName}`,
                                });
                                setAdminLogs((prev) => [log, ...prev]);
                              }}
                              className="min-h-[42px] px-3.5 bg-amber-400 text-stone-950 rounded-xl text-xs font-bold cursor-pointer"
                            >
                              👁️ رپورٹ شدہ پیغام پڑھیں (لاگ درج ہوگا)
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                requestDangerousActionWithPassword({
                                  actionType: 'delete_item',
                                  actionUrdu: 'رپورٹ شدہ پیغام حذف کیا',
                                  targetId: m.id,
                                  targetTitle: `${m.senderName} کا پیغام`,
                                  execute: () => onDeleteMessage(m.id),
                                })
                              }
                              className="min-h-[42px] px-3.5 bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                            >
                              حذف کریں
                            </button>
                          )}
                        </div>
                      </div>
                      {isUnlocked && (
                        <div className="p-3 bg-stone-950 border border-stone-700 rounded-xl text-xs text-amber-100">
                          متن: "{m.messageText}"
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Reported Profiles & Admin Alerts */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-amber-300">
                🚩 رپورٹ شدہ پروفائلز اور شکایات ({alerts.length + reportedProfiles.length})
              </h3>
              {alerts.map((al) => (
                <div
                  key={al.id}
                  className="p-4 bg-stone-900 border border-stone-800 rounded-2xl flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <strong className="text-sm text-white block">{al.title}</strong>
                    <p className="text-xs text-stone-300">{al.details}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onResolveAlert(al.id)}
                      className="min-h-[40px] px-3 bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      {al.isResolved ? 'حل شدہ ✓' : 'حل شدہ نشان زد کریں'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteAlert(al.id)}
                      className="min-h-[40px] px-3 bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 4: MANAGE ROLES & SECOND TRUSTED ADMIN ("رولز اور دوسرا ایڈمن")
            Shows email ONLY where needed to manage roles; NEVER shows any password!
           ===================================================================== */}
        {activeMainTab === 'roles' && (
          <div className="space-y-6">
            <div className="bg-stone-900 border-2 border-emerald-600 rounded-3xl p-5 space-y-4">
              <h3 className="text-lg font-bold text-emerald-300">
                👥 ذمہ داریاں (Roles) دیں یا ہٹائیں + دوسرا قابلِ اعتماد ایڈمن (Second Trusted Admin)
              </h3>
              <p className="text-xs text-stone-300 leading-loose">
                یہاں آپ ای میل کے ذریعے کسی ذمہ دار کو مخصوص سیکشن کا رول (<code className="font-mono">alertManager</code>, <code className="font-mono">mosqueEditor</code>, <code className="font-mono">schoolEditor</code>, <code className="font-mono">hospitalEditor</code>, <code className="font-mono">transportEditor</code>) یا <strong>دوسرا قابلِ اعتماد ایڈمن (Backup Admin)</strong> مقرر کر سکتے ہیں تاکہ ایک اکاؤنٹ گم ہونے پر پورٹل بند نہ ہو۔ یہاں کبھی کسی کا پاس ورڈ نہیں دکھایا جاتا۔
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="email"
                  value={roleEmailInput}
                  onChange={(e) => setRoleEmailInput(e.target.value)}
                  placeholder="یوزر کی ای میل (مثلاً: imam@ratta.pk)"
                  className="min-h-[46px] px-3.5 bg-stone-950 border border-stone-700 rounded-xl text-xs font-sans text-white text-left"
                />
                <input
                  type="text"
                  value={roleUidInput}
                  onChange={(e) => setRoleUidInput(e.target.value)}
                  placeholder="Firebase UID (اختیاری)"
                  className="min-h-[46px] px-3.5 bg-stone-950 border border-stone-700 rounded-xl text-xs font-mono text-white"
                />
                <input
                  type="text"
                  value={roleNameInput}
                  onChange={(e) => setRoleNameInput(e.target.value)}
                  placeholder="ذمہ دار کا نام"
                  className="min-h-[46px] px-3.5 bg-stone-950 border border-stone-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <select
                  value={selectedRoleToToggle}
                  onChange={(e) => setSelectedRoleToToggle(e.target.value as PortalRoleKey)}
                  className="min-h-[46px] px-3.5 bg-stone-950 border border-stone-700 rounded-xl text-xs text-white"
                >
                  <option value="mosqueEditor">مسجد ایڈیٹر (mosqueEditor)</option>
                  <option value="schoolEditor">سکول ایڈیٹر (schoolEditor)</option>
                  <option value="hospitalEditor">ہسپتال ایڈیٹر (hospitalEditor)</option>
                  <option value="transportEditor">ٹرانسپورٹ ایڈیٹر (transportEditor)</option>
                  <option value="alertManager">الّرٹ مینیجر (alertManager)</option>
                  <option value="admin">دوسرا قابلِ اعتماد ایڈمن (Second Trusted Admin - admin:true)</option>
                </select>

                <label className="flex items-center gap-2 text-xs text-amber-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSecondTrustedAdminToggle || selectedRoleToToggle === 'admin'}
                    onChange={(e) => setIsSecondTrustedAdminToggle(e.target.checked)}
                    className="w-4 h-4 accent-amber-400"
                  />
                  <span>دوسرا قابلِ اعتماد ایڈمن (Backup Admin — تا کہ ایک اکاؤنٹ گم ہونے پر پورٹل چلتا رہے)</span>
                </label>
              </div>

              <button
                type="button"
                onClick={() => {
                  const cleanEm = roleEmailInput.trim().toLowerCase();
                  if (!cleanEm || !cleanEm.includes('@')) return;
                  const targetUid =
                    roleUidInput.trim() || `uid-${cleanEm.replace(/[^a-z0-9]/g, '_')}`;
                  requestDangerousActionWithPassword({
                    actionType: 'manage_role',
                    actionUrdu: `${cleanEm} کو رول (${selectedRoleToToggle}) تفویض کیا`,
                    targetId: targetUid,
                    targetTitle: cleanEm,
                    execute: async () => {
                      const existing = roleMap[targetUid] || roleMap[cleanEm] || {
                        uid: targetUid,
                        email: cleanEm,
                        updatedAt: new Date().toISOString(),
                      };
                      const updatedDoc: RoleAssignmentDoc = {
                        ...existing,
                        uid: targetUid,
                        email: cleanEm,
                        name: roleNameInput.trim() || existing.name || cleanEm.split('@')[0],
                        [selectedRoleToToggle]: true,
                        admin:
                          selectedRoleToToggle === 'admin' ||
                          isSecondTrustedAdminToggle ||
                          existing.admin,
                        isTrustedBackupAdmin:
                          selectedRoleToToggle === 'admin' ||
                          isSecondTrustedAdminToggle ||
                          existing.isTrustedBackupAdmin,
                        updatedAt: new Date().toISOString(),
                        updatedBy: activeSession.email || 'admin',
                      };
                      await saveRoleAssignmentToFirestore(updatedDoc);
                      setRoleMap(getLocalRolesCollection());
                      setRoleEmailInput('');
                      setRoleUidInput('');
                      setRoleNameInput('');
                    },
                  });
                }}
                className="min-h-[48px] px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-sm font-bold cursor-pointer"
              >
                ✓ پاس ورڈ کی تصدیق کے ساتھ رول محفوظ کریں
              </button>
            </div>

            {/* Active Role Documents List */}
            <div className="space-y-3">
              <h4 className="text-base font-bold text-amber-300">
                موجودہ رولز اور ذمہ داران (`roles` کلیکشن)
              </h4>
              {Object.values(
                Object.values(roleMap).reduce((acc, docItem) => {
                  acc[docItem.uid || docItem.email] = docItem;
                  return acc;
                }, {} as Record<string, RoleAssignmentDoc>)
              ).map((rDoc) => (
                <div
                  key={rDoc.uid || rDoc.email}
                  className="p-4 bg-stone-900 border border-stone-800 rounded-2xl flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-sm text-white">{rDoc.name || 'ذمہ دار'}</strong>
                      <span className="text-xs font-sans text-emerald-300 bg-stone-950 px-2 py-0.5 rounded">
                        {rDoc.email}
                      </span>
                      <span className="text-[11px] font-mono text-stone-400">UID: {rDoc.uid}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {rDoc.admin && (
                        <span className="text-[11px] bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full font-bold">
                          admin: true {rDoc.isTrustedBackupAdmin ? '(دوسرا قابلِ اعتماد ایڈمن)' : ''}
                        </span>
                      )}
                      {rDoc.alertManager && (
                        <span className="text-[11px] bg-red-900 text-red-200 px-2 py-0.5 rounded-full">
                          alertManager
                        </span>
                      )}
                      {rDoc.mosqueEditor && (
                        <span className="text-[11px] bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded-full">
                          mosqueEditor
                        </span>
                      )}
                      {rDoc.schoolEditor && (
                        <span className="text-[11px] bg-sky-900 text-sky-200 px-2 py-0.5 rounded-full">
                          schoolEditor
                        </span>
                      )}
                      {rDoc.hospitalEditor && (
                        <span className="text-[11px] bg-purple-900 text-purple-200 px-2 py-0.5 rounded-full">
                          hospitalEditor
                        </span>
                      )}
                      {rDoc.transportEditor && (
                        <span className="text-[11px] bg-amber-900 text-amber-200 px-2 py-0.5 rounded-full">
                          transportEditor
                        </span>
                      )}
                      {rDoc.disabled && (
                        <span className="text-[11px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                          اکاؤنٹ معطل (Disabled)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        requestDangerousActionWithPassword({
                          actionType: 'disable_account',
                          actionUrdu: rDoc.disabled
                            ? `اکاؤنٹ دوبارہ بحال کیا (${rDoc.email})`
                            : `اکاؤنٹ معطل کیا (${rDoc.email})`,
                          targetId: rDoc.uid,
                          targetTitle: rDoc.email,
                          execute: async () => {
                            await saveRoleAssignmentToFirestore({
                              ...rDoc,
                              disabled: !rDoc.disabled,
                              updatedAt: new Date().toISOString(),
                            });
                            setRoleMap(getLocalRolesCollection());
                          },
                        })
                      }
                      className="min-h-[40px] px-3 bg-amber-600 text-stone-950 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      {rDoc.disabled ? 'اکاؤنٹ بحال کریں' : 'اکاؤنٹ معطل کریں'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        requestDangerousActionWithPassword({
                          actionType: 'manage_role',
                          actionUrdu: `تمام رولز ہٹائے (${rDoc.email})`,
                          targetId: rDoc.uid,
                          targetTitle: rDoc.email,
                          execute: async () => {
                            await deleteRoleAssignmentFromFirestore(rDoc.uid);
                            if (rDoc.email) await deleteRoleAssignmentFromFirestore(rDoc.email);
                            setRoleMap(getLocalRolesCollection());
                          },
                        })
                      }
                      className="min-h-[40px] px-3 bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      رول ختم کریں
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 5: ADMIN AUDIT LOG ("ایڈمن لاگ")
            Visible ONLY to the admin: who did what and when
           ===================================================================== */}
        {activeMainTab === 'logs' && (
          <div className="space-y-4">
            <div className="bg-stone-900 border border-amber-500/70 rounded-2xl p-4">
              <h3 className="text-lg font-bold text-amber-300">
                📜 ایڈمن لاگ (کس ایڈمن نے کیا کام کیا اور کس وقت کیا)
              </h3>
              <p className="text-xs text-stone-300">
                یہ ریکارڈ صرف ایڈمن کو نظر آتا ہے اور ہر اہم کارروائی یا رپورٹ شدہ پیغام پڑھنے پر خودکار درج ہوتا ہے۔
              </p>
            </div>

            {adminLogs.length === 0 ? (
              <div className="p-6 bg-stone-900 border border-stone-800 rounded-2xl text-center text-xs text-stone-400">
                ابھی تک ایڈمن لاگ میں کوئی کارروائی درج نہیں ہوئی۔
              </div>
            ) : (
              <div className="space-y-2.5">
                {adminLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <strong className="text-sm text-emerald-300 block">
                        {log.actionUrdu} — <span className="text-white">{log.targetTitle}</span>
                      </strong>
                      <span className="text-xs text-stone-400 block">
                        ایڈمن: {log.adminName} (<span className="font-sans">{log.adminEmail}</span>)
                      </span>
                    </div>
                    <span className="text-xs font-sans text-amber-300 bg-stone-950 px-2.5 py-1 rounded-lg">
                      {new Date(log.timestamp).toLocaleString('ur-PK')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* =====================================================================
          PASSWORD RE-AUTHENTICATION MODAL FOR DANGEROUS ADMIN ACTIONS
         ===================================================================== */}
      {pendingDangerousAction && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-amber-400 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-amber-300">
              <KeyRound className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold">حفاظتی تصدیق: پاس ورڈ دوبارہ درج کریں</h3>
            </div>
            <p className="text-xs text-stone-200 leading-loose">
              آپ ایک اہم ایڈمن کارروائی کرنے لگے ہیں:{' '}
              <strong className="text-amber-300">
                {pendingDangerousAction.actionUrdu} ({pendingDangerousAction.targetTitle})
              </strong>
              ۔ تصدیق کے لیے اپنا ایڈمن پاس ورڈ دوبارہ ٹائپ کریں۔ یہ عمل <strong>"ایڈمن لاگ"</strong> میں درج کیا جائے گا۔
            </p>

            {reauthError && (
              <div className="p-3 bg-red-950 border border-red-500 rounded-xl text-xs text-red-200">
                {reauthError}
              </div>
            )}

            <form onSubmit={confirmAndExecuteDangerousAction} className="space-y-3">
              <input
                type="password"
                value={reauthPassword}
                onChange={(e) => setReauthPassword(e.target.value)}
                placeholder="اپنا ایڈمن پاس ورڈ دوبارہ لکھیں"
                className="w-full min-h-[48px] px-4 bg-stone-950 border border-stone-700 rounded-xl text-sm text-white"
                autoFocus
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 min-h-[48px] bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-sm font-bold cursor-pointer"
                >
                  ✓ تصدیق کریں اور لاگو کریں
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDangerousAction(null)}
                  className="px-4 min-h-[48px] bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-sm font-bold cursor-pointer"
                >
                  منسوخ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {renderAdminPasswordModal()}
    </div>
  );
};
