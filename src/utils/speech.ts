import { Language } from '../types';

/**
 * Global slow speech mode state (آہستہ بولیں) for elderly & non-literate villagers
 */
let globalSlowSpeechMode = false;

export function setGlobalSpeechSlowMode(slow: boolean): void {
  globalSlowSpeechMode = slow;
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ratta_kallan_slow_speech_v1', slow ? '1' : '0');
    }
  } catch {
    // ignore storage errors
  }
}

export function getGlobalSpeechSlowMode(): boolean {
  try {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('ratta_kallan_slow_speech_v1');
      if (saved === '1') return true;
      if (saved === '0') return false;
    }
  } catch {
    // ignore
  }
  return globalSlowSpeechMode;
}

export function getSpeechRate(customRate?: number): number {
  if (getGlobalSpeechSlowMode()) {
    return 0.78; // Noticeably slower, clear, natural pace for elderly listeners
  }
  return customRate ?? 0.94;
}

/**
 * Detects the actual script/language of a text string so we never force Urdu
 * Nastaliq script into an English voice or treat English/Roman Urdu as Urdu script.
 */
export function detectTextLanguage(text: string, fallbackLang: Language = 'ur'): Language {
  if (!text || !text.trim()) return fallbackLang;
  // Count Urdu/Arabic script characters vs Gurmukhi vs Latin characters
  const urduMatches = text.match(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g);
  const gurmukhiMatches = text.match(/[\u0A00-\u0A7F]/g);
  const latinMatches = text.match(/[a-zA-Z]/g);

  const urduCount = urduMatches ? urduMatches.length : 0;
  const gurmukhiCount = gurmukhiMatches ? gurmukhiMatches.length : 0;
  const latinCount = latinMatches ? latinMatches.length : 0;

  if (gurmukhiCount > urduCount && gurmukhiCount > latinCount) {
    return 'pa';
  }
  if (urduCount > 0 && urduCount >= latinCount * 0.35) {
    return fallbackLang === 'pa' ? 'pa' : 'ur';
  }
  if (latinCount > 0 && urduCount === 0) {
    return 'en';
  }
  return fallbackLang;
}

/**
 * Cleans emojis, HTML tags, markdown symbols, URLs, and decorative characters
 * from text before passing to TTS so the voice engine reads only human-meaningful content.
 */
