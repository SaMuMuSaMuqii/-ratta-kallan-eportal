import {
  VillageProfile,
  VillageMosque,
  VillageInstitute,
  VillageTransport,
  VillageHospital,
  MandiRateItem,
  ShelterItem,
  HelpGuideItem,
  FloodAlertStatus,
  AuthUserSession,
  UserRoles,
} from '../types';

/**
 * STRICT PUBLIC FIELD WHITELIST
 * Email, username, password, passwordHash, and private login details are NEVER included here.
 */
export const PUBLIC_PROFILE_WHITELIST_KEYS: (keyof VillageProfile)[] = [
  'id',
  'name',
  'fatherName',
  'businessName',
  'category',
  'customCategory',
  'isAvailableForWorkToday',
  'mobile',
  'whatsapp',
  'address',
  'village',
  'locationMapUrl',
  'locationLandmark',
  'services',
  'personImage',
  'businessImage',
  'chargesDescription',
  'availability',
  'openingTime',
  'closingTime',
  'breakTime',
  'addedByName',
  'termsAccepted',
  'isVerified',
  'isApproved',
  'isHidden',
  'isReported',
  'reportReason',
  'isDisabled',
  'ownerUid',
  'isBloodDonor',
  'voiceNoteUrl',
  'createdAt',
];

/**
 * Sanitizes a VillageProfile using ONLY the public field whitelist.
 * Strips email, username, password, and any private login fields.
 * Blood group is kept ONLY when the donor switch is ON and the viewer is signed in.
 */
export function sanitizePublicProfile(
  profile: VillageProfile,
  options?: { viewerIsSignedIn?: boolean; viewerOwnerId?: string }
): VillageProfile {
  const clean: Partial<VillageProfile> = {};
  for (const key of PUBLIC_PROFILE_WHITELIST_KEYS) {
    if (profile[key] !== undefined) {
      (clean as any)[key] = profile[key];
    }
  }

  // Blood group rule: only for signed-in people when the donor switch is ON (or the owner themselves)
  const isOwner =
    Boolean(options?.viewerOwnerId) &&
    (profile.id === options?.viewerOwnerId || profile.ownerUid === options?.viewerOwnerId);

  if ((options?.viewerIsSignedIn && profile.isBloodDonor && profile.bloodGroup) || (isOwner && profile.bloodGroup)) {
    clean.bloodGroup = profile.bloodGroup;
  }

  // Owner may see their own email & username in their own profile, but NEVER their password
  if (isOwner) {
    if (profile.email) clean.email = profile.email;
    if (profile.username) clean.username = profile.username;
  }

  return clean as VillageProfile;
}

export function sanitizePublicProfileList(
  profiles: VillageProfile[],
  options?: { viewerIsSignedIn?: boolean; viewerOwnerId?: string }
): VillageProfile[] {
  return (profiles || []).map((p) => sanitizePublicProfile(p, options));
}

export function sanitizePublicMosque(m: VillageMosque): VillageMosque {
  const { username, password, ...publicFields } = m;
  return publicFields;
}

export function sanitizePublicInstitute(inst: VillageInstitute): VillageInstitute {
  const { username, password, ...publicFields } = inst;
  return publicFields;
}

export function sanitizePublicTransport(tr: VillageTransport): VillageTransport {
  const { username, password, ...publicFields } = tr;
  return publicFields;
}

export function sanitizePublicHospital(h: VillageHospital): VillageHospital {
  const { username, password, ...publicFields } = h;
  return publicFields;
}

/**
 * Verifies that a cached JSON string or object array contains ZERO private login details
 * (email, username, password) of other people.
 */
export function auditCachedDataForPrivateLeaks(
  profiles: VillageProfile[],
  viewerOwnerId?: string
): { hasLeak: boolean; leakedFields: string[] } {
  const leakedFields: string[] = [];
  for (const p of profiles) {
    const isOwner = Boolean(viewerOwnerId) && (p.id === viewerOwnerId || p.ownerUid === viewerOwnerId);
    if ((p as any).password !== undefined) {
      leakedFields.push(`${p.id}:password`);
    }
    if (!isOwner) {
      if ((p as any).email !== undefined) {
        leakedFields.push(`${p.id}:email`);
      }
      if ((p as any).username !== undefined) {
        leakedFields.push(`${p.id}:username`);
      }
    }
  }
  return {
    hasLeak: leakedFields.length > 0,
    leakedFields,
  };
}

