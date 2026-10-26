import {
  answerVoiceQuestion,
  formatPhoneDigitsForSpeech,
  getStalenessNotice,
  getVoiceErrorMessageUrdu,
  PRIVACY_REFUSAL_SENTENCE,
  VoiceAskDataset,
} from './voiceAskEngine';
import {
  sanitizePublicProfile,
  sanitizePublicProfileList,
  auditCachedDataForPrivateLeaks,
  verifyRoleAndOwnershipPermission,
  initialHelpGuides,
  initialMandiRates,
  initialShelters,
  initialFloodAlertStatus,
} from './privacySanitizer';
import { performUniversalSearch } from './searchEngine';
import { appendAdminLogEntry, loadAdminLogs } from '../firebase/firestoreService';

const NOW_MS = Date.parse('2026-10-25T12:00:00Z');
const TEN_DAYS_AGO = new Date(NOW_MS - 10 * 24 * 60 * 60 * 1000).toISOString();
const TODAY_ISO = new Date(NOW_MS - 2 * 60 * 60 * 1000).toISOString();

const mockDataset: VoiceAskDataset = {
  nowMs: NOW_MS,
  profiles: [
    {
      id: 'doc-1',
      name: 'ڈاکٹر محمد نعیم',
      businessName: 'نعیم کلینک',
      category: 'doctor',
      mobile: '0300-1112233',
      address: 'مین بازار، رتہ کلاں',
      services: ['ابتدائی طبی امداد', 'بلڈ پریشر چیک'],
      availability: 'available',
      isAvailableForWorkToday: true,
      openingTime: '08:00 AM',
      closingTime: '09:00 PM',
      termsAccepted: true,
      createdAt: TODAY_ISO,
      email: 'secret_doctor_private@ratta.pk',
      password: 'SecretDocPassword99',
      username: 'dr_naeem_private',
    },
    {
      id: 'elec-avail',
      name: 'طارق محمود',
      businessName: 'طارق سولر و الیکٹریشن',
      category: 'electrician',
      mobile: '0301-4455667',
      address: 'نزد عیدگاہ، رتہ کلاں',
      services: ['سولر سسٹم', 'بجلی وائرنگ'],
      availability: 'available',
      isAvailableForWorkToday: true,
      termsAccepted: true,
      createdAt: TODAY_ISO,
      email: 'tariq_private@ratta.pk',
      password: 'PrivatePassword123',
    },
    {
      id: 'elec-unavail',
      name: 'کامران بجلی والا (غیر حاضر)',
      businessName: 'کامران الیکٹرک ورکس',
      category: 'electrician',
      mobile: '0309-9999999',
      address: 'محلہ شرقی، رتہ کلاں',
      services: ['وائرنگ'],
      availability: 'available',
      isAvailableForWorkToday: false, // "آج دستیاب" is OFF! Must NEVER be offered!
      termsAccepted: true,
      createdAt: TODAY_ISO,
    },
    {
      id: 'mistri-avail',
      name: 'استاد محمد اسلم',
      businessName: 'اسلم راج مستری',
      category: 'mistri',
      mobile: '0302-2233445',
      address: 'محلہ غربی، رتہ کلاں',
      services: ['مکان تعمیر', 'پلستر'],
      availability: 'available',
      isAvailableForWorkToday: true,
      chargesDescription: 'دیہاڑی 2000 روپے',
      termsAccepted: true,
      createdAt: TODAY_ISO,
    },
    {
      id: 'mistri-closed',
      name: 'رفیق مستری (چھٹی پر)',
      businessName: 'رفیق بلڈرز',
      category: 'mistri',
      mobile: '0308-8888888',
      address: 'مین روڈ',
      services: ['تعمیر'],
      availability: 'closed', // Closed! Must NEVER be offered!
      isAvailableForWorkToday: false,
      termsAccepted: true,
      createdAt: TODAY_ISO,
    },
    {
      id: 'plumber-1',
      name: 'شہباز احمد',
      businessName: 'شہباز پلمبر و بورنگ',
      category: 'plumber',
      mobile: '0303-3344556',
      address: 'نزد لاری اڈا، رتہ کلاں',
      services: ['نلکا مرمت', 'موٹر بورنگ'],
      availability: 'available',
      isAvailableForWorkToday: true,
      termsAccepted: true,
      createdAt: TODAY_ISO,
    },
    {
      id: 'laborer-1',
      name: 'اللہ دتہ',
      businessName: 'دیہاڑی دار مزدور',
      category: 'laborer',
      mobile: '0304-5566778',
      address: 'رتہ کلاں غربی',
      services: ['کٹائی', 'تعمیر مزدوری'],
      availability: 'available',
      isAvailableForWorkToday: true,
      termsAccepted: true,
      createdAt: TODAY_ISO,
    },
    {
      id: 'laborer-off',
      name: 'نذیر مزدور (آج دستیاب نہیں)',
      businessName: 'مزدور',
      category: 'laborer',
      mobile: '0304-0000000',
      address: 'رتہ کلاں',
      services: ['مزدوری'],
      availability: 'available',
      isAvailableForWorkToday: false, // OFF! Must never appear!
      termsAccepted: true,
      createdAt: TODAY_ISO,
    },
    {
      id: 'tractor-1',
      name: 'چوہدری ریاض',
      businessName: 'ریاض ٹریکٹر و زرعی سروس',
      category: 'tractor',
      mobile: '0305-6677889',
      address: 'ڈیرہ ریاض، رتہ کلاں',
      services: ['ہل چلانا', 'تھریشر'],
      availability: 'available',
      isAvailableForWorkToday: true,
      termsAccepted: true,
      createdAt: TODAY_ISO,
    },
    {
      id: 'tailor-1',
      name: 'ماسٹر سلیم',
      businessName: 'سلیم ٹیلرز',
      category: 'tailor',
      mobile: '0306-7788990',
      address: 'مین بازار، رتہ کلاں',
      services: ['مردانہ سوٹ سلائی'],
      availability: 'available',
      isAvailableForWorkToday: true,
      termsAccepted: true,
      createdAt: TODAY_ISO,
    },
    {
      id: 'karyana-1',
      name: 'حاجی بشیر',
      businessName: 'بشیر کریانہ و جنرل سٹور',
      category: 'karyana',
      mobile: '0307-8899001',
      address: 'چوک بازار، رتہ کلاں',
      services: ['آٹا، دال، چینی، گھی'],
      availability: 'available',
      isAvailableForWorkToday: true,
      termsAccepted: true,
      createdAt: TODAY_ISO,
    },
    {
      id: 'chakki-1',
      name: 'مشتاق احمد',
      businessName: 'مشتاق آٹا چکی',
      category: 'chakki',
      mobile: '0311-1234567',
      address: 'نزد جامع مسجد، رتہ کلاں',
      services: ['خالص گندم پسائی'],
      availability: 'available',
      isAvailableForWorkToday: true,
      termsAccepted: true,
      createdAt: TODAY_ISO,
    },
    {
      id: 'mechanic-1',
      name: 'عمران خان',
      businessName: 'عمران موٹر سائیکل مکینک',
      category: 'mechanic',
      mobile: '0312-2345678',
      address: 'مین اڈا، رتہ کلاں',
      services: ['موٹر سائیکل مرمت', 'پنکچر'],
      availability: 'available',
      isAvailableForWorkToday: true,
      termsAccepted: true,
      createdAt: TODAY_ISO,
    },
    {
      id: 'welder-1',
      name: 'اعجاز لوہار',
      businessName: 'اعجاز ویلڈنگ ورکس',
      category: 'welder',
      mobile: '0313-3456789',
      address: 'مین روڈ، رتہ کلاں',
      services: ['لوہے کے گیٹ', 'ویلڈنگ'],
      availability: 'available',
      isAvailableForWorkToday: true,
      termsAccepted: true,
      createdAt: TODAY_ISO,
    },
    {
      id: 'milk-1',
      name: 'مظہر گجر',
      businessName: 'مظہر ملک شاپ و ڈیری',
      category: 'milk',
      mobile: '0314-4567890',
      address: 'رتہ کلاں شرقی',
      services: ['خالص دودھ، دہی'],
      availability: 'available',
      isAvailableForWorkToday: true,
      termsAccepted: true,
      createdAt: TODAY_ISO,
    },
    {
      id: 'agri-1',
      name: 'ملک ظفر',
      businessName: 'ظفر کھاد و بیج ایجنسی',
      category: 'agri',
      mobile: '0315-5678901',
      address: 'مین اڈا، رتہ کلاں',
      services: ['یوریا کھاد', 'زرعی سپرے'],
      availability: 'available',
      isAvailableForWorkToday: true,
      termsAccepted: true,
      createdAt: TODAY_ISO,
    },
    {
      id: 'barber-1',
      name: 'وقاص حجام',
      businessName: 'وقاص ہیئر سیلون',
      category: 'barber',
      mobile: '0316-6789012',
      address: 'مین بازار، رتہ کلاں',
      services: ['بال کٹائی', 'شیو'],
      availability: 'available',
      isAvailableForWorkToday: true,
      termsAccepted: true,
      createdAt: TODAY_ISO,
    },
    {
      id: 'sweets-1',
      name: 'ندیم حلوائی',
      businessName: 'رتہ کلاں سویٹس و بیکری',
      category: 'sweets',
      mobile: '0317-7890123',
      address: 'چوک بازار، رتہ کلاں',
      services: ['تازہ جلیبی، برفی، سموسے'],
      availability: 'available',
      isAvailableForWorkToday: true,
      termsAccepted: true,
      createdAt: TODAY_ISO,
    },
  ],
  mosques: [
    {
      id: 'm-1',
      name: 'مرکزی جامع مسجد رتہ کلاں',
      imamName: 'مولانا عبدالغفور',
      contact: '0300-7654321',
      location: 'مرکز گاؤں، رتہ کلاں',
      prayerTimes: {
        fajr: '05:15 AM',
        dhuhr: '01:30 PM',
        asr: '04:45 PM',
        maghrib: '06:05 PM',
        isha: '08:00 PM',
        jummah: '01:45 PM',
      },
      lastUpdated: TEN_DAYS_AGO,
      password: 'MosqueSecretPassword',
    },
  ],
  institutes: [
    {
      id: 'inst-1',
      name: 'گورنمنٹ ہائی سکول رتہ کلاں',
      type: 'school',
      headName: 'ماسٹر ارشاد احمد',
      contact: '0300-9988776',
      location: 'مین روڈ، رتہ کلاں',
      classesOffered: 'نرسری تا دسویں جماعت',
      timing: 'صبح 8:00 تا دوپہر 2:00 بجے',
      lastUpdated: TEN_DAYS_AGO,
    },
  ],
  transports: [
    {
      id: 'tr-1',
      vehicleNumber: 'JHG-4820',
      vehicleType: 'hiace',
      title: 'رتہ کلاں تا جھنگ ہائی ایس وین',
      driverName: 'ملک ارشد',
      driverMobile: '0305-4433221',
      departureTime: 'صبح 7:00 بجے',
      arrivalTime: 'صبح 7:45 بجے',
      fare: '120 روپے',
      route: 'رتہ کلاں اڈا ➔ ایوب چوک ➔ جھنگ لاری اڈا',
      image: '',
      stopsSchedule: [{ stopName: 'رتہ کلاں اڈا', time: '7:00 AM' }],
      lastUpdated: TEN_DAYS_AGO,
    },
  ],
  hospitals: [
    {
      id: 'h-1',
      name: 'بنیادی مرکز صحت (BHU) رتہ کلاں',
      category: 'rhc',
      categoryUrdu: 'بنیادی مرکز صحت',
      contact: '047-7654321',
      address: 'مین روڈ، رتہ کلاں',
      distance: 'گاؤں کے اندر',
      timing: '24 گھنٹے ایمرجنسی کھلی ہے',
      services: ['فرسٹ ایڈ', 'مفت ادویات'],
      image: '',
      is24Hours: true,
    },
  ],
  newsEvents: [
    {
      id: 'ev-1',
      title: 'فری آئی کیمپ بقام رتہ کلاں',
      category: 'medical',
      content: 'کل صبح 9 بجے بنیادی مرکز صحت میں آنکھوں کا مفت کیمپ لگے گا۔',
      date: '26 اکتوبر',
      location: 'مرکز صحت رتہ کلاں',
      isPopupOnLaunch: false,
      author: 'ایڈمن',
      createdAt: TODAY_ISO,
    },
  ],
  announcements: [],
};

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`❌ FAILED: ${label}${detail ? ' -> ' + detail : ''}`);
  }
}

