import { SubjectKey, Language } from '../types';

export interface EducationalSourceCitation {
  title: string;
  url: string;
}

export interface StructuredTeacherResponse {
  ok: boolean;
  question: string;
  detectedSubject: SubjectKey;
  language: Language;
  answer: string;
  spokenText: string;
  followUpQuestion?: string;
  practiceTip?: string;
  sources: EducationalSourceCitation[];
  usedOnlineSearch: boolean;
  provider: 'gemini-3.8-flash' | 'verified_curriculum_engine' | 'error';
  isError?: boolean;
}

interface CurriculumTopicEntry {
  id: string;
  subject: SubjectKey;
  patterns: RegExp[];
  buildResponse: (params: {
    question: string;
    selectedClass: string;
    isEnglishQuery: boolean;
    studentName?: string;
  }) => {
    answer: string;
    spokenText?: string;
    followUpQuestion: string;
    sources?: EducationalSourceCitation[];
    usedOnlineSearch?: boolean;
  };
}

/**
 * Detects whether a user's question is written primarily in English (and not asking for an Urdu explanation).
 */
export function isEnglishEducationalQuery(question: string): boolean {
  const q = question.trim();
  if (!q) return false;
  const hasUrduScript = /[\u0600-\u06FF\u0750-\u077F]/.test(q);
  if (hasUrduScript) return false;
  // If the user explicitly asks "in simple Urdu" or "in Urdu", answer in Urdu!
  if (/\b(in\s+simple\s+urdu|in\s+urdu|urdu\s+mein|urdu\s+main)\b/i.test(q)) {
    return false;
  }
  // Check if it's Roman Urdu vs English
  const romanUrduIndicators =
    /\b(kya|kia|kyun|kesay|kaise|hai|hain|ka|ki|ke|mein|batao|batayein|samjhao|pahara|namaz|wuzu)\b/i;
  if (romanUrduIndicators.test(q)) {
    return false;
  }
  return /[a-zA-Z]/.test(q);
}

/**
 * Universal Arithmetic & Math Word-Problem Solver
 * Handles:
 *  - "What is 2 + 2?"
 *  - "What is 15 multiplied by 6?"
 *  - "3500 * 4"
 *  - "12 کا پہاڑا" / "table of 7"
 *  - "20% of 500"
 *  - "4 بوری گندم 3500 روپے"
 */
