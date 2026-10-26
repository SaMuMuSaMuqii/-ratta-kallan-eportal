import { Language } from '../types';

// Speech synthesis instance
let synth: SpeechSynthesis | null = null;
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  synth = window.speechSynthesis;
}

let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

// Global speed preference (Default 0.95x for natural, calm Pakistani cadence)
let globalSpeechRate = 0.95;
let globalSpeechPitch = 1.0;

export const setSpeechRate = (rate: number) => {
  if (rate >= 0.7 && rate <= 2.0) {
    globalSpeechRate = rate;
    try {
      localStorage.setItem('rk_speech_rate_v1', String(rate));
    } catch {}
  }
};

export const getSpeechRate = (): number => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('rk_speech_rate_v1');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed > 0.5 && parsed < 2.5) {
          globalSpeechRate = parsed;
        }
      }
    } catch {}
  }
  return globalSpeechRate;
};

// Universal silent audio context unlock for Mobile Safari, Chrome & Android
let sharedAudioCtx: AudioContext | null = null;
export const unlockAudioContext = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    // Play a 1-sample silent buffer to unlock iOS and Android media engines
    const buffer = sharedAudioCtx.createBuffer(1, 1, 22050);
    const source = sharedAudioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(sharedAudioCtx.destination);
    source.start(0);

    // Also wake up speech synthesis if it was sleeping
    if (synth && synth.paused) {
      synth.resume();
    }
  } catch (e) {
    // Non-critical, audio context may already be active
  }
};

// Auto-attach unlock on first touch or click
if (typeof window !== 'undefined') {
  const onFirstInteraction = () => {
    unlockAudioContext();
    window.removeEventListener('click', onFirstInteraction);
    window.removeEventListener('touchstart', onFirstInteraction);
  };
  window.addEventListener('click', onFirstInteraction, { passive: true, once: true });
  window.addEventListener('touchstart', onFirstInteraction, { passive: true, once: true });
}

// Comprehensive Urdu character & digraph phonetic mapping for fallback English voices
const urduCharMap: Record<string, string> = {
  'ا': 'a', 'آ': 'aa', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ٹ': 't', 'ث': 's',
  'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ڈ': 'd', 'ذ': 'z',
  'ر': 'r', 'ڑ': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's',
  'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
  'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ں': 'n', 'و': 'o',
  'ہ': 'h', 'ھ': 'h', 'ء': '', 'ی': 'i', 'ے': 'ay', 'ئ': 'e', 'ؤ': 'o',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6',
  '۷': '7', '۸': '8', '۹': '9', '؟': '?', '،': ',', '۔': '.',
};

// Common Urdu words & phrases mapped to clean spoken phonetic phrases if browser voice is English
const commonUrduPhrases: [RegExp, string][] = [
  [/السلام علیکم/g, 'Assalam-o-Alaikum'],
  [/وعلیکم السلام/g, 'Walaikum Assalam'],
  [/رتہ کلاں/g, 'Ratta Kallan'],
  [/جھنگ/g, 'Jhang'],
  [/خوش آمدید/g, 'khush aamdeed'],
  [/ورچوئل/g, 'virtual'],
  [/پورٹل/g, 'portal'],
  [/سپر ایڈمن/g, 'Super Admin'],
  [/اسکول مددگار/g, 'School Madadgar'],
  [/اسکول|سکول/g, 'school'],
  [/کالج/g, 'college'],
  [/مسجد/g, 'masjid'],
  [/نماز/g, 'namaz'],
  [/استاد/g, 'ustad'],
  [/طالب علم/g, 'student'],
  [/ہوم ورک/g, 'homework'],
  [/سبق/g, 'sabaq'],
  [/سوال/g, 'sawaal'],
  [/جواب/g, 'jawab'],
  [/ہسپتال|اسپتال/g, 'hospital'],
  [/ایمرجنسی/g, 'emergency'],
  [/ریسکیو/g, 'Rescue'],
  [/ایمبولینس/g, 'ambulance'],
  [/ڈاکٹر/g, 'doctor'],
  [/کلینک/g, 'clinic'],
  [/ڈسپنسری/g, 'dispensary'],
  [/میڈیکل اسٹور|فارمیسی/g, 'medical store'],
  [/موبائل نمبر|فون نمبر|رابطہ نمبر/g, 'mobile number'],
  [/فوری رابطہ/g, 'fauri rabta'],
  [/الیکٹریشن/g, 'electrician'],
  [/مستری/g, 'mistri builder'],
  [/ٹریکٹر/g, 'tractor'],
  [/کریانہ/g, 'karyana store'],
  [/درزی/g, 'darzi tailor'],
  [/گاڑی/g, 'gaari van'],
  [/کرایہ/g, 'kiraya fare'],
  [/روانگی/g, 'rawangi departure'],
  [/روٹ/g, 'route'],
];