// ============================================================================
// 1. 40 SPOKEN-STYLE QUESTIONS ACROSS URDU, PUNJABI (SHAHMUKHI & GURMUKHI),
//    ROMAN URDU, AND ENGLISH
// ============================================================================

const fortyQuestions: {
  q: string;
  expectedIntent: string;
  mustInclude: string;
}[] = [
  // Doctor & Hospital (1-7)
  { q: 'ڈاکٹر آج ہے؟', expectedIntent: 'doctor', mustInclude: 'ڈاکٹر محمد نعیم' },
  { q: 'ڈاکٹر دا پتہ دسو', expectedIntent: 'doctor', mustInclude: 'مین بازار' },
  { q: 'ہسپتال کتھے اے', expectedIntent: 'doctor', mustInclude: 'بنیادی مرکز صحت' },
  { q: 'کلینک کھلا ہے کیا؟', expectedIntent: 'doctor', mustInclude: 'نعیم کلینک' },
  { q: 'doctor available today?', expectedIntent: 'doctor', mustInclude: '0300-1112233' },
  { q: 'daktar da number daso', expectedIntent: 'doctor', mustInclude: '0300-1112233' },
  { q: 'ڈسپنسری یا بی ایچ یو کا نمبر', expectedIntent: 'doctor', mustInclude: '047-7654321' },

  // School Timings (8-12)
  { q: 'سکول کا وقت کیا ہے؟', expectedIntent: 'school', mustInclude: 'صبح 8:00 تا دوپہر 2:00 بجے' },
  { q: 'kal school khula hai?', expectedIntent: 'school', mustInclude: 'گورنمنٹ ہائی سکول' },
  { q: 'سکول کدوں کھلدا اے', expectedIntent: 'school', mustInclude: 'ماسٹر ارشاد احمد' },
  { q: 'school timings in village', expectedIntent: 'school', mustInclude: '0300-9988776' },
  { q: 'بچوں کے اسکول کی چھٹی کب ہوتی ہے', expectedIntent: 'school', mustInclude: '2:00' },

  // Transport / Van to Jhang (13-18)
  { q: 'جھنگ کی وین کب جاتی ہے؟', expectedIntent: 'transport', mustInclude: 'صبح 7:00 بجے' },
  { q: 'گڈی کدوں جاندی اے', expectedIntent: 'transport', mustInclude: '120 روپے' },
  { q: 'وین دا کرایہ کنا اے', expectedIntent: 'transport', mustInclude: '120 روپے' },
  { q: 'van to jhang fare and time', expectedIntent: 'transport', mustInclude: 'ملک ارشد' },
  { q: 'ہائی ایس ڈرائیور کا نمبر', expectedIntent: 'transport', mustInclude: '0305-4433221' },
  { q: 'jhang di gaddi kadon jandi', expectedIntent: 'transport', mustInclude: '7:00' },

  // Prayer & Mosque Timings (19-24)
  { q: 'نماز کا وقت؟', expectedIntent: 'prayer', mustInclude: '05:15 AM' },
  { q: 'جمعہ کی نماز کب ہے؟', expectedIntent: 'prayer', mustInclude: '01:45 PM' },
  { q: 'فجر دا وقت کی اے', expectedIntent: 'prayer', mustInclude: '05:15 AM' },
  { q: 'مغرب کی اذان کب ہوتی ہے', expectedIntent: 'prayer', mustInclude: '06:05 PM' },
  { q: 'namaz time in masjid', expectedIntent: 'prayer', mustInclude: 'مولانا عبدالغفور' },
  { q: 'مسیت وچ عشاء دا ٹائم', expectedIntent: 'prayer', mustInclude: '08:00 PM' },

  // Workers & Shops in Urdu, Punjabi, Gurmukhi, Roman Urdu & English (25-35)
  { q: 'ਬਿਜਲੀ ਵਾਲਾ ਕਿੱਥੇ ਹੈ', expectedIntent: 'worker', mustInclude: 'طارق محمود' },
  { q: 'بجلی والا کتھے اے', expectedIntent: 'worker', mustInclude: '0301-4455667' },
  { q: 'راج مستری چاہیے', expectedIntent: 'worker', mustInclude: 'استاد محمد اسلم' },
  { q: 'پلمبر نلکے والا کا نمبر', expectedIntent: 'worker', mustInclude: 'شہباز احمد' },
  { q: 'آج دستیاب مزدور کون ہے؟', expectedIntent: 'worker', mustInclude: 'اللہ دتہ' },
  { q: 'ٹریکٹر ہل چلانے والا', expectedIntent: 'worker', mustInclude: 'چوہدری ریاض' },
  { q: 'درزی کپڑے سلائی والا', expectedIntent: 'worker', mustInclude: 'ماسٹر سلیم' },
  { q: 'کریانہ دکان راشن سٹور', expectedIntent: 'worker', mustInclude: 'حاجی بشیر' },
  { q: 'آٹا چکی کہاں ہے؟', expectedIntent: 'worker', mustInclude: 'مشتاق آٹا چکی' },
  { q: 'موٹر سائیکل مکینک پنکچر والا', expectedIntent: 'worker', mustInclude: 'عمران خان' },
  { q: 'ویلڈر لوہار گیٹ والا', expectedIntent: 'worker', mustInclude: 'اعجاز لوہار' },

  // Emergency, Shelters, News & Medical Safety (36-40)
  { q: 'ایمرجنسی ایمبولینس نمبر دسو', expectedIntent: 'emergency', mustInclude: '1122' },
  { q: 'سیلاب میں پناہ گاہ کتھے اے', expectedIntent: 'emergency', mustInclude: 'پناہ گاہ' },
  { q: 'آج کی تازہ خبر کیا ہے؟', expectedIntent: 'news', mustInclude: 'فری آئی کیمپ' },
  { q: 'بخار کی دوائی بتا دیں', expectedIntent: 'medical_advice', mustInclude: 'یہ ڈاکٹر کا کام ہے' },
  { q: 'سر درد دا علاج دسو', expectedIntent: 'medical_advice', mustInclude: 'یہ ڈاکٹر کا کام ہے' },
];