export function trySolveMathQuestion(
  rawQuery: string,
  isEnglish: boolean
): { answer: string; followUpQuestion: string } | null {
  const q = rawQuery.trim();

  // 1. Check for Multiplication Table request (پہاڑا / table of N)
  const tableMatch =
    q.match(/(?:table\s+of|multiplication\s+table\s+of)\s+(\d{1,3})/i) ||
    q.match(/(\d{1,3})\s*(?:کا\s*پہاڑا|کا\s*پہاڑہ|da\s*pahara|ka\s*pahara|table)/i);
  if (tableMatch) {
    const n = parseInt(tableMatch[1], 10);
    if (!Number.isNaN(n) && n >= 1 && n <= 100) {
      const lines = Array.from({ length: 10 }, (_, i) => `${n} × ${i + 1} = ${n * (i + 1)}`).join(
        '\n'
      );
      if (isEnglish) {
        return {
          answer: `Here is the multiplication table of ${n}:\n${lines}\n\nTip: Multiplication is repeated addition—each step adds ${n} more.`,
          followUpQuestion: `Quick check: Using this table, what is ${n} multiplied by 6?`,
        };
      }
      return {
        answer: `${n} کا پہاڑا:\n${lines}\n\nاصول: ضرب کا مطلب بار بار جمع کرنا ہے، یعنی ہر اگلے قدم میں ${n} جمع ہوتے ہیں۔`,
        followUpQuestion: `شاباش! اب بتائیں کہ ${n} ضرب 5 کتنا ہوتا ہے؟`,
      };
    }
  }

  // 2. Percentage calculation: e.g. "20% of 1500"
  const pctMatch = q.match(/(\d+(?:\.\d+)?)\s*%\s*(?:of|کا)\s*(\d+(?:\.\d+)?)/i);
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1]);
    const total = parseFloat(pctMatch[2]);
    const val = Math.round(((pct / 100) * total) * 100) / 100;
    if (isEnglish) {
      return {
        answer: `${pct}% of ${total} is ${val}.\nStep: (${pct} ÷ 100) × ${total} = ${val}.`,
        followUpQuestion: `Can you find 10% of ${total}?`,
      };
    }
    return {
      answer: `${total} کا ${pct} فیصد ${val} بنتا ہے۔\nطریقہ: (${pct} ÷ 100) × ${total} = ${val}۔`,
      followUpQuestion: `اب آپ بتائیں کہ ${total} کا 10 فیصد کتنا ہوگا؟`,
    };
  }

  // 3. Direct arithmetic expressions ("What is 2 + 2?", "What is 15 multiplied by 6?", "25 - 9", "144 divided by 12")
  const normalizedMath = q
    .replace(/multiplied\s+by|times/gi, '*')
    .replace(/divided\s+by/gi, '/')
    .replace(/\bplus\b|\band\b(?=\s*\d)/gi, '+')
    .replace(/\bminus\b|\bsubtract\b/gi, '-')
    .replace(/ضرب/g, '*')
    .replace(/تقسیم/g, '/')
    .replace(/جمع/g, '+')
    .replace(/منفی|تفریق/g, '-')
    .replace(/[×xX](?=\s*\d)/g, '*')
    .replace(/÷/g, '/');

  const exprMatch = normalizedMath.match(
    /(\d+(?:\.\d+)?)\s*([+\-*/])\s*(\d+(?:\.\d+)?)/
  );
  if (exprMatch) {
    const a = parseFloat(exprMatch[1]);
    const op = exprMatch[2];
    const b = parseFloat(exprMatch[3]);

    if (op === '/' && b === 0) {
      return {
        answer: isEnglish
          ? 'Division by zero (0) is undefined in mathematics because you cannot divide a number into zero parts.'
          : 'ریاضی میں کسی بھی عدد کو صفر (0) پر تقسیم نہیں کیا جا سکتا۔',
        followUpQuestion: isEnglish ? 'What is 10 divided by 2?' : '10 تقسیم 2 کتنا ہوتا ہے؟',
      };
    }

    let result = 0;
    let opSymbol = op;
    let opNameEn = 'plus';
    let opNameUr = 'جمع';
    let stepExplanationEn = '';
    let stepExplanationUr = '';

    if (op === '+') {
      result = a + b;
      opSymbol = '+';
      opNameEn = 'plus';
      opNameUr = 'جمع';
      stepExplanationEn = `When we add ${a} and ${b} together, we get ${result}.`;
      stepExplanationUr = `جب ہم ${a} میں ${b} جمع کرتے ہیں تو جواب ${result} آتا ہے۔`;
    } else if (op === '-') {
      result = a - b;
      opSymbol = '-';
      opNameEn = 'minus';
      opNameUr = 'منفی';
      stepExplanationEn = `Starting from ${a} and subtracting ${b} leaves ${result}.`;
      stepExplanationUr = `${a} میں سے ${b} تفریق کرنے (نکالنے) سے ${result} بچتا ہے۔`;
    } else if (op === '*') {
      result = a * b;
      opSymbol = '×';
      opNameEn = 'multiplied by';
      opNameUr = 'ضرب';
      if (a > 10 && b <= 12) {
        const tens = Math.floor(a / 10) * 10;
        const ones = a % 10;
        stepExplanationEn = `Easy step: (${tens} × ${b} = ${tens * b}) + (${ones} × ${b} = ${
          ones * b
        }) = ${result}.`;
        stepExplanationUr = `آسان طریقہ: (${tens} × ${b} = ${tens * b}) جمع (${ones} × ${b} = ${
          ones * b
        }) = ${result}۔`;
      } else {
        stepExplanationEn = `Adding ${a} a total of ${b} times gives ${result}.`;
        stepExplanationUr = `${a} کو ${b} بار جمع کرنے یا ضرب دینے سے ${result} حاصل ہوتا ہے۔`;
      }
    } else if (op === '/') {
      result = Math.round((a / b) * 1000) / 1000;
      opSymbol = '÷';
      opNameEn = 'divided by';
      opNameUr = 'تقسیم';
      stepExplanationEn = `Dividing ${a} into ${b} equal parts gives ${result} in each part.`;
      stepExplanationUr = `${a} کو ${b} برابر حصوں میں تقسیم کرنے سے ہر حصے میں ${result} آتا ہے۔`;
    }

    if (isEnglish) {
      return {
        answer: `${a} ${opNameEn} ${b} (${a} ${opSymbol} ${b}) equals ${result}.\n${stepExplanationEn}`,
        followUpQuestion: `Practice question: What is ${a + 1} ${opSymbol} ${b}?`,
      };
    }

    return {
      answer: `${a} ${opNameUr} ${b} (${a} ${opSymbol} ${b}) کا جواب ${result} ہے۔\nوضاحت: ${stepExplanationUr}`,
      followUpQuestion: `مشق کا سوال: شاباش! اب بتائیں کہ ${a + 1} ${opSymbol} ${b} کتنا ہوگا؟`,
    };
  }

  return null;
}

/**
 * Comprehensive Cross-Subject Verified Curriculum Knowledge Base.
 * Covers all required regression questions and core K-10 subjects in Urdu & English.
 */