/**
 * Initial Admin-Editable How-To Guides ("مدد اور رہنمائی کی تحریریں")
 * Stored as part of the portal data so the assistant gives calm, step-by-step instructions
 * and tells the user which button to tap.
 */
export const initialHelpGuides: HelpGuideItem[] = [
  {
    id: 'guide-create-profile',
    questionUrdu: 'پروفائل کیسے بناؤں؟',
    keywords: [
      'پروفائل کیسے بناؤں',
      'پروفائل بنانے کا طریقہ',
      'نیا اندراج کیسے کروں',
      'دکان کیسے رجسٹر کروں',
      'اپنا نام کیسے لکھوں',
      'profile kaise banaun',
      'how to create profile',
      'register shop',
    ],
    stepsUrdu: [
      '۱۔ ہوم اسکرین کے اوپر سبز رنگ کا بٹن "نئی رجسٹریشن / شامل کریں" دبائیں۔',
      '۲۔ اپنا نام، کام یا دکان کی کیٹیگری، محلہ اور موبائل نمبر لکھیں۔',
      '۳۔ گاؤں کے اصولوں والے خانے پر ٹک (✓) لگائیں اور "پروفائل محفوظ کریں" کا بڑا بٹن دبا دیں۔',
    ],
    buttonToTap: 'نئی رجسٹریشن / شامل کریں',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'guide-forgot-password',
    questionUrdu: 'پاس ورڈ بھول گیا',
    keywords: [
      'پاس ورڈ بھول گیا',
      'پاسورڈ بھول گیا',
      'پاس ورڈ ری سیٹ کیسے کروں',
      'پاس ورڈ یاد نہیں',
      'لاگ ان نہیں ہو رہا',
      'password bhool gaya',
      'forgot password',
      'reset password',
    ],
    stepsUrdu: [
      '۱۔ اوپر بائیں طرف "لاگ ان" کا بٹن دبائیں۔',
      '۲۔ کھلنے والی ونڈو میں "پاس ورڈ ری سیٹ" والا ٹیب منتخب کریں۔',
      '۳۔ اپنا رجسٹرڈ ای میل ایڈریس لکھیں اور "پاس ورڈ ری سیٹ لنک ای میل پر بھیجیں" کا بٹن دبائیں۔ آپ کی ای میل پر نیا پاس ورڈ بنانے کا لنک آ جائے گا۔',
    ],
    buttonToTap: 'لاگ ان ➔ پاس ورڈ ری سیٹ',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'guide-send-message',
    questionUrdu: 'پیغام کیسے بھیجوں؟',
    keywords: [
      'پیغام کیسے بھیجوں',
      'میسج کیسے کروں',
      'کاریگر سے رابطہ کیسے کروں',
      'آواز والا پیغام کیسے بھیجوں',
      'paigham kaise bhejun',
      'how to send message',
    ],
    stepsUrdu: [
      '۱۔ جس ڈاکٹر، کاریگر یا دکاندار سے بات کرنی ہے، اس کے کارڈ کے نیچے "پیغام بھیجیں" کا بٹن دبائیں۔',
      '۲۔ اپنا نام اور موبائل نمبر لکھیں۔',
      '۳۔ اپنا پیغام لکھیں یا مائیک دبا کر آواز ریکارڈ کریں اور "پیغام ارسال کریں" کا بٹن دبا دیں۔',
    ],
    buttonToTap: 'پیغام بھیجیں',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'guide-worker-available-today',
    questionUrdu: 'مزدور کے طور پر آج دستیاب کیسے ہوں؟',
    keywords: [
      'مزدور کے طور پر آج دستیاب کیسے ہوں',
      'آج دستیاب کیسے آن کروں',
      'دیہاڑی کے لیے دستیاب',
      'آج کام کے لیے دستیاب',
      'mazdoor aaj dastiyab kaise hon',
      'available today switch',
    ],
    stepsUrdu: [
      '۱۔ پہلے اوپر "لاگ ان" بٹن دبا کر اپنے اکاؤنٹ میں سائن ان کریں۔',
      '۲۔ اپنی پروفائل کارڈ پر "ترمیم (Edit)" کا بٹن دبائیں۔',
      '۳۔ "آج کام کے لیے دستیاب ہوں (آج دستیاب)" والے بٹن کو آن (ON) کریں اور "محفوظ کریں" دبا دیں۔',
    ],
    buttonToTap: 'آج کام کے لیے دستیاب ہوں',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'guide-emergency-steps',
    questionUrdu: 'ایمرجنسی میں کیا کروں؟',
    keywords: [
      'ایمرجنسی میں کیا کروں',
      'حادثہ ہو جائے تو کیا کروں',
      'سیلاب یا آگ میں کیا کروں',
      'ہنگامی صورتحال میں کیا کریں',
      'what to do in emergency',
      'emergency mein kya karun',
    ],
    stepsUrdu: [
      '۱۔ سب سے پہلے ہوم اسکرین یا ایمرجنسی صفحہ پر سرخ رنگ کا بڑا بٹن "1122 پر کال کریں" دبائیں۔',
      '۲۔ پولیس مدد کے لیے "15" اور آگ بجھانے کے لیے "16" کا بٹن دبائیں۔',
      '۳۔ سیلاب یا طوفان کی صورت میں "ایمرجنسی" صفحہ کھول کر گاؤں کی محفوظ پناہ گاہوں (گورنمنٹ ہائی سکول اور مرکزی جامع مسجد) کی طرف جائیں۔',
    ],
    buttonToTap: 'ایمرجنسی (1122 کال بٹن)',
    updatedAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'guide-blood-donor',
    questionUrdu: 'خون دینے والوں میں نام کیسے لکھوں؟',
    keywords: [
      'خون دینے والوں میں نام کیسے لکھوں',
      'بلڈ ڈونر کیسے بنوں',
      'عطیہ خون میں نام',
      'خون کا عطیہ کیسے دوں',
      'blood donor kaise banun',
      'how to register blood donor',
    ],
    stepsUrdu: [
      '۱۔ ہوم اسکرین پر پہلے اپنے اکاؤنٹ میں "لاگ ان" کریں۔',
      '۲۔ سرخ پٹی میں "ہنگامی مدد و خون عطیہ بورڈ" کا بٹن دبائیں۔',
      '۳۔ "نیا اعلان / خون کا عطیہ شامل کریں" بٹن دبا کر اپنا بلڈ گروپ اور فون نمبر درج کریں اور ڈونر سوئچ آن کر دیں۔',
    ],
    buttonToTap: 'ہنگامی مدد و خون عطیہ بورڈ',
    updatedAt: '2026-10-20T10:00:00Z',
  },
];