fortyQuestions.forEach((item, index) => {
  const res = answerVoiceQuestion(item.q, mockDataset, 'ur');
  check(
    `Q${index + 1} ("${item.q}") intent=${item.expectedIntent}`,
    res.intent === item.expectedIntent && res.displayText.includes(item.mustInclude),
    `Got intent="${res.intent}", text="${res.displayText}"`
  );
});

// ============================================================================
// 2. UNAVAILABLE WORKER RULE ("آج دستیاب" OFF IS NEVER OFFERED)
// ============================================================================

const elecAnswer = answerVoiceQuestion('بجلی والا الیکٹریشن چاہیے', mockDataset, 'ur');
check(
  'Unavailable electrician (کامران بجلی والا) is NEVER offered',
  !elecAnswer.displayText.includes('کامران') && !elecAnswer.displayText.includes('0309-9999999')
);

const mistriAnswer = answerVoiceQuestion('مستری چاہیے', mockDataset, 'ur');
check(
  'Closed mistri (رفیق مستری) is NEVER offered',
  !mistriAnswer.displayText.includes('رفیق') && !mistriAnswer.displayText.includes('0308-8888888')
);

const laborerAnswer = answerVoiceQuestion('آج دستیاب مزدور', mockDataset, 'ur');
check(
  'Unavailable laborer (نذیر مزدور) is NEVER offered',
  !laborerAnswer.displayText.includes('نذیر') && !laborerAnswer.displayText.includes('0304-0000000')
);