// Numbers map in Urdu words for natural spoken phonetics
export const digitToUrduWord: Record<string, string> = {
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

export const convertPhoneToUrduWords = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return phone;
  const words = digits.split('').map((d) => digitToUrduWord[d] || d);
  if (words.length === 11) {
    return `${words.slice(0, 4).join(' ')}، ${words.slice(4, 7).join(' ')}، ${words.slice(7).join(' ')}`;
  }
  return words.join(' ');
};

export const convertTextToPakistaniUrduPhonetics = (text: string): string => {
  if (!text) return '';
  let result = text;

  // Convert phone numbers like 0327-0019099 or 03001234567 into natural Urdu spoken words
  result = result.replace(/03\d{2}[-\s]?\d{7}/g, (match) => {
    return convertPhoneToUrduWords(match);
  });

  // Convert Time ranges like "08:00 AM – 09:00 PM"
  result = result
    .replace(/08:00\s*AM/gi, 'صبح آٹھ بجے')
    .replace(/08:30\s*AM/gi, 'صبح ساڑھے آٹھ بجے')
    .replace(/09:00\s*AM/gi, 'صبح نو بجے')
    .replace(/10:00\s*AM/gi, 'صبح دس بجے')
    .replace(/10:30\s*AM/gi, 'صبح ساڑھے دس بجے')
    .replace(/11:00\s*AM/gi, 'صبح گیارہ بجے')
    .replace(/12:00\s*PM/gi, 'دوپہر بارہ بجے')
    .replace(/01:00\s*PM/gi, 'دوپہر ایک بجے')
    .replace(/02:00\s*PM/gi, 'دوپہر دو بجے')
    .replace(/03:00\s*PM/gi, 'دوپہر تین بجے')
    .replace(/04:00\s*PM/gi, 'شام چار بجے')
    .replace(/05:00\s*PM/gi, 'شام پانچ بجے')
    .replace(/06:00\s*PM/gi, 'شام چھ بجے')
    .replace(/07:00\s*PM/gi, 'شام سات بجے')
    .replace(/08:00\s*PM/gi, 'رات آٹھ بجے')
    .replace(/09:00\s*PM/gi, 'رات نو بجے')
    .replace(/10:00\s*PM/gi, 'رات دس بجے')
    .replace(/11:00\s*PM/gi, 'رات گیارہ بجے');

  // Convert common English words to pure Urdu
  result = result
    .replace(/\bOpen Now\b/gi, 'ابھی کھلا ہے')
    .replace(/\bClosed\b/gi, 'ابھی بند ہے')
    .replace(/\bBreak\b/gi, 'وقفہ')
    .replace(/\bSuper Admin\b/gi, 'سپر ایڈمن')
    .replace(/\bHelpline\b/gi, 'ہیلپ لائن')
    .replace(/\bWhatsApp\b/gi, 'واٹس ایپ')
    .replace(/[-–—]/g, ' تا ');

  return result;
};