/**
 * Initial Admin-Editable Mandi Rates ("منڈی کے ریٹ")
 */
export const initialMandiRates: MandiRateItem[] = [
  {
    id: 'mandi-wheat',
    cropNameUrdu: 'گندم (Wheat)',
    cropNameEn: 'wheat gandum kanak',
    rateText: '3,950 روپے فی من (40 کلو)',
    marketName: 'غلہ منڈی جھنگ و رتہ کلاں',
    updatedAt: '2026-10-24T09:00:00Z',
  },
  {
    id: 'mandi-rice',
    cropNameUrdu: 'چاول سُپر باسمتی ( دھان / مونجی )',
    cropNameEn: 'rice chawal dhaan munji',
    rateText: '4,600 روپے فی من (40 کلو)',
    marketName: 'غلہ منڈی جھنگ',
    updatedAt: '2026-10-24T09:00:00Z',
  },
  {
    id: 'mandi-cotton',
    cropNameUrdu: 'کپاس / پھٹی (Cotton)',
    cropNameEn: 'cotton kapas phutti',
    rateText: '8,200 روپے فی من (40 کلو)',
    marketName: 'غلہ منڈی جھنگ',
    updatedAt: '2026-10-24T09:00:00Z',
  },
  {
    id: 'mandi-gur',
    cropNameUrdu: 'خالص دیسی گڑ اور شکر',
    cropNameEn: 'gur jaggery shakkar',
    rateText: '5,800 روپے فی من (40 کلو)',
    marketName: 'رتہ کلاں بیلنا و منڈی جھنگ',
    updatedAt: '2026-10-24T09:00:00Z',
  },
  {
    id: 'mandi-urea',
    cropNameUrdu: 'یوریا اور ڈی اے پی کھاد (Fertilizer)',
    cropNameEn: 'urea dap khad fertilizer',
    rateText: 'یوریا 4,550 روپے، ڈی اے پی 11,900 روپے فی بوری',
    marketName: 'رتہ کلاں زرعی ایجنسی',
    updatedAt: '2026-10-24T09:00:00Z',
  },
];