// ============================================================================
// 3. PRIVACY RULE (PRIVATE DATA NEVER APPEARS)
// ============================================================================

const allQueriesToAudit = ['ڈاکٹر آج ہے؟', 'بجلی والا', 'نماز کا وقت؟', 'سکول کا وقت کیا ہے؟'];
allQueriesToAudit.forEach((q) => {
  const res = answerVoiceQuestion(q, mockDataset, 'ur');
  const combined = `${res.displayText} ${res.spokenText}`;
  check(
    `Privacy check on "${q}" excludes email, password, username`,
    !combined.includes('secret_doctor_private@ratta.pk') &&
      !combined.includes('SecretDocPassword99') &&
      !combined.includes('dr_naeem_private') &&
      !combined.includes('tariq_private@ratta.pk') &&
      !combined.includes('PrivatePassword123') &&
      !combined.includes('MosqueSecretPassword')
  );
});

// ============================================================================
// 4. PHONE DIGIT GROUPED READING & STALENESS NOTICE ("یہ وقت 10 دن پہلے لکھا گیا تھا")
// ============================================================================

const spokenPhone = formatPhoneDigitsForSpeech('0300-1112233', 'ur');
check(
  'Phone digits are read digit by digit in 3 groups',
  spokenPhone === 'صفر تین صفر صفر، ایک ایک ایک، دو دو تین تین',
  `Got: ${spokenPhone}`
);