// Clean speech helper that ensures natural phrasing without robotic character decomposition
export const cleanSpeechText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/[#*_~`]/g, '')
    .replace(/https?:\/\/\S+/g, 'link')
    .replace(/[🚨📢🩺🏥🕌🏫🚌⚡🔨🚜🛒📱📩🔔⭐⚠️🚫❌]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Intelligible Roman fallback for English-only synthesis engines (never outputs isolated consonants)
export const urduToRomanUrdu = (text: string): string => {
  if (!text) return '';
  let result = cleanSpeechText(text);

  // Common high-priority welcome & terms phrases
  if (result.includes('کوئی بھی اس ایپ کا غلط استعمال نہ کرے') || result.includes('ضروری ہدایات غور سے سنیں')) {
    return 'Assalam-o-Alaikum! Ratta Kallan Jhang portal main khush aamdeed. Zaroori hidayaat: Koi is app ka ghalat istimal na kare, aurat ka number share na kare, dhamki ya dhoka na kare. Admin is ko nigrani karte hain.';
  }

  if (result.includes('اسکول مددگار')) {
    return 'Assalam-o-Alaikum! Ratta Kallan virtual school main khush aamdeed. Aap nursery se matric tak koi bhi sawaal pooch saktay hain.';
  }

  for (const [pattern, replacement] of commonUrduPhrases) {
    result = result.replace(pattern, replacement);
  }

  // Remove leftover Arabic diacritics/symbols without destroying words
  return result.replace(/[\u064B-\u065F\u06D6-\u06ED]/g, '').trim();
};

const loadVoices = () => {
  if (!synth) return;
  try {
    const list = synth.getVoices() || [];
    if (list.length > 0) {
      cachedVoices = list;
      voicesLoaded = true;
    }
  } catch (e) {
    console.warn('Error loading voices:', e);
  }
};

if (typeof window !== 'undefined' && synth) {
  loadVoices();
  if ('onvoiceschanged' in synth) {
    synth.onvoiceschanged = () => {
      loadVoices();
    };
  }
}

export const isSpeechSynthesisSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

export const isSpeechRecognitionSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
};

let currentAudioElement: HTMLAudioElement | null = null;
let currentAudioQueue: string[] = [];
let currentAudioIndex = 0;
let currentAudioOnEnd: (() => void) | null = null;
let isAudioEnginePlaying = false;

export const stopSpeaking = () => {
  // 1. Immediately pause and reset HTML5 audio streaming
  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
      currentAudioElement.src = '';
    } catch (e) {}
    currentAudioElement = null;
  }
  currentAudioQueue = [];
  currentAudioIndex = 0;
  isAudioEnginePlaying = false;
  if (currentAudioOnEnd) {
    const cb = currentAudioOnEnd;
    currentAudioOnEnd = null;
    try {
      cb();
    } catch {}
  }

  // 2. Stop Web Speech API synthesis
  if (synth) {
    try {
      synth.cancel();
    } catch (e) {
      console.warn('Error cancelling speech:', e);
    }
  }
};

export const playNotificationChime = (
  type: 'message' | 'alert' | 'start' | 'teacher' | 'chime' | 'success' = 'start'
) => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'message') {
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'alert') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'teacher') {
      // Pleasant learning chime
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc.frequency.setValueAtTime(1046.5, now + 0.24); // C6
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else {
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    }
  } catch (e) {
    // Ignore audio context autoplay restriction
  }
};

/**
 * Get available voices from browser
 */
export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (!synth) return [];
  if (!cachedVoices.length) {
    loadVoices();
  }
  return cachedVoices.length ? cachedVoices : (synth.getVoices() || []);
};

/**
 * Split long Urdu sentences into natural phrases for high-fidelity audio streaming.
 */
export const splitTextIntoUrduChunks = (text: string, maxLen = 140): string[] => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];

  // Split by natural pause markers (full stops, exclamation, question marks, commas, newlines)
  const parts = clean.split(/([۔!؟\n]+|[،,]+)/g);
  const chunks: string[] = [];
  let buffer = '';

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (!p) continue;
    if ((buffer + ' ' + p).trim().length <= maxLen) {
      buffer = (buffer + ' ' + p).trim();
    } else {
      if (buffer.trim()) chunks.push(buffer.trim());
      if (p.length <= maxLen) {
        buffer = p.trim();
      } else {
        // Break long words sequence
        const words = p.split(' ');
        for (const w of words) {
          if ((buffer + ' ' + w).trim().length <= maxLen) {
            buffer = (buffer + ' ' + w).trim();
          } else {
            if (buffer.trim()) chunks.push(buffer.trim());
            buffer = w;
          }
        }
      }
    }
  }
  if (buffer.trim()) chunks.push(buffer.trim());
  return chunks.length ? chunks : [clean];
};

/**
 * Web Speech API fallback engine when network audio is unavailable
 */