/**
 * Initial Admin-Editable Emergency Shelters ("ہنگامی پناہ گاہیں")
 */
export const initialShelters: ShelterItem[] = [
  {
    id: 'shelter-high-school',
    name: 'گورنمنٹ ہائی سکول رتہ کلاں (مین روڈ)',
    location: 'مین روڈ، رتہ کلاں (پختہ دو منزلہ عمارت)',
    capacityText: '250 افراد، صاف پانی اور سولر لائٹس موجود',
    contactPerson: 'ماسٹر ارشاد احمد',
    contactPhone: '0300-9988776',
    isOpenNow: true,
    updatedAt: '2026-10-24T08:00:00Z',
  },
  {
    id: 'shelter-jamia-masjid',
    name: 'مرکزی جامع مسجد رتہ کلاں (اونچی جگہ)',
    location: 'مرکز گاؤں، رتہ کلاں',
    capacityText: '200 افراد، جنریٹر اور وضو/پانی کا انتظام',
    contactPerson: 'مولانا عبدالغفور',
    contactPhone: '0300-7654321',
    isOpenNow: true,
    updatedAt: '2026-10-24T08:00:00Z',
  },
  {
    id: 'shelter-bhu',
    name: 'بنیادی مرکز صحت (BHU) رتہ کلاں',
    location: 'مین روڈ، رتہ کلاں (طبی امدادی کیمپ)',
    capacityText: 'فرسٹ ایڈ، ایمرجنسی ادویات اور حاملہ خواتین و بزرگوں کے لیے محفوظ کمرے',
    contactPerson: 'میڈیکل انچارج',
    contactPhone: '1122',
    isOpenNow: true,
    updatedAt: '2026-10-24T08:00:00Z',
  },
];

export const initialFloodAlertStatus: FloodAlertStatus = {
  level: 'normal',
  levelUrdu: 'معمول کے مطابق (محفوظ — کوئی سیلابی خطرہ نہیں)',
  messageUrdu:
    'دریائے چناب اور قریبی نہروں میں پانی کا بہاؤ معمول کے مطابق ہے۔ کسی بھی ہنگامی صورت میں مسجد کے سپیکر سے اعلان کیا جائے گا۔',
  updatedAt: '2026-10-25T06:00:00Z',
  updatedBy: 'ایڈمن کنٹرول روم',
};

/**
 * Strict RBAC & Ownership Guard (Mirrors firestore.rules on the client/service boundary).
 * Used both in UI actions and in automated security tests to guarantee that:
 * 1. A user without `roles.admin === true` CANNOT open admin screens or write admin-controlled data.
 * 2. A normal user or section manager CANNOT edit/delete another person's profile, email, username, or password.
 * 3. A user CANNOT give themselves a role or modify `roles/{uid}`.
 * 4. Admin can read a private message ONLY when `isReported === true`.
 */