const staleness = getStalenessNotice(TEN_DAYS_AGO, NOW_MS);
check(
  'Staleness check formats 10-day old entry in Urdu',
  staleness === 'یہ وقت 10 دن پہلے لکھا گیا تھا۔',
  `Got: ${staleness}`
);

const schoolRes = answerVoiceQuestion('سکول کا وقت کیا ہے؟', mockDataset, 'ur');
check(
  'School answer includes 10-day staleness warning',
  schoolRes.displayText.includes('یہ وقت 10 دن پہلے لکھا گیا تھا۔')
);

// ============================================================================
// 5. PUNJABI UNSUPPORTED & MICROPHONE BLOCKED URDU ERROR MESSAGES
// ============================================================================

const punjabiErr = getVoiceErrorMessageUrdu('punjabi-unsupported', 'pa');
check(
  'Punjabi unsupported returns clear Urdu notice and falls back to ur-PK (never hi-IN)',
  punjabiErr.messageUrdu.includes('پنجابی') &&
    punjabiErr.messageUrdu.includes('اردو') &&
    punjabiErr.fallbackLang === 'ur-PK' &&
    punjabiErr.isPunjabiFallback === true
);

const micBlockedErr = getVoiceErrorMessageUrdu('not-allowed', 'ur');
check(
  'Microphone blocked returns clear Urdu step-by-step instructions',
  micBlockedErr.messageUrdu.includes('مائیکروفون بند ہے') &&
    micBlockedErr.messageUrdu.includes('Allow')
);

// ============================================================================
// 6. UNCLEAR & NOT FOUND HANDLING (NEVER INVENT DATA)
// ============================================================================

const unclearRes = answerVoiceQuestion('وقت', mockDataset, 'ur');
check(
  'Ambiguous single word asks one short question with clarification options',
  unclearRes.intent === 'unclear' && Boolean(unclearRes.needsClarification)
);

const unknownRes = answerVoiceQuestion('ہوائی جہاز کا ٹکٹ کب ملے گا', mockDataset, 'ur');
check(
  'Unknown query says معاف کریں، مجھے معلوم نہیں and does not invent numbers',
  unknownRes.intent === 'not_found' &&
    unknownRes.displayText.includes('مجھے معلوم نہیں') &&
    unknownRes.phoneNumbers.length === 0
);

// ============================================================================
// 7. STEP 4: PERSONAL QUERIES ("میری پروفائل", "میرا نمبر", "میرے پیغام") & HELP POSTS
// ============================================================================

