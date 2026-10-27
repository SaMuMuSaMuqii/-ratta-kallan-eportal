import {
  VillageProfile,
  VillageMosque,
  VillageInstitute,
  VillageTransport,
  VillageHospital,
  VillageNewsEvent,
  VillageAnnouncement,
  MandiRateItem,
  ShelterItem,
  HelpGuideItem,
  CustomSearchKeywordItem,
  FloodAlertStatus,
  Language,
} from '../types';
import {
  normalizeSearchString,
  transliterateGurmukhiToShahmukhi,
  stripUrduDiacritics,
  performUniversalSearch,
  PORTAL_FEATURES_INDEX,
  PortalFeatureSearchItem,
} from './searchEngine';
import {
  sanitizePublicProfile,
  initialHelpGuides,
  initialMandiRates,
  initialShelters,
  initialFloodAlertStatus,
} from './privacySanitizer';

export const PRIVACY_REFUSAL_SENTENCE =
  'یہ ذاتی معلومات ہیں، میں نہیں بتا سکتا۔ آپ فون نمبر یا پیغام کے ذریعے رابطہ کر سکتے ہیں۔';

export type VoiceIntentType =
  | 'privacy_refusal'
  | 'portal_action'
  | 'how_to'
  | 'mandi'
  | 'policy_terms'
  | 'follow_up'
  | 'medical_advice'
  | 'emergency'
  | 'my_profile'
  | 'help_post'
  | 'doctor'
  | 'school'
  | 'prayer'
  | 'transport'
  | 'worker'
  | 'news'
  | 'unclear'
  | 'not_found';

export interface PhoneContactItem {
  label: string;
  phone: string;
  sublabel?: string;
}

export interface VoiceMatchedItem {
  id: string;
  title: string;
  categoryLabel: string;
  area: string;
  phone?: string;
  badgeText?: string;
  portalActionType?: PortalFeatureSearchItem['actionType'];
  portalActionButtonLabel?: string;
}

export interface VoiceAskResult {
  intent: VoiceIntentType;
  displayText: string;
  spokenText: string;
  phoneNumbers: PhoneContactItem[];
  matchedItems?: VoiceMatchedItem[];
  allCandidateItems?: VoiceMatchedItem[];
  buttonToTap?: string;
  portalActionType?: PortalFeatureSearchItem['actionType'];
  stalenessNotice?: string;
  needsClarification?: boolean;
  clarificationOptions?: string[];
  exampleButtons: string[];
}

export interface SignedInOwnerContext {
  id?: string;
  uid?: string;
  username?: string;
  name?: string;
  mobile?: string;
  email?: string;
  profileId?: string;
}

export interface PublicHelpPostItem {
  id: string;
  type: 'blood' | 'lost' | 'urgent_aid' | 'other' | string;
  title: string;
  details: string;
  contactName: string;
  contactMobile: string;
  location: string;
  createdAt?: string;
}

export interface VoiceAskDataset {
  profiles: VillageProfile[];
  mosques: VillageMosque[];
  institutes: VillageInstitute[];
  transports: VillageTransport[];
  hospitals: VillageHospital[];
  newsEvents: VillageNewsEvent[];
  announcements?: VillageAnnouncement[];
  helpNotices?: PublicHelpPostItem[];
  mandiRates?: MandiRateItem[];
  shelters?: ShelterItem[];
  helpGuides?: HelpGuideItem[];
  customKeywords?: CustomSearchKeywordItem[];
  floodAlertStatus?: FloodAlertStatus;
  previousResult?: VoiceAskResult | null;
  signedInUser?: SignedInOwnerContext | null;
  userMessages?: {
    id: string;
    senderName: string;
    senderMobile: string;
    targetProfileId?: string;
    targetProfileName?: string;
    targetMobile: string;
    messageText: string;
    createdAt: string;
  }[];
  nowMs?: number;
}

export const DEFAULT_EXAMPLE_QUESTIONS: string[] = [
  'ڈاکٹر آج ہے؟',
  'سکول کا وقت کیا ہے؟',
  'جھنگ کی وین کب جاتی ہے؟',
  'نماز کا وقت؟',
];

const URDU_DIGIT_WORDS: Record<string, string> = {
  '0': 'صفر',
  '1': 'ایک',
  '2': 'دو',
  '3': 'تین',
  '4': 'چار',
  '5': 'پانچ',
  '6': 'چھ',
  '7': 'سات',
  '8': 'آٹھ',
  '9': 'نو',
};

const EN_DIGIT_WORDS: Record<string, string> = {
  '0': 'zero',
  '1': 'one',
  '2': 'two',
  '3': 'three',
  '4': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'nine',
};

/**
 * Reads phone numbers digit by digit in clear groups for elderly listeners.
 * Example: 0300-1234567 -> "صفر تین صفر صفر، ایک دو تین، چار پانچ چھ سات"
 */
export function formatPhoneDigitsForSpeech(phone: string, lang: Language = 'ur'): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  const map = lang === 'en' ? EN_DIGIT_WORDS : URDU_DIGIT_WORDS;
  const sep = lang === 'en' ? ', ' : '، ';

  const toWords = (slice: string) =>
    slice
      .split('')
      .map((d) => map[d] || d)
      .join(' ');

  if (digits.length === 11) {
    return `${toWords(digits.slice(0, 4))}${sep}${toWords(digits.slice(4, 7))}${sep}${toWords(digits.slice(7))}`;
  }
  if (digits.length === 10) {
    return `${toWords(digits.slice(0, 3))}${sep}${toWords(digits.slice(3, 6))}${sep}${toWords(digits.slice(6))}`;
  }
  return toWords(digits);
}

/**
 * Checks if an entry's timestamp is old (> 3 days) and returns a clear Urdu staleness notice.
 * Example: "یہ وقت 10 دن پہلے لکھا گیا تھا۔"
 */
export function getStalenessNotice(
  dateStr?: string,
  nowMs: number = Date.now()
): string | undefined {
  if (!dateStr) return undefined;
  const parsed = Date.parse(dateStr);
  if (isNaN(parsed)) return undefined;
  const diffDays = Math.floor((nowMs - parsed) / (1000 * 60 * 60 * 24));
  if (diffDays >= 3) {
    return `یہ وقت ${diffDays} دن پہلے لکھا گیا تھا۔`;
  }
  return undefined;
}

/**
 * Clear Urdu error messages for microphone, speech, or language problems (Never fail silently, never switch to Hindi).
 */
export function getVoiceErrorMessageUrdu(
  errorType: string,
  requestedLang: Language = 'ur'
): { messageUrdu: string; fallbackLang: 'ur-PK' | 'en-US'; isPunjabiFallback: boolean } {
  const code = (errorType || '').toLowerCase();

  if (code.includes('language-not-supported') || code.includes('punjabi-unsupported')) {
    return {
      messageUrdu:
        'آپ کے فون میں پنجابی آواز کی سہولت موجود نہیں ہے، اس لیے اردو میں سنا جا رہا ہے۔ آپ پنجابی یا اردو میں بول سکتے ہیں۔',
      fallbackLang: 'ur-PK',
      isPunjabiFallback: true,
    };
  }

  if (code.includes('not-allowed') || code.includes('permission-denied') || code.includes('service-not-allowed')) {
    return {
      messageUrdu:
        'مائیکروفون بند ہے (اجازت نہیں ملی)۔ ٹھیک کرنے کا طریقہ: ۱۔ اوپر ایڈریس بار کے ساتھ تالے (🔒) کے نشان کو دبائیں۔ ۲۔ مائیکروفون (Microphone) کو Allow کریں۔ ۳۔ نیچے دوبارہ کوشش کریں کا بٹن دبائیں۔',
      fallbackLang: requestedLang === 'en' ? 'en-US' : 'ur-PK',
      isPunjabiFallback: false,
    };
  }

  if (code.includes('no-speech')) {
    return {
      messageUrdu:
        'کوئی آواز سنائی نہیں دی۔ براہ کرم فون کے قریب آ کر صاف آواز میں دوبارہ بولیں یا نیچے بڑا بٹن دبائیں۔',
      fallbackLang: requestedLang === 'en' ? 'en-US' : 'ur-PK',
      isPunjabiFallback: false,
    };
  }

  if (code.includes('audio-capture') || code.includes('noise')) {
    return {
      messageUrdu:
        'شور کی وجہ سے یا مائیک نہ ملنے سے آواز صاف نہیں آئی۔ براہ کرم خاموش جگہ پر دوبارہ کوشش کریں۔',
      fallbackLang: requestedLang === 'en' ? 'en-US' : 'ur-PK',
      isPunjabiFallback: false,
    };
  }

  if (code.includes('network') || code.includes('offline')) {
    return {
      messageUrdu:
        'آواز پہچاننے کے لیے انٹرنیٹ موجود نہیں ہے۔ لیکن پریشان نہ ہوں! نیچے دیے گئے بڑے بٹن دبا کر یا لکھ کر آپ بغیر انٹرنیٹ کے بھی تمام معلومات لے سکتے ہیں۔',
      fallbackLang: requestedLang === 'en' ? 'en-US' : 'ur-PK',
      isPunjabiFallback: false,
    };
  }

  if (code.includes('browser-unsupported') || code.includes('not-supported')) {
    return {
      messageUrdu:
        'اس براؤزر میں بول کر پوچھنے کی سہولت نہیں ہے۔ براہ کرم گوگل کروم (Google Chrome) استعمال کریں یا نیچے دیے گئے بڑے بٹن دبائیں۔',
      fallbackLang: requestedLang === 'en' ? 'en-US' : 'ur-PK',
      isPunjabiFallback: false,
    };
  }

  return {
    messageUrdu:
      'آواز سننے میں معمولی رکاوٹ پیش آئی۔ براہ کرم دوبارہ کوشش کریں کا بٹن دبائیں یا نیچے مثال والا بٹن چنیں۔',
    fallbackLang: requestedLang === 'en' ? 'en-US' : 'ur-PK',
    isPunjabiFallback: false,
  };
}

/**
 * Checks whether a profile worker/doctor is available today.
 * Strictly excludes any profile whose isAvailableForWorkToday is false or availability is closed/busy.
 */
export function isProfileAvailableToday(p: VillageProfile): boolean {
  if (p.isAvailableForWorkToday === false) return false;
  if (p.availability === 'closed' || p.availability === 'busy') return false;
  return true;
}