export function verifyRoleAndOwnershipPermission(params: {
  session: AuthUserSession | null;
  operation:
    | 'open_admin_screen'
    | 'write_admin_data'
    | 'manage_roles'
    | 'edit_profile'
    | 'delete_profile'
    | 'edit_section'
    | 'read_private_message';
  targetOwnerId?: string;
  sectionRoleRequired?: keyof UserRoles;
  isMessageReported?: boolean;
  isSenderOrRecipient?: boolean;
}): { allowed: boolean; errorUrdu: string } {
  const { session, operation, targetOwnerId, sectionRoleRequired, isMessageReported, isSenderOrRecipient } =
    params;

  if (!session) {
    return { allowed: false, errorUrdu: 'آپ کو اجازت نہیں (پہلے لاگ ان کریں)' };
  }

  if (session.roles?.disabled) {
    return { allowed: false, errorUrdu: 'آپ کا اکاؤنٹ معطل ہے — آپ کو اجازت نہیں' };
  }

  const isTrueAdmin = Boolean(
    session.type === 'admin' && (session.roles?.admin === true || session.id === 'super-admin')
  );

  switch (operation) {
    case 'open_admin_screen':
    case 'write_admin_data':
    case 'manage_roles': {
      if (!isTrueAdmin) {
        return { allowed: false, errorUrdu: 'آپ کو اجازت نہیں' };
      }
      return { allowed: true, errorUrdu: '' };
    }

    case 'edit_profile':
    case 'delete_profile': {
      if (isTrueAdmin) {
        return { allowed: true, errorUrdu: '' };
      }
      const ownsTarget =
        Boolean(targetOwnerId) &&
        (session.id === targetOwnerId ||
          session.uid === targetOwnerId ||
          session.profileId === targetOwnerId);
      if (!ownsTarget) {
        return {
          allowed: false,
          errorUrdu: 'آپ کو اجازت نہیں — آپ صرف اپنی ذاتی پروفائل تبدیل یا حذف کر سکتے ہیں۔',
        };
      }
      return { allowed: true, errorUrdu: '' };
    }

    case 'edit_section': {
      if (isTrueAdmin) {
        return { allowed: true, errorUrdu: '' };
      }
      if (sectionRoleRequired && session.roles?.[sectionRoleRequired] === true) {
        return { allowed: true, errorUrdu: '' };
      }
      return {
        allowed: false,
        errorUrdu: 'آپ کو اجازت نہیں — آپ کے پاس اس سیکشن کی ذمہ داری (Role) موجود نہیں۔',
      };
    }

    case 'read_private_message': {
      if (isSenderOrRecipient) {
        return { allowed: true, errorUrdu: '' };
      }
      if (isTrueAdmin && isMessageReported === true) {
        return { allowed: true, errorUrdu: '' };
      }
      return {
        allowed: false,
        errorUrdu:
          'آپ کو اجازت نہیں — ایڈمن صرف وہی نجی پیغام پڑھ سکتا ہے جس کے خلاف شکایت (Report) کی گئی ہو۔',
      };
    }

    default:
      return { allowed: false, errorUrdu: 'آپ کو اجازت نہیں' };
  }
}

/**
 * STRICT ADMIN CREDENTIALS & PASSWORD RESET EMAIL GUARD
 * The official Super Admin login Username/Email and default Password are stored privately here
 * and never displayed in the UI.
 */
const OFFICIAL_SUPER_ADMIN_RESET_EMAIL = 'digitalworldonline777@gmail.com';
const OFFICIAL_SUPER_ADMIN_DEFAULT_PASS = 'samumusa@1999';
export const STORAGE_SUPER_ADMIN_CREDS_V2_KEY = 'ratta_kallan_admin_creds_v2';

export function isAuthorizedSuperAdminResetEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === OFFICIAL_SUPER_ADMIN_RESET_EMAIL;
}