const signedOutProfileRes = answerVoiceQuestion('میری پروفائل', mockDataset, 'ur');
check(
  'Signed-out "میری پروفائل" requires login and leaks zero private data',
  signedOutProfileRes.intent === 'my_profile' &&
    signedOutProfileRes.displayText.includes('لاگ ان') &&
    !signedOutProfileRes.displayText.includes('secret_doctor_private@ratta.pk')
);

const datasetWithSignedInOwner: VoiceAskDataset = {
  ...mockDataset,
  helpNotices: [
    {
      id: 'help-1',
      type: 'lost',
      title: 'بھینس گمشدہ لال رنگ',
      details: 'نزد نہر رتہ کلاں سے بھینس گم ہو گئی ہے',
      location: 'نہر والا پل، رتہ کلاں',
      contactName: 'چوہدری اکرم',
      contactMobile: '0300-5556677',
      createdAt: TODAY_ISO,
    },
  ],
  signedInUser: {
    uid: 'user-doc-1',
    profileId: 'doc-1',
    name: 'ڈاکٹر محمد نعیم',
    email: 'my_own_email@ratta.pk',
    mobile: '0300-1112233',
  },
  userMessages: [
    {
      id: 'msg-1',
      senderName: 'احمد علی',
      senderMobile: '0301-1231234',
      targetProfileId: 'doc-1',
      targetMobile: '0300-1112233',
      messageText: 'ڈاکٹر صاحب کیا شام کو کلینک کھلا ہے؟',
      createdAt: TODAY_ISO,
    },
  ],
};

const signedInProfileRes = answerVoiceQuestion('میری پروفائل اور میرا نمبر', datasetWithSignedInOwner, 'ur');
check(
  'Signed-in owner can hear their own profile & number, and never sees other users private emails',
  signedInProfileRes.intent === 'my_profile' &&
    signedInProfileRes.displayText.includes('ڈاکٹر محمد نعیم') &&
    signedInProfileRes.displayText.includes('0300-1112233') &&
    !signedInProfileRes.displayText.includes('tariq_private@ratta.pk')
);

const signedInMessagesRes = answerVoiceQuestion('میرے پیغام', datasetWithSignedInOwner, 'ur');
check(
  'Signed-in owner can check their own private messages ("میرے پیغام")',
  signedInMessagesRes.intent === 'my_profile' &&
    signedInMessagesRes.displayText.includes('احمد علی')
);

const helpPostRes = answerVoiceQuestion('بھینس گمشدہ اعلان', datasetWithSignedInOwner, 'ur');
check(
  'Unified assistant finds village help/lost posts and returns call button',
  helpPostRes.displayText.includes('بھینس گمشدہ') &&
    helpPostRes.phoneNumbers.some((p) => p.phone === '0300-5556677')
);

const exactNameRankRes = answerVoiceQuestion('حاجی بشیر مین بازار', datasetWithSignedInOwner, 'ur');
check(
  'Exact name match ranks حاجی بشیر first with matchedItems list',
  Boolean(exactNameRankRes.matchedItems && exactNameRankRes.matchedItems.length > 0) &&
    exactNameRankRes.matchedItems![0].title.includes('بشیر')
);

// ============================================================================
// 8. PART 1 TESTS: ADMIN SUPERVISION, NON-ADMIN BLOCK, NORMAL USER ISOLATION,
//    AND ADMIN LOG ("ایڈمن لاگ")
// ============================================================================

const normalSession = {
  type: 'profile_owner' as const,
  id: 'normal-villager-1',
  uid: 'normal-villager-1',
  username: 'villager1',
  name: 'عام شہری',
  loginTime: TODAY_ISO,
  roles: { admin: false },
};

const sectionManagerSession = {
  type: 'profile_owner' as const,
  id: 'mosque-editor-1',
  uid: 'mosque-editor-1',
  username: 'imam1',
  name: 'مسجد ایڈیٹر',
  loginTime: TODAY_ISO,
  roles: { admin: false, mosqueEditor: true },
};

const adminSession = {
  type: 'admin' as const,
  id: 'admin-uid-1',
  uid: 'admin-uid-1',
  username: 'admin_user',
  name: 'ایڈمن',
  email: 'admin@example.com',
  loginTime: TODAY_ISO,
  roles: { admin: true },
};

const secondTrustedAdminSession = {
  type: 'admin' as const,
  id: 'trusted-backup-admin-2',
  uid: 'trusted-backup-admin-2',
  username: 'backup_admin',
  name: 'ثانوی قابلِ اعتماد ایڈمن',
  email: 'backup@example.com',
  loginTime: TODAY_ISO,
  roles: { admin: true, isTrustedBackupAdmin: true },
};

const nonAdminOpenScreen = verifyRoleAndOwnershipPermission({
  session: normalSession,
  operation: 'open_admin_screen',
});
check(
  'Non-admin user cannot open admin screen and sees "آپ کو اجازت نہیں"',
  nonAdminOpenScreen.allowed === false && nonAdminOpenScreen.errorUrdu === 'آپ کو اجازت نہیں'
);