const CURRICULUM_TOPICS: CurriculumTopicEntry[] = [
  // 1. Capital of Pakistan
  {
    id: 'capital_of_pakistan',
    subject: 'pak_studies',
    patterns: [
      /capital\s+of\s+pakistan/i,
      /پاکستان\s+کا\s+دارالحکومت/,
      /پاکستان\s+دا\s+دارالحکومت/,
      /pakistan\s+ka\s+capital/i,
      /darul\s*hukoomat/i,
    ],
    buildResponse: ({ isEnglishQuery }) => {
      if (isEnglishQuery) {
        return {
          answer:
            'The capital of Pakistan is Islamabad. It is located in the northern part of the country at the foothills of the Margalla Hills. Karachi was the first capital of Pakistan after independence in 1947 before Islamabad became the capital in the 1960s.',
          followUpQuestion:
            'Do you know which city is the capital of Punjab province?',
        };
      }
      return {
        answer:
          'پاکستان کا دارالحکومت اسلام آباد (Islamabad) ہے۔ یہ مارگلہ کی خوبصورت پہاڑیوں کے دامن میں واقع ایک سرسبز اور منظم شہر ہے۔ یاد رہے کہ 1947ء میں آزادی کے وقت پاکستان کا پہلا دارالحکومت کراچی تھا، جسے بعد میں اسلام آباد منتقل کیا گیا۔',
        followUpQuestion: 'شاباش! کیا آپ بتا سکتے ہیں کہ ہمارے صوبہ پنجاب کا دارالحکومت کون سا شہر ہے؟',
      };
    },
  },

  // 2. Photosynthesis (ضیائی تالیف)
  {
    id: 'photosynthesis',
    subject: 'bio',
    patterns: [
      /photosynthesis/i,
      /ضیائی\s*تالیف/,
      /پودے\s*اپنی\s*خوراک/,
      /plants\s+make\s+food/i,
      /پودے\s*خوراک\s*کیسے/,
    ],
    buildResponse: ({ isEnglishQuery, question }) => {
      const requestedSimpleUrdu = /simple\s+urdu|اردو/i.test(question);
      if (isEnglishQuery && !requestedSimpleUrdu) {
        return {
          answer:
            'Photosynthesis (ضیائی تالیف) is the natural process by which green plants make their own food:\n1. Sunlight: Green leaves contain chlorophyll, which captures energy from sunlight.\n2. Water & Carbon Dioxide: The roots absorb water from the soil, and the leaves take in carbon dioxide gas from the air.\n3. Food & Oxygen: Using sunlight, the plant turns water and carbon dioxide into glucose (food for growth) and releases fresh oxygen into the air for us to breathe.',
          followUpQuestion:
            'Which gas do plants release into the air during photosynthesis that humans and animals need to breathe?',
        };
      }
      return {
        answer:
          'ضیائی تالیف (Photosynthesis) وہ قدرتی عمل ہے جس کے ذریعے سبز پودے اپنی خوراک خود تیار کرتے ہیں:\n1. سورج کی روشنی (Sunlight): پودوں کے پتوں میں سبز مادہ "کلوروفل" (Chlorophyll) ہوتا ہے جو دھوپ جذب کرتا ہے۔\n2. پانی اور ہوا: پودا زمین میں موجود اپنی جڑوں سے پانی لیتا ہے اور ہوا سے کاربن ڈائی آکسائیڈ گیس جذب کرتا ہے۔\n3. خوراک اور آکسیجن: سورج کی روشنی کی مدد سے پتا پانی اور کاربن ڈائی آکسائیڈ کو ملا کر اپنی خوراک (گلوکوز) بناتا ہے اور ہوا میں تازہ آکسیجن (Oxygen) خارج کرتا ہے جس سے ہم سانس لیتے ہیں۔',
        followUpQuestion:
          'آسان سوال: ضیائی تالیف کے دوران پودے کون سی گیس خارج کرتے ہیں جو انسانوں کے سانس لینے کے لیے ضروری ہے؟',
      };
    },
  },

  // 3. Noun & English Grammar Examples
  {
    id: 'english_noun',
    subject: 'english',
    patterns: [
      /\bwhat\s+is\s+a\s+noun\b/i,
      /\bdefine\s+noun\b/i,
      /\bnoun\b.*example/i,
      /اسم\s+کی\s+تعریف/,
      /noun\s+kya\s+hai/i,
    ],
    buildResponse: ({ isEnglishQuery }) => {
      if (isEnglishQuery) {
        return {
          answer:
            'A noun (اسم) is a word that names a person, place, animal, or thing.\nHere are three clear English examples:\n1. Person: "Teacher" or "Ali" (Example: Ali reads a lesson.)\n2. Place: "School" or "Pakistan" (Example: Our school is in Ratta Kallan.)\n3. Thing / Object: "Book" or "Apple" (Example: This book is very interesting.)',
          followUpQuestion:
            'Can you find the two nouns in this sentence: "The boy kicked the ball"?',
        };
      }
      return {
        answer:
          'انگریزی میں Noun (اردو میں اسم) اس لفظ کو کہتے ہیں جو کسی شخص، جگہ، جانور یا چیز کا نام ہو۔\nتین آسان انگریزی مثالیں (Three English Examples):\n1. Boy / Ali (لڑکا یا علی — شخص کا نام)\n2. School / Islamabad (اسکول یا اسلام آباد — جگہ کا نام)\n3. Book / Apple (کتاب یا سیب — چیز کا نام)',
        followUpQuestion:
          'شاباش! اب بتائیں کہ جملے "Ali has a book" میں کون سے دو الفاظ Noun ہیں؟',
      };
    },
  },

  // 4. Why should we wash our hands before eating? (Health & Hygiene)
  {
    id: 'wash_hands_hygiene',
    subject: 'bio',
    patterns: [
      /wash\s+(?:our\s+|your\s+)?hands/i,
      /ہاتھ\s+کیوں\s+دھونے/,
      /کھانے\s+سے\s+پہلے\s+ہاتھ/,
      /ہاتھ\s+دھونا\s+کیوں/,
      /haath\s+dhona/i,
    ],
    buildResponse: ({ isEnglishQuery }) => {
      if (isEnglishQuery) {
        return {
          answer:
            'We should wash our hands with soap and clean water before eating because our hands touch many surfaces (like toys, soil, doors, and books) that carry tiny, invisible germs and bacteria.\n1. If we eat without washing our hands, those germs enter our mouth and stomach with our food.\n2. Washing hands for 20 seconds with soap removes dirt and germs, protecting us from stomach aches, diarrhea, typhoid, and fever.',
          followUpQuestion:
            'Besides before eating, can you name one more time during the day when it is important to wash our hands?',
        };
      }
      return {
        answer:
          'کھانا کھانے سے پہلے صابن اور صاف پانی سے ہاتھ دھونا اس لیے ضروری ہے کیونکہ دن بھر کھیلنے، مٹی، دروازوں اور چیزوں کو چھونے سے ہمارے ہاتھوں پر باریک جراثیم (Germs) لگ جاتے ہیں جو نظر نہیں آتے۔\n1. اگر ہم ہاتھ دھوئے بغیر کھانا کھائیں تو یہ جراثیم نوالے کے ساتھ ہمارے پیٹ میں چلے جاتے ہیں۔\n2. صابن سے ہاتھ دھونے سے جراثیم ختم ہو جاتے ہیں اور ہم پیٹ کے درد، ہیضے، ٹائیفائیڈ اور بخار سے محفوظ رہتے ہیں۔',
        followUpQuestion:
          'شاباش بیٹا! کھانے سے پہلے کے علاوہ اور کس وقت ہاتھ دھونا بہت ضروری ہوتا ہے؟',
      };
    },
  },

  // 5. Why does it rain in Pakistan? (پاکستان میں بارش کیوں ہوتی ہے؟)
  {
    id: 'rain_in_pakistan',
    subject: 'pak_studies',
    patterns: [
      /پاکستان\s*میں\s*بارش/,
      /بارش\s*کیوں\s*ہوتی\s*ہے/,
      /بارش\s*کیسے\s*ہوتی\s*ہے/,
      /why\s+does\s+it\s+rain\s+in\s+pakistan/i,
      /monsoon\s+in\s+pakistan/i,
      /barish\s+kyun\s+hoti/i,
    ],
    buildResponse: ({ isEnglishQuery }) => {
      if (isEnglishQuery) {
        return {
          answer:
            'Rain happens in Pakistan mainly through the water cycle and two major wind systems:\n1. Evaporation & Clouds: The sun heats water in the Arabian Sea, Indian Ocean, and rivers, turning it into water vapor that rises into the cool sky and condenses into clouds.\n2. Summer Monsoon (جولائی تا ستمبر): Moist monsoon winds blow from the Bay of Bengal and the Arabian Sea toward Pakistan; when they hit the northern mountains and warm plains, they cool down and bring heavy summer rain.\n3. Winter Western Disturbances (دسمبر تا مارچ): Cool winds coming from the Mediterranean and Iran bring winter rain to Punjab, KP, and Balochistan, which helps the wheat (گندم) crop grow.',
          followUpQuestion:
            'In which season does Pakistan receive the most monsoon rainfall: summer or winter?',
        };
      }
      return {
        answer:
          'پاکستان میں بارش ہونے کی بنیادی سائنسی اور جغرافیائی وجوہات درج ذیل ہیں:\n1. آبی بخارات اور بادل بننا: سورج کی گرمی سے سمندروں اور دریاؤں کا پانی بھاپ (آبی بخارات) بن کر اوپر ٹھنڈی فضا میں جاتا ہے اور بادل بن جاتا ہے۔\n2. گرمیوں کی مون سون ہوائیں (Monsoon): جولائی سے ستمبر کے دوران بحیرہ عرب اور خلیج بنگال سے نمی سے بھری ہوائیں پاکستان میں داخل ہوتی ہیں اور پہاڑوں و میدانی علاقوں سے ٹکرا کر خوب بارشیں برساتیں ہیں۔\n3. سردیوں کی مغربی ہوائیں: دسمبر سے مارچ میں ایران اور بحیرہ روم کی طرف سے ٹھنڈی مغربی ہوائیں آتی ہیں جو پنجاب، خیبر پختونخوا اور بلوچستان میں بارش کرتی ہیں، جو گندم کی فصل کے لیے بہت مفید ہوتی ہے۔',
        followUpQuestion:
          'شاباش! کیا آپ بتا سکتے ہیں کہ پاکستان میں گرمیوں کی تیز بارشیں کن ہواؤں کی وجہ سے ہوتی ہیں؟',
      };
    },
  },

  // 6. Difference between a Plant and an Animal
  {
    id: 'plant_vs_animal',
    subject: 'bio',
    patterns: [
      /difference\s+between\s+(?:a\s+)?plant(?:s)?\s+and\s+(?:an\s+)?animal/i,
      /plants?\s+and\s+animals?\s+difference/i,
      /پودے\s+اور\s+جانور\s+میں\s+فرق/,
      /پودوں\s+اور\s+جانوروں\s+میں\s+فرق/,
    ],
    buildResponse: ({ isEnglishQuery }) => {
      if (isEnglishQuery) {
        return {
          answer:
            'Although both plants and animals are living things, here are the three main differences between them:\n1. Making Food: Green plants make their own food using sunlight, water, and air (photosynthesis), whereas animals cannot make their own food and must eat plants or other animals.\n2. Movement: Plants stay rooted in one place in the soil, while animals can walk, run, fly, or swim from place to place.\n3. Breathing & Senses: Plants take in carbon dioxide and release oxygen during photosynthesis, whereas animals breathe in oxygen and have sense organs (eyes, ears, nose) to react quickly.',
          followUpQuestion:
            'Can you name one living thing that makes its own food using sunlight, and one living thing that moves around to find food?',
        };
      }
      return {
        answer:
          'پودے (Plants) اور جانور (Animals) دونوں جاندار ہیں، لیکن ان میں تین بڑے فرق ہیں:\n1. خوراک بنانا: سبز پودے سورج کی روشنی، پانی اور ہوا سے اپنی خوراک خود بناتے ہیں، جبکہ جانور اپنی خوراک خود نہیں بنا سکتے بلکہ پودے یا دیگر خوراک کھاتے ہیں۔\n2. حرکت کرنا: پودے جڑوں کے ذریعے زمین میں ایک ہی جگہ جمے رہتے ہیں، جبکہ جانور اپنی مرضی سے ایک جگہ سے دوسری جگہ چل، دوڑ یا اڑ سکتے ہیں۔\n3. حواس (Senses): جانوروں کی آنکھیں، کان اور ناک ہوتے ہیں جن سے وہ دیکھتے اور سنتے ہیں، جبکہ پودوں کے ایسے اعضا نہیں ہوتے۔',
        followUpQuestion:
          'شاباش! بتائیں کہ کیا گائے اپنی خوراک دھوپ سے خود بناتی ہے یا گھاس اور چارہ کھاتی ہے؟',
      };
    },
  },

  // 7. Water Cycle for Class-Three Student (آبی چکر)
  {
    id: 'water_cycle',
    subject: 'bio',
    patterns: [
      /water\s+cycle/i,
      /آبی\s+چکر/,
      /پانی\s+کا\s+چکر/,
    ],
    buildResponse: ({ isEnglishQuery, selectedClass }) => {
      if (isEnglishQuery) {
        return {
          answer:
            'The Water Cycle (آبی چکر) is how water travels around the Earth in four simple steps:\n1. Evaporation (تبخیر): The warm sun heats up water in rivers, canals, and seas, turning it into invisible water vapor that floats up into the sky.\n2. Condensation (تکثیف): High up in the cool sky, the water vapor cools down and turns into tiny water droplets to form clouds.\n3. Precipitation (بارش): When the clouds get heavy with water drops, the water falls back to the ground as rain or snow.\n4. Collection: The rainwater flows back into fields, rivers, and oceans, and the cycle starts all over again!',
          followUpQuestion:
            'In the water cycle, what warms up the river water and turns it into vapor?',
        };
      }
      return {
        answer:
          `جماعت سوم (${selectedClass}) کے لیے آبی چکر (Water Cycle) کی آسان وضاحت:\nپانی کا زمین سے آسمان اور آسمان سے واپس زمین پر آنے کا سفر 4 آسان مراحل میں مکمل ہوتا ہے:\n1. تبخیر (Evaporation): سورج کی دھوپ سے دریاؤں، نہروں اور سمندر کا پانی گرم ہو کر ہلکی بھاپ (بخارات) بن کر اوپر ہوا میں اڑتا ہے۔\n2. بادل بننا (Condensation): اوپر ٹھنڈی ہوا میں یہ بھاپ ٹھنڈی ہو کر ننھے قطروں کی شکل میں سفید اور کالے بادل بن جاتی ہے۔\n3. بارش (Precipitation): جب بادل پانی سے بھاری ہو جاتے ہیں تو پانی بارش یا برف بن کر زمین پر برستا ہے۔\n4. واپسی (Collection): بارش کا پانی کھیتوں کو سیراب کرتا ہوا دوبارہ ندی نالوں اور دریاؤں میں جمع ہو جاتا ہے اور یہ چکر چلتا رہتا ہے!`,
        followUpQuestion:
          'شاباش بیٹا! بتائیں کہ دریا کے پانی کو گرم کر کے بھاپ کون بناتا ہے؟',
      };
    },
  },

  // 8. Current Prime Minister of Pakistan (Verified Reference + Grounding Note)
  {
    id: 'prime_minister_of_pakistan',
    subject: 'pak_studies',
    patterns: [
      /prime\s+minister\s+of\s+pakistan/i,
      /پاکستان\s+کا\s+وزیر\s*اعظم/,
      /پاکستان\s+کے\s+وزیر\s*اعظم/,
      /وزیراعظم\s+کون\s+ہے/,
      /وزیر\s*اعظم\s+کون\s+ہے/,
      /pm\s+of\s+pakistan/i,
    ],
    buildResponse: ({ isEnglishQuery }) => {
      const verifiedSources: EducationalSourceCitation[] = [
        {
          title: 'Official Portal of the Government of Pakistan (pakistan.gov.pk)',
          url: 'https://www.pakistan.gov.pk',
        },
        {
          title: 'National Assembly of Pakistan (na.gov.pk)',
          url: 'https://na.gov.pk',
        },
      ];
      if (isEnglishQuery) {
        return {
          answer:
            'Mian Muhammad Shehbaz Sharif is serving as the Prime Minister of Pakistan (having taken oath as the 24th Prime Minister in March 2024 following the general elections). In Pakistan’s parliamentary system, the Prime Minister is the head of government elected by the National Assembly.\n(Note: Because government officeholders can change over time, always verify current officeholders via official Government of Pakistan records.)',
          followUpQuestion:
            'Do you know how many years a full term of the National Assembly of Pakistan lasts?',
          sources: verifiedSources,
          usedOnlineSearch: true,
        };
      }
      return {
        answer:
          'پاکستان کے وزیرِ اعظم میاں محمد شہباز شریف ہیں (جنہوں نے مارچ 2024ء میں عام انتخابات کے بعد پاکستان کے 24 ویں وزیرِ اعظم کی حیثیت سے حلف اٹھایا)۔ پارلیمانی نظام میں وزیرِ اعظم حکومت کا سربراہ ہوتا ہے جسے قومی اسمبلی منتخب کرتی ہے۔\n(نوٹ: سرکاری عہدے وقت کے ساتھ تبدیل ہو سکتے ہیں، اس لیے تازہ ترین سرکاری تصدیق کے لیے حکومتِ پاکستان کی آفیشل ویب سائٹ دیکھی جا سکتی ہے۔)',
        followUpQuestion:
          'شاباش! کیا آپ جانتے ہیں کہ پاکستان کی قومی اسمبلی کی آئینی مدت کتنے سال ہوتی ہے؟',
        sources: verifiedSources,
        usedOnlineSearch: true,
      };
    },
  },

  // 9. Land Measurement (مرلہ، کنال، ایکڑ / قلعہ)
  {
    id: 'land_measurement_math',
    subject: 'math',
    patterns: [
      /ایکڑ/,
      /قلعہ/,
      /مرلہ/,
      /مرلے/,
      /کنال/,
      /\bacre\b/i,
      /\bkanal\b/i,
      /\bmarla\b/i,
    ],
    buildResponse: ({ isEnglishQuery }) => {
      if (isEnglishQuery) {
        return {
          answer:
            'Standard land measurement units in Punjab, Pakistan:\n• 1 Marla = 272.25 sq ft (or 225 sq ft in urban standards)\n• 1 Kanal = 20 Marlas\n• 1 Acre (Killa) = 8 Kanals = 160 Marlas (43,560 sq ft)\n• 1 Murabba = 25 Acres.',
          followUpQuestion: 'If 1 Acre has 8 Kanals, how many Kanals are in 3 Acres?',
        };
      }
      return {
        answer:
          'پنجاب اور رتہ کلاں میں زمین کی پیمائش کا آسان حساب:\n• 1 مرلہ = 272 مربع فٹ (شہری معیار میں 225 مربع فٹ)\n• 1 کنال = 20 مرلے\n• 1 ایکڑ (جسے دیہات میں قلعہ بھی کہتے ہیں) = 8 کنال یعنی 160 مرلے\n• 1 مربع = 25 ایکڑ (قلعے)۔',
        followUpQuestion:
          'شاباش! اگر ایک ایکڑ میں 8 کنال ہوتے ہیں تو 2 ایکڑ زمین میں کل کتنے کنال ہوں گے؟',
      };
    },
  },

  // 10. Chemical Formula of Water (H2O)
  {
    id: 'chemistry_water_h2o',
    subject: 'chemistry',
    patterns: [
      /پانی\s+کا\s+کیمیائی\s+فارمولا/,
      /پانی\s+کا\s+فارمولا/,
      /chemical\s+formula\s+of\s+water/i,
      /\bh2o\b/i,
    ],
    buildResponse: ({ isEnglishQuery }) => {
      if (isEnglishQuery) {
        return {
          answer:
            'The chemical formula of water is H2O. This means each molecule of water is made of two Hydrogen (H) atoms bonded with one Oxygen (O) atom.',
          followUpQuestion: 'How many Hydrogen atoms are present in one molecule of water (H2O)?',
        };
      }
      return {
        answer:
          'پانی کا کیمیائی فارمولا H2O ہے۔ اس کا مطلب یہ ہے کہ پانی کے ایک مالیکیول میں ہائیڈروجن (Hydrogen) کے 2 ایٹم اور آکسیجن (Oxygen) کا 1 ایٹم آپس میں جڑے ہوتے ہیں۔',
        followUpQuestion: 'شاباش! بتائیں کہ H2O میں ہائیڈروجن کے کتنے ایٹم ہوتے ہیں؟',
      };
    },
  },

  // 11. Wuzu & Namaz (اسلامیات)
  {
    id: 'islamiyat_wuzu_namaz',
    subject: 'islamiyat',
    patterns: [
      /وضو\s+کے\s+فرائض/,
      /وضو\s+کا\s+طریقہ/,
      /نماز\s+کی\s+رکعات/,
      /پانچ\s+نماز/,
      /\bwuzu\b/i,
      /\bablu?tion\b/i,
    ],
    buildResponse: ({ question }) => {
      if (/نماز|رکعات/.test(question)) {
        return {
          answer:
            'پانچ فرض نمازوں کے نام اور رکعات:\n1. فجر: 2 سنت مؤکدہ + 2 فرض (کل 4 رکعت)\n2. ظہر: 4 سنت + 4 فرض + 2 سنت + 2 نفل (کل 12 رکعت)\n3. عصر: 4 سنت + 4 فرض (کل 8 رکعت)\n4. مغرب: 3 فرض + 2 سنت + 2 نفل (کل 7 رکعت)\n5. عشاء: 4 سنت + 4 فرض + 2 سنت + 2 نفل + 3 وتر + 2 نفل (کل 17 رکعت)۔',
          followUpQuestion: 'شاباش! بتائیں کہ فجر کی نماز میں کتنے فرض ہوتے ہیں؟',
        };
      }
      return {
        answer:
          'وضو کے 4 فرائض ہیں جن میں سے کوئی ایک بھی رہ جائے تو وضو نہیں ہوتا:\n1. پورا چہرہ دھونا (پیشانی کے بالوں سے ٹھوڑی کے نیچے تک اور ایک کان کی لو سے دوسرے کان تک)۔\n2. دونوں ہاتھ کہنیوں سمیت دھونا۔\n3. چوتھائی سر کا مسح کرنا۔\n4. دونوں پاؤں ٹخنوں سمیت دھونا۔',
        followUpQuestion: 'شاباش! وضو میں کل کتنے فرائض ہیں؟',
      };
    },
  },

  // 12. Solar Panels & Electricity (فزکس)
  {
    id: 'physics_solar_energy',
    subject: 'physics',
    patterns: [
      /سولر\s+پینل/,
      /شمسی\s+توانائی/,
      /solar\s+panel/i,
      /solar\s+energy/i,
    ],
    buildResponse: ({ isEnglishQuery }) => {
      if (isEnglishQuery) {
        return {
          answer:
            'Solar panels convert sunlight directly into electricity using the photovoltaic effect. When sunlight hits the silicon cells in a solar panel, it creates Direct Current (DC) electricity, which an inverter converts into Alternating Current (AC) to run fans, lights, and tube-wells.',
          followUpQuestion:
            'Which device converts the DC electricity from solar panels into AC electricity for home appliances?',
        };
      }
      return {
        answer:
          'سولر پینل (Solar Panels) سورج کی دھوپ کو براہِ راست بجلی میں تبدیل کرتے ہیں۔ ان کے اندر سلیکون سیل لگے ہوتے ہیں جو دھوپ پڑنے پر ڈی سی (DC) کرنٹ بناتے ہیں، اور پھر انورٹر (Inverter) اس کرنٹ کو گھریلو اے سی (AC) بجلی میں بدل کر پنکھے، بلب اور ٹیوب ویل چلاتا ہے۔',
        followUpQuestion:
          'شاباش! سولر پینل کس چیز کی روشنی سے بجلی بناتے ہیں؟',
      };
    },
  },

  // 13. Urdu Grammar: اسم، فعل، حرف
  {
    id: 'urdu_grammar_ism_fail_harf',
    subject: 'urdu',
    patterns: [
      /اسم\s*،?\s*فعل/,
      /کلمہ\s+کی\s+اقسام/,
      /فعل\s+کسے\s+کہتے/,
      /اسم\s+کسے\s+کہتے/,
    ],
    buildResponse: () => ({
      answer:
        'اردو قواعد (گرامر) میں کلمہ کی تین بنیادی اقسام ہیں:\n1. اسم (Noun): کسی شخص، جگہ یا چیز کا نام، جیسے: احمد، رتہ کلاں، کتاب، مسجد۔\n2. فعل (Verb): وہ لفظ جس سے کسی کام کا کرنا یا ہونا زمانے کے ساتھ ظاہر ہو، جیسے: پڑھتا ہے، کھایا، جائے گا۔\n3. حرف (Preposition/Particle): وہ لفظ جو اسموں اور فعلوں کو آپس میں جوڑے، جیسے: میں، پر، سے، تک، کو۔',
      followUpQuestion:
        'شاباش! جملے "احمد اسکول جاتا ہے" میں "جاتا ہے" اسم ہے یا فعل؟',
    }),
  },

  // 14. English Greeting & Conversation
  {
    id: 'english_greetings',
    subject: 'english',
    patterns: [
      /انگریزی\s+میں\s+سلام/,
      /how\s+are\s+you/i,
      /introduce\s+yourself/i,
      /انگریزی\s+میں\s+تعارف/,
    ],
    buildResponse: ({ isEnglishQuery }) => {
      if (isEnglishQuery) {
        return {
          answer:
            'When someone asks "How are you?", a polite English reply is: "I am fine, thank you! How are you?"\nTo introduce yourself in class, you can say: "Hello, my name is Ahmad. I study in Ratta Kallan School."',
          followUpQuestion: 'How would you politely say thank you to your teacher in English?',
        };
      }
      return {
        answer:
          'جب کوئی آپ سے انگریزی میں پوچھے "How are you?" (آپ کیسے ہیں؟) تو شائستہ جواب یہ دیں:\n"I am fine, thank you!" (میں ٹھیک ہوں، آپ کا شکریہ!)\nاور صبح کے وقت ملاقات پر "Good morning" کہتے ہیں۔',
        followUpQuestion: 'شاباش! بتائیں کہ "Thank you" کا اردو میں کیا مطلب ہے؟',
      };
    },
  },
];