// Intent Keyword Lists (Normalized + Roman Urdu + Punjabi + English)
const MEDICAL_ADVICE_KEYWORDS = [
  'دوایی',
  'دوا',
  'گولی',
  'شربت',
  'علاج دسو',
  'نسخہ',
  'بخار ہے',
  'بخار اے',
  'سر درد',
  'پیٹ درد',
  'پیٹ خراب',
  'کھانسی',
  'زکام',
  'بلڈ پریشر ہایی',
  'شوگر دا علاج',
  'تکلیف ہے',
  'سینے میں درد',
  'دل کی تکلیف',
  'medicine for',
  'treatment for',
  'bukhar ki dawa',
  'sar dard',
  'pait dard',
  'dawai',
  'ilaj daso',
];

const EMERGENCY_KEYWORDS = [
  '1122',
  'ایمرجنسی',
  'ریسکیو',
  'ایمبولینس',
  'حادثہ',
  'آگ لگ',
  'اگ لگ',
  'پولیس',
  'چوری',
  'ڈکیتی',
  'سیلاب',
  'طوفان',
  'پناہ گاہ',
  'شیلٹر',
  'فوری مدد',
  'زخمی',
  'سانپ',
  'emergency',
  'rescue',
  'ambulance',
  'police',
  'shelter',
  'panah gah',
  'aag lag',
  'hadsa',
];

const DOCTOR_KEYWORDS = [
  'ڈاکٹر',
  'ہسپتال',
  'اسپتال',
  'کلینک',
  'ڈسپنسری',
  'حکیم',
  'طبیب',
  'میڈیکل سٹور',
  'میڈیکل اسٹور',
  'فارمیسی',
  'بی ایچ یو',
  'مرکز صحت',
  'مریض',
  'چیک اپ',
  'doctor',
  'hospital',
  'clinic',
  'dispensary',
  'bhu',
  'medical store',
  'pharmacy',
  'daktar',
  'haspatal',
  'డాక్టర్',
];

const SCHOOL_KEYWORDS = [
  'سکول',
  'اسکول',
  'کالج',
  'مدرسہ',
  'تعلیم',
  'استاد',
  'ماسٹر',
  'پرنسپل',
  'کلاس',
  'داخلہ',
  'چھٹی',
  'ٹایم ٹیبل',
  'پڑھایی',
  'school',
  'college',
  'madrasa',
  'classes',
  'admission',
  'chutti',
  'sakool',
  'iskool',
];

const PRAYER_KEYWORDS = [
  'نماز',
  'فجر',
  'ظہر',
  'عصر',
  'مغرب',
  'عشا',
  'جمعہ',
  'عید کی نماز',
  'عید الفطر',
  'عید الاضحی',
  'مسجد',
  'مسیت',
  'اذان',
  'جماعت',
  'امام مسجد',
  'مولوی صاحب',
  'namaz',
  'prayer',
  'mosque',
  'masjid',
  'maseet',
  'fajr',
  'zohar',
  'dhuhr',
  'asar',
  'asr',
  'maghrib',
  'isha',
  'jummah',
  'jumma',
  'azan',
];

const TRANSPORT_KEYWORDS = [
  'وین',
  'گاڑی',
  'گڈی',
  'بس',
  'ہایی ایس',
  'ہایس',
  'بکسہ',
  'رکشہ',
  'ویگن',
  'جھنگ کی وین',
  'جھنگ جانا',
  'جھنگ کی گاڑی',
  'جھنگ دی گڈی',
  'لاری اڈا',
  'کرایہ',
  'روانگی',
  'ڈراییور',
  'سفر',
  'van',
  'bus',
  'gari',
  'gaddi',
  'transport',
  'hiace',
  'rickshaw',
  'jhang',
  'kiraya',
  'fare',
  'departure',
];

const NEWS_KEYWORDS = [
  'خبر',
  'خبریں',
  'اعلان',
  'جنازہ',
  'فوتگی',
  'شادی',
  'پنچایت',
  'جلسہ',
  'میڈیکل کیمپ',
  'واپڈا',
  'بجلی بند',
  'لوڈ شیڈنگ',
  'نہر کا پانی',
  'تازہ خبر',
  'آج کی خبر',
  'news',
  'announcement',
  'khabar',
  'elan',
  'janaza',
  'bijli band',
  'alert',
];

const WORKER_CATEGORY_MAP: { category: VillageProfile['category']; terms: string[]; labelUrdu: string }[] = [
  {
    category: 'electrician',
    labelUrdu: 'الیکٹریشن (بجلی والا)',
    terms: [
      'الیکٹریشن',
      'بجلی والا',
      'بیجلی والا',
      'بیجلی',
      'بجلی دا کم',
      'بجلی کا کام',
      'وایرنگ',
      'سولر',
      'پنکھا',
      'موٹر وینڈنگ',
      'بجلی مستری',
      'electrician',
      'bijli wala',
      'solar',
      'wiring',
    ],
  },
  {
    category: 'mistri',
    labelUrdu: 'راج مستری',
    terms: [
      'راج مستری',
      'مستری',
      'مکان تعمیر',
      'اینٹ',
      'پلستر',
      'عمارت',
      'تعمیر',
      'mistri',
      'mason',
      'builder',
      'raj mistri',
    ],
  },
  {
    category: 'plumber',
    labelUrdu: 'پلمبر (نلکے و موٹر والا)',
    terms: [
      'پلمبر',
      'نلکا',
      'نلکے والا',
      'ٹوٹیاں',
      'پایپ',
      'بورنگ',
      'پانی والی موٹر',
      'plumber',
      'nalka',
      'pipe',
      'boring',
    ],
  },
  {
    category: 'laborer',
    labelUrdu: 'مزدور و دیہاڑی دار',
    terms: [
      'مزدور',
      'دیہاڑی',
      'دہاڑی',
      'لیبر',
      'کٹایی والا',
      'مزدوری',
      'آج دستیاب مزدور',
      'کام والا',
      'mazdoor',
      'labor',
      'labour',
      'laborer',
      'dihari',
      'worker',
    ],
  },
  {
    category: 'mechanic',
    labelUrdu: 'مکینک (موٹر سائیکل و انجن)',
    terms: [
      'مکینک',
      'موٹر سایکل',
      'بایک',
      'پنکچر',
      'انجن',
      'ٹیوب ویل مکینک',
      'ٹرالی',
      'mechanic',
      'motorcycle',
      'bike',
      'puncture',
    ],
  },
  {
    category: 'tractor',
    labelUrdu: 'ٹریکٹر و زرعی مشینری',
    terms: [
      'ٹریکٹر',
      'ہل',
      'تھریشر',
      'روٹاویٹر',
      'کراہا',
      'لیزر',
      'زمین واہن',
      'tractor',
      'thresher',
      'plough',
    ],
  },
  {
    category: 'tailor',
    labelUrdu: 'درزی (سلائی کاریگر)',
    terms: [
      'درزی',
      'کپڑے سینے',
      'سلایی',
      'سوٹ',
      'ٹیلر',
      'کڑھایی',
      'tailor',
      'darzi',
      'silai',
    ],
  },
  {
    category: 'karyana',
    labelUrdu: 'کریانہ و جنرل سٹور',
    terms: [
      'کریانہ',
      'دکان',
      'ہٹی',
      'سودا',
      'راشن',
      'جنرل سٹور',
      'آٹا دال',
      'چینی گھی',
      'karyana',
      'shop',
      'store',
      'dukan',
      'rashan',
    ],
  },
  {
    category: 'chakki',
    labelUrdu: 'آٹا چکی',
    terms: ['چکی', 'آٹا چکی', 'گندم پیسنے', 'آٹا پیسنا', 'chakki', 'atta chakki', 'flour mill'],
  },
  {
    category: 'barber',
    labelUrdu: 'حجام / نائی (سیلون)',
    terms: ['نایی', 'حجام', 'بال کٹوانے', 'سیلون', 'شیو', 'خط', 'barber', 'nai', 'hajam', 'salon'],
  },
  {
    category: 'welder',
    labelUrdu: 'ویلڈر و لوہار',
    terms: ['ویلڈر', 'ویلڈنگ', 'لوہار', 'لوہے کا گیٹ', 'جالی', 'کھڑکی', 'welder', 'welding', 'lohar', 'iron'],
  },
  {
    category: 'milk',
    labelUrdu: 'دودھ و ڈیری فارم',
    terms: ['دودھ', 'دہی', 'لسی', 'گجر', 'ڈیری', 'بھینس کا دودھ', 'milk', 'dairy', 'doodh', 'dahi'],
  },
  {
    category: 'agri',
    labelUrdu: 'کھاد، بیج و زرعی ادویات',
    terms: ['کھاد', 'کھاد بیج', 'زرعی بیج', 'سپرے', 'یوریا', 'ڈی اے پی', 'زرعی دکان', 'khad', 'seed', 'fertilizer', 'spray'],
  },
  {
    category: 'sweets',
    labelUrdu: 'مٹھائی، بیکری و پکوان',
    terms: ['مٹھایی', 'حلوایی', 'بیکری', 'سموسے', 'پکوڑے', 'جلیبی', 'برفی', 'پکوان', 'دیگ', 'sweets', 'bakery', 'halwai'],
  },
];

const AMBIGUOUS_SINGLE_WORDS = [
  'وقت',
  'ٹایم',
  'نمبر',
  'فون',
  'پتہ',
  'کب',
  'کہاں',
  'کتھے',
  'کون',
  'بتاو',
  'دسو',
  'مدد',
  'کھلا',
  'بند',
  'time',
  'number',
  'phone',
  'where',
  'when',
  'help',
];

const MY_PROFILE_KEYWORDS = [
  'میری پروفایل',
  'میری پروفائل',
  'میرا نمبر',
  'میرے پیغام',
  'میرے پیغامات',
  'میرا ان باکس',
  'میرا کارڈ',
  'میرا اکاونٹ',
  'میری ای میل',
  'میرا ڈیٹا',
  'meri profile',
  'mera number',
  'mere paigham',
  'mere messages',
  'my profile',
  'my number',
  'my messages',
  'my inbox',
  'मेरी प्रोफाइल',
  'ਮੇਰੀ ਪ੍ਰੋਫਾਈਲ',
  'ਮੇਰਾ ਨੰਬਰ',
  'ਮੇਰੇ ਸੁਨੇਹੇ',
];