export const speakViaWebSpeech = (
  cleanText: string,
  lang: Language = 'ur',
  onEnd?: () => void,
  options?: {
    isFemaleVillageVoice?: boolean;
    voiceGender?: 'female' | 'male';
    rate?: number;
    pitch?: number;
    volume?: number;
  }
) => {
  if (!synth) {
    if (onEnd) onEnd();
    return;
  }

  try {
    synth.cancel();
    if (synth.paused) {
      synth.resume();
    }

    if (!cachedVoices.length) {
      loadVoices();
    }
    const voices = cachedVoices.length ? cachedVoices : (synth.getVoices() || []);
    const requestedGender =
      options?.voiceGender || (options?.isFemaleVillageVoice === true ? 'female' : 'male');

    let targetVoice: SpeechSynthesisVoice | undefined;

    // 1. Urdu voice matching requested gender
    if (requestedGender === 'male') {
      targetVoice = voices.find(
        (v) =>
          (v.lang.toLowerCase() === 'ur-pk' || v.lang.toLowerCase().startsWith('ur')) &&
          (v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('asad') ||
            v.name.toLowerCase().includes('salman'))
      );
    } else {
      targetVoice = voices.find(
        (v) =>
          (v.lang.toLowerCase() === 'ur-pk' || v.lang.toLowerCase().startsWith('ur')) &&
          (v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('uzma') ||
            v.name.toLowerCase().includes('pakistan'))
      );
    }

    if (!targetVoice) {
      targetVoice = voices.find(
        (v) => v.lang.toLowerCase() === 'ur-pk' || v.lang.toLowerCase().startsWith('ur')
      );
    }

    // 2. Punjabi fallback (Never switch to Hindi)
    if (!targetVoice && lang === 'pa') {
      targetVoice = voices.find((v) => v.lang.toLowerCase().startsWith('pa'));
    }

    // 3. Intelligible phonetic Roman Urdu fallback for English-only browser voices
    let textToSpeak = cleanText;
    if (!targetVoice) {
      textToSpeak = urduToRomanUrdu(cleanText);
      targetVoice =
        voices.find(
          (v) => v.lang.toLowerCase().includes('in') || v.lang.toLowerCase().includes('pk')
        ) || voices[0];
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    if (targetVoice) {
      utterance.voice = targetVoice;
      utterance.lang = targetVoice.lang;
    } else {
      utterance.lang = lang === 'en' ? 'en-US' : 'ur-PK';
    }

    utterance.rate = options?.rate ?? (lang === 'en' ? 1.0 : getSpeechRate());
    utterance.pitch = options?.pitch ?? (requestedGender === 'male' ? 0.95 : 1.0);
    utterance.volume = options?.volume ?? 1.0;

    let finished = false;
    const finishHandler = () => {
      if (!finished) {
        finished = true;
        if (onEnd) onEnd();
      }
    };

    utterance.onend = finishHandler;
    utterance.onerror = () => finishHandler();

    synth.speak(utterance);
  } catch (err) {
    console.warn('Web speech fallback failed:', err);
    if (onEnd) onEnd();
  }
};

/**
 * Universal Speak Text in Clear Pakistani Urdu
 * Tier 1: Streams authentic high-fidelity native Urdu audio from neural TTS.
 * Tier 2: Seamlessly falls back to Web Speech API without double-cancellation.
 */
export const speakText = (
  text: string,
  lang: Language = 'ur',
  onEnd?: () => void,
  options?: {
    isFemaleVillageVoice?: boolean;
    voiceGender?: 'female' | 'male';
    rate?: number;
    pitch?: number;
    volume?: number;
  }
): boolean => {
  // Pre-unlock audio engine for mobile Safari, Android Chrome, and laptops
  unlockAudioContext();

  // Stop any prior speech or audio playback cleanly
  stopSpeaking();

  let cleanText = cleanSpeechText(text);

  // If Urdu or Punjabi, convert numbers, times, and terms into natural Pakistani Urdu words
  if (lang === 'ur' || lang === 'pa') {
    cleanText = convertTextToPakistaniUrduPhonetics(cleanText);
  }

  if (!cleanText) {
    if (onEnd) onEnd();
    return false;
  }

  // If English is explicitly selected, use Web Speech API
  if (lang === 'en') {
    speakViaWebSpeech(cleanText, lang, onEnd, options);
    return true;
  }

  // Primary Native Urdu Neural Streaming Engine:
  // Breaks text into sentence chunks and plays sequential high-quality audio
  const chunks = splitTextIntoUrduChunks(cleanText, 140);
  if (!chunks.length) {
    if (onEnd) onEnd();
    return false;
  }

  currentAudioQueue = chunks;
  currentAudioIndex = 0;
  currentAudioOnEnd = onEnd || null;
  isAudioEnginePlaying = true;

  const playNextChunk = () => {
    if (!isAudioEnginePlaying) return;
    if (currentAudioIndex >= currentAudioQueue.length) {
      stopSpeaking();
      return;
    }

    const chunk = currentAudioQueue[currentAudioIndex];
    currentAudioIndex++;
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ur&client=tw-ob&q=${encodeURIComponent(
      chunk
    )}`;

    const audio = new Audio(ttsUrl);
    currentAudioElement = audio;

    const speechRate = options?.rate ?? getSpeechRate();
    audio.playbackRate = Math.max(0.85, Math.min(1.4, speechRate));

    audio.onended = () => {
      playNextChunk();
    };

    audio.onerror = (e) => {
      console.warn('Audio stream error, falling back to Web Speech API:', e);
      const remaining = currentAudioQueue.slice(currentAudioIndex - 1).join(' ');
      stopSpeaking();
      speakViaWebSpeech(remaining, lang, onEnd, options);
    };

    audio.play().catch((err) => {
      console.warn('Audio play() error, falling back to Web Speech API:', err);
      const remaining = currentAudioQueue.slice(currentAudioIndex - 1).join(' ');
      stopSpeaking();
      speakViaWebSpeech(remaining, lang, onEnd, options);
    });
  };

  playNextChunk();
  return true;
};

/**
 * Polite Spoken Text Builders for Illiterate or Elderly Villagers
 */
export const formatSpokenCardText = (p: {
  name: string;
  fatherName?: string;
  businessName: string;
  address?: string;
  rateInfo?: string;
  mobile: string;
  timingInfo?: string;
  breakInfo?: string;
  statusInfo?: string;
}): string => {
  const cleanPhone = (p.mobile || '').replace(/[-]/g, ' ');
  return [
    `یہ رتہ کلاں کے ہنر مند ہیں: ${p.name}۔`,
    p.fatherName ? `ولد ${p.fatherName}۔` : '',
    `کاروبار: ${p.businessName}۔`,
    p.timingInfo ? `اوقاتِ کار: ${p.timingInfo}۔` : '',
    p.breakInfo ? `وقفہ: ${p.breakInfo}۔` : '',
    p.statusInfo ? `موجودہ صورتحال: ${p.statusInfo}۔` : '',
    p.rateInfo ? `ریٹ یا مزدوری: ${p.rateInfo}۔` : '',
    p.address ? `پتہ: ${p.address}۔` : 'مقام: رتہ کلاں جھنگ۔',
    `موبائل نمبر ہے: ${cleanPhone}۔`,
    'رابطہ کرنے کے لیے کال یا واٹس ایپ کا بٹن دبائیں۔',
  ]
    .filter(Boolean)
    .join(' ');
};

export const formatSpokenMosqueText = (m: {
  name: string;
  imamName?: string;
  location?: string;
  prayerTimes?: {
    fajr?: string;
    dhuhr?: string;
    asr?: string;
    maghrib?: string;
    isha?: string;
    jummah?: string;
  };
  fajr?: string;
  dhuhr?: string;
  asr?: string;
  maghrib?: string;
  isha?: string;
  jummah?: string;
}): string => {
  const fajr = m.prayerTimes?.fajr || m.fajr;
  const dhuhr = m.prayerTimes?.dhuhr || m.dhuhr;
  const asr = m.prayerTimes?.asr || m.asr;
  const maghrib = m.prayerTimes?.maghrib || m.maghrib;
  const isha = m.prayerTimes?.isha || m.isha;
  const jummah = m.prayerTimes?.jummah || m.jummah;

  return [
    `یہ ہے: ${m.name}۔`,
    m.imamName ? `خطیب و امام صاحب: ${m.imamName}۔` : '',
    m.location ? `مقام: ${m.location}۔` : '',
    'نماز کے اوقات یہ ہیں:',
    fajr ? `فجر: ${fajr}۔` : '',
    dhuhr ? `ظہر: ${dhuhr}۔` : '',
    asr ? `عصر: ${asr}۔` : '',
    maghrib ? `مغرب: ${maghrib}۔` : '',
    isha ? `عشاء: ${isha}۔` : '',
    jummah ? `نمازِ جمعہ: ${jummah}۔` : '',
  ]
    .filter(Boolean)
    .join(' ');
};

export const formatSpokenInstituteText = (inst: {
  name: string;
  headName?: string;
  location?: string;
  classesOffered?: string;
  timing?: string;
}): string => {
  return [
    `یہ تعلیمی ادارہ ہے: ${inst.name}۔`,
    inst.headName ? `پرنسپل یا ہیڈ ماسٹر: ${inst.headName}۔` : '',
    inst.classesOffered ? `کلاسیں: ${inst.classesOffered}۔` : '',
    inst.timing ? `اوقات: ${inst.timing}۔` : '',
    inst.location ? `مقام: ${inst.location}۔` : '',
  ]
    .filter(Boolean)
    .join(' ');
};

export const formatSpokenTransportText = (v: {
  title: string;
  driverName?: string;
  driverMobile?: string;
  route?: string;
  rent?: string;
  fare?: string;
  departureTime?: string;
}): string => {
  const fare = v.fare || v.rent;
  const cleanPhone = (v.driverMobile || '').replace(/[-]/g, ' ');
  return [
    `یہ رتہ کلاں پبلک ٹرانسپورٹ ہے: ${v.title}۔`,
    v.driverName ? `ڈرائیور صاحب: ${v.driverName}۔` : '',
    v.route ? `روٹ: ${v.route}۔` : '',
    v.departureTime ? `روانگی کا وقت: ${v.departureTime}۔` : '',
    fare ? `کرایہ: ${fare}۔` : '',
    cleanPhone ? `ڈرائیور کا رابطہ نمبر: ${cleanPhone}۔` : '',
  ]
    .filter(Boolean)
    .join(' ');
};

export const formatSpokenHospitalText = (h: {
  name: string;
  categoryUrdu?: string;
  address?: string;
  distance?: string;
  timing?: string;
  contact?: string;
}): string => {
  const cleanPhone = (h.contact || '').replace(/[-]/g, ' ');
  return [
    `یہ طبی سروس ہے: ${h.name}۔`,
    h.categoryUrdu ? `قسم: ${h.categoryUrdu}۔` : '',
    h.address ? `پتہ: ${h.address}۔` : '',
    h.distance ? `فاصلہ: ${h.distance}۔` : '',
    h.timing ? `اوقات: ${h.timing}۔` : '',
    cleanPhone ? `ایمرجنسی رابطہ نمبر: ${cleanPhone}۔` : '',
  ]
    .filter(Boolean)
    .join(' ');
};

/**
 * Foolproof 1-tap card speech toggle helper for 🔊 speaker buttons
 */
export const toggleCardSpeech = (
  cardId: string,
  text: string,
  currentPlayingId: string | null,
  setPlayingId: (id: string | null) => void,
  lang: Language = 'ur'
) => {
  unlockAudioContext();
  if (currentPlayingId === cardId) {
    stopSpeaking();
    setPlayingId(null);
  } else {
    stopSpeaking();
    setPlayingId(cardId);
    playNotificationChime('start');
    speakText(
      cleanSpeechText(text),
      lang,
      () => setPlayingId(null),
      {
        isFemaleVillageVoice: true,
        rate: getSpeechRate(),
        pitch: globalSpeechPitch,
      }
    );
  }
};

// Speech Recognition helper with fallback support
export class VoiceRecognizer {
  private recognition: any = null;
  public isListening = false;

  constructor(lang: Language = 'ur') {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      if (lang === 'pa') {
        this.recognition.lang = 'pa-PK';
      } else if (lang === 'en') {
        this.recognition.lang = 'en-US';
      } else {
        this.recognition.lang = 'ur-PK';
      }
    }
  }

  public start(
    onResult: (text: string, isFinal: boolean) => void,
    onError: (err: any) => void,
    onEnd: () => void
  ) {
    if (!this.recognition) {
      onError(new Error('مائیکروفون اس براؤزر میں سپورٹ نہیں ہے'));
      return;
    }

    this.isListening = true;
    let lastRecognizedText = '';

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const text = (final || interim).trim();
      if (text) {
        lastRecognizedText = text;
      }
      onResult(text, Boolean(final));
    };

    this.recognition.onerror = (e: any) => {
      console.warn('VoiceRecognizer error:', e);
      this.isListening = false;
      onError(e);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      // If we got interim text but not marked final before ending, deliver it now!
      if (lastRecognizedText) {
        onResult(lastRecognizedText, true);
      }
      onEnd();
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.warn('Failed to start recognition:', e);
      this.isListening = false;
      onError(e);
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Failed to stop recognition:', e);
      }
      this.isListening = false;
    }
  }
}

// Audio Voice Note Recorder for village messages
export class AudioVoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;

  async start(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return false;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.startTime = Date.now();

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.start();
      return true;
    } catch (e) {
      console.warn('AudioVoiceRecorder error:', e);
      return false;
    }
  }

  async stop(): Promise<{ base64Audio: string; durationEstimate: number }> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve({ base64Audio: '', durationEstimate: 0 });
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const durationEstimate = Math.round((Date.now() - this.startTime) / 1000);
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          resolve({ base64Audio, durationEstimate });
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks to release microphone
        this.mediaRecorder?.stream.getTracks().forEach((t) => t.stop());
      };

      this.mediaRecorder.stop();
    });
  }
}