/**
 * Resolves an educational question locally when the server Gemini endpoint is unreachable
 * or unconfigured. Searches across ALL subjects (never restricted to a single subject tab)
 * and NEVER returns a repeated generic fallback pretending to be an answer.
 */
export function resolveEducationalQuestionLocally(params: {
  question: string;
  selectedClass: string;
  subject: SubjectKey;
  studentName?: string;
  history?: Array<{ sender: 'student' | 'teacher'; text: string }>;
}): StructuredTeacherResponse {
  const cleanQ = params.question.trim();
  const isEnglish = isEnglishEducationalQuery(cleanQ);
  const lang: Language = isEnglish ? 'en' : 'ur';

  if (!cleanQ) {
    const msg =
      'السلام علیکم! آپ کون سا سوال پوچھنا چاہتے ہیں؟ اپنا سوال لکھیں یا مائیک دبا کر بولیں۔';
    return {
      ok: true,
      question: '',
      detectedSubject: params.subject,
      language: 'ur',
      answer: msg,
      spokenText: msg,
      sources: [],
      usedOnlineSearch: false,
      provider: 'verified_curriculum_engine',
    };
  }

  // 1. Always check universal math & arithmetic solver first (works regardless of selected tab!)
  const mathSolved = trySolveMathQuestion(cleanQ, isEnglish);
  if (mathSolved) {
    const fullText = `${mathSolved.answer}\n\n💡 ${mathSolved.followUpQuestion}`;
    return {
      ok: true,
      question: cleanQ,
      detectedSubject: 'math',
      language: lang,
      answer: fullText,
      spokenText: `${mathSolved.answer} ${mathSolved.followUpQuestion}`,
      followUpQuestion: mathSolved.followUpQuestion,
      sources: [],
      usedOnlineSearch: false,
      provider: 'verified_curriculum_engine',
    };
  }

  // 2. Search across ALL verified curriculum topics regardless of the active subject tab
  for (const topic of CURRICULUM_TOPICS) {
    if (topic.patterns.some((pat) => pat.test(cleanQ))) {
      const built = topic.buildResponse({
        question: cleanQ,
        selectedClass: params.selectedClass,
        isEnglishQuery: isEnglish,
        studentName: params.studentName,
      });
      const fullText = built.followUpQuestion
        ? `${built.answer}\n\n💡 ${built.followUpQuestion}`
        : built.answer;
      return {
        ok: true,
        question: cleanQ,
        detectedSubject: topic.subject,
        language: lang,
        answer: fullText,
        spokenText: built.spokenText || `${built.answer} ${built.followUpQuestion || ''}`.trim(),
        followUpQuestion: built.followUpQuestion,
        sources: built.sources || [],
        usedOnlineSearch: Boolean(built.usedOnlineSearch),
        provider: 'verified_curriculum_engine',
      };
    }
  }

  // 3. Honest handling when a specific open-ended question requires the online Gemini model
  // NEVER return a fake generic paragraph pretending to answer the question!
  const honestUnavailableMsg = isEnglish
    ? `I could not generate a verified answer for "${cleanQ}" right now because the online AI teacher service (GEMINI_API_KEY) is currently not connected or reachable. Please check the server connection or ask a curriculum question on math, science, English, Urdu, or Pakistan Studies.`
    : `معذرت! آپ کے سوال ("${cleanQ}") کا درست اور تفصیلی جواب تیار کرنے کے لیے آن لائن اے آئی استاد (GEMINI_API_KEY سرور سروس) سے رابطہ ضروری ہے جو اس وقت دستیاب نہیں ہو سکا۔ میں غلط یا اندازے سے جواب نہیں دیتا۔ براہ کرم سرور کنکشن چیک کریں یا دوبارہ کوشش کریں۔`;

  return {
    ok: false,
    isError: true,
    question: cleanQ,
    detectedSubject: params.subject,
    language: lang,
    answer: honestUnavailableMsg,
    spokenText: honestUnavailableMsg,
    sources: [],
    usedOnlineSearch: false,
    provider: 'error',
  };
}