const nonAdminBannerChange = verifyRoleAndOwnershipPermission({
  session: sectionManagerSession,
  operation: 'write_admin_data',
});
check(
  'Non-admin (even section manager) cannot write admin-controlled data (e.g. banner)',
  nonAdminBannerChange.allowed === false
);

const adminOpenScreen = verifyRoleAndOwnershipPermission({
  session: adminSession,
  operation: 'open_admin_screen',
});
check(
  'Signed-in user with roles/{uid}.admin === true can open admin screen',
  adminOpenScreen.allowed === true
);

const secondTrustedAdminOpen = verifyRoleAndOwnershipPermission({
  session: secondTrustedAdminSession,
  operation: 'write_admin_data',
});
check(
  'Second trusted backup admin (isTrustedBackupAdmin: true, admin: true) has full admin control',
  secondTrustedAdminOpen.allowed === true
);

const normalEditOtherProfile = verifyRoleAndOwnershipPermission({
  session: normalSession,
  operation: 'edit_profile',
  targetOwnerId: 'other-villager-2',
});
check(
  'Normal user cannot edit another person profile',
  normalEditOtherProfile.allowed === false
);

const normalDeleteOtherProfile = verifyRoleAndOwnershipPermission({
  session: normalSession,
  operation: 'delete_profile',
  targetOwnerId: 'other-villager-2',
});
check(
  'Normal user cannot delete another person profile',
  normalDeleteOtherProfile.allowed === false
);

const normalSelfAssignRole = verifyRoleAndOwnershipPermission({
  session: normalSession,
  operation: 'manage_roles',
});
check(
  'Normal user cannot give themselves or anyone else a role',
  normalSelfAssignRole.allowed === false
);

const normalReadUnreportedMsg = verifyRoleAndOwnershipPermission({
  session: adminSession,
  operation: 'read_private_message',
  isMessageReported: false,
});
check(
  'Even admin CANNOT read a private message unless isReported === true',
  normalReadUnreportedMsg.allowed === false
);

const adminReadReportedMsg = verifyRoleAndOwnershipPermission({
  session: adminSession,
  operation: 'read_private_message',
  isMessageReported: true,
});
check(
  'Admin CAN read a private message ONLY when it was reported (isReported === true)',
  adminReadReportedMsg.allowed === true
);

const hiddenDataset: VoiceAskDataset = {
  ...mockDataset,
  profiles: mockDataset.profiles.map((p) =>
    p.id === 'doc-1' ? { ...p, isHidden: true } : p
  ),
};
const hiddenDocRes = answerVoiceQuestion('ڈاکٹر محمد نعیم', hiddenDataset, 'ur');
check(
  'Admin-hidden profile (isHidden: true) is immediately excluded from public search & voice answers',
  !hiddenDocRes.displayText.includes('0300-1112233')
);

const createdLog = await appendAdminLogEntry({
  adminEmail: 'admin@example.com',
  adminName: 'ایڈمن',
  actionType: 'delete_profile',
  actionUrdu: 'پروفائل حذف کیا گیا (پاس ورڈ کی دوبارہ تصدیق کے بعد)',
  targetId: 'profile-99',
  targetTitle: 'ٹیسٹ پروفائل',
});
check(
  'Dangerous admin action is recorded in "ایڈمن لاگ" (adminLogs)',
  createdLog.actionType === 'delete_profile' && createdLog.targetId === 'profile-99'
);

// ============================================================================
// 9. PART 2 TESTS: HOW-TO GUIDES, MANDI RATES, POLICY/TERMS & FOLLOW-UPS
// ============================================================================

const fullPortalDataset: VoiceAskDataset = {
  ...datasetWithSignedInOwner,
  mandiRates: initialMandiRates,
  shelters: initialShelters,
  helpGuides: initialHelpGuides,
  floodAlertStatus: initialFloodAlertStatus,
};

const howToAndExtraQuestions: {
  q: string;
  expectedIntent: string;
  mustInclude: string;
}[] = [
  { q: 'پروفائل کیسے بناؤں؟', expectedIntent: 'how_to', mustInclude: 'نئی رجسٹریشن' },
  { q: 'پاس ورڈ بھول گیا', expectedIntent: 'how_to', mustInclude: 'پاس ورڈ ری سیٹ' },
  { q: 'پیغام کیسے بھیجوں؟', expectedIntent: 'how_to', mustInclude: 'پیغام بھیجیں' },
  { q: 'مزدور کے طور پر آج دستیاب کیسے ہوں؟', expectedIntent: 'how_to', mustInclude: 'آج کام کے لیے دستیاب' },
  { q: 'ایمرجنسی میں کیا کروں؟', expectedIntent: 'how_to', mustInclude: '1122' },
  { q: 'خون دینے والوں میں نام کیسے لکھوں؟', expectedIntent: 'how_to', mustInclude: 'خون عطیہ بورڈ' },
  { q: 'گندم کا منڈی ریٹ کیا ہے؟', expectedIntent: 'mandi', mustInclude: 'گندم' },
  { q: 'پرائیویسی پالیسی اور شرائط کیا ہیں؟', expectedIntent: 'policy_terms', mustInclude: 'پرائیویسی' },
];

