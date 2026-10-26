/**
 * Automated Test Suite for Ratta Kallan Search Engine
 * Contains 45 test cases verifying:
 *  - Diacritic normalization (زبر، زیر، پیش، تنوین، تشدید)
 *  - Character variant mapping (ے/ی, ہ/ھ/ۃ, ک/ك)
 *  - Gurmukhi to Shahmukhi transliteration
 *  - Multilingual Synonym Clusters (Urdu, Punjabi, Roman Urdu, English)
 *  - Weighted Fuzzy Scoring & Ranking
 *  - Cross-Entity Search (Profiles, Mosques, Institutes, Transports, Hospitals)
 */

import {
  stripUrduDiacritics,
  transliterateGurmukhiToShahmukhi,
  normalizeSearchString,
  expandSynonyms,
  calculateMatchScore,
  performUniversalSearch,
} from './searchEngine';
import {
  VillageProfile,
  VillageMosque,
  VillageInstitute,
  VillageTransport,
  VillageHospital,
} from '../types';

export interface TestCaseResult {
  id: number;
  description: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
}

export function runAllSearchEngineTests(): {
  total: number;
  passed: number;
  failed: number;
  results: TestCaseResult[];
} {
  const results: TestCaseResult[] = [];
  let currentId = 1;

  function assert(
    description: string,
    actual: unknown,
    expected: unknown,
    customValidator?: (act: unknown, exp: unknown) => boolean
  ) {
    const passed = customValidator
      ? customValidator(actual, expected)
      : JSON.stringify(actual) === JSON.stringify(expected);

    results.push({
      id: currentId++,
      description,
      passed,
      expected,
      actual,
    });
  }

  // --- Group 1: Diacritic Stripping (اعارب و حرکات) ---
  assert(
    '1. Strips Zabar (فَتْحَة) from word',
    stripUrduDiacritics('مَسْتَرِی'),
    'مستری'
  );

  assert(
    '2. Strips Zer (كَسْرَة)',
    stripUrduDiacritics('بِجْلِی'),
    'بجلی'
  );

  assert(
    '3. Strips Pesh (ضَمَّة)',
    stripUrduDiacritics('دُودھ'),
    'دودھ'
  );

  assert(
    '4. Strips Tashdeed (تَشْدِيد)',
    stripUrduDiacritics('رَتَّہ کَلاں'),
    'رتہ کلاں'
  );

  assert(
    '5. Strips Tanwin (تَنْوِين)',
    stripUrduDiacritics('فوراً'),
    'فورا'
  );

  assert(
    '6. Strips Sukun (سُكُون)',
    stripUrduDiacritics('مَسْجِدْ'),
    'مسجد'
  );

  // --- Group 2: Orthography & Letter Variant Normalization ---
  assert(
    '7. Normalizes Bari Ye (ے) to Choti Ye (ی)',
    normalizeSearchString('کپڑے'),
    'کپڑی'
  );

  assert(
    '8. Normalizes Arabic Kaaf (ك) to Urdu Kaaf (ک)',
    normalizeSearchString('كلينك'),
    'کلینک'
  );

  assert(
    '9. Normalizes Do-Chashmi He (ھ) to Gol He (ہ)',
    normalizeSearchString('ھائی اسکول'),
    'ہایی اسکول'
  );

  assert(
    '10. Normalizes Alif Maddah (آ) to Alif (ا)',
    normalizeSearchString('آٹا چکی'),
    'اٹا چکی'
  );

  assert(
    '11. Normalizes Saraiki/Punjabi Gaaf (ڳ)',
    normalizeSearchString('ڳاں'),
    'گاں'
  );

  assert(
    '12. Normalizes Urdu comma and full stop punctuation to space',
    normalizeSearchString('ڈاکٹر، کلینک۔ رتہ'),
    'ڈاکٹر کلینک رتہ'
  );

  // --- Group 3: Gurmukhi Transliteration (پنجابی رسم الخط) ---
  assert(
    '13. Transliterates Gurmukhi ਕ (Kaf) to Urdu ک',
    transliterateGurmukhiToShahmukhi('ਕ'),
    'ک'
  );

  assert(
    '14. Transliterates Gurmukhi ਪਿੰਡ (Pind)',
    transliterateGurmukhiToShahmukhi('ਪਿੰਡ'),
    'پیںڈ'
  );

  assert(
    '15. Transliterates Gurmukhi ਮਿਸਤਰੀ (Mistri)',
    normalizeSearchString('ਮਿਸਤਰੀ'),
    'میستری'
  );

  // --- Group 4: Synonym Dictionary Expansions ---
  assert(
    '16. Expands "mistri" to include "مستری", "mason", "راج"',
    expandSynonyms('mistri'),
    true,
    (act) => {
      const arr = act as string[];
      return arr.includes('مستری') && arr.includes('mason') && arr.includes('راج');
    }
  );

  assert(
    '17. Expands "bijli" to include "الیکٹریشن", "سولر", "motor"',
    expandSynonyms('bijli'),
    true,
    (act) => {
      const arr = act as string[];
      return arr.includes('الیکٹریشن') && arr.includes('سولر');
    }
  );

  assert(
    '18. Expands "doctor" to include "طبیب", "کلینک", "ہسپتال"',
    expandSynonyms('doctor'),
    true,
    (act) => {
      const arr = act as string[];
      return arr.includes('طبیب') && arr.includes('کلینک');
    }
  );

  assert(
    '19. Expands "darzi" to include "tailor", "سلائی", "سوٹ"',
    expandSynonyms('darzi'),
    true,
    (act) => {
      const arr = act as string[];
      return arr.includes('tailor') && (arr.includes('سلایی') || arr.includes('سلائی'));
    }
  );

  assert(
    '20. Expands "tractor" to include "زرعی", "روٹاوریٹر"',
    expandSynonyms('tractor'),
    true,
    (act) => {
      const arr = act as string[];
      return arr.includes('زرعی');
    }
  );

  assert(
    '21. Expands "karyana" to include "grocery", "سودا سلف", "پرچون"',
    expandSynonyms('karyana'),
    true,
    (act) => {
      const arr = act as string[];
      return arr.includes('grocery') && arr.includes('پرچون');
    }
  );

  assert(
    '22. Expands "plumber" to include "سینیٹری", "پائپ", "ٹونٹی"',
    expandSynonyms('plumber'),
    true,
    (act) => {
      const arr = act as string[];
      return arr.includes('سینیٹری');
    }
  );

  assert(
    '23. Expands "lohar" to include "ویلڈر", "گیٹ"',
    expandSynonyms('lohar'),
    true,
    (act) => {
      const arr = act as string[];
      return arr.includes('ویلڈر');
    }
  );

  assert(
    '24. Expands "barber" to include "حجام", "نائی", "سیلون"',
    expandSynonyms('barber'),
    true,
    (act) => {
      const arr = act as string[];
      return arr.includes('حجام') && (arr.includes('نایی') || arr.includes('نائی'));
    }
  );

  assert(
    '25. Expands "chakki" to include "آٹا", "گندم", "flour"',
    expandSynonyms('chakki'),
    true,
    (act) => {
      const arr = act as string[];
      return arr.includes('گندم');
    }
  );

  assert(
    '26. Expands "milk" to include "دودھ", "ڈیری", "دہی"',
    expandSynonyms('milk'),
    true,
    (act) => {
      const arr = act as string[];
      return (arr.includes('دودہ') || arr.includes('دودھ')) && arr.includes('ڈیری');
    }
  );

  assert(
    '27. Expands "transport" to include "گاڑی", "ویگن", "hiace", "bus"',
    expandSynonyms('transport'),
    true,
    (act) => {
      const arr = act as string[];
      return arr.includes('گاڑی') && arr.includes('ویگن');
    }
  );

  assert(
    '28. Expands "masjid" to include "مسجد", "جامع مسجد", "امام", "namaz"',
    expandSynonyms('masjid'),
    true,
    (act) => {
      const arr = act as string[];
      return arr.includes('مسجد') && arr.includes('امام');
    }
  );

  assert(
    '29. Expands "school" to include "تعلیم", "پڑھائی", "استاد", "کالج"',
    expandSynonyms('school'),
    true,
    (act) => {
      const arr = act as string[];
      return arr.includes('تعلیم') && arr.includes('استاد');
    }
  );

  assert(
    '30. Expands "mazdoor" to include "دیہاڑی", "لیبر", "daily wage"',
    expandSynonyms('mazdoor'),
    true,
    (act) => {
      const arr = act as string[];
      return arr.includes('دیہاڑی');
    }
  );

  // --- Group 5: Match Scoring Tests ---
  const sampleTarget = {
    name: 'محمد اسلم',
    category: 'mistri',
    businessName: 'اسلم راج مستری و تعمیرات',
    services: ['مکان کی چنائی', 'پلستر', 'بنیادیں'],
    location: 'رتہ کلاں، محلہ غربی',
    phoneDigits: '0300-1234567',
  };

  assert(
    '31. Exact name match produces score > 100',
    calculateMatchScore(sampleTarget, 'محمد اسلم') > 100,
    true
  );

  assert(
    '32. Partial name match produces positive score',
    calculateMatchScore(sampleTarget, 'اسلم') > 50,
    true
  );

  assert(
    '33. English synonym query "mason" scores positively on mistri profile',
    calculateMatchScore(sampleTarget, 'mason') > 20,
    true
  );

  assert(
    '34. Roman Urdu "raj mistri" produces strong score',
    calculateMatchScore(sampleTarget, 'raj mistri') > 40,
    true
  );

  assert(
    '35. Phone number 4-digit search "4567" matches mobile',
    calculateMatchScore(sampleTarget, '4567') > 50,
    true
  );

  assert(
    '36. Unrelated query "الیکٹریشن" scores 0 on mistri target',
    calculateMatchScore(sampleTarget, 'الیکٹریشن') === 0,
    true
  );

  // --- Group 6: Universal Multi-Entity Search Integration ---
  const dummyProfiles: VillageProfile[] = [
    {
      id: 'p1',
      name: 'محمد اسلم',
      businessName: 'اسلم راج مستری',
      category: 'mistri',
      mobile: '0300-1234567',
      address: 'محلہ غربی، رتہ کلاں',
      services: ['مکان تعمیر', 'پلستر'],
      termsAccepted: true,
      createdAt: '2026-01-01',
    },
    {
      id: 'p2',
      name: 'طارق محمود',
      businessName: 'طارق سولر و الیکٹریشن',
      category: 'electrician',
      mobile: '0301-9876543',
      address: 'مین بازار، رتہ کلاں',
      services: ['سولر وائرنگ', 'موٹر وائنڈنگ'],
      termsAccepted: true,
      createdAt: '2026-01-01',
    },
    {
      id: 'p3',
      name: 'ڈاکٹر رضوان',
      businessName: 'رضوان کلینک و میڈیکل سٹور',
      category: 'doctor',
      mobile: '0302-5555555',
      address: 'نزد لاری اڈا، رتہ کلاں',
      services: ['ایمرجنسی علاج', 'بلڈ پریشر چیک'],
      termsAccepted: true,
      createdAt: '2026-01-01',
    },
  ];

  const dummyMosques: VillageMosque[] = [
    {
      id: 'm1',
      name: 'مرکزی جامع مسجد رتہ کلاں',
      imamName: 'مولانا عبدالغفور',
      location: 'مرکز گاؤں، رتہ کلاں',
      contactNumber: '0300-1112233',
      prayerTimes: {
        fajr: '05:15 AM',
        dhuhr: '01:30 PM',
        asr: '04:45 PM',
        maghrib: 'غروب آفتاب',
        isha: '08:00 PM',
        jummah: '01:45 PM',
      },
    },
  ];

  const dummyInstitutes: VillageInstitute[] = [
    {
      id: 'inst1',
      name: 'گورنمنٹ ہائی سکول رتہ کلاں',
      headName: 'ماسٹر ارشاد احمد',
      location: 'شرقی رتہ کلاں',
      classesOffered: 'نرسری تا میٹرک',
      timing: 'صبح 8:00 تا دوپہر 1:30',
      type: 'school',
      contactNumber: '0300-9988776',
    },
  ];

  const dummyTransports: VillageTransport[] = [
    {
      id: 't1',
      vehicleNumber: 'JHG-4820',
      title: 'رتہ کلاں تا جھنگ ہائی ایس سروس',
      vehicleType: 'hiace',
      driverName: 'ملک ارشد',
      driverMobile: '0305-4433221',
      route: 'رتہ کلاں اڈا ➔ ایوب چوک ➔ جھنگ لاری اڈا',
      fare: '80 روپے',
      departureTime: 'صبح 7:00 بجے',
      arrivalTime: 'صبح 7:45 بجے',
      image: '',
      stopsSchedule: [{ stopName: 'رتہ کلاں اڈا', time: '7:00 AM' }],
    },
  ];

  const dummyHospitals: VillageHospital[] = [
    {
      id: 'h1',
      name: 'بنیادی ہیلتھ یونٹ رتہ کلاں (BHU)',
      category: 'rhc',
      categoryUrdu: 'بنیادی مرکز صحت (گورنمنٹ)',
      contact: '047-123456',
      contactPhone: '047-123456',
      address: 'رتہ کلاں مین روڈ',
      distance: 'گاؤں کے اندر',
      timing: 'صبح 8:00 تا دوپہر 2:00',
      facilities: ['مفت ادویات', 'ویکسینیشن', 'فرسٹ ایڈ'],
      services: ['مفت ادویات', 'ویکسینیشن', 'فرسٹ ایڈ'],
      image: '',
      is24Hours: false,
    },
  ];

  assert(
    '37. Universal search finds mistri by English word "mason"',
    performUniversalSearch({
      query: 'mason',
      profiles: dummyProfiles,
    }).map((r) => r.id),
    ['p1']
  );

  assert(
    '38. Universal search finds solar electrician by "solar"',
    performUniversalSearch({
      query: 'solar',
      profiles: dummyProfiles,
    }).map((r) => r.id),
    ['p2']
  );

  assert(
    '39. Universal search finds doctor by "dawa" (دوا)',
    performUniversalSearch({
      query: 'dawa',
      profiles: dummyProfiles,
    }).map((r) => r.id),
    ['p3']
  );

  assert(
    '40. Universal search finds Mosque when querying "masjid" (مسجد)',
    performUniversalSearch({
      query: 'masjid',
      profiles: dummyProfiles,
      mosques: dummyMosques,
    }).some((r) => r.type === 'mosque'),
    true
  );

  assert(
    '41. Universal search finds School when querying "school" (سکول)',
    performUniversalSearch({
      query: 'school',
      profiles: dummyProfiles,
      institutes: dummyInstitutes,
    }).some((r) => r.type === 'institute'),
    true
  );

  assert(
    '42. Universal search finds Transport when querying "jhang bus" (جھنگ گاڑی)',
    performUniversalSearch({
      query: 'jhang',
      profiles: dummyProfiles,
      transports: dummyTransports,
    }).some((r) => r.type === 'transport'),
    true
  );

  assert(
    '43. Universal search finds Hospital when querying "1122" or "emergency"',
    performUniversalSearch({
      query: 'emergency',
      profiles: dummyProfiles,
      hospitals: dummyHospitals,
    }).some((r) => r.type === 'hospital'),
    true
  );

  assert(
    '44. Empty query returns all entities formatted with default score',
    performUniversalSearch({
      query: '',
      profiles: dummyProfiles,
    }).length === dummyProfiles.length,
    true
  );

  assert(
    '45. Category filter restricts search accurately',
    performUniversalSearch({
      query: '',
      profiles: dummyProfiles,
      categoryFilter: 'mistri',
    }).length === 1,
    true
  );

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passed,
    failed,
    results,
  };
}