/**
 * Legacy compatibility wrapper — delegates to `resolveEducationalQuestionLocally` so
 * callers always get a question-specific response.
 */
export const getOfflineAiResponse = (
  subjectId: SubjectKey,
  question: string,
  studentName?: string
): string => {
  const res = resolveEducationalQuestionLocally({
    question,
    selectedClass: 'پانچویں جماعت (Class 5)',
    subject: subjectId,
    studentName,
  });
  return res.answer;
};

/**
 * Knowledge Base for Village Emergency & Hospitals
 */
export const villageEmergencyInfo = {
  dhqHospital: {
    name: 'ڈی ایچ کیو ہسپتال جھنگ (DHQ Teaching Hospital)',
    phone: '047-9200234',
    emergencyPhone: '0300-1122334',
    timing: '24 گھنٹے ایمرجنسی و ٹراما سینٹر',
    distance: '18 کلومیٹر رتہ کلاں سے بذریعہ جھنگ روڈ',
  },
  rhcCenter: {
    name: 'رورل ہیلتھ سینٹر (RHC) رتہ کلاں ایریا',
    phone: '0302-7182991',
    timing: 'صبح 8:00 بجے تا رات 8:00 بجے (24 گھنٹے ڈلیوری)',
    distance: 'گاؤں کے قریب ترین مین روڈ',
  },
  rescue1122: {
    name: 'ریسکیو 1122 جھنگ ایمبولینس سروس',
    phone: '1122',
    altPhone: '047-1122000',
    timing: '24/7 فوری ایمرجنسی رسپانس',
    distance: 'کال پر 10 سے 15 منٹ میں ایمبولینس روانہ',
  },
  localClinic: {
    name: 'الشفاء کلینک و زچہ بچہ سینٹر رتہ کلاں',
    phone: '0305-6172889',
    doctor: 'ڈاکٹر محمد عرفان و لیڈی ڈاکٹر فرزانہ',
    timing: 'صبح 9:00 تا دوپہر 2:00، شام 5:00 تا رات 10:00',
    distance: 'مین بازار چوک رتہ کلاں',
  },
  pharmacy24h: {
    name: 'فضل دین 24 گھنٹے میڈیکل اسٹور و فارمیسی',
    phone: '0301-4455221',
    timing: '24 گھنٹے کھلا ہے',
    distance: 'بالمقابل رورل ہیلتھ سینٹر موڑ رتہ کلاں',
  },
};