export function cleanSpeechText(text: string): string {
  if (!text) return '';
  return text
    // Strip HTML tags if any
    .replace(/<[^>]+>/g, ' ')
    // Strip URLs
    .replace(/https?:\/\/\S+/gi, ' ')
    // Remove emojis & pictographs
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F910}-\u{1F96B}\u{1F980}-\u{1F9E0}]/gu, ' ')
    // Remove decorative arrows, bullets, markdown characters, and box drawing symbols
    .replace(/[•●▪▸►◄➔➜➝➞➟➠➢➣➤➥➦➧➨✓✔✕✖✗✘★☆✦✧✩✪✫✬✭✮✯✰⚠️🚨📞📍🌾🕌🏫🚐🏥📢💰🩸📦🔑🔒🔓🎙️🔊🐢⚡⏹️⏸️▶️🔄]/g, ' ')
    // Convert newlines and pipe separators into natural sentence pauses
    .replace(/\r?\n+/g, '۔ ')
    .replace(/[|•·]/g, '، ')
    .replace(/[_*~`#>+=^\\]/g, ' ')
    // Collapse multiple periods/stops
    .replace(/۔\s*۔+/g, '۔ ')
    .replace(/\.\s*\.+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

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

function digitsToUrduSpokenWords(digitsStr: string): string {
  return digitsStr
    .replace(/[-\s]/g, '')
    .split('')
    .map((d) => URDU_DIGIT_WORDS[d] || d)
    .join(' ');
}

/**
 * Converts numbers, phone numbers, times, prices, and common English/abbreviated terms into
 * pure Pakistani Urdu phonetic script so the TTS voice speaks with a natural,
 * clear Pakistani Urdu accent and cadence.
 */
export function convertTextToPakistaniUrduPhonetics(text: string): string {
  if (!text) return '';

  let out = cleanSpeechText(text);

  // Convert Pakistani mobile phone numbers (e.g. 0300-1234567 or 03001234567) into clear digit-by-digit Urdu words
  out = out.replace(/\b(03\d{2})[-\s]?(\d{7})\b/g, (_, prefix: string, rest: string) => {
    const pWords = digitsToUrduSpokenWords(prefix);
    const rWords1 = digitsToUrduSpokenWords(rest.slice(0, 3));
    const rWords2 = digitsToUrduSpokenWords(rest.slice(3));
    return `${pWords}، ${rWords1}، ${rWords2}`;
  });

  // Convert landline phone numbers (e.g. 047-9200234 or 047-6210000)
  out = out.replace(/\b(0\d{2,3})[-\s](\d{6,8})\b/g, (_, area: string, num: string) => {
    const aWords = digitsToUrduSpokenWords(area);
    const nWords = digitsToUrduSpokenWords(num);
    return `${aWords}، ${nWords}`;
  });

  // Convert formatted prices with commas (e.g., 3,950 or 12,500) so commas inside numbers don't split digits
  out = out.replace(/\b(\d{1,3}),(\d{3})\b/g, '$1$2');

  // Convert emergency shortcodes into natural Urdu pronunciation
  out = out.replace(/\b1122\b/g, 'گیارہ بائیس');
  out = out.replace(/\b115\b/g, 'ایک ایک پانچ');
  out = out.replace(/\b15\b/g, 'پندرہ');
  out = out.replace(/\b16\b/g, 'سولہ');
  out = out.replace(/\b1030\b/g, 'دس تیس');
  out = out.replace(/\b1717\b/g, 'سترہ سترہ');

  // Convert common English abbreviations and medical/village terms into Urdu script
  const phoneticDictionary: Array<[RegExp, string]> = [
    [/\b24\/7\b/gi, 'چوبیس گھنٹے'],
    [/\bAM\b/gi, 'صبح'],
    [/\bPM\b/gi, 'شام'],
    [/\bRHC\b/gi, 'دیہی مرکزِ صحت'],
    [/\bBHU\b/gi, 'بنیادی مرکزِ صحت'],
    [/\bDHQ\b/gi, 'ڈسٹرکٹ ہیڈ کوارٹر ہسپتال'],
    [/\bTHQ\b/gi, 'تحصیل ہیڈ کوارٹر ہسپتال'],
    [/\bAI\b/gi, 'اے آئی'],
    [/\bRs\.?\s*/gi, 'روپے '],
    [/\bPKR\b/gi, 'روپے'],
    [/\bDr\.?\s+/gi, 'ڈاکٹر '],
    [/\bO\+/gi, 'او پازیٹو'],
    [/\bO-/gi, 'او نیگیٹو'],
    [/\bA\+/gi, 'اے پازیٹو'],
    [/\bA-/gi, 'اے نیگیٹو'],
    [/\bB\+/gi, 'بی پازیٹو'],
    [/\bB-/gi, 'بی نیگیٹو'],
    [/\bAB\+/gi, 'اے بی پازیٹو'],
    [/\bAB-/gi, 'اے بی نیگیٹو'],
    [/\bRatta Kallan\b/gi, 'رتہ کلاں'],
    [/\bJhang\b/gi, 'جھنگ'],
    [/\bkm\b/gi, 'کلومیٹر'],
  ];

  for (const [pattern, replacement] of phoneticDictionary) {
    out = out.replace(pattern, replacement);
  }

  // Convert time format like 05:30 or 5:30 into natural Urdu "5 بج کر 30 منٹ"
  out = out.replace(/\b0?(\d{1,2}):00\b/g, '$1 بجے');
  out = out.replace(/\b0?(\d{1,2}):(\d{2})\b/g, '$1 بج کر $2 منٹ');

  // Replace hyphens only when used as a range between numbers/times
  out = out.replace(/(\d)\s*[-–—]\s*(\d)/g, '$1 تا $2');

  // Ensure natural breathing pauses at Urdu commas and full stops
  out = out
    .replace(/\s*،\s*/g, '، ')
    .replace(/\s*۔\s*/g, '۔ ')
    .replace(/\s*:\s*/g, ': ')
    .replace(/\s+/g, ' ')
    .trim();

  return out;
}

/**
 * Splits long Urdu/English text into smaller natural sentence/clause chunks so TTS
 * never gets cut off mid-sentence by browser speechSynthesis timeouts or buffer limits.
 */
export function splitTextIntoUrduChunks(text: string, maxChunkLen = 150): string[] {
  const cleaned = text.trim();
  if (!cleaned) return [];
  if (cleaned.length <= maxChunkLen) return [cleaned];

  // Split by Urdu full stop (۔), English period (.), question mark (؟/?), exclamation (!), or semicolon
  const rawSentences = cleaned
    .split(/(?<=[۔.؟?!\n])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';

  for (const sentence of rawSentences) {
    if (sentence.length > maxChunkLen) {
      if (current) {
        chunks.push(current.trim());
        current = '';
      }
      // Split long sentence further by Urdu comma (،), English comma (,), or colon (:)
      const subParts = sentence
        .split(/(?<=[،,:])\s+/)
        .map((p) => p.trim())
        .filter(Boolean);

      for (const part of subParts) {
        if (part.length > maxChunkLen) {
          // Hard word-boundary split if a single clause has no commas
          if (current) {
            chunks.push(current.trim());
            current = '';
          }
          const words = part.split(/\s+/);
          let wordChunk = '';
          for (const w of words) {
            if ((wordChunk + ' ' + w).trim().length <= maxChunkLen) {
              wordChunk = (wordChunk + ' ' + w).trim();
            } else {
              if (wordChunk) chunks.push(wordChunk);
              wordChunk = w;
            }
          }
          if (wordChunk) current = wordChunk;
        } else if ((current + ' ' + part).trim().length <= maxChunkLen) {
          current = (current + ' ' + part).trim();
        } else {
          if (current) chunks.push(current.trim());
          current = part;
        }
      }
    } else if ((current + ' ' + sentence).trim().length <= maxChunkLen) {
      current = (current + ' ' + sentence).trim();
    } else {
      if (current) chunks.push(current.trim());
      current = sentence;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.length > 0 ? chunks : [cleaned];
}

/**
 * Shared Web Audio API Context for reliable mobile & desktop notification chimes
 */
let sharedAudioCtx: AudioContext | null = null;

function getOrCreateAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Unlocks browser audio & speech synthesis on first user tap/click
 */
export function unlockAudioContext(): void {
  try {
    const ctx = getOrCreateAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch {
    // Ignore
  }
}

const playedChimeEventIds = new Set<string>();

/**
 * Plays a pleasant, audible chime when voice assistant activates, completes, or notifications arrive
 */
export function playNotificationChime(
  type:
    | 'start'
    | 'end'
    | 'success'
    | 'alert'
    | 'chime'
    | 'teacher'
    | 'message'
    | 'announcement'
    | string = 'start',
  options?: { eventId?: string; forcePlay?: boolean; [key: string]: unknown } | number
): void {
  try {
    if (options && typeof options === 'object' && options.eventId && !options.forcePlay) {
      if (playedChimeEventIds.has(options.eventId)) {
        return;
      }
      playedChimeEventIds.add(options.eventId);
    }

    if (type === 'message') {
      playIncomingMessageBell();
      return;
    }

    const ctx = getOrCreateAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type === 'alert' || type === 'announcement' ? 'triangle' : 'sine';
    const now = ctx.currentTime;

    if (type === 'start') {
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.14); // E5
    } else if (type === 'alert' || type === 'announcement') {
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.18); // A5
    } else {
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.16); // G5
    }

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.23);
  } catch {
    // Ignore audio context restriction errors
  }
}

/**
 * Plays a distinct, clear dual-tone incoming message bell (پیغام کی گھنٹی)
 * when a new message arrives for a profile or signed-in villager.
 */
export function playIncomingMessageBell(): void {
  try {
    const ctx = getOrCreateAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // First chime note (G5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(783.99, now);
    gain1.gain.setValueAtTime(0.16, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.26);

    // Second chime note (B5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(987.77, now + 0.18);
    gain2.gain.setValueAtTime(0.18, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.56);
  } catch {
    // Ignore audio context errors
  }
}

export interface SpeakOptions {
  isFemaleVillageVoice?: boolean;
  voiceGender?: 'male' | 'female';
  rate?: number;
  pitch?: number;
  volume?: number;
  preferOnlineNeural?: boolean;
  onSegmentChange?: (segmentText: string, index: number, total: number) => void;
  onError?: (errorMsg: string) => void;
}

export interface LanguageSegment {
  text: string;
  lang: Language;
}

export interface VoiceAvailabilityStatus {
  supported: boolean;
  hasNativeUrduVoice: boolean;
  voiceName: string;
  voiceLang: string;
  mode:
    | 'azure_neural'
    | 'gemini_neural_tts'
    | 'native_urdu'
    | 'south_asian_phonetic'
    | 'roman_transliteration'
    | 'english'
    | 'unsupported';
  statusMessageUrdu: string;
}

const URDU_NUMBER_WORDS_0_TO_100: Record<number, string> = {
  0: 'صفر',
  1: 'ایک',
  2: 'دو',
  3: 'تین',
  4: 'چار',
  5: 'پانچ',
  6: 'چھ',
  7: 'سات',
  8: 'آٹھ',
  9: 'نو',
  10: 'دس',
  11: 'گیارہ',
  12: 'بارہ',
  13: 'تیرہ',
  14: 'چودہ',
  15: 'پندرہ',
  16: 'سولہ',
  17: 'سترہ',
  18: 'اٹھارہ',
  19: 'انیس',
  20: 'بیس',
  21: 'اکیس',
  22: 'بائیس',
  23: 'تئیس',
  24: 'چوبیس',
  25: 'پچیس',
  26: 'چھبیس',
  27: 'ستائیس',
  28: 'اٹھائیس',
  29: 'انتیس',
  30: 'تیس',
  35: 'پینتیس',
  40: 'چالیس',
  45: 'پینتالیس',
  50: 'پچاس',
  60: 'ساٹھ',
  70: 'ستر',
  75: 'پچھتر',
  80: 'اسی',
  90: 'نوے',
  100: 'ایک سو',
};

const ENGLISH_ONES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];

const ENGLISH_TENS = [
  '',
  '',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety',
];

/**
 * Converts a number into its exact spoken word in Urdu or English
 * (e.g., 1 -> "ایک" / "one", 10 -> "دس" / "ten", 25 -> "پچیس" / "twenty-five", 100 -> "ایک سو" / "one hundred").
 */
export function formatNumberForSpeech(numInput: number | string, lang: Language = 'ur'): string {
  const n = typeof numInput === 'number' ? numInput : parseInt(String(numInput).trim(), 10);
  if (Number.isNaN(n)) return String(numInput);

  if (lang === 'en') {
    if (n < 0) return `minus ${formatNumberForSpeech(Math.abs(n), 'en')}`;
    if (n < 20) return ENGLISH_ONES[n];
    if (n < 100) {
      const t = Math.floor(n / 10);
      const r = n % 10;
      return r === 0 ? ENGLISH_TENS[t] : `${ENGLISH_TENS[t]}-${ENGLISH_ONES[r]}`;
    }
    if (n === 100) return 'one hundred';
    if (n < 1000) {
      const h = Math.floor(n / 100);
      const r = n % 100;
      return r === 0
        ? `${ENGLISH_ONES[h]} hundred`
        : `${ENGLISH_ONES[h]} hundred and ${formatNumberForSpeech(r, 'en')}`;
    }
    return String(n);
  }

  // Urdu number words
  if (URDU_NUMBER_WORDS_0_TO_100[n]) {
    return URDU_NUMBER_WORDS_0_TO_100[n];
  }
  if (n > 100 && n < 1000) {
    const h = Math.floor(n / 100);
    const r = n % 100;
    const hWord = URDU_NUMBER_WORDS_0_TO_100[h] || String(h);
    const rWord = r > 0 ? ` ${formatNumberForSpeech(r, 'ur')}` : '';
    return `${hWord} سو${rWord}`;
  }
  return String(n);
}

/**
 * Splits a sentence containing mixed Urdu and English words into language-specific segments
 * so Urdu phrases are spoken with Pakistani Urdu pronunciation and embedded English phrases
 * (e.g. "آج ہم English میں five new words سیکھیں گے۔") are spoken with authentic English pronunciation.
 */
export function splitMixedLanguageSegments(
  text: string,
  defaultLang: Language = 'ur'
): LanguageSegment[] {
  const cleaned = cleanSpeechText(text);
  if (!cleaned) return [];

  const hasUrdu = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(cleaned);
  const hasLatin = /[A-Za-z]/.test(cleaned);

  if (!hasUrdu && hasLatin) {
    return [{ text: cleaned, lang: 'en' }];
  }
  if (hasUrdu && !hasLatin) {
    return [{ text: cleaned, lang: defaultLang === 'pa' ? 'pa' : 'ur' }];
  }

  // Mixed Urdu + English text: group tokens by script
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const segments: LanguageSegment[] = [];

  for (const token of tokens) {
    const tokenHasUrdu = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(token);
    const tokenHasLatin = /[A-Za-z]/.test(token);

    let tokenLang: Language;
    if (tokenHasUrdu) {
      tokenLang = defaultLang === 'pa' ? 'pa' : 'ur';
    } else if (tokenHasLatin) {
      // Check if it's just an abbreviation like AM/PM/km/Rs that should stay with Urdu if surrounded by Urdu
      if (/^(AM|PM|Rs\.?|PKR|km)$/i.test(token) && segments.length > 0 && segments[segments.length - 1].lang !== 'en') {
        tokenLang = segments[segments.length - 1].lang;
      } else {
        tokenLang = 'en';
      }
    } else {
      // Pure digits or punctuation: inherit the previous segment's language or defaultLang
      tokenLang = segments.length > 0 ? segments[segments.length - 1].lang : defaultLang;
    }

    if (segments.length > 0 && segments[segments.length - 1].lang === tokenLang) {
      segments[segments.length - 1].text += ` ${token}`;
    } else {
      segments.push({ text: token, lang: tokenLang });
    }
  }

  return segments;
}

let activeAudioElement: HTMLAudioElement | null = null;
let activeSpeakSessionId = 0;
let isSpeechCurrentlyPlaying = false;
let isSpeechCurrentlyPaused = false;
let cachedServerStatus: {
  checked: boolean;
  geminiConfigured: boolean;
  azureSpeechConfigured: boolean;
  activeTtsProvider: string;
} = {
  checked: false,
  geminiConfigured: false,
  azureSpeechConfigured: false,
  activeTtsProvider: 'browser_segmented_speech',
};

// Keep strong references to active utterances so Chrome/Android GC never collects them mid-sentence!
const activeUtterances: SpeechSynthesisUtterance[] = [];
const clientAudioDataCache = new Map<string, string>();

type SpeechStateListener = (state: { isPlaying: boolean; isPaused: boolean }) => void;
const speechStateListeners = new Set<SpeechStateListener>();

function notifySpeechStateChange(): void {
  const snapshot = {
    isPlaying: isSpeechCurrentlyPlaying,
    isPaused: isSpeechCurrentlyPaused,
  };
  speechStateListeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch {
      // ignore listener error
    }
  });
}

export function subscribeSpeechState(listener: SpeechStateListener): () => void {
  speechStateListeners.add(listener);
  return () => {
    speechStateListeners.delete(listener);
  };
}

export function isCurrentlySpeaking(): boolean {
  return isSpeechCurrentlyPlaying;
}

export function isSpeechPaused(): boolean {
  return isSpeechCurrentlyPaused;
}

/**
 * Queries the backend `/api/ai/status` once to check if Azure Neural TTS or Gemini 3.8 TTS is active.
 */
export async function checkOnlineVoiceProviderStatus(): Promise<typeof cachedServerStatus> {
  if (typeof window === 'undefined') return cachedServerStatus;
  try {
    const res = await fetch('/api/ai/status');
    if (res.ok) {
      const data = await res.json();
      cachedServerStatus = {
        checked: true,
        geminiConfigured: Boolean(data.geminiConfigured),
        azureSpeechConfigured: Boolean(data.azureSpeechConfigured),
        activeTtsProvider: data.activeTtsProvider || 'browser_segmented_speech',
      };
    }
  } catch {
    // Offline or running in unit tests
  }
  return cachedServerStatus;
}

/**
 * Comprehensive Urdu-to-Roman-Urdu word & character transliterator.
 * Used ONLY when the user's device/browser has NO Urdu, Punjabi, Hindi, or Arabic
 * voice installed at all AND online neural TTS is unavailable, so an English fallback
 * voice can still read every word of the answer from start to finish.
 */
export function transliterateUrduScriptToRoman(text: string): string {
  let result = cleanSpeechText(text);

  const phraseDictionary: Array<[RegExp, string]> = [
    [/السلام علیکم/g, 'Assalam-o-Alaikum'],
    [/وعلیکم السلام/g, 'Wa-Alaikum-us-Salam'],
    [/رتہ کلاں/g, 'Ratta Kallan'],
    [/جھنگ/g, 'Jhang'],
    [/خوش آمدید/g, 'Khush Aamdeed'],
    [/معذرت، یہ معلومات فی الحال پورٹل پر دستیاب نہیں ہیں/g, 'Maazrat, yeh maloomat filhal portal par dastiyab nahi hain'],
    [/معاف کریں، مجھے معلوم نہیں/g, 'Maaf karein, mujhe maloom nahi'],
    [/مجھے معلوم نہیں/g, 'Mujhe maloom nahi'],
    [/براہ کرم نیچے دیے گئے مثال والے بٹن دبائیں/g, 'Barah-e-karam neechay diye gaye misaal wale button dabayein'],
    [/کوئی میچنگ رزلٹ نہیں ملا/g, 'Koi matching result nahi mila'],
    [/پاکستان کا دارالحکومت اسلام آباد ہے/g, 'Pakistan ka dar-ul-hukoomat Islamabad hai'],
    [/بچو، آج ہم ایک سے دس تک گنتی سیکھیں گے/g, 'Bacho, aaj hum aik se das tak ginti seekhein ge'],
    [/فون نمبر/g, 'phone number'],
    [/موبائل نمبر/g, 'mobile number'],
    [/پتہ/g, 'pata'],
    [/ایڈریس/g, 'address'],
    [/اوقاتِ کار/g, 'auqat-e-kaar'],
    [/اوقات/g, 'auqat'],
    [/کھلنے کا وقت/g, 'khulne ka waqt'],
    [/بند ہونے کا وقت/g, 'band hone ka waqt'],
    [/وقفہ/g, 'waqfa'],
    [/حالت/g, 'haalat'],
    [/اس وقت کھلا ہے/g, 'is waqt khula hai'],
    [/اس وقت بند ہے/g, 'is waqt band hai'],
    [/اس وقت وقفہ ہے/g, 'is waqt waqfa hai'],
    [/مرکزی جامع مسجد/g, 'Markazi Jamia Masjid'],
    [/جامع مسجد/g, 'Jamia Masjid'],
    [/مسجد/g, 'Masjid'],
    [/مساجد/g, 'Masajid'],
    [/امام صاحب/g, 'Imam Sahib'],
    [/نماز کے اوقات/g, 'namaz ke auqat'],
    [/فجر/g, 'Fajr'],
    [/ظہر/g, 'Zohar'],
    [/عصر/g, 'Asr'],
    [/مغرب/g, 'Maghrib'],
    [/عشاء/g, 'Isha'],
    [/جمعہ/g, 'Jummah'],
    [/غروب آفتاب/g, 'ghuroob-e-aftab'],
    [/گورنمنٹ ہائی سکول/g, 'Government High School'],
    [/پرائمری سکول/g, 'Primary School'],
    [/سکول/g, 'School'],
    [/اسکول/g, 'School'],
    [/مدرسہ/g, 'Madrasa'],
    [/کالج/g, 'College'],
    [/بنیادی مرکز صحت/g, 'Basic Health Unit'],
    [/دیہی مرکز صحت/g, 'Rural Health Center'],
    [/ہسپتال/g, 'Hospital'],
    [/کلینک/g, 'Clinic'],
    [/ڈاکٹر/g, 'Doctor'],
    [/میڈیکل سٹور/g, 'Medical Store'],
    [/ایمرجنسی/g, 'Emergency'],
    [/ریسکیو/g, 'Rescue'],
    [/گاڑی/g, 'Gaari'],
    [/ہائی ایس/g, 'Hiace'],
    [/وین/g, 'Van'],
    [/بس/g, 'Bus'],
    [/کرایہ/g, 'Kiraya'],
    [/روٹ/g, 'Route'],
    [/روانگی/g, 'Rawangi'],
    [/واپسی/g, 'Wapsi'],
    [/ڈرائیور/g, 'Driver'],
    [/الیکٹریشن/g, 'Electrician'],
    [/مستری/g, 'Mistri'],
    [/پلمبر/g, 'Plumber'],
    [/درزی/g, 'Darzi'],
    [/حجام/g, 'Hajjam'],
    [/کریانہ/g, 'Karyana'],
    [/آٹا چکی/g, 'Atta Chakki'],
    [/ٹریکٹر/g, 'Tractor'],
    [/مزدور/g, 'Mazdoor'],
    [/سولر/g, 'Solar'],
    [/منڈی ریٹ/g, 'Mandi Rate'],
    [/گندم/g, 'Gandum'],
    [/کپاس/g, 'Kapas'],
    [/چاول/g, 'Chawal'],
    [/مکئی/g, 'Makai'],
    [/گڑ/g, 'Gur'],
    [/فی من/g, 'fi mann'],
    [/روپے/g, 'rupay'],
    [/صبح/g, 'subah'],
    [/دوپہر/g, 'dopehar'],
    [/شام/g, 'shaam'],
    [/رات/g, 'raat'],
    [/بجے/g, 'bajay'],
    [/بج کر/g, 'baj kar'],
    [/منٹ/g, 'minute'],
    [/محلہ/g, 'Mohalla'],
    [/مین بازار/g, 'Main Bazaar'],
    [/لاری اڈا/g, 'Lari Adda'],
    [/نزد/g, 'nazd'],
    [/تا/g, 'se'],
    [/اور/g, 'aur'],
    [/کا/g, 'ka'],
    [/کی/g, 'ki'],
    [/کے/g, 'ke'],
    [/میں/g, 'mein'],
    [/ہے/g, 'hai'],
    [/ہیں/g, 'hain'],
    [/پر/g, 'par'],
    [/سے/g, 'se'],
    [/کو/g, 'ko'],
    [/نے/g, 'ne'],
    [/یہ/g, 'yeh'],
    [/وہ/g, 'woh'],
    [/نام/g, 'naam'],
    [/کاروبار/g, 'karobar'],
    [/دکان/g, 'dukan'],
    [/تفصیل/g, 'tafseel'],
  ];

  for (const [pattern, replacement] of phraseDictionary) {
    result = result.replace(pattern, ` ${replacement} `);
  }

  const charMap: Record<string, string> = {
    'آ': 'aa',
    'ا': 'a',
    'أ': 'a',
    'إ': 'i',
    'ب': 'b',
    'پ': 'p',
    'ت': 't',
    'ٹ': 't',
    'ث': 's',
    'ج': 'j',
    'چ': 'ch',
    'ح': 'h',
    'خ': 'kh',
    'د': 'd',
    'ڈ': 'd',
    'ذ': 'z',
    'ر': 'r',
    'ڑ': 'r',
    'ز': 'z',
    'ژ': 'zh',
    'س': 's',
    'ش': 'sh',
    'ص': 's',
    'ض': 'z',
    'ط': 't',
    'ظ': 'z',
    'ع': 'a',
    'غ': 'gh',
    'ف': 'f',
    'ق': 'q',
    'ک': 'k',
    'ك': 'k',
    'گ': 'g',
    'ل': 'l',
    'م': 'm',
    'ن': 'n',
    'ں': 'n',
    'و': 'o',
    'ؤ': 'o',
    'ہ': 'h',
    'ھ': 'h',
    'ۃ': 'h',
    'ء': '',
    'ی': 'i',
    'ے': 'ay',
    'ئ': 'i',
    '۰': '0',
    '۱': '1',
    '۲': '2',
    '۳': '3',
    '۴': '4',
    '۵': '5',
    '۶': '6',
    '۷': '7',
    '۸': '8',
    '۹': '9',
    '۔': '. ',
    '،': ', ',
    '؟': '? ',
  };

  let finalOut = '';
  for (const ch of result) {
    if (charMap[ch] !== undefined) {
      finalOut += charMap[ch];
    } else if (/[\u064B-\u065F\u0670]/.test(ch)) {
      // skip diacritics
    } else {
      finalOut += ch;
    }
  }

  return finalOut.replace(/\s+/g, ' ').trim();
}

function isLikelyFemaleVoice(v: SpeechSynthesisVoice): boolean {
  const n = v.name.toLowerCase();
  return (
    n.includes('female') ||
    n.includes('woman') ||
    n.includes('girl') ||
    n.includes('uzma') ||
    n.includes('salma') ||
    n.includes('sara') ||
    n.includes('fatima') ||
    n.includes('ayesha') ||
    n.includes('heera') ||
    n.includes('swara') ||
    n.includes('kalpana') ||
    n.includes('lekha') ||
    n.includes('neerja') ||
    n.includes('zira') ||
    n.includes('samantha') ||
    n.includes('victoria') ||
    n.includes('karen') ||
    n.includes('moira') ||
    n.includes('tessa') ||
    n.includes('veena')
  );
}

function isExplicitlyMaleVoice(v: SpeechSynthesisVoice): boolean {
  const n = v.name.toLowerCase();
  return (
    !isLikelyFemaleVoice(v) &&
    (n.includes('male') ||
      n.includes('man') ||
      n.includes('asad') ||
      n.includes('salman') ||
      n.includes('imran') ||
      n.includes('bilal') ||
      n.includes('madhur') ||
      n.includes('prabhat') ||
      n.includes('hemant') ||
      n.includes('ravi') ||
      n.includes('david') ||
      n.includes('mark') ||
      n.includes('daniel') ||
      n.includes('george') ||
      n.includes('alex') ||
      n.includes('james') ||
      n.includes('richard'))
  );
}

function getAssistantVoice(
  lang: Language,
  preferFemale = false
): { voice: SpeechSynthesisVoice | null; isNativeUrdu: boolean; isSouthAsianScriptCapable: boolean } {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { voice: null, isNativeUrdu: false, isSouthAsianScriptCapable: false };
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) {
    return { voice: null, isNativeUrdu: false, isSouthAsianScriptCapable: false };
  }

  const pickByGender = (pool: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
    if (pool.length === 0) return undefined;
    if (preferFemale) {
      return pool.find((v) => isLikelyFemaleVoice(v)) || pool[0];
    }
    return (
      pool.find((v) => isExplicitlyMaleVoice(v)) ||
      pool.find((v) => !isLikelyFemaleVoice(v)) ||
      pool[0]
    );
  };

  if (lang === 'en') {
    const enVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
    return {
      voice: pickByGender(enVoices) || voices[0] || null,
      isNativeUrdu: false,
      isSouthAsianScriptCapable: false,
    };
  }

  // 1. Pakistani Urdu (`ur-PK`)
  const urPkVoices = voices.filter((v) => {
    const l = v.lang.toLowerCase().replace('_', '-');
    const n = v.name.toLowerCase();
    return l.includes('ur-pk') || (l.startsWith('ur') && n.includes('pakistan'));
  });
  const pickedUrPk = pickByGender(urPkVoices);
  if (pickedUrPk) {
    return { voice: pickedUrPk, isNativeUrdu: true, isSouthAsianScriptCapable: true };
  }

  // 2. Any Urdu voice (`ur`, `ur-IN`, etc.)
  const urVoices = voices.filter((v) => {
    const l = v.lang.toLowerCase();
    const n = v.name.toLowerCase();
    return l.startsWith('ur') || n.includes('urdu');
  });
  const pickedUr = pickByGender(urVoices);
  if (pickedUr) {
    return { voice: pickedUr, isNativeUrdu: true, isSouthAsianScriptCapable: true };
  }

  // 3. Punjabi (`pa`) if requested
  if (lang === 'pa') {
    const paVoices = voices.filter((v) => {
      const l = v.lang.toLowerCase();
      const n = v.name.toLowerCase();
      return l.startsWith('pa') || n.includes('punjabi');
    });
    const pickedPa = pickByGender(paVoices);
    if (pickedPa) {
      return { voice: pickedPa, isNativeUrdu: true, isSouthAsianScriptCapable: true };
    }
  }

  // 4. Arabic (`ar`) can read Arabic/Urdu script letters if installed
  const arVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('ar'));
  const pickedAr = pickByGender(arVoices);
  if (pickedAr) {
    return { voice: pickedAr, isNativeUrdu: false, isSouthAsianScriptCapable: true };
  }

  return { voice: null, isNativeUrdu: false, isSouthAsianScriptCapable: false };
}

/**
 * Reports honest voice availability status including server-side neural TTS when configured.
 */
export function getVoiceAvailabilityStatus(lang: Language = 'ur'): VoiceAvailabilityStatus {
  if (cachedServerStatus.geminiConfigured) {
    return {
      supported: true,
      hasNativeUrduVoice: true,
      voiceName: 'Gemini 3.8 Flash Lite TTS (Puck / Kore / Charon / Zephyr)',
      voiceLang: lang === 'en' ? 'en-US' : 'ur-PK',
      mode: 'gemini_neural_tts',
      statusMessageUrdu: 'گوگل جیمنائی پاکستانی اردو آواز فعال ہے (Gemini 3.8 TTS)',
    };
  }
  if (cachedServerStatus.azureSpeechConfigured) {
    return {
      supported: true,
      hasNativeUrduVoice: true,
      voiceName: 'Azure Neural (ur-PK-AsadNeural / ur-PK-UzmaNeural)',
      voiceLang: 'ur-PK',
      mode: 'azure_neural',
      statusMessageUrdu: 'پاکستانی اردو نیورل آواز فعال ہے (ur-PK Neural Voice)',
    };
  }

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return {
      supported: false,
      hasNativeUrduVoice: false,
      voiceName: 'None',
      voiceLang: '',
      mode: 'unsupported',
      statusMessageUrdu: 'آپ کے براؤزر میں آواز (Text-to-Speech) کی سہولت دستیاب نہیں ہے۔',
    };
  }

  const voices = window.speechSynthesis.getVoices();
  if (lang === 'en') {
    const { voice } = getAssistantVoice('en');
    return {
      supported: true,
      hasNativeUrduVoice: false,
      voiceName: voice?.name || 'System English',
      voiceLang: voice?.lang || 'en-US',
      mode: 'english',
      statusMessageUrdu: 'انگلش آواز فعال ہے (English Voice Active)',
    };
  }

  const { voice, isNativeUrdu, isSouthAsianScriptCapable } = getAssistantVoice(lang);
  if (voice && isNativeUrdu) {
    return {
      supported: true,
      hasNativeUrduVoice: true,
      voiceName: voice.name,
      voiceLang: voice.lang,
      mode: 'native_urdu',
      statusMessageUrdu: `اردو آواز فعال ہے (${voice.lang})`,
    };
  }

  if (voice && isSouthAsianScriptCapable) {
    return {
      supported: true,
      hasNativeUrduVoice: false,
      voiceName: voice.name,
      voiceLang: voice.lang,
      mode: 'south_asian_phonetic',
      statusMessageUrdu: `متبادل آواز فعال ہے (${voice.lang})`,
    };
  }

  const fallbackEn = voices.find((v) => v.lang.toLowerCase().startsWith('en')) || voices[0];
  return {
    supported: true,
    hasNativeUrduVoice: false,
    voiceName: fallbackEn?.name || 'System Default (Roman Urdu Fallback)',
    voiceLang: fallbackEn?.lang || 'en-US',
    mode: 'roman_transliteration',
    statusMessageUrdu:
      'آپ کے ڈیوائس میں اردو آواز انسٹال نہیں — رومن اردو اور انگلش تلفظ کے ذریعے مکمل جواب سنایا جا رہا ہے۔',
  };
}

/**
 * Speaks a text string using language-aware segment queues so Urdu and English parts
 * each receive their proper pronunciation and voice without mid-sentence cutoff.
 */
function speakViaWebSpeech(
  cleanText: string,
  requestedLang: Language,
  onEnd?: () => void,
  options?: SpeakOptions,
  sessionId?: number
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    isSpeechCurrentlyPlaying = false;
    isSpeechCurrentlyPaused = false;
    notifySpeechStateChange();
    if (options?.onError) {
      options.onError('آپ کے براؤزر میں آواز کی سہولت موجود نہیں ہے۔');
    }
    if (onEnd) onEnd();
    return;
  }

  const executeSpeak = () => {
    if (sessionId !== undefined && sessionId !== activeSpeakSessionId) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    activeUtterances.length = 0;

    const preferFemale =
      options?.voiceGender === 'female' || Boolean(options?.isFemaleVillageVoice);

    // Split into sentences first, then split mixed-language sentences into language-tagged segments
    const rawSentences = splitTextIntoUrduChunks(cleanText, 150);
    const playbackQueue: Array<{
      displaySegment: string;
      spokenChunk: string;
      targetLangTag: string;
      selectedVoice: SpeechSynthesisVoice | null;
    }> = [];

    const allVoices = window.speechSynthesis.getVoices();

    for (const sentence of rawSentences) {
      const langSegments = splitMixedLanguageSegments(sentence, requestedLang);
      for (const seg of langSegments) {
        if (!seg.text.trim()) continue;

        if (seg.lang === 'en') {
          const { voice: enVoice } = getAssistantVoice('en', preferFemale);
          playbackQueue.push({
            displaySegment: sentence,
            spokenChunk: seg.text,
            targetLangTag: enVoice?.lang || 'en-US',
            selectedVoice: enVoice,
          });
        } else {
          const { voice: urVoice, isSouthAsianScriptCapable } = getAssistantVoice(
            seg.lang,
            preferFemale
          );
          if (urVoice && isSouthAsianScriptCapable) {
            playbackQueue.push({
              displaySegment: sentence,
              spokenChunk: convertTextToPakistaniUrduPhonetics(seg.text),
              targetLangTag: urVoice.lang || (seg.lang === 'pa' ? 'pa-PK' : 'ur-PK'),
              selectedVoice: urVoice,
            });
          } else if (allVoices.length > 0) {
            const enFallback = getAssistantVoice('en', preferFemale).voice || allVoices[0];
            playbackQueue.push({
              displaySegment: sentence,
              spokenChunk: transliterateUrduScriptToRoman(
                convertTextToPakistaniUrduPhonetics(seg.text)
              ),
              targetLangTag: enFallback?.lang || 'en-US',
              selectedVoice: enFallback,
            });
          } else {
            playbackQueue.push({
              displaySegment: sentence,
              spokenChunk: convertTextToPakistaniUrduPhonetics(seg.text),
              targetLangTag: seg.lang === 'pa' ? 'pa-PK' : 'ur-PK',
              selectedVoice: null,
            });
          }
        }
      }
    }

    if (playbackQueue.length === 0) {
      isSpeechCurrentlyPlaying = false;
      isSpeechCurrentlyPaused = false;
      notifySpeechStateChange();
      if (onEnd) onEnd();
      return;
    }

    isSpeechCurrentlyPlaying = true;
    isSpeechCurrentlyPaused = false;
    notifySpeechStateChange();

    let currentIndex = 0;

    const speakNext = () => {
      if (sessionId !== undefined && sessionId !== activeSpeakSessionId) {
        return;
      }
      if (currentIndex >= playbackQueue.length) {
        activeUtterances.length = 0;
        isSpeechCurrentlyPlaying = false;
        isSpeechCurrentlyPaused = false;
        notifySpeechStateChange();
        if (onEnd) onEnd();
        return;
      }

      const item = playbackQueue[currentIndex];
      const itemIdx = currentIndex;
      currentIndex += 1;

      if (options?.onSegmentChange) {
        try {
          options.onSegmentChange(item.displaySegment, itemIdx, playbackQueue.length);
        } catch {
          // ignore
        }
      }

      const utterance = new SpeechSynthesisUtterance(item.spokenChunk);
      activeUtterances.push(utterance);

      utterance.lang = item.targetLangTag;
      if (item.selectedVoice) {
        utterance.voice = item.selectedVoice;
      }

      const targetRate = getSpeechRate(options?.rate);
      const isCurrentlyFemale = item.selectedVoice
        ? isLikelyFemaleVoice(item.selectedVoice)
        : false;

      utterance.rate = targetRate;
      if (preferFemale) {
        utterance.pitch = options?.pitch ?? 1.05;
      } else {
        utterance.pitch = options?.pitch ?? (isCurrentlyFemale ? 0.88 : 1.0);
      }
      utterance.volume = options?.volume ?? 1.0;

      utterance.onend = () => {
        const idx = activeUtterances.indexOf(utterance);
        if (idx !== -1) activeUtterances.splice(idx, 1);
        speakNext();
      };

      utterance.onerror = (ev) => {
        const idx = activeUtterances.indexOf(utterance);
        if (idx !== -1) activeUtterances.splice(idx, 1);
        if (ev.error === 'interrupted' || ev.error === 'canceled') {
          return;
        }
        speakNext();
      };

      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);
      } catch {
        speakNext();
      }
    };

    speakNext();
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    let fired = false;
    const handleVoicesChanged = () => {
      if (fired) return;
      fired = true;
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      executeSpeak();
    };
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    setTimeout(() => {
      if (!fired) {
        fired = true;
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        executeSpeak();
      }
    }, 250);
  } else {
    executeSpeak();
  }
}

/**
 * Attempts online neural TTS (`/api/ai/tts` — Azure `ur-PK-AsadNeural`/`ur-PK-UzmaNeural` or
 * Google Gemini `gemini-3.8-flash-lite-tts`), falling back to language-aware segmented Web Speech
 * if the backend neural service is unconfigured or offline.
 */
async function trySpeakViaOnlineNeuralTts(
  cleanText: string,
  lang: Language,
  sessionId: number,
  onEnd?: () => void,
  options?: SpeakOptions
): Promise<boolean> {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return false;

  if (!cachedServerStatus.checked) {
    await checkOnlineVoiceProviderStatus();
  }
  if (!cachedServerStatus.azureSpeechConfigured && !cachedServerStatus.geminiConfigured) {
    return false;
  }

  const gender: 'male' | 'female' =
    options?.voiceGender === 'female' || options?.isFemaleVillageVoice ? 'female' : 'male';
  const rate = getSpeechRate(options?.rate);
  const slowMode = getGlobalSpeechSlowMode() || rate < 0.86;
  const cacheKey = `${lang}:${gender}:${slowMode ? 'slow' : 'norm'}:${cleanText}`;

  try {
    let dataUrl = clientAudioDataCache.get(cacheKey);
    if (!dataUrl) {
      const response = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          lang,
          gender,
          rate,
          slowMode,
        }),
      });
      if (!response.ok) return false;
      const data = await response.json();
      if (!data?.ok || !data?.audioBase64) return false;
      const mime = data.mimeType || 'audio/wav';
      dataUrl = `data:${mime};base64,${data.audioBase64}`;
      clientAudioDataCache.set(cacheKey, dataUrl);
    }

    if (sessionId !== activeSpeakSessionId) {
      return true; // Interrupted while fetching
    }

    const audio = new Audio(dataUrl);
    activeAudioElement = audio;
    audio.playbackRate = slowMode ? 0.92 : 1.0;
    audio.volume = options?.volume ?? 1.0;

    isSpeechCurrentlyPlaying = true;
    isSpeechCurrentlyPaused = false;
    notifySpeechStateChange();

    if (options?.onSegmentChange) {
      options.onSegmentChange(cleanText, 0, 1);
    }

    audio.onended = () => {
      if (activeAudioElement === audio) {
        activeAudioElement = null;
      }
      isSpeechCurrentlyPlaying = false;
      isSpeechCurrentlyPaused = false;
      notifySpeechStateChange();
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      if (activeAudioElement === audio) {
        activeAudioElement = null;
      }
      // Fall back to segmented Web Speech if audio element fails
      speakViaWebSpeech(cleanText, lang, onEnd, options, sessionId);
    };

    await audio.play();
    return true;
  } catch {
    return false;
  }
}

/**
 * Speaks a text string aloud in clear Urdu, Punjabi, English, or mixed Urdu-English.
 * Automatically uses server-side neural TTS (Azure `ur-PK-AsadNeural`/`ur-PK-UzmaNeural` or
 * Gemini `gemini-3.8-flash-lite-tts`) when configured, or language-aware segmented Web Speech.
 */
export function speakText(
  text: string,
  lang: Language = 'ur',
  onEnd?: () => void,
  options?: SpeakOptions
): void {
  if (typeof window === 'undefined') {
    if (onEnd) onEnd();
    return;
  }

  stopSpeaking();
  const currentSessionId = ++activeSpeakSessionId;

  const cleanText = cleanSpeechText(text);
  if (!cleanText) {
    if (onEnd) onEnd();
    return;
  }

  if (options?.preferOnlineNeural !== false) {
    trySpeakViaOnlineNeuralTts(cleanText, lang, currentSessionId, onEnd, options).then(
      (handledByNeural) => {
        if (!handledByNeural && currentSessionId === activeSpeakSessionId) {
          speakViaWebSpeech(cleanText, lang, onEnd, options, currentSessionId);
        }
      }
    );
  } else {
    speakViaWebSpeech(cleanText, lang, onEnd, options, currentSessionId);
  }
}

/**
 * Speaks a sequence of counting items (e.g., 1 to 10) in exact order with visual highlighting,
 * optional slow repetition for young children, and immediate cancellation support.
 */
export function speakSequentialCounting(
  items: Array<{ id: string; text: string; lang: Language }>,
  options: {
    repeatEach?: boolean;
    slowMode?: boolean;
    voiceGender?: 'male' | 'female';
    onItemStart?: (id: string, index: number) => void;
    onComplete?: () => void;
  } = {}
): void {
  stopSpeaking();
  const sessionId = activeSpeakSessionId;
  if (!items || items.length === 0) {
    if (options.onComplete) options.onComplete();
    return;
  }

  let currentIdx = 0;
  let repeatPass = 0;
  const maxPasses = options.repeatEach ? 2 : 1;

  const playNextItem = () => {
    if (sessionId !== activeSpeakSessionId) {
      return;
    }
    if (currentIdx >= items.length) {
      if (options.onComplete) options.onComplete();
      return;
    }

    const currentItem = items[currentIdx];
    if (options.onItemStart) {
      options.onItemStart(currentItem.id, currentIdx);
    }

    const rate = options.slowMode ? 0.78 : getSpeechRate();

    speakViaWebSpeech(
      currentItem.text,
      currentItem.lang,
      () => {
        if (sessionId !== activeSpeakSessionId) return;
        repeatPass += 1;
        if (repeatPass < maxPasses) {
          setTimeout(() => {
            if (sessionId === activeSpeakSessionId) playNextItem();
          }, 350);
        } else {
          repeatPass = 0;
          currentIdx += 1;
          setTimeout(() => {
            if (sessionId === activeSpeakSessionId) playNextItem();
          }, 420);
        }
      },
      {
        voiceGender: options.voiceGender || 'male',
        rate,
      },
      sessionId
    );
  };

  playNextItem();
}

/**
 * Pauses active speech playback (if currently speaking).
 */
export function pauseSpeaking(): void {
  if (typeof window === 'undefined') return;
  try {
    if (activeAudioElement && !activeAudioElement.paused) {
      activeAudioElement.pause();
      isSpeechCurrentlyPaused = true;
      notifySpeechStateChange();
    }
    if ('speechSynthesis' in window && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      isSpeechCurrentlyPaused = true;
      notifySpeechStateChange();
    }
  } catch {
    // ignore
  }
}

/**
 * Resumes paused speech playback.
 */
export function resumeSpeaking(): void {
  if (typeof window === 'undefined') return;
  try {
    if (activeAudioElement && activeAudioElement.paused) {
      activeAudioElement.play().catch(() => {});
      isSpeechCurrentlyPaused = false;
      isSpeechCurrentlyPlaying = true;
      notifySpeechStateChange();
    }
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      isSpeechCurrentlyPaused = false;
      isSpeechCurrentlyPlaying = true;
      notifySpeechStateChange();
    }
  } catch {
    // ignore
  }
}

/**
 * Stops any active speech playback immediately and clears queued chunks.
 */
export function stopSpeaking(): void {
  activeSpeakSessionId++;
  activeUtterances.length = 0;
  isSpeechCurrentlyPlaying = false;
  isSpeechCurrentlyPaused = false;
  notifySpeechStateChange();

  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.src = '';
    } catch {
      // ignore
    }
    activeAudioElement = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

/**
 * Generates an easy-to-understand spoken Urdu sentence for any profile/item card
 */
export function formatSpokenCardText(params: {
  name: string;
  fatherName?: string;
  businessName: string;
  address: string;
  rateInfo?: string;
  mobile: string;
  timingInfo?: string;
  breakInfo?: string;
  statusInfo?: string;
}): string {
  const parts: string[] = [];
  if (params.fatherName) {
    parts.push(`نام: ${params.name} ولد ${params.fatherName}۔`);
  } else {
    parts.push(`نام: ${params.name}۔`);
  }
  parts.push(`کاروبار یا خدمت: ${params.businessName}۔`);
  if (params.statusInfo) {
    parts.push(`حالت: ${params.statusInfo}۔`);
  }
  if (params.timingInfo) {
    parts.push(`اوقاتِ کار: ${params.timingInfo}۔`);
  }
  if (params.breakInfo) {
    parts.push(`کھانے اور نماز کا وقفہ: ${params.breakInfo}۔`);
  }
  parts.push(`پتہ: ${params.address}۔`);
  if (params.rateInfo) {
    parts.push(`ریٹ اور تفصیل: ${params.rateInfo}۔`);
  }
  parts.push(`فون نمبر: ${params.mobile}۔`);
  return parts.join(' ');
}

export function setSpeechRate(rate: number): void {
  setGlobalSpeechSlowMode(rate < 0.85);
}

export function formatSpokenMosqueText(mosque: {
  name: string;
  imamName: string;
  location: string;
  contact?: string;
  contactNumber?: string;
  prayerTimes: {
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    jummah: string;
  };
}): string {
  const phone = mosque.contact || mosque.contactNumber || '';
  return `مسجد کا نام: ${mosque.name}۔ امام صاحب: ${mosque.imamName}۔ مقام: ${mosque.location}۔ نماز کے اوقات: فجر ${mosque.prayerTimes.fajr}، ظہر ${mosque.prayerTimes.dhuhr}، عصر ${mosque.prayerTimes.asr}، مغرب ${mosque.prayerTimes.maghrib}، عشاء ${mosque.prayerTimes.isha}، جمعہ ${mosque.prayerTimes.jummah}۔${phone ? ` فون نمبر: ${phone}۔` : ''}`;
}

export function formatSpokenInstituteText(inst: {
  name: string;
  headName: string;
  location: string;
  classesOffered: string;
  timing: string;
  contact?: string;
  contactNumber?: string;
}): string {
  const phone = inst.contact || inst.contactNumber || '';
  return `تعلیمی ادارہ: ${inst.name}۔ سربراہ: ${inst.headName}۔ مقام: ${inst.location}۔ کلاسیں: ${inst.classesOffered}۔ اوقات: ${inst.timing}۔${phone ? ` فون نمبر: ${phone}۔` : ''}`;
}

export function formatSpokenTransportText(trans: {
  title: string;
  vehicleNumber?: string;
  driverName: string;
  driverMobile: string;
  route: string;
  departureTime: string;
  arrivalTime?: string;
  fare: string;
}): string {
  return `گاڑی: ${trans.title}${trans.vehicleNumber ? `، نمبر ${trans.vehicleNumber}` : ''}۔ ڈرائیور: ${trans.driverName}۔ روٹ: ${trans.route}۔ روانگی کا وقت: ${trans.departureTime}۔ کرایہ: ${trans.fare}۔ فون نمبر: ${trans.driverMobile}۔`;
}

export function formatSpokenHospitalText(hosp: {
  name: string;
  categoryUrdu?: string;
  address: string;
  distance?: string;
  timing: string;
  contact: string;
  doctorInCharge?: string;
}): string {
  return `ہسپتال یا کلینک: ${hosp.name}۔ ${hosp.categoryUrdu ? `${hosp.categoryUrdu}۔ ` : ''}پتہ: ${hosp.address}۔ ${hosp.distance ? `فاصلہ: ${hosp.distance}۔ ` : ''}اوقات: ${hosp.timing}۔ ${hosp.doctorInCharge ? `ڈاکٹر انچارج: ${hosp.doctorInCharge}۔ ` : ''}فون نمبر: ${hosp.contact}۔`;
}

/**
 * Normalizes voice recognition transcript for search without changing the user's meaning.
 * Strips trailing punctuation added by speech-to-text engines (like ?, ۔, ., !) and collapses spaces.
 */
export function normalizeVoiceTranscriptForSearch(transcript: string): string {
  if (!transcript) return '';
  return transcript
    .trim()
    .replace(/[؟?!۔.,،؛\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if Voice Input (Web Speech Recognition OR MediaRecorder + Gemini 3.5 Transcribe STT) is supported
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const hasWebSpeech = Boolean(
    (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition
  );
  const hasMediaRecorder = Boolean(
    typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof MediaRecorder !== 'undefined'
  );
  return hasWebSpeech || hasMediaRecorder;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionResultEvent {
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [altIndex: number]: {
        transcript: string;
      };
    };
  };
}

export class VoiceRecognizer {
  private recognition: SpeechRecognitionInstance | null = null;
  private fallbackRecorder: AudioVoiceRecorder | null = null;
  private fallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private onResultCb: ((transcript: string, isFinal: boolean) => void) | null = null;
  private onErrorCb: ((errorMsg: string) => void) | null = null;
  private onEndCb: (() => void) | null = null;
  private isListening = false;

  constructor(lang: Language = 'ur') {
    if (typeof window === 'undefined') return;
    const SpeechRec =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (SpeechRec) {
      const RecConstructor = SpeechRec as new () => SpeechRecognitionInstance;
      this.recognition = new RecConstructor();
      this.setLanguage(lang);
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 3;
    } else {
      this.fallbackRecorder = new AudioVoiceRecorder();
    }
  }

  public setLanguage(lang: Language) {
    if (!this.recognition) return;
    if (lang === 'en') {
      this.recognition.lang = 'en-PK';
    } else if (lang === 'pa') {
      this.recognition.lang = 'ur-PK';
    } else {
      this.recognition.lang = 'ur-PK';
    }
  }

  public isAvailable(): boolean {
    return this.recognition !== null || this.fallbackRecorder !== null;
  }

  public start(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (errorMsg: string) => void,
    onEnd: () => void
  ) {
    this.onResultCb = onResult;
    this.onErrorCb = onError;
    this.onEndCb = onEnd;

    if (!this.recognition && !this.fallbackRecorder) {
      onError('آپ کے براؤزر میں وائس سرچ کی سہولت موجود نہیں ہے۔ براہ کرم گوگل کروم استعمال کریں۔');
      onEnd();
      return;
    }

    if (this.isListening) {
      this.stop();
    }

    unlockAudioContext();
    playNotificationChime('start');

    // Fallback to MediaRecorder + Server-side Gemini 3.5 Transcribe (`/api/ai/transcribe`) if Web Speech API is absent
    if (!this.recognition && this.fallbackRecorder) {
      this.isListening = true;
      this.fallbackRecorder.start().then((started) => {
        if (!started) {
          this.isListening = false;
          onError('مائیکروفون کی اجازت نہیں ملی۔ براہ کرم براؤزر میں مائیکروفون Allow کریں۔');
          onEnd();
          return;
        }
        // Automatically stop after 6 seconds if user doesn't manually tap stop
        this.fallbackTimer = setTimeout(() => {
          if (this.isListening) {
            this.stop();
          }
        }, 6000);
      });
      return;
    }

    if (!this.recognition) return;

    this.recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          finalTranscript += res[0].transcript;
        } else {
          interimTranscript += res[0].transcript;
        }
      }

      if (finalTranscript) {
        onResult(normalizeVoiceTranscriptForSearch(finalTranscript), true);
      } else if (interimTranscript) {
        onResult(normalizeVoiceTranscriptForSearch(interimTranscript), false);
      }
    };

    this.recognition.onerror = (event: { error: string }) => {
      this.isListening = false;
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        onError('مائیکروفون کی اجازت نہیں ملی۔ براہ کرم براؤزر میں مائیکروفون Allow کریں۔');
      } else if (event.error === 'no-speech') {
        onError('کوئی آواز سنائی نہیں دی۔ براہ کرم مائیک کے قریب دوبارہ بولیں۔');
      } else if (event.error === 'network') {
        onError('انٹرنیٹ رابطے میں مسئلہ ہے۔ براہ کرم کنکشن چیک کریں یا نیچے دیے گئے بٹن دبائیں۔');
      } else {
        onError('آواز شناخت کرنے میں مسئلہ پیش آیا۔ براہ کرم دوبارہ کوشش کریں۔');
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.isListening = true;
      this.recognition.start();
    } catch {
      this.isListening = false;
      onEnd();
    }
  }

  public stop() {
    if (this.fallbackTimer) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }

    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.isListening = false;
      return;
    }

    if (this.fallbackRecorder && this.isListening) {
      this.isListening = false;
      this.fallbackRecorder.stop().then(async ({ base64Audio }) => {
        if (!base64Audio) {
          if (this.onEndCb) this.onEndCb();
          return;
        }
        try {
          const res = await fetch('/api/ai/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Audio,
              mimeType: 'audio/webm',
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.ok && data?.transcript && this.onResultCb) {
              this.onResultCb(normalizeVoiceTranscriptForSearch(data.transcript), true);
            }
          } else if (this.onErrorCb) {
            this.onErrorCb('آواز شناخت کرنے میں مسئلہ پیش آیا۔');
          }
        } catch {
          if (this.onErrorCb) {
            this.onErrorCb('انٹرنیٹ رابطے میں مسئلہ ہے۔');
          }
        } finally {
          if (this.onEndCb) this.onEndCb();
        }
      });
    }
  }
}

/**
 * Records voice messages into Base64 data URLs for in-app voice messaging
 * (`LeaveMessageModal` and `InboxModal`).
 */
export class AudioVoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime = 0;

  public async start(): Promise<boolean> {
    if (
      typeof window === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      return false;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.startTime = Date.now();

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      return true;
    } catch {
      return false;
    }
  }

  public stop(): Promise<{ base64Audio: string; durationEstimate: number }> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        this.cleanup();
        resolve({ base64Audio: '', durationEstimate: 0 });
        return;
      }

      const durationEstimate = Math.max(
        1,
        Math.round((Date.now() - this.startTime) / 1000)
      );

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = typeof reader.result === 'string' ? reader.result : '';
          this.cleanup();
          resolve({ base64Audio, durationEstimate });
        };
        reader.onerror = () => {
          this.cleanup();
          resolve({ base64Audio: '', durationEstimate: 0 });
        };
        reader.readAsDataURL(audioBlob);
      };

      try {
        this.mediaRecorder.stop();
      } catch {
        this.cleanup();
        resolve({ base64Audio: '', durationEstimate: 0 });
      }
    });
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}