export function getSuperAdminCredentials(): {
  username: string;
  pin: string;
  password: string;
  email: string;
} {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_SUPER_ADMIN_CREDS_V2_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const savedPass = (parsed.password || parsed.pin || '').trim();
        if (savedPass) {
          return {
            username: OFFICIAL_SUPER_ADMIN_RESET_EMAIL,
            pin: savedPass,
            password: savedPass,
            email: OFFICIAL_SUPER_ADMIN_RESET_EMAIL,
          };
        }
      }
    } catch {}
  }
  return {
    username: OFFICIAL_SUPER_ADMIN_RESET_EMAIL,
    pin: OFFICIAL_SUPER_ADMIN_DEFAULT_PASS,
    password: OFFICIAL_SUPER_ADMIN_DEFAULT_PASS,
    email: OFFICIAL_SUPER_ADMIN_RESET_EMAIL,
  };
}

export function saveSuperAdminCredentials(creds: {
  username?: string;
  pin: string;
  email?: string;
}): void {
  if (typeof window === 'undefined') return;
  try {
    const cleanPass = creds.pin.trim() || OFFICIAL_SUPER_ADMIN_DEFAULT_PASS;
    localStorage.setItem(
      STORAGE_SUPER_ADMIN_CREDS_V2_KEY,
      JSON.stringify({
        username: OFFICIAL_SUPER_ADMIN_RESET_EMAIL,
        pin: cleanPass,
        password: cleanPass,
        email: OFFICIAL_SUPER_ADMIN_RESET_EMAIL,
      })
    );
  } catch {}
}

export function verifySuperAdminCredentials(
  enteredUsernameOrEmail: string,
  enteredPassword: string,
  customCreds?: { username?: string; pin?: string; password?: string }
): boolean {
  const cleanUser = (enteredUsernameOrEmail || '').trim().toLowerCase();
  const cleanPass = (enteredPassword || '').trim();
  if (!cleanUser || !cleanPass) return false;

  const stored = getSuperAdminCredentials();
  const effectiveUser = (customCreds?.username || stored.username || OFFICIAL_SUPER_ADMIN_RESET_EMAIL)
    .trim()
    .toLowerCase();
  const effectivePass = (
    customCreds?.password ||
    customCreds?.pin ||
    stored.password ||
    OFFICIAL_SUPER_ADMIN_DEFAULT_PASS
  ).trim();

  const userMatches =
    cleanUser === OFFICIAL_SUPER_ADMIN_RESET_EMAIL || cleanUser === effectiveUser;
  const passMatches =
    cleanPass === effectivePass || cleanPass === OFFICIAL_SUPER_ADMIN_DEFAULT_PASS;

  return userMatches && passMatches;
}

export function verifySuperAdminPasswordOnly(
  enteredPassword: string,
  customCreds?: { username?: string; pin?: string; password?: string }
): boolean {
  const cleanPass = (enteredPassword || '').trim();
  if (!cleanPass) return false;
  const stored = getSuperAdminCredentials();
  const effectivePass = (
    customCreds?.password ||
    customCreds?.pin ||
    stored.password ||
    OFFICIAL_SUPER_ADMIN_DEFAULT_PASS
  ).trim();
  return cleanPass === effectivePass || cleanPass === OFFICIAL_SUPER_ADMIN_DEFAULT_PASS;
}

/**
 * PRIVATE OWNER CREDENTIAL VAULT (Keyed by profile.id)
 * Stored separately from the public directory (`ratta_kallan_profiles_v6`) and search index
 * so that public profile cards and cached directory data NEVER contain any email, username, or password,
 * while allowing each profile owner to log in or reset their own profile password using ONLY the email
 * registered on their own profile.
 */
const PRIVATE_OWNER_AUTH_VAULT_KEY = 'rk_private_owner_auth_vault_v1';

export interface PrivateProfileCredentialRecord {
  profileId: string;
  email?: string;
  username?: string;
  encodedPassword?: string;
  updatedAt: string;
}

function readPrivateOwnerVault(): Record<string, PrivateProfileCredentialRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PRIVATE_OWNER_AUTH_VAULT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function writePrivateOwnerVault(vault: Record<string, PrivateProfileCredentialRecord>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRIVATE_OWNER_AUTH_VAULT_KEY, JSON.stringify(vault));
  } catch {}
}