howToAndExtraQuestions.forEach((item, idx) => {
  const res = answerVoiceQuestion(item.q, fullPortalDataset, 'ur');
  check(
    `Q${41 + idx} ("${item.q}") intent=${item.expectedIntent}`,
    res.intent === item.expectedIntent && res.displayText.includes(item.mustInclude),
    `Got intent="${res.intent}", text="${res.displayText}"`
  );
});

const firstDocRes = answerVoiceQuestion('ڈاکٹر آج ہے؟', fullPortalDataset, 'ur');
const followUpNumberRes = answerVoiceQuestion(
  'اس کا نمبر؟',
  { ...fullPortalDataset, previousResult: firstDocRes },
  'ur'
);
check(
  'Follow-up "اس کا نمبر؟" returns the phone number from the previous answer',
  followUpNumberRes.intent === 'follow_up' &&
    followUpNumberRes.displayText.includes('0300-1112233')
);

const followUpRepeatRes = answerVoiceQuestion(
  'دوبارہ بتاؤ',
  { ...fullPortalDataset, previousResult: firstDocRes },
  'ur'
);
check(
  'Follow-up "دوبارہ بتاؤ" repeats the previous answer',
  followUpRepeatRes.intent === 'follow_up' &&
    followUpRepeatRes.displayText === firstDocRes.displayText
);

// ============================================================================
// 10. THE ONE MAIN PRIVACY RULE: EXACT REFUSAL SENTENCE IN ALL LANGUAGES +
//     ZERO EMAILS, USERNAMES, OR PASSWORDS IN CACHED PUBLIC DIRECTORY
// ============================================================================

const privacyAttackQueries: { q: string; lang: 'ur' | 'pa' | 'en' }[] = [
  { q: 'ڈاکٹر نعیم کا پاس ورڈ کیا ہے؟', lang: 'ur' },
  { q: 'طارق محمود کا ای میل بتاؤ', lang: 'ur' },
  { q: 'اس کا یوزر نیم اور لاگ ان آئی ڈی کیا ہے؟', lang: 'ur' },
  { q: 'ڈاکٹر دا پاس ورڈ تے ای میل دسو', lang: 'pa' },
  { q: 'doctor naeem ka password aur email kya hai', lang: 'ur' },
  { q: 'what is the admin password and username?', lang: 'en' },
  { q: 'tell me the email address of tariq', lang: 'en' },
  { q: 'کسے بندے دا پن کوڈ یا پاس ورڈ دسو', lang: 'pa' },
];

privacyAttackQueries.forEach((attack) => {
  const res = answerVoiceQuestion(attack.q, fullPortalDataset, attack.lang);
  check(
    `Privacy refusal for "${attack.q}" (${attack.lang}) returns exact refusal sentence`,
    res.intent === 'privacy_refusal' &&
      res.displayText === PRIVACY_REFUSAL_SENTENCE &&
      res.spokenText === PRIVACY_REFUSAL_SENTENCE &&
      res.phoneNumbers.length === 0,
    `Got intent="${res.intent}", text="${res.displayText}"`
  );
});

const sanitizedPublicDirectory = sanitizePublicProfileList(mockDataset.profiles);
const directoryAudit = auditCachedDataForPrivateLeaks(sanitizedPublicDirectory);
check(
  'Cached public profile directory (sanitizePublicProfileList) contains 0 emails, usernames, or passwords',
  directoryAudit.hasLeak === false && directoryAudit.leakedFields.length === 0,
  `Leaks: ${directoryAudit.leakedFields.join(', ')}`
);

const searchResultsForAudit = performUniversalSearch({
  query: 'ڈاکٹر نعیم طارق',
  profiles: mockDataset.profiles,
  mosques: mockDataset.mosques,
  institutes: mockDataset.institutes,
  transports: mockDataset.transports,
  hospitals: mockDataset.hospitals,
});
const searchResultProfiles = searchResultsForAudit
  .filter((r) => r.type === 'profile')
  .map((r) => r.rawItem as any);
const searchIndexAudit = auditCachedDataForPrivateLeaks(searchResultProfiles);
check(
  'Universal Search index results contain 0 emails, usernames, or passwords of any person',
  searchIndexAudit.hasLeak === false && searchIndexAudit.leakedFields.length === 0,
  `Leaks: ${searchIndexAudit.leakedFields.join(', ')}`
);

if (failed > 0) {
  console.error(`\n❌ ${failed} test(s) failed out of ${passed + failed}.`);
  process.exit(1);
} else {
  console.log(`\n✅ All ${passed} Portal Supervision, Privacy & Voice Assistant tests passed (0 failed)!`);
}