const HELP_POST_KEYWORDS = [
  'گمشدہ',
  'گم شدہ',
  'فایل گم',
  'فائل گم',
  'کاغذات گم',
  'شناختی کارڈ گم',
  'مدد نوٹس',
  'امداد نوٹس',
  'ہنگامی امداد نوٹس',
  'خون کا عطیہ',
  'خون کی ضرورت',
  'عطیہ نوٹس',
  'gumshuda',
  'lost file',
  'lost id',
  'help notice',
  'help post',
  'blood notice',
  'مدد درکار',
];

function containsAny(normQuery: string, rawLower: string, keywords: string[]): boolean {
  for (const kw of keywords) {
    const normKw = normalizeSearchString(kw);
    if (normKw && (normQuery.includes(normKw) || rawLower.includes(kw.toLowerCase()))) {
      return true;
    }
  }
  return false;
}

/**
 * Ranks profiles by:
 * 1) Exact Name match (+300)
 * 2) Exact Category / Business match (+200)
 * 3) Area / Address match (+120)
 * 4) Close spelling / Services match (+60)
 */
function rankProfilesByQuery(
  profiles: VillageProfile[],
  meaningfulTokens: string[],
  targetCategory?: VillageProfile['category']
): VillageProfile[] {
  if (meaningfulTokens.length === 0 && !targetCategory) return profiles;

  const scored = profiles.map((p) => {
    let score = 0;
    const normName = normalizeSearchString(p.name);
    const normBiz = normalizeSearchString(p.businessName);
    const normAddr = normalizeSearchString(p.address);
    const normServices = normalizeSearchString((p.services || []).join(' '));

    if (targetCategory && p.category === targetCategory) {
      score += 200;
    }

    for (const tok of meaningfulTokens) {
      if (!tok || tok.length < 2) continue;
      if (normName === tok || normName.split(/\s+/).includes(tok)) {
        score += 350; // Exact name word match
      } else if (normName.includes(tok)) {
        score += 280; // Name substring match
      }
      if (normBiz.includes(tok)) {
        score += 210; // Business / category title match
      }
      if (normAddr.includes(tok)) {
        score += 130; // Area / Mohalla match
      }
      if (normServices.includes(tok)) {
        score += 80; // Service match
      }
    }

    if (p.isVerified) score += 5;
    return { profile: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const hasHighNameOrAreaMatch = scored.some((s) => s.score >= 330);
  if (hasHighNameOrAreaMatch) {
    return scored.filter((s) => s.score >= 300).map((s) => s.profile);
  }
  return scored.map((s) => s.profile);
}

/**
 * Main Free On-Phone Voice & Search Question Answering Engine.
 * Uses only the portal's cached data. Never exposes private fields of other people.
 * Shows a user's own private data ONLY to that signed-in owner.
 */
export function answerVoiceQuestion(
  rawQuery: string,
  dataset: VoiceAskDataset,
  lang: Language = 'ur'
): VoiceAskResult {
  const cleanedRaw = stripUrduDiacritics(transliterateGurmukhiToShahmukhi(rawQuery || '')).trim();
  const rawLower = cleanedRaw.toLowerCase();
  const normQuery = normalizeSearchString(cleanedRaw);
  const nowMs = dataset.nowMs ?? Date.now();

  // Enforce Public Whitelist on dataset profiles: strip email, username, password of all other people
  const viewerOwnerId =
    dataset.signedInUser?.profileId || dataset.signedInUser?.id || dataset.signedInUser?.uid;
  const safeProfiles = (dataset.profiles || [])
    .filter((p) => !p.isHidden && !p.isDisabled)
    .map((p) =>
      sanitizePublicProfile(p, {
        viewerIsSignedIn: Boolean(dataset.signedInUser),
        viewerOwnerId,
      })
    );
  dataset = {
    ...dataset,
    profiles: safeProfiles,
  };

  const STOP_WORDS = new Set([
    'کا', 'کی', 'کے', 'کو', 'سے', 'میں', 'پر', 'ہے', 'ہیں', 'تھا', 'گا', 'گی', 'گے',
    'کب', 'کہاں', 'کتھے', 'دا', 'دی', 'دے', 'تے', 'وچ', 'ملے', 'چاہیے', 'بتاییں',
    'دسو', 'کیسے', 'کیا', 'اے', 'ہو', 'تسی', 'آپ', 'مجھے', 'ہمیں', 'والا', 'والے',
    'آج', 'کل', 'فون', 'نمبر', 'پتہ', 'وقت', 'ٹایم',
    'where', 'when', 'is', 'the', 'in', 'to', 'for', 'how', 'can', 'get', 'today',
  ]);
  const queryTokens = normQuery.split(/\s+/).filter(Boolean);
  const meaningfulTokens = queryTokens.filter((tok) => tok.length >= 2 && !STOP_WORDS.has(tok));

  // Empty or ultra-short input -> ask clarification
  if (!normQuery || normQuery.length < 2) {
    const msg = 'آپ کس چیز کے بارے میں پوچھنا چاہتے ہیں؟ نیچے بڑا بٹن دبائیں:';
    return {
      intent: 'unclear',
      displayText: msg,
      spokenText: msg,
      phoneNumbers: [],
      matchedItems: [],
      needsClarification: true,
      clarificationOptions: DEFAULT_EXAMPLE_QUESTIONS,
      exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
    };
  }

  // ============================================================================
  // 0A. CONVERSATION FOLLOW-UPS ("اور کوئی؟", "اس کا نمبر؟", "دوبارہ بتاؤ")
  // ============================================================================
  const isRepeatFollowUp =
    normQuery === 'دوبارہ بتاو' ||
    normQuery === 'دوبارہ بتاییں' ||
    normQuery === 'دوبارہ سناو' ||
    normQuery === 'فیر دسو' ||
    rawLower === 'repeat' ||
    rawLower === 'dobara batao' ||
    rawLower === 'phir daso';

  const isNumberFollowUp =
    normQuery === 'اس کا نمبر' ||
    normQuery === 'ان کا نمبر' ||
    normQuery === 'اوہدا نمبر' ||
    normQuery === 'نمبر بتاو' ||
    normQuery === 'فون نمبر دسو' ||
    rawLower === 'is ka number' ||
    rawLower === 'ohda number' ||
    rawLower === 'his number' ||
    rawLower === 'phone number';

  const isMoreFollowUp =
    normQuery === 'اور کویی' ||
    normQuery === 'کویی اور' ||
    normQuery === 'ہور کویی' ||
    normQuery === 'دوسرا کویی' ||
    rawLower === 'aur koi' ||
    rawLower === 'hor koi' ||
    rawLower === 'any other' ||
    rawLower === 'anyone else';

  if (dataset.previousResult && (isRepeatFollowUp || isNumberFollowUp || isMoreFollowUp)) {
    const prev = dataset.previousResult;
    if (isRepeatFollowUp) {
      return {
        ...prev,
        intent: 'follow_up',
      };
    }
    if (isNumberFollowUp) {
      if (prev.phoneNumbers && prev.phoneNumbers.length > 0) {
        const firstPhone = prev.phoneNumbers[0];
        const msg = `📞 ${firstPhone.label} کا فون نمبر یہ ہے: ${firstPhone.phone}۔ کال کرنے کے لیے سبز بٹن "فون کریں" دبائیں۔`;
        const spoken = `${firstPhone.label} کا فون نمبر: ${formatPhoneDigitsForSpeech(firstPhone.phone, lang)}۔`;
        return {
          intent: 'follow_up',
          displayText: msg,
          spokenText: spoken,
          phoneNumbers: prev.phoneNumbers,
          matchedItems: prev.matchedItems,
          exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
        };
      }
      const noNumMsg = 'اس جواب کے ساتھ کوئی الگ فون نمبر درج نہیں ہے۔ ایمرجنسی کے لیے 1122 ملائیں۔';
      return {
        intent: 'follow_up',
        displayText: noNumMsg,
        spokenText: noNumMsg,
        phoneNumbers: [],
        matchedItems: [],
        exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
      };
    }
    if (isMoreFollowUp) {
      const items = prev.allCandidateItems || prev.matchedItems || [];
      if (items.length > 1) {
        const remaining = items.slice(1);
        const nextItem = remaining[0];
        const phones: PhoneContactItem[] = remaining
          .filter((it) => Boolean(it.phone))
          .map((it) => ({
            label: it.title,
            phone: it.phone!,
            sublabel: `${it.categoryLabel} — ${it.area}`,
          }));
        const msg = `جی ہاں، اگلے دستیاب نام یہ ہیں:\n${remaining
          .map(
            (it, idx) =>
              `${idx + 1}۔ ${it.title} (${it.categoryLabel})، پتہ: ${it.area}${
                it.phone ? `، فون نمبر: ${it.phone}` : ''
              }`
          )
          .join('\n')}`;
        const spoken = `جی ہاں، اگلا نام: ${nextItem.title}، پتہ ${nextItem.area}۔${
          nextItem.phone ? ` فون نمبر: ${formatPhoneDigitsForSpeech(nextItem.phone, lang)}۔` : ''
        }`;
        return {
          intent: 'follow_up',
          displayText: msg,
          spokenText: spoken,
          phoneNumbers: phones,
          matchedItems: remaining,
          allCandidateItems: remaining,
          exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
        };
      }
      const noMoreMsg = 'اس کیٹیگری میں اس وقت صرف یہی ریکارڈ موجود ہے۔';
      return {
        intent: 'follow_up',
        displayText: noMoreMsg,
        spokenText: noMoreMsg,
        phoneNumbers: prev.phoneNumbers || [],
        matchedItems: prev.matchedItems || [],
        exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
      };
    }
  }

  // ============================================================================
  // 0B. THE ONE MAIN PRIVACY RULE:
  // NEVER reveal another person's email, username/login ID, password, or hash!
  // ============================================================================
  const PRIVATE_CREDENTIAL_PATTERNS = [
    'ای میل',
    'ایمیل',
    'پاس ورڈ',
    'پاسورڈ',
    'یوزر نیم',
    'یوزرنیم',
    'لاگ ان آیی ڈی',
    'لاگ ان ایی ڈی',
    'خفیہ کوڈ',
    'پن کوڈ',
    'ہیش',
    'email',
    'e-mail',
    'gmail',
    'password',
    'passcode',
    'username',
    'user name',
    'login id',
    'hash',
    'pin code',
  ];

  const FORGOT_PASSWORD_HOWTO_PATTERNS = [
    'بھول',
    'ری سیٹ',
    'ریسیٹ',
    'بازیاب',
    'یاد نہیں',
    'کیسے بدلوں',
    'کیسے بناوں',
    'تبدیل',
    'چینج',
    'forgot',
    'reset',
    'change',
    'bhool',
    'bhul',
    'recover',
  ];

  // Check if user is searching for the Admin Panel / Supervision Dashboard ("admin", "ایڈمن", "admin panel", "#admin")
  const ADMIN_PANEL_QUERY_PATTERNS = [
    'admin',
    'super admin',
    'admin panel',
    'admin panal',
    'admin dashboard',
    'admin login',
    'superadmin',
    '#admin',
    'ایڈمن',
    'ایڈمن پینل',
    'سپر ایڈمن',
    'کنٹرول پینل',
    'ایڈمن ڈیش بورڈ',
    'ایڈمن لاگ ان',
  ];
  const isAskingAdminPanel = containsAny(normQuery, rawLower, ADMIN_PANEL_QUERY_PATTERNS);

  const isAskingPrivateCredential = containsAny(normQuery, rawLower, PRIVATE_CREDENTIAL_PATTERNS);
  const isForgotPasswordHowTo = containsAny(normQuery, rawLower, FORGOT_PASSWORD_HOWTO_PATTERNS);
  const isAskingPasswordDirectly =
    normQuery.includes('پاس ورڈ') ||
    normQuery.includes('پاسورڈ') ||
    normQuery.includes('خفیہ کوڈ') ||
    normQuery.includes('ہیش') ||
    rawLower.includes('password') ||
    rawLower.includes('passcode') ||
    rawLower.includes('hash') ||
    rawLower.includes('pin code');

  const isStrictlyOwnProfileQuery =
    containsAny(normQuery, rawLower, MY_PROFILE_KEYWORDS) &&
    !normQuery.includes('ڈاکٹر') &&
    !normQuery.includes('طارق') &&
    !normQuery.includes('ساجد') &&
    !normQuery.includes('ارشد') &&
    !normQuery.includes('بشیر') &&
    !normQuery.includes('اسلم') &&
    !normQuery.includes('نعیم') &&
    !rawLower.includes('doctor') &&
    !rawLower.includes('tariq') &&
    !rawLower.includes('sajid') &&
    !rawLower.includes('arshad');

  if (isAskingPrivateCredential && !isForgotPasswordHowTo) {
    // Even a signed-in user can NEVER see any password; and no one can ever ask for another person's or admin's email/username/password
    if (isAskingPasswordDirectly || !isStrictlyOwnProfileQuery) {
      return {
        intent: 'privacy_refusal',
        displayText: PRIVACY_REFUSAL_SENTENCE,
        spokenText: PRIVACY_REFUSAL_SENTENCE,
        phoneNumbers: [],
        matchedItems: [],
        exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
      };
    }
  }

  // ============================================================================
  // 0B-2. DIRECT PORTAL SECTIONS & ADMIN PANEL ("admin", "ایڈمن", "ai school", "login", "register")
  // ============================================================================
  if (isAskingAdminPanel) {
    const adminFeat = PORTAL_FEATURES_INDEX[0];
    const displayText =
      '🔐 ایڈمن پینل اور سپر ایڈمن کنٹرول ڈیش بورڈ:\n' +
      '• یہاں سے ایڈمن اپنی ای میل اور پاس ورڈ کے ذریعے لاگ ان کر سکتے ہیں۔\n' +
      '• اپنا پاس ورڈ تبدیل (Change Password) یا ای میل سے ری سیٹ کر سکتے ہیں۔\n' +
      '• پورٹل کے تمام پروفائلز، بینر تصاویر، خبریں، منڈی ریٹس، شیلٹرز، الرٹس اور رولز کنٹرول کر سکتے ہیں۔\n' +
      '👉 نیچے دیے گئے بٹن پر کلک کر کے براہِ راست ایڈمن پینل کھولیں۔';
    const spokenText =
      'ایڈمن پینل اور سپر ایڈمن کنٹرول ڈیش بورڈ سامنے نکال دیا گیا ہے۔ آپ نیچے بٹن دبا کر ایڈمن ڈیش بورڈ کھول سکتے ہیں اور اپنی ای میل اور پاس ورڈ سے لاگ ان کر سکتے ہیں۔';
    return {
      intent: 'portal_action',
      displayText,
      spokenText,
      portalActionType: 'open_admin_supervision',
      buttonToTap: adminFeat.buttonLabelUrdu,
      phoneNumbers: [],
      matchedItems: [
        {
          id: adminFeat.id,
          title: adminFeat.titleUrdu,
          categoryLabel: adminFeat.badgeUrdu,
          area: adminFeat.descriptionUrdu,
          badgeText: 'ایڈمن کنٹرول',
          portalActionType: 'open_admin_supervision',
          portalActionButtonLabel: adminFeat.buttonLabelUrdu,
        },
        {
          id: 'portal-action-admin-modal',
          title: '⚙️ کوئیک ایڈمن پینل اور لاگ ان ونڈو',
          categoryLabel: 'ایڈمن پورٹل',
          area: 'پروفائلز کی منظوری، بینر اور خبریں منظم کریں',
          badgeText: 'فوری رسائی',
          portalActionType: 'open_admin_panel',
          portalActionButtonLabel: 'ایڈمن پینل کھولیں',
        },
      ],
      exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
    };
  }

  // ============================================================================
  // 0C. HOW-TO GUIDES & ORDINARY INSTRUCTIONS (Editable by Admin)
  // Examples: "پروفائل کیسے بناؤں؟", "پاس ورڈ بھول گیا", "پیغام کیسے بھیجوں؟",
  // "مزدور کے طور پر آج دستیاب کیسے ہوں؟", "ایمرجنسی میں کیا کروں؟", "خون دینے والوں میں نام کیسے لکھوں؟"
  // ============================================================================
  const activeGuides = (dataset.helpGuides || initialHelpGuides).filter((g) => !g.isHidden);
  for (const guide of activeGuides) {
    const normTitle = normalizeSearchString(guide.questionUrdu);
    const guideKeywords = [guide.questionUrdu, ...(guide.keywords || [])];
    const matchedGuide =
      normQuery.includes(normTitle) ||
      containsAny(normQuery, rawLower, guideKeywords) ||
      (guide.id === 'guide-forgot-password' && isAskingPrivateCredential && isForgotPasswordHowTo);

    if (matchedGuide) {
      const stepsJoined = guide.stepsUrdu.join('\n');
      const displayText = `📖 رہنمائی: ${guide.questionUrdu}\n${stepsJoined}\n👉 بٹن دبائیں: "${guide.buttonToTap}"`;
      const spokenText = `${guide.questionUrdu}۔ آسان طریقہ یہ ہے: ${guide.stepsUrdu.join(' ')} اس کے لیے "${
        guide.buttonToTap
      }" کا بٹن دبائیں۔`;
      return {
        intent: 'how_to',
        displayText,
        spokenText,
        buttonToTap: guide.buttonToTap,
        phoneNumbers:
          guide.id === 'guide-emergency-steps'
            ? [
                { label: 'ریسکیو ایمرجنسی 1122', phone: '1122', sublabel: 'فوری ایمبولینس' },
                { label: 'پولیس ہیلپ لائن 15', phone: '15', sublabel: 'پولیس مدد' },
                { label: 'فائر بریگیڈ 16', phone: '16', sublabel: 'آگ بجھانا' },
              ]
            : [],
        matchedItems: [
          {
            id: guide.id,
            title: guide.questionUrdu,
            categoryLabel: `بٹن دبائیں: ${guide.buttonToTap}`,
            area: guide.stepsUrdu[0] || '',
          },
        ],
        exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
      };
    }
  }

  // ============================================================================
  // 0D. PRIVACY POLICY & TERMS AND CONDITIONS QUERIES
  // ============================================================================
  const POLICY_TERMS_KEYWORDS = [
    'پراییویسی پالیسی',
    'پرائیویسی پالیسی',
    'شرایط و ضوابط',
    'شرائط و ضوابط',
    'گاوں کے اصول',
    'خواتین کے نمبر',
    'privacy policy',
    'terms and conditions',
    'community rules',
  ];
  if (containsAny(normQuery, rawLower, POLICY_TERMS_KEYWORDS)) {
    const displayText =
      '📜 رتہ کلاں پورٹل پرائیویسی اور شرائط و ضوابط:\n' +
      '۱۔ خواتین کے فون نمبر یا تصاویر لگانا سختی سے منع ہے۔\n' +
      '۲۔ کسی کا ای میل، یوزر نیم، بلڈ گروپ یا نجی پیغام عام لوگوں کو نہیں دکھایا جاتا۔\n' +
      '۳۔ کوئی آواز کی ریکارڈنگ محفوظ نہیں کی جاتی اور نہ کوئی ڈیٹا بیچا جاتا ہے۔\n' +
      '👉 مکمل پڑھنے کے لیے فوٹر میں "پرائیویسی پالیسی" یا "شرائط و ضوابط" کا بٹن دبائیں۔';
    const spokenText =
      'رتہ کلاں پورٹل کے اصول: خواتین کے فون نمبر یا تصاویر لگانا سختی سے منع ہے۔ کسی کا ای میل، بلڈ گروپ یا نجی پیغام عام نہیں کیا جاتا، اور آواز کی ریکارڈنگ محفوظ نہیں ہوتی۔';
    return {
      intent: 'policy_terms',
      displayText,
      spokenText,
      phoneNumbers: [],
      matchedItems: [
        {
          id: 'footer-privacy-terms',
          title: 'پرائیویسی پالیسی اور شرائط و ضوابط',
          categoryLabel: 'کمیونٹی اصول و رازداری',
          area: 'فوٹر لنکس میں دستیاب',
        },
      ],
      exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
    };
  }

  // ============================================================================
  // 0E. MANDI RATES ("منڈی کے ریٹ", گندم، چاول، کپاس، گڑ، کھاد ریٹ)
  // ============================================================================
  const MANDI_KEYWORDS = [
    'منڈی',
    'غلہ منڈی',
    'گندم کا ریٹ',
    'چاول کا ریٹ',
    'کپاس کا ریٹ',
    'پھٹی کا ریٹ',
    'گڑ کا ریٹ',
    'کھاد کا ریٹ',
    'یوریا کا ریٹ',
    'اجناس کے ریٹ',
    'فصل کا ریٹ',
    'mandi rate',
    'wheat rate',
    'gandum rate',
    'rice rate',
    'cotton rate',
    'urea rate',
  ];
  if (containsAny(normQuery, rawLower, MANDI_KEYWORDS)) {
    const rates = (dataset.mandiRates || initialMandiRates).filter((r) => !r.isHidden);
    const matchedRates = rates.filter((r) => {
      const normCrop = normalizeSearchString(`${r.cropNameUrdu} ${r.cropNameEn}`);
      return meaningfulTokens.some((tok) => normCrop.includes(tok));
    });
    const listToShow = matchedRates.length > 0 ? matchedRates : rates;
    const displayLines = listToShow.map(
      (r) => `🌾 ${r.cropNameUrdu}: ${r.rateText} (${r.marketName})`
    );
    const spokenLines = listToShow
      .slice(0, 3)
      .map((r) => `${r.cropNameUrdu} کا ریٹ ${r.rateText} ہے۔`);
    const matchedItems: VoiceMatchedItem[] = listToShow.map((r) => ({
      id: r.id,
      title: r.cropNameUrdu,
      categoryLabel: r.rateText,
      area: r.marketName,
    }));
    return {
      intent: 'mandi',
      displayText: `📊 آج کے منڈی اور زرعی ریٹس:\n${displayLines.join('\n')}`,
      spokenText: `آج کے منڈی ریٹ۔ ${spokenLines.join(' ')}`,
      phoneNumbers: [],
      matchedItems,
      allCandidateItems: matchedItems,
      exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
    };
  }

  // 0. Check Signed-in User's Own Profile ("میری پروفائل", "میرا نمبر", "میرے پیغام")
  if (containsAny(normQuery, rawLower, MY_PROFILE_KEYWORDS)) {
    const owner = dataset.signedInUser;
    if (!owner || (!owner.id && !owner.uid && !owner.mobile && !owner.profileId)) {
      const msg =
        'اپنی پروفائل، اپنا نمبر یا اپنے ذاتی پیغامات دیکھنے کے لیے براہ کرم پہلے لاگ ان کریں۔ پرائیویسی اصول کے تحت کسی بھی فرد کی ذاتی معلومات بغیر لاگ ان ظاہر نہیں کی جاتیں۔';
      return {
        intent: 'my_profile',
        displayText: msg,
        spokenText: 'اپنی پروفائل، اپنا نمبر یا اپنے پیغامات دیکھنے کے لیے براہ کرم پہلے لاگ ان کریں۔',
        phoneNumbers: [],
        matchedItems: [],
        exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
      };
    }

    const ownerDigits = (owner.mobile || '').replace(/\D/g, '');
    const ownProfile = dataset.profiles.find(
      (p) =>
        (owner.profileId && p.id === owner.profileId) ||
        (owner.id && p.id === owner.id) ||
        (ownerDigits.length >= 10 && p.mobile.replace(/\D/g, '') === ownerDigits)
    );

    const ownMessages = (dataset.userMessages || []).filter((m) => {
      const targetDigits = (m.targetMobile || '').replace(/\D/g, '');
      const senderDigits = (m.senderMobile || '').replace(/\D/g, '');
      return (
        (ownProfile && m.targetProfileId === ownProfile.id) ||
        (ownerDigits.length >= 10 && (targetDigits === ownerDigits || senderDigits === ownerDigits))
      );
    });

    const isAskingMessages =
      normQuery.includes('پیغام') ||
      normQuery.includes('باکس') ||
      rawLower.includes('paigham') ||
      rawLower.includes('message') ||
      rawLower.includes('inbox');

    const ownerPhone = ownProfile?.mobile || owner.mobile || '';
    const ownerName = ownProfile?.name || owner.name || 'صارف';
    const ownerBiz = ownProfile?.businessName || 'ذاتی اکاؤنٹ';
    const ownerAddr = ownProfile?.address || 'رتہ کلاں';
    const ownerEmail = ownProfile?.email || owner.email;
    const ownerUsername = ownProfile?.username || owner.username;

    const phones: PhoneContactItem[] = [];
    const matchedItems: VoiceMatchedItem[] = [];

    if (ownerPhone) {
      phones.push({
        label: `میرا نمبر (${ownerName})`,
        phone: ownerPhone,
        sublabel: ownerBiz,
      });
    }

    matchedItems.push({
      id: ownProfile?.id || owner.id || 'my-profile',
      title: `${ownerName} (${ownerBiz})`,
      categoryLabel: 'میری ذاتی پروفائل',
      area: ownerAddr,
      phone: ownerPhone,
      badgeText: `میرے پیغامات: ${ownMessages.length}`,
    });

    if (isAskingMessages) {
      if (ownMessages.length === 0) {
        const msg = `👤 ${ownerName}: آپ کے ان باکس میں اس وقت کوئی نیا پیغام نہیں ہے۔ آپ کا درج شدہ نمبر: ${
          ownerPhone || 'درج نہیں'
        }۔`;
        return {
          intent: 'my_profile',
          displayText: msg,
          spokenText: `${ownerName}، آپ کے ان باکس میں اس وقت کوئی نیا پیغام نہیں ہے۔`,
          phoneNumbers: phones,
          matchedItems,
          exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
        };
      }
      const latest = ownMessages[0];
      const msg = `📩 ${ownerName} کے پیغامات (کل ${ownMessages.length}): تازہ پیغام "${latest.senderName}" کی طرف سے: "${latest.messageText}"۔ رابطہ نمبر: ${latest.senderMobile}۔`;
      const spoken = `${ownerName}، آپ کے لیے کل ${ownMessages.length} پیغامات ہیں۔ تازہ پیغام ${latest.senderName} کی طرف سے ہے: ${latest.messageText}۔`;
      if (latest.senderMobile) {
        phones.push({
          label: `${latest.senderName} (پیغام بھیجنے والا)`,
          phone: latest.senderMobile,
          sublabel: latest.messageText.slice(0, 40),
        });
      }
      return {
        intent: 'my_profile',
        displayText: msg,
        spokenText: spoken,
        phoneNumbers: phones,
        matchedItems,
        exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
      };
    }

    const emailNote = ownerEmail ? `، آپ کی ریکوری ای میل: ${ownerEmail}` : '';
    const usernameNote = ownerUsername ? `، آپ کا یوزر نیم: ${ownerUsername}` : '';
    const displayText = `👤 میری پروفائل: نام: ${ownerName} (${ownerBiz})، پتہ: ${ownerAddr}، میرا فون نمبر: ${
      ownerPhone || 'درج نہیں'
    }${usernameNote}${emailNote}۔ آپ کے ان باکس میں ${ownMessages.length} پیغامات ہیں۔ (حفاظتی اصول: پاس ورڈ کبھی ذخیرہ یا ظاہر نہیں کیا جاتا)۔`;
    const spokenText = `آپ کی پروفائل: ${ownerName}، ${ownerBiz}، ${ownerAddr}۔ آپ کا فون نمبر: ${
      ownerPhone ? formatPhoneDigitsForSpeech(ownerPhone, lang) : 'درج نہیں'
    }۔ آپ کے لیے ${ownMessages.length} پیغامات ہیں۔`;

    return {
      intent: 'my_profile',
      displayText,
      spokenText,
      phoneNumbers: phones,
      matchedItems,
      exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
    };
  }

  // 1. Check Medical Advice first (Safety Rule: Never give medical advice; refer to doctor & 1122)
  if (containsAny(normQuery, rawLower, MEDICAL_ADVICE_KEYWORDS)) {
    const availableDoctors = dataset.profiles.filter(
      (p) => p.category === 'doctor' && isProfileAvailableToday(p)
    );
    const primaryDoc = availableDoctors[0];
    const bhu = dataset.hospitals[0];

    const phones: PhoneContactItem[] = [
      { label: 'ریسکیو ایمرجنسی 1122', phone: '1122', sublabel: 'فوری ایمبولینس' },
    ];
    const matchedItems: VoiceMatchedItem[] = [
      {
        id: 'em-1122',
        title: 'ریسکیو ایمرجنسی 1122',
        categoryLabel: 'ایمبولینس و ہنگامی مدد',
        area: '24 گھنٹے مفت سروس',
        phone: '1122',
      },
    ];
    if (primaryDoc) {
      phones.push({
        label: primaryDoc.name,
        phone: primaryDoc.mobile,
        sublabel: primaryDoc.businessName,
      });
      matchedItems.push({
        id: primaryDoc.id,
        title: `${primaryDoc.name} (${primaryDoc.businessName})`,
        categoryLabel: 'ڈاکٹر و کلینک',
        area: primaryDoc.address,
        phone: primaryDoc.mobile,
      });
    }
    if (bhu && bhu.contact && bhu.contact !== '1122') {
      phones.push({
        label: bhu.name,
        phone: bhu.contact,
        sublabel: bhu.address,
      });
    }

    const docLineDisplay = primaryDoc
      ? `${primaryDoc.name} (${primaryDoc.businessName})، فون نمبر: ${primaryDoc.mobile}۔`
      : bhu
      ? `${bhu.name}، فون نمبر: ${bhu.contact}۔`
      : '';

    const docLineSpoken = primaryDoc
      ? `${primaryDoc.name}، فون نمبر: ${formatPhoneDigitsForSpeech(primaryDoc.mobile, lang)}۔`
      : bhu
      ? `${bhu.name}، فون نمبر: ${formatPhoneDigitsForSpeech(bhu.contact, lang)}۔`
      : '';

    const displayText = `یہ ڈاکٹر کا کام ہے۔ براہ کرم خود دوا نہ لیں اور ڈاکٹر سے مشورہ کریں۔ سخت ایمرجنسی میں پہلے 1122 پر کال کریں۔ ${docLineDisplay}`;
    const spokenText = `یہ ڈاکٹر کا کام ہے۔ براہ کرم ڈاکٹر سے مشورہ کریں۔ ایمرجنسی میں پہلے ایک ایک دو دو پر کال کریں۔ ${docLineSpoken}`;

    return {
      intent: 'medical_advice',
      displayText,
      spokenText,
      phoneNumbers: phones,
      matchedItems,
      exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
    };
  }

  // 2. Check Help Posts (Lost items, urgent community aid notices)
  if (containsAny(normQuery, rawLower, HELP_POST_KEYWORDS)) {
    const notices = dataset.helpNotices || [
      {
        id: 'notice-2',
        type: 'lost',
        title: 'گمشدہ دستاویزات / فائل',
        details: 'رتہ کلاں اڈا کے قریب نیلی فائل گر گئی ہے۔ جس کو ملے رابطہ فرمائے۔',
        contactName: 'طارق محمود',
        contactMobile: '0301-4455667',
        location: 'رتہ کلاں مین اڈا',
      },
    ];

    const publicSafeNotices = notices.filter((n) => n.type !== 'blood' || Boolean(dataset.signedInUser));
    if (publicSafeNotices.length === 0) {
      const msg = dataset.signedInUser
        ? 'اس وقت ہنگامی مدد نوٹس بورڈ پر کوئی اعلان موجود نہیں ہے۔ ایمرجنسی کے لیے 1122 پر کال کریں۔'
        : 'خون کے عطیہ کی فہرست دیکھنے کے لیے لاگ ان ضروری ہے (پرائیویسی اصول)۔ فوری طبی ایمرجنسی میں 1122 پر کال کریں۔';
      return {
        intent: 'help_post',
        displayText: msg,
        spokenText: msg,
        phoneNumbers: [{ label: 'ریسکیو 1122', phone: '1122', sublabel: 'ایمرجنسی' }],
        matchedItems: [],
        exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
      };
    }

    const phones: PhoneContactItem[] = [];
    const matchedItems: VoiceMatchedItem[] = [];
    const displayLines: string[] = [];
    const spokenLines: string[] = [];

    publicSafeNotices.slice(0, 3).forEach((n) => {
      displayLines.push(
        `📌 ${n.title} (${n.location}): ${n.details} — رابطہ: ${n.contactName}، فون نمبر: ${n.contactMobile}۔`
      );
      spokenLines.push(
        `${n.title}، مقام ${n.location}۔ ${n.details}۔ رابطہ ${n.contactName}، فون نمبر: ${formatPhoneDigitsForSpeech(
          n.contactMobile,
          lang
        )}۔`
      );
      if (n.contactMobile) {
        phones.push({
          label: `${n.contactName} (${n.title})`,
          phone: n.contactMobile,
          sublabel: n.location,
        });
      }
      matchedItems.push({
        id: n.id,
        title: n.title,
        categoryLabel: `رابطہ: ${n.contactName}`,
        area: n.location,
        phone: n.contactMobile,
      });
    });

    return {
      intent: 'help_post',
      displayText: displayLines.join('\n'),
      spokenText: spokenLines[0] || displayLines[0],
      phoneNumbers: phones,
      matchedItems,
      exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
    };
  }

  // 3. Check Emergency & Shelters
  if (containsAny(normQuery, rawLower, EMERGENCY_KEYWORDS)) {
    const phones: PhoneContactItem[] = [
      { label: 'ریسکیو ایمبولینس و آگ 1122', phone: '1122', sublabel: '24 گھنٹے مفت ایمرجنسی' },
      { label: 'پولیس ہیلپ لائن 15', phone: '15', sublabel: 'فوری پولیس مدد' },
      { label: 'فائر بریگیڈ 16', phone: '16', sublabel: 'آگ بجھانے کا عملہ' },
    ];
    const matchedItems: VoiceMatchedItem[] = [
      {
        id: 'em-1122',
        title: 'ریسکیو 1122 (ایمبولینس و حادثات)',
        categoryLabel: 'ایمرجنسی ہیلپ لائن',
        area: 'رتہ کلاں و ضلع جھنگ',
        phone: '1122',
      },
      {
        id: 'em-15',
        title: 'پولیس ایمرجنسی 15',
        categoryLabel: 'پولیس مدد',
        area: 'ضلع جھنگ',
        phone: '15',
      },
      {
        id: 'em-16',
        title: 'فائر بریگیڈ 16',
        categoryLabel: 'آگ بجھانے کا عملہ',
        area: 'ضلع جھنگ',
        phone: '16',
      },
    ];

    dataset.hospitals.slice(0, 2).forEach((h) => {
      if (h.contact && h.contact !== '1122') {
        phones.push({
          label: h.name,
          phone: h.contact,
          sublabel: h.address,
        });
        matchedItems.push({
          id: h.id,
          title: h.name,
          categoryLabel: h.categoryUrdu || 'ہسپتال',
          area: h.address,
          phone: h.contact,
        });
      }
    });

    const isShelterQuery =
      normQuery.includes('پناہ') ||
      normQuery.includes('شیلٹر') ||
      normQuery.includes('سیلاب') ||
      normQuery.includes('طوفان') ||
      rawLower.includes('shelter') ||
      rawLower.includes('panah');

    if (isShelterQuery) {
      const displayText =
        'ایمرجنسی میں سب سے پہلے 1122 پر کال کریں۔ رتہ کلاں میں ہنگامی پناہ گاہیں یہ ہیں: ۱۔ گورنمنٹ ہائی سکول رتہ کلاں (مین روڈ)۔ ۲۔ مرکزی جامع مسجد رتہ کلاں (اونچی جگہ)۔ ۳۔ بنیادی مرکز صحت (BHU) رتہ کلاں۔ پولیس کے لیے 15 اور فائر بریگیڈ کے لیے 16 ملائیں۔';
      const spokenText =
        'ایمرجنسی میں سب سے پہلے ایک ایک دو دو پر کال کریں۔ رتہ کلاں میں ہنگامی پناہ گاہیں گورنمنٹ ہائی سکول رتہ کلاں اور مرکزی جامع مسجد رتہ کلاں ہیں۔ پولیس کے لیے ایک پانچ ملائیں۔';

      return {
        intent: 'emergency',
        displayText,
        spokenText,
        phoneNumbers: phones,
        matchedItems,
        exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
      };
    }

    const displayText =
      'فوری ایمرجنسی اور ایمبولینس کے لیے سب سے پہلے 1122 پر کال کریں۔ پولیس مدد کے لیے 15 اور آگ بجھانے کے لیے 16 پر کال کریں۔ بنیادی مرکز صحت (BHU) رتہ کلاں اور ڈی ایچ کیو ہسپتال جھنگ 24 گھنٹے ایمرجنسی کے لیے کھلے ہیں۔';
    const spokenText =
      'فوری ایمرجنسی اور ایمبولینس کے لیے سب سے پہلے ایک ایک دو دو پر کال کریں۔ پولیس مدد کے لیے ایک پانچ اور فائر بریگیڈ کے لیے ایک چھ پر کال کریں۔';

    return {
      intent: 'emergency',
      displayText,
      spokenText,
      phoneNumbers: phones,
      matchedItems,
      exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
    };
  }

  // 4. Check Transport (Vans & Buses to Jhang)
  if (containsAny(normQuery, rawLower, TRANSPORT_KEYWORDS)) {
    if (dataset.transports.length === 0) {
      const msg = 'معاف کریں، مجھے معلوم نہیں۔ اس وقت گاڑیوں کا ریکارڈ موجود نہیں۔';
      return {
        intent: 'not_found',
        displayText: msg,
        spokenText: msg,
        phoneNumbers: [],
        matchedItems: [],
        exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
      };
    }

    const phones: PhoneContactItem[] = [];
    const matchedItems: VoiceMatchedItem[] = [];
    const displayLines: string[] = [];
    const spokenLines: string[] = [];
    let staleness: string | undefined;

    dataset.transports.slice(0, 3).forEach((v) => {
      const st = getStalenessNotice(v.lastUpdated, nowMs);
      if (st && !staleness) staleness = st;

      displayLines.push(
        `🚐 ${v.title}: روانگی ${v.departureTime} (واپسی/پہنچ: ${v.arrivalTime})، کرایہ: ${v.fare}، روٹ: ${v.route}۔ ڈرائیور: ${v.driverName}، فون نمبر: ${v.driverMobile}۔`
      );
      spokenLines.push(
        `${v.title}۔ روانگی کا وقت: ${v.departureTime}۔ کرایہ: ${v.fare}۔ ڈرائیور ${v.driverName} کا فون نمبر: ${formatPhoneDigitsForSpeech(
          v.driverMobile,
          lang
        )}۔`
      );
      if (v.driverMobile) {
        phones.push({
          label: `${v.driverName} (${v.title})`,
          phone: v.driverMobile,
          sublabel: `روانگی: ${v.departureTime} | کرایہ: ${v.fare}`,
        });
      }
      matchedItems.push({
        id: v.id,
        title: `${v.title} (${v.driverName})`,
        categoryLabel: `روانگی: ${v.departureTime} | کرایہ: ${v.fare}`,
        area: v.route,
        phone: v.driverMobile,
      });
    });

    const fullDisplay = displayLines.join('\n') + (staleness ? `\n(${staleness})` : '');
    const fullSpoken = spokenLines.join(' ') + (staleness ? ` ${staleness}` : '');

    return {
      intent: 'transport',
      displayText: fullDisplay,
      spokenText: fullSpoken,
      phoneNumbers: phones,
      matchedItems,
      stalenessNotice: staleness,
      exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
    };
  }

  // 5. Check Prayer & Mosque Timings
  if (containsAny(normQuery, rawLower, PRAYER_KEYWORDS)) {
    if (dataset.mosques.length === 0) {
      const msg = 'معاف کریں، مجھے معلوم نہیں۔ مسجد کے اوقات کا ریکارڈ موجود نہیں۔';
      return {
        intent: 'not_found',
        displayText: msg,
        spokenText: msg,
        phoneNumbers: [],
        matchedItems: [],
        exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
      };
    }

    const m = dataset.mosques[0];
    const staleness = getStalenessNotice(m.lastUpdated, nowMs);
    const phones: PhoneContactItem[] = [];
    const matchedItems: VoiceMatchedItem[] = [];
    const contactNum = m.contact || m.contactNumber;
    if (contactNum) {
      phones.push({
        label: `${m.imamName} (${m.name})`,
        phone: contactNum,
        sublabel: m.location,
      });
    }
    matchedItems.push({
      id: m.id,
      title: m.name,
      categoryLabel: `امام: ${m.imamName} | جمعہ: ${m.prayerTimes.jummah}`,
      area: m.location,
      phone: contactNum,
    });

    let specificLineDisplay = '';
    let specificLineSpoken = '';
    if (normQuery.includes('فجر') || rawLower.includes('fajr')) {
      specificLineDisplay = `نمازِ فجر کا وقت ${m.prayerTimes.fajr} ہے۔ `;
      specificLineSpoken = `نمازِ فجر کا وقت ${m.prayerTimes.fajr} ہے۔ `;
    } else if (normQuery.includes('ظہر') || rawLower.includes('zohar') || rawLower.includes('dhuhr')) {
      specificLineDisplay = `نمازِ ظہر کا وقت ${m.prayerTimes.dhuhr} ہے۔ `;
      specificLineSpoken = `نمازِ ظہر کا وقت ${m.prayerTimes.dhuhr} ہے۔ `;
    } else if (normQuery.includes('عصر') || rawLower.includes('asar') || rawLower.includes('asr')) {
      specificLineDisplay = `نمازِ عصر کا وقت ${m.prayerTimes.asr} ہے۔ `;
      specificLineSpoken = `نمازِ عصر کا وقت ${m.prayerTimes.asr} ہے۔ `;
    } else if (normQuery.includes('مغرب') || rawLower.includes('maghrib')) {
      specificLineDisplay = `نمازِ مغرب کا وقت ${m.prayerTimes.maghrib} ہے۔ `;
      specificLineSpoken = `نمازِ مغرب کا وقت ${m.prayerTimes.maghrib} ہے۔ `;
    } else if (normQuery.includes('عشا') || rawLower.includes('isha')) {
      specificLineDisplay = `نمازِ عشاء کا وقت ${m.prayerTimes.isha} ہے۔ `;
      specificLineSpoken = `نمازِ عشاء کا وقت ${m.prayerTimes.isha} ہے۔ `;
    } else if (normQuery.includes('جمعہ') || rawLower.includes('jumma')) {
      specificLineDisplay = `نمازِ جمعہ کا وقت ${m.prayerTimes.jummah} ہے۔ `;
      specificLineSpoken = `نمازِ جمعہ کا وقت ${m.prayerTimes.jummah} ہے۔ `;
    }

    const displayText =
      `${m.name} (${m.location}) میں نماز کے اوقات: ${specificLineDisplay}` +
      `فجر: ${m.prayerTimes.fajr}، ظہر: ${m.prayerTimes.dhuhr}، عصر: ${m.prayerTimes.asr}، مغرب: ${m.prayerTimes.maghrib}، عشاء: ${m.prayerTimes.isha}، جمعہ: ${m.prayerTimes.jummah}۔ امام صاحب: ${m.imamName}` +
      (contactNum ? `، فون نمبر: ${contactNum}۔` : '۔') +
      (staleness ? ` (${staleness})` : '');

    const spokenText =
      `${m.name} میں نماز کے اوقات۔ ${specificLineSpoken}` +
      `فجر ${m.prayerTimes.fajr}، ظہر ${m.prayerTimes.dhuhr}، عصر ${m.prayerTimes.asr}، مغرب ${m.prayerTimes.maghrib}، عشاء ${m.prayerTimes.isha}، اور جمعہ ${m.prayerTimes.jummah}۔` +
      (contactNum ? ` امام ${m.imamName} کا فون نمبر: ${formatPhoneDigitsForSpeech(contactNum, lang)}۔` : '') +
      (staleness ? ` ${staleness}` : '');

    return {
      intent: 'prayer',
      displayText,
      spokenText,
      phoneNumbers: phones,
      matchedItems,
      stalenessNotice: staleness,
      exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
    };
  }

  // 6. Check School & Educational Institutes
  if (containsAny(normQuery, rawLower, SCHOOL_KEYWORDS)) {
    if (dataset.institutes.length === 0) {
      const msg = 'معاف کریں، مجھے معلوم نہیں۔ سکول کے اوقات کا ریکارڈ موجود نہیں۔';
      return {
        intent: 'not_found',
        displayText: msg,
        spokenText: msg,
        phoneNumbers: [],
        matchedItems: [],
        exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
      };
    }

    const inst = dataset.institutes[0];
    const staleness = getStalenessNotice(inst.lastUpdated, nowMs);
    const phones: PhoneContactItem[] = [];
    const matchedItems: VoiceMatchedItem[] = [];
    const contactNum = inst.contact || inst.contactNumber;
    if (contactNum) {
      phones.push({
        label: `${inst.name} (${inst.headName})`,
        phone: contactNum,
        sublabel: inst.location,
      });
    }
    matchedItems.push({
      id: inst.id,
      title: inst.name,
      categoryLabel: `وقت: ${inst.timing} | سربراہ: ${inst.headName}`,
      area: inst.location,
      phone: contactNum,
    });

    const displayText =
      `🏫 ${inst.name} (${inst.location}): سکول کا وقت ${inst.timing} ہے۔ کلاسیں: ${inst.classesOffered}۔ سربراہ: ${inst.headName}۔ (پیر تا ہفتہ کھلا ہوتا ہے، اتوار کو ہفتہ وار چھٹی ہوتی ہے)۔` +
      (contactNum ? ` فون نمبر: ${contactNum}۔` : '') +
      (staleness ? ` (${staleness})` : '');

    const spokenText =
      `${inst.name} کا وقت ${inst.timing} ہے۔ کلاسیں ${inst.classesOffered} تک ہیں۔ پیر سے ہفتہ سکول کھلا رہتا ہے اور اتوار کو چھٹی ہوتی ہے۔ سربراہ ${inst.headName} ہیں۔` +
      (contactNum ? ` فون نمبر: ${formatPhoneDigitsForSpeech(contactNum, lang)}۔` : '') +
      (staleness ? ` ${staleness}` : '');

    return {
      intent: 'school',
      displayText,
      spokenText,
      phoneNumbers: phones,
      matchedItems,
      stalenessNotice: staleness,
      exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
    };
  }

  // 7. Check Doctors & Hospitals / Clinics (Prefer exact name match, then category, then area)
  if (containsAny(normQuery, rawLower, DOCTOR_KEYWORDS)) {
    const rawAvailableDoctors = dataset.profiles.filter(
      (p) => p.category === 'doctor' && isProfileAvailableToday(p)
    );
    const rankedDoctors = rankProfilesByQuery(rawAvailableDoctors, meaningfulTokens, 'doctor');

    const phones: PhoneContactItem[] = [];
    const matchedItems: VoiceMatchedItem[] = [];
    const displayParts: string[] = [];
    const spokenParts: string[] = [];
    let staleness: string | undefined;

    rankedDoctors.forEach((doc) => {
      const st = getStalenessNotice(doc.createdAt, nowMs);
      if (st && !staleness) staleness = st;

      const hours =
        doc.openingTime && doc.closingTime ? ` (اوقات: ${doc.openingTime} تا ${doc.closingTime})` : '';
      displayParts.push(
        `🩺 ${doc.name} (${doc.businessName}) ${doc.address} میں ہیں۔ آج موجود ہیں${hours}۔ فون نمبر: ${doc.mobile}۔`
      );
      spokenParts.push(
        `${doc.name}، ${doc.businessName}، ${doc.address} میں ہیں۔ آج موجود ہیں۔ فون نمبر: ${formatPhoneDigitsForSpeech(
          doc.mobile,
          lang
        )}۔`
      );
      phones.push({
        label: `${doc.name} (${doc.businessName})`,
        phone: doc.mobile,
        sublabel: doc.address,
      });
      matchedItems.push({
        id: doc.id,
        title: `${doc.name} (${doc.businessName})`,
        categoryLabel: 'ڈاکٹر و کلینک (آج موجود)',
        area: doc.address,
        phone: doc.mobile,
      });
    });

    dataset.hospitals.slice(0, 2).forEach((h) => {
      const st = getStalenessNotice(h.lastUpdated, nowMs);
      if (st && !staleness) staleness = st;

      displayParts.push(
        `🏥 ${h.name} (${h.address}): ${h.timing}۔ فون نمبر: ${h.contact}۔`
      );
      spokenParts.push(
        `${h.name}، ${h.address}۔ ${h.timing}۔ فون نمبر: ${formatPhoneDigitsForSpeech(
          h.contact,
          lang
        )}۔`
      );
      if (h.contact) {
        phones.push({
          label: h.name,
          phone: h.contact,
          sublabel: h.timing,
        });
      }
      matchedItems.push({
        id: h.id,
        title: h.name,
        categoryLabel: h.categoryUrdu || 'ہسپتال و ایمرجنسی',
        area: h.address,
        phone: h.contact,
      });
    });

    if (displayParts.length === 0) {
      const msg =
        'اس وقت کوئی ڈاکٹر آج دستیاب فہرست میں موجود نہیں ہے۔ ایمرجنسی کے لیے 1122 پر کال کریں۔';
      return {
        intent: 'doctor',
        displayText: msg,
        spokenText: 'اس وقت کوئی ڈاکٹر آج دستیاب نہیں ہے۔ ایمرجنسی کے لیے ایک ایک دو دو پر کال کریں۔',
        phoneNumbers: [{ label: 'ریسکیو 1122', phone: '1122', sublabel: 'ایمرجنسی' }],
        matchedItems: [],
        exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
      };
    }

    const displayText = displayParts.join('\n') + (staleness ? `\n(${staleness})` : '');
    const spokenText = spokenParts.join(' ') + (staleness ? ` ${staleness}` : '');

    return {
      intent: 'doctor',
      displayText,
      spokenText,
      phoneNumbers: phones,
      matchedItems,
      stalenessNotice: staleness,
      exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
    };
  }

  // 8. Check News & Announcements
  if (containsAny(normQuery, rawLower, NEWS_KEYWORDS)) {
    const events = dataset.newsEvents || [];
    const anns = dataset.announcements || [];

    if (events.length === 0 && anns.length === 0) {
      const msg = 'آج رتہ کلاں پورٹل پر کوئی نیا ہنگامی اعلان موجود نہیں ہے۔';
      return {
        intent: 'news',
        displayText: msg,
        spokenText: msg,
        phoneNumbers: [],
        matchedItems: [],
        exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
      };
    }

    const displayLines: string[] = [];
    const spokenLines: string[] = [];
    const matchedItems: VoiceMatchedItem[] = [];
    let staleness: string | undefined;

    events.slice(0, 2).forEach((ev) => {
      const st = getStalenessNotice(ev.createdAt, nowMs);
      if (st && !staleness) staleness = st;

      displayLines.push(`📢 ${ev.title} (${ev.date}، مقام: ${ev.location}): ${ev.content}`);
      spokenLines.push(`تازہ خبر: ${ev.title}۔ تاریخ ${ev.date}۔ مقام ${ev.location}۔ ${ev.content}۔`);
      matchedItems.push({
        id: ev.id,
        title: ev.title,
        categoryLabel: `تاریخ: ${ev.date}`,
        area: ev.location,
      });
    });

    if (displayLines.length === 0 && anns.length > 0) {
      const a = anns[0];
      displayLines.push(`📢 ${a.title} (${a.date}): ${a.content}`);
      spokenLines.push(`اعلان: ${a.title}۔ ${a.content}۔`);
      matchedItems.push({
        id: a.id,
        title: a.title,
        categoryLabel: a.date,
        area: 'رتہ کلاں',
      });
    }

    return {
      intent: 'news',
      displayText: displayLines.join('\n') + (staleness ? `\n(${staleness})` : ''),
      spokenText: spokenLines.join(' ') + (staleness ? ` ${staleness}` : ''),
      phoneNumbers: [],
      matchedItems,
      stalenessNotice: staleness,
      exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
    };
  }

  // 9. Check Specific Worker / Shop Categories (Rank exact name & category first, then area)
  for (const catEntry of WORKER_CATEGORY_MAP) {
    if (containsAny(normQuery, rawLower, catEntry.terms)) {
      const rawMatchingWorkers = dataset.profiles.filter(
        (p) => p.category === catEntry.category && isProfileAvailableToday(p)
      );
      const matchingWorkers = rankProfilesByQuery(
        rawMatchingWorkers,
        meaningfulTokens,
        catEntry.category
      );

      if (matchingWorkers.length === 0) {
        const msg = `معاف کریں، اس وقت کوئی ${catEntry.labelUrdu} آج دستیاب نہیں ہے۔`;
        return {
          intent: 'worker',
          displayText: msg,
          spokenText: msg,
          phoneNumbers: [],
          matchedItems: [],
          exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
        };
      }

      const phones: PhoneContactItem[] = [];
      const matchedItems: VoiceMatchedItem[] = [];
      const displayParts: string[] = [];
      const spokenParts: string[] = [];
      let staleness: string | undefined;

      matchingWorkers.slice(0, 3).forEach((w) => {
        const st = getStalenessNotice(w.createdAt, nowMs);
        if (st && !staleness) staleness = st;

        const charges = w.chargesDescription ? ` (${w.chargesDescription})` : '';
        displayParts.push(
          `✅ ${w.name} (${w.businessName}) ${w.address} میں ہیں۔ آج دستیاب ہیں${charges}۔ فون نمبر: ${w.mobile}۔`
        );
        spokenParts.push(
          `${w.name}، ${w.businessName}، ${w.address} میں ہیں۔ آج دستیاب ہیں۔ فون نمبر: ${formatPhoneDigitsForSpeech(
            w.mobile,
            lang
          )}۔`
        );
        phones.push({
          label: `${w.name} (${w.businessName})`,
          phone: w.mobile,
          sublabel: w.address,
        });
        matchedItems.push({
          id: w.id,
          title: `${w.name} (${w.businessName})`,
          categoryLabel: catEntry.labelUrdu,
          area: w.address,
          phone: w.mobile,
          badgeText: 'آج دستیاب',
        });
      });

      return {
        intent: 'worker',
        displayText: displayParts.join('\n') + (staleness ? `\n(${staleness})` : ''),
        spokenText: spokenParts.join(' ') + (staleness ? ` ${staleness}` : ''),
        phoneNumbers: phones,
        matchedItems,
        stalenessNotice: staleness,
        exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
      };
    }
  }

  // 10. Check if query is just a generic/ambiguous single word (e.g., "وقت", "نمبر", "پتہ")
  if (
    queryTokens.length === 1 &&
    AMBIGUOUS_SINGLE_WORDS.some((w) => normalizeSearchString(w) === queryTokens[0])
  ) {
    const msg = 'آپ کس چیز کے بارے میں پوچھنا چاہتے ہیں؟ نیچے بڑا بٹن دبائیں:';
    return {
      intent: 'unclear',
      displayText: msg,
      spokenText: msg,
      phoneNumbers: [],
      matchedItems: [],
      needsClarification: true,
      clarificationOptions: [
        'ڈاکٹر آج ہے؟',
        'سکول کا وقت کیا ہے؟',
        'جھنگ کی وین کب جاتی ہے؟',
        'نماز کا وقت؟',
      ],
      exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
    };
  }

  // 11. Universal Search across ALL public portal sections, profiles & entities
  // Ranks exact name & category matches first, then area (address/location), then close spellings
  const filteredSearchQuery = (meaningfulTokens.join(' ').trim() || cleanedRaw).trim();

  const rawSearchMatches = filteredSearchQuery
    ? performUniversalSearch({
        query: filteredSearchQuery,
        profiles: dataset.profiles,
        mosques: dataset.mosques,
        institutes: dataset.institutes,
        transports: dataset.transports,
        hospitals: dataset.hospitals,
        newsEvents: dataset.newsEvents,
        announcements: dataset.announcements,
        mandiRates: dataset.mandiRates,
        shelters: dataset.shelters,
        helpNotices: dataset.helpNotices,
        helpGuides: dataset.helpGuides,
        customKeywords: dataset.customKeywords,
        viewerIsSignedIn: Boolean(dataset.signedInUser),
        minScoreThreshold: 25,
      })
    : [];

  // Re-rank matches to strictly prefer exact name & category matches, then area, then close spellings
  const searchMatches = [...rawSearchMatches].sort((a, b) => {
    const scoreBoost = (item: typeof a) => {
      let boost = item.score;
      const normTitle = normalizeSearchString(item.title);
      const normSub = normalizeSearchString(item.subtitle);
      const normLoc = normalizeSearchString(item.location);
      for (const tok of meaningfulTokens) {
        if (normTitle === tok || normTitle.split(/\s+/).includes(tok)) {
          boost += 500; // Exact name match
        } else if (normTitle.includes(tok)) {
          boost += 300;
        }
        if (normSub.includes(tok)) {
          boost += 200; // Category / business match
        }
        if (normLoc.includes(tok)) {
          boost += 120; // Area match
        }
      }
      return boost;
    };
    return scoreBoost(b) - scoreBoost(a);
  });

  if (searchMatches.length > 0) {
    const topMatches = searchMatches.slice(0, 4);
    const phones: PhoneContactItem[] = [];
    const matchedItems: VoiceMatchedItem[] = [];
    const displayParts: string[] = [];
    const spokenParts: string[] = [];
    let staleness: string | undefined;

    topMatches.forEach((item) => {
      if (item.type === 'portal_action') {
        const feat = item.rawItem as PortalFeatureSearchItem;
        displayParts.push(`✨ ${feat.titleUrdu}: ${feat.descriptionUrdu}`);
        spokenParts.push(`${feat.titleUrdu}۔ ${feat.descriptionUrdu}`);
        matchedItems.push({
          id: feat.id,
          title: feat.titleUrdu,
          categoryLabel: feat.badgeUrdu,
          area: feat.descriptionUrdu,
          phone: feat.contactPhone,
          badgeText: feat.badgeUrdu,
          portalActionType: feat.actionType,
          portalActionButtonLabel: feat.buttonLabelUrdu,
        });
      } else if (item.type === 'profile') {
        const p = item.rawItem as VillageProfile;
        const st = getStalenessNotice(p.createdAt, nowMs);
        if (st && !staleness) staleness = st;
        const availToday = isProfileAvailableToday(p);
        const availLabel = availToday ? 'آج موجود ہیں' : 'اس وقت مصروف / بند';

        displayParts.push(
          `✅ ${p.name} (${p.businessName}) ${p.address} میں ہیں۔ ${availLabel}۔ فون نمبر: ${p.mobile}۔`
        );
        spokenParts.push(
          `${p.name}، ${p.businessName}، ${p.address} میں ہیں۔ ${availLabel}۔ فون نمبر: ${formatPhoneDigitsForSpeech(
            p.mobile,
            lang
          )}۔`
        );
        if (p.mobile) {
          phones.push({
            label: `${p.name} (${p.businessName})`,
            phone: p.mobile,
            sublabel: p.address,
          });
        }
        matchedItems.push({
          id: p.id,
          title: `${p.name} (${p.businessName})`,
          categoryLabel: p.category,
          area: p.address,
          phone: p.mobile,
          badgeText: availToday ? 'آج دستیاب' : 'ریکارڈ موجود',
        });
      } else {
        const phoneStr = item.contactNumber ? `۔ فون نمبر: ${item.contactNumber}۔` : '۔';
        displayParts.push(
          `📍 ${item.title} (${item.location}): ${item.subtitle}${phoneStr}`
        );
        spokenParts.push(
          `${item.title}، ${item.location}۔ ${item.subtitle}${
            item.contactNumber ? `۔ فون نمبر: ${formatPhoneDigitsForSpeech(item.contactNumber, lang)}۔` : '۔'
          }`
        );
        if (item.contactNumber) {
          phones.push({
            label: item.title,
            phone: item.contactNumber,
            sublabel: item.location,
          });
        }
        matchedItems.push({
          id: item.id,
          title: item.title,
          categoryLabel: item.categoryLabelUrdu || item.subtitle,
          area: item.location,
          phone: item.contactNumber || undefined,
          badgeText: item.categoryLabelUrdu,
        });
      }
    });

    return {
      intent: topMatches[0]?.type === 'portal_action' ? 'portal_action' : 'worker',
      displayText: displayParts.join('\n') + (staleness ? `\n(${staleness})` : ''),
      spokenText: (spokenParts[0] || '') + (staleness ? ` ${staleness}` : ''),
      phoneNumbers: phones,
      matchedItems,
      stalenessNotice: staleness,
      exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
    };
  }

  // 12. Nothing found — Say "مجھے معلوم نہیں" and show the example buttons. Never invent a number, time, or person!
  const notFoundMsg = 'معاف کریں، مجھے معلوم نہیں۔ براہ کرم نیچے دیے گئے مثال والے بٹن دبائیں۔';
  return {
    intent: 'not_found',
    displayText: notFoundMsg,
    spokenText: 'معاف کریں، مجھے معلوم نہیں۔',
    phoneNumbers: [],
    matchedItems: [],
    exampleButtons: DEFAULT_EXAMPLE_QUESTIONS,
  };
}