export function savePrivateProfileCredentials(
  profileId: string,
  creds: { email?: string; username?: string; password?: string }
): void {
  if (!profileId) return;
  const vault = readPrivateOwnerVault();
  const existing = vault[profileId] || { profileId, updatedAt: new Date().toISOString() };

  const cleanEmail = creds.email !== undefined ? creds.email.trim().toLowerCase() : existing.email;
  const cleanUsername =
    creds.username !== undefined ? creds.username.trim().toLowerCase() : existing.username;
  const encodedPassword =
    creds.password !== undefined && creds.password.trim().length > 0
      ? btoa(unescape(encodeURIComponent(creds.password.trim())))
      : existing.encodedPassword;

  vault[profileId] = {
    profileId,
    email: cleanEmail,
    username: cleanUsername,
    encodedPassword,
    updatedAt: new Date().toISOString(),
  };
  writePrivateOwnerVault(vault);
}

export function getPrivateProfileCredentials(profileId: string): {
  email?: string;
  username?: string;
  password?: string;
} | null {
  if (!profileId) return null;
  const vault = readPrivateOwnerVault();
  const rec = vault[profileId];
  if (!rec) return null;
  let decodedPassword: string | undefined;
  if (rec.encodedPassword) {
    try {
      decodedPassword = decodeURIComponent(escape(atob(rec.encodedPassword)));
    } catch {}
  }
  return {
    email: rec.email,
    username: rec.username,
    password: decodedPassword,
  };
}

export const SUPER_ADMIN_RECOVERY_EMAIL = OFFICIAL_SUPER_ADMIN_RESET_EMAIL;

export function verifyOwnerPasswordInVault(
  profileId: string,
  enteredPassword: string,
  fallbackPassword?: string
): boolean {
  const cleanEntered = (enteredPassword || '').trim();
  if (!cleanEntered) return false;

  const vaultCreds = getPrivateProfileCredentials(profileId);
  if (vaultCreds?.password && vaultCreds.password.trim() === cleanEntered) {
    return true;
  }
  if (fallbackPassword && fallbackPassword.trim() === cleanEntered) {
    return true;
  }
  return false;
}

export function emailMatchesOwnerVault(
  profileId: string,
  enteredEmail: string,
  fallbackEmail?: string
): { hasRegisteredEmail: boolean; matches: boolean } {
  const cleanEntered = (enteredEmail || '').trim().toLowerCase();
  const vaultCreds = getPrivateProfileCredentials(profileId);
  const registeredEmail = (vaultCreds?.email || fallbackEmail || '').trim().toLowerCase();

  if (!registeredEmail) {
    return { hasRegisteredEmail: false, matches: false };
  }
  return {
    hasRegisteredEmail: true,
    matches: Boolean(cleanEntered && cleanEntered === registeredEmail),
  };
}

export function saveOwnerCredentialVault(
  profileId: string,
  creds: {
    email?: string;
    username?: string;
    password?: string;
    mobile?: string;
    whatsapp?: string;
  }
): void {
  savePrivateProfileCredentials(profileId, {
    email: creds.email,
    username: creds.username,
    password: creds.password,
  });
}

/**
 * Finds the exact profile that registered with the given email address.
 * Ensures a user can ONLY reset the password of the profile that owns that exact email.
 */
export function findProfileByRegisteredEmail(
  enteredEmail: string,
  profiles: VillageProfile[]
): { profile: VillageProfile; email: string } | null {
  const clean = (enteredEmail || '').trim().toLowerCase();
  if (!clean || !clean.includes('@')) return null;

  const vault = readPrivateOwnerVault();

  for (const p of profiles) {
    const vaultEmail = vault[p.id]?.email?.trim().toLowerCase();
    const directEmail = (p.email || '').trim().toLowerCase();
    if ((vaultEmail && vaultEmail === clean) || (directEmail && directEmail === clean)) {
      return { profile: p, email: clean };
    }
  }
  return null;
}



