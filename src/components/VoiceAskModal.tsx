import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneCall,
  RefreshCw,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Send,
  Sparkles,
  Clock,
} from 'lucide-react';
import {
  VillageProfile,
  VillageMosque,
  VillageInstitute,
  VillageTransport,
  VillageHospital,
  VillageNewsEvent,
  VillageAnnouncement,
  Language,
  MandiRateItem,
  ShelterItem,
  HelpGuideItem,
  CustomSearchKeywordItem,
  FloodAlertStatus,
} from '../types';
import {
  speakText,
  stopSpeaking,
  VoiceRecognizer,
  isSpeechRecognitionSupported,
  unlockAudioContext,
  playNotificationChime,
} from '../utils/speech';
import {
  answerVoiceQuestion,
  DEFAULT_EXAMPLE_QUESTIONS,
  getVoiceErrorMessageUrdu,
  VoiceAskResult,
  SignedInOwnerContext,
  PublicHelpPostItem,
} from '../utils/voiceAskEngine';

export interface VoiceAskSharedProps {
  profiles: VillageProfile[];
  mosques: VillageMosque[];
  institutes: VillageInstitute[];
  transports: VillageTransport[];
  hospitals: VillageHospital[];
  newsEvents: VillageNewsEvent[];
  announcements: VillageAnnouncement[];
  helpNotices?: PublicHelpPostItem[];
  mandiRates?: MandiRateItem[];
  shelters?: ShelterItem[];
  helpGuides?: HelpGuideItem[];
  customKeywords?: CustomSearchKeywordItem[];
  floodAlertStatus?: FloodAlertStatus;
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
  initialLang?: Language;
  initialQuestion?: string;
  autoStartListen?: boolean;
  onClose?: () => void;
  isInlineHomeScreen?: boolean;
}

interface VoiceAskModalProps extends VoiceAskSharedProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_RECENT_QUESTIONS_KEY = 'rk_recent_voice_ask_questions_v1';

export const VoiceAskPanel: React.FC<VoiceAskSharedProps> = ({
  profiles,
  mosques,
  institutes,
  transports,
  hospitals,
  newsEvents,
  announcements,
  helpNotices,
  mandiRates,
  shelters,
  helpGuides,
  customKeywords,
  floodAlertStatus,
  signedInUser,
  userMessages,
  initialLang = 'ur',
  initialQuestion = '',
  autoStartListen = false,
  onClose,
  isInlineHomeScreen = false,
}) => {
  // Always start with Urdu by default
  const [selectedLang, setSelectedLang] = useState<Language>(initialLang || 'ur');
  const [effectiveRecogLang, setEffectiveRecogLang] = useState<Language>('ur');
  const [punjabiNoticeUrdu, setPunjabiNoticeUrdu] = useState<string>('');

  // Live speech & answer state
  const [isListening, setIsListening] = useState(false);
  const [liveWords, setLiveWords] = useState<string>('');
  const [manualInput, setManualInput] = useState<string>('');
  const [currentAnswer, setCurrentAnswer] = useState<VoiceAskResult | null>(null);
  const [isSpeakingAnswer, setIsSpeakingAnswer] = useState(false);

  // Error & Mic Test state
  const [errorBannerUrdu, setErrorBannerUrdu] = useState<string>('');
  const [micTestStatus, setMicTestStatus] = useState<'idle' | 'testing' | 'ok' | 'failed'>('idle');
  const [micTestMessage, setMicTestMessage] = useState<string>('');

  // Recent questions stored only on phone (text only, never audio recordings)
  const [recentQuestions, setRecentQuestions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_RECENT_QUESTIONS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const recognizerRef = useRef<VoiceRecognizer | null>(null);

  const saveRecentQuestion = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecentQuestions((prev) => {
      const updated = [trimmed, ...prev.filter((item) => item !== trimmed)].slice(0, 5);
      try {
        localStorage.setItem(STORAGE_RECENT_QUESTIONS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearRecentQuestions = () => {
    setRecentQuestions([]);
    try {
      localStorage.removeItem(STORAGE_RECENT_QUESTIONS_KEY);
    } catch {}
  };

  // Speak answer at normal or slow speed
  const speakAnswerAloud = (text: string, slowMode: boolean = false) => {
    unlockAudioContext();
    stopSpeaking();
    setIsSpeakingAnswer(true);
    const speechRate = slowMode ? 0.65 : 0.92;
    speakText(
      text,
      selectedLang === 'en' ? 'en' : 'ur',
      () => {
        setIsSpeakingAnswer(false);
      },
      {
        isFemaleVillageVoice: false,
        voiceGender: 'male',
        rate: speechRate,
        pitch: 1.0,
      }
    );
  };

  // Run question through the free on-phone engine
  const processQuestion = (questionText: string) => {
    const cleanQ = questionText.trim();
    if (!cleanQ) return;

    setLiveWords(cleanQ);
    setErrorBannerUrdu('');
    saveRecentQuestion(cleanQ);

    const answer = answerVoiceQuestion(
      cleanQ,
      {
        profiles,
        mosques,
        institutes,
        transports,
        hospitals,
        newsEvents,
        announcements,
        helpNotices,
        mandiRates,
        shelters,
        helpGuides,
        customKeywords,
        floodAlertStatus,
        signedInUser,
        userMessages,
        previousResult: currentAnswer,
      },
      selectedLang
    );

    setCurrentAnswer(answer);
    playNotificationChime('success');
    speakAnswerAloud(answer.spokenText, false);
  };

  // Start / Stop listening on big microphone button tap (1 tap = immediately speaks)
  const handleTapMicrophone = () => {
    unlockAudioContext();
    stopSpeaking();
    setIsSpeakingAnswer(false);
    setErrorBannerUrdu('');

    if (isListening) {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      setIsListening(false);
      if (liveWords.trim()) {
        processQuestion(liveWords);
      }
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      const errInfo = getVoiceErrorMessageUrdu('browser-unsupported', selectedLang);
      setErrorBannerUrdu(errInfo.messageUrdu);
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      const errInfo = getVoiceErrorMessageUrdu('offline', selectedLang);
      setErrorBannerUrdu(errInfo.messageUrdu);
      return;
    }

    setLiveWords('');
    setCurrentAnswer(null);
    setIsListening(true);
    playNotificationChime('start');

    const recogLangToUse: Language = selectedLang === 'pa' ? effectiveRecogLang : selectedLang;
    const vr = new VoiceRecognizer(recogLangToUse);
    recognizerRef.current = vr;

    let latestTranscript = '';

    vr.start(
      (text, isFinal) => {
        latestTranscript = text;
        setLiveWords(text);
        if (isFinal && text.trim()) {
          vr.stop();
          setIsListening(false);
          processQuestion(text);
        }
      },
      (err) => {
        setIsListening(false);
        const rawCode = String(err?.error || err?.message || err || '');

        // If Punjabi pa-PK threw language-not-supported, inform user in Urdu and continue in Urdu
        if (rawCode.includes('language-not-supported') && selectedLang === 'pa') {
          const info = getVoiceErrorMessageUrdu('language-not-supported', 'pa');
          setPunjabiNoticeUrdu(info.messageUrdu);
          setEffectiveRecogLang('ur');
          return;
        }

        const errInfo = getVoiceErrorMessageUrdu(rawCode, selectedLang);
        setErrorBannerUrdu(errInfo.messageUrdu);
      },
      () => {
        setIsListening(false);
        if (!latestTranscript.trim() && !errorBannerUrdu) {
          const noSpeechInfo = getVoiceErrorMessageUrdu('no-speech', selectedLang);
          setErrorBannerUrdu(noSpeechInfo.messageUrdu);
        }
      }
    );
  };

  useEffect(() => {
    if (initialQuestion && initialQuestion.trim()) {
      processQuestion(initialQuestion);
    } else if (autoStartListen) {
      handleTapMicrophone();
    }
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
    };
  }, [initialQuestion, autoStartListen]);

  // Language switcher with explicit Punjabi support check (never switches silently or to Hindi)
  const handleSelectLanguage = (langChoice: Language) => {
    setSelectedLang(langChoice);
    setErrorBannerUrdu('');
    setPunjabiNoticeUrdu('');

    if (langChoice === 'pa') {
      const voices =
        typeof window !== 'undefined' && 'speechSynthesis' in window
          ? window.speechSynthesis.getVoices()
          : [];
      const hasPunjabiVoice = voices.some((v) => v.lang.toLowerCase().startsWith('pa'));

      if (!hasPunjabiVoice) {
        const info = getVoiceErrorMessageUrdu('punjabi-unsupported', 'pa');
        setPunjabiNoticeUrdu(info.messageUrdu);
        setEffectiveRecogLang('ur');
      } else {
        setEffectiveRecogLang('pa');
      }
    } else {
      setEffectiveRecogLang(langChoice);
    }
  };

  // Microphone Test ("مائیک ٹیسٹ")
  const handleMicTest = async () => {
    unlockAudioContext();
    stopSpeaking();
    setErrorBannerUrdu('');
    setMicTestStatus('testing');
    setMicTestMessage('مائیک چیک کیا جا رہا ہے...');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicTestStatus('failed');
      const info = getVoiceErrorMessageUrdu('browser-unsupported', selectedLang);
      setMicTestMessage(info.messageUrdu);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Release stream immediately (never record or store audio)
      stream.getTracks().forEach((track) => track.stop());
      setMicTestStatus('ok');
      const okMsg =
        '✅ مائیک بالکل ٹھیک کام کر رہا ہے! اب اوپر بڑا بٹن "بول کر پوچھیں" دبا کر بات کریں۔';
      setMicTestMessage(okMsg);
      speakAnswerAloud('مائیک بالکل ٹھیک کام کر رہا ہے۔ اب آپ سوال پوچھ سکتے ہیں۔', false);
    } catch {
      setMicTestStatus('failed');
      const info = getVoiceErrorMessageUrdu('not-allowed', selectedLang);
      setMicTestMessage(info.messageUrdu);
    }
  };

  return (
    <div
      className={
        isInlineHomeScreen
          ? 'bg-stone-50 border-3 border-emerald-700 rounded-3xl overflow-hidden shadow-xl mb-3 font-nastaliq'
          : 'bg-stone-50 border-4 border-emerald-600 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl my-auto flex flex-col max-h-[95vh] font-nastaliq'
      }
    >
      {/* Top Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white p-3.5 sm:p-4 flex items-center justify-between border-b-2 border-amber-400">
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center shadow-md shrink-0">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-amber-300 leading-tight">
              بول کر پوچھیں (رتہ کلاں مددگار)
            </h2>
            <p className="text-xs text-emerald-100">
              بزرگوں اور سب گاؤں والوں کے لیے مفت صوتی مددگار
            </p>
          </div>
        </div>

        {onClose && !isInlineHomeScreen && (
          <button
            type="button"
            onClick={onClose}
            className="min-w-[48px] min-h-[48px] rounded-2xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition cursor-pointer"
            title="بند کریں"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="p-3.5 sm:p-5 overflow-y-auto space-y-4">
        {/* Language Buttons (اردو default, پنجابی, English) + Mic Test ("مائیک ٹیسٹ") */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleSelectLanguage('ur')}
              className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-sm font-bold transition cursor-pointer ${
                selectedLang === 'ur'
                  ? 'bg-emerald-700 text-white shadow'
                  : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
              }`}
            >
              اردو
            </button>
            <button
              type="button"
              onClick={() => handleSelectLanguage('pa')}
              className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-sm font-bold transition cursor-pointer ${
                selectedLang === 'pa'
                  ? 'bg-emerald-700 text-white shadow'
                  : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
              }`}
            >
              پنجابی
            </button>
            <button
              type="button"
              onClick={() => handleSelectLanguage('en')}
              className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-sm font-bold font-sans transition cursor-pointer ${
                selectedLang === 'en'
                  ? 'bg-emerald-700 text-white shadow'
                  : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
              }`}
            >
              English
            </button>
          </div>

          <button
            type="button"
            onClick={handleMicTest}
            className="min-h-[44px] px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-400 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition"
          >
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>مائیک ٹیسٹ</span>
          </button>
        </div>

        {/* Punjabi Fallback Notice (Never fail silently, never switch to Hindi) */}
        {punjabiNoticeUrdu && (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-3 text-amber-950 text-sm font-bold leading-relaxed flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <span>{punjabiNoticeUrdu}</span>
          </div>
        )}

        {/* Mic Test Result Banner */}
        {micTestStatus !== 'idle' && micTestMessage && (
          <div
            className={`rounded-2xl p-3 text-sm font-bold border-2 flex items-start justify-between gap-2 ${
              micTestStatus === 'ok'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                : micTestStatus === 'failed'
                ? 'bg-red-50 border-red-400 text-red-950'
                : 'bg-blue-50 border-blue-300 text-blue-950'
            }`}
          >
            <span>{micTestMessage}</span>
            <button
              type="button"
              onClick={() => setMicTestStatus('idle')}
              className="text-xs underline shrink-0 cursor-pointer"
            >
              بند کریں
            </button>
          </div>
        )}

        {/* VERY BIG MICROPHONE BUTTON (>= 56px, built at 80px height; 1 tap = immediately speaks) */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleTapMicrophone}
            className={`w-full min-h-[80px] py-4 px-5 rounded-3xl font-bold text-xl sm:text-2xl shadow-xl border-4 flex items-center justify-center gap-3.5 transition active:scale-98 cursor-pointer ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 text-white border-amber-300 animate-pulse'
                : 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white border-amber-400'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-white text-emerald-900 flex items-center justify-center shadow-md shrink-0">
              {isListening ? (
                <MicOff className="w-8 h-8 text-red-600 animate-bounce" />
              ) : (
                <Mic className="w-8 h-8 text-emerald-700" />
              )}
            </div>
            <div className="text-right">
              <span className="block text-xl sm:text-2xl font-bold leading-snug">
                {isListening ? 'اب بولیں... (سن رہا ہے)' : '🎤 بول کر پوچھیں'}
              </span>
              <span className="block text-xs sm:text-sm text-emerald-100 font-normal">
                {isListening
                  ? 'بات مکمل ہونے پر خود جواب ملے گا'
                  : 'یہاں ایک بار دبائیں اور اپنا سوال بولیں'}
              </span>
            </div>
          </button>
        </div>

        {/* LIVE SPOKEN WORDS IN LARGE TEXT */}
        {(isListening || liveWords) && (
          <div className="bg-white border-2 border-emerald-500 rounded-2xl p-4 text-center shadow-sm">
            <span className="text-xs font-bold text-stone-500 block mb-1">
              آپ کے بولے گئے الفاظ:
            </span>
            <p className="text-xl sm:text-2xl font-bold text-stone-900 leading-relaxed">
              {liveWords || 'سن رہا ہے... براہ کرم بولیں'}
            </p>
          </div>
        )}

        {/* CLEAR URDU ERROR MESSAGE WITH RETRY BUTTON */}
        {errorBannerUrdu && (
          <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-4 space-y-3 text-right shadow-sm">
            <div className="flex items-start gap-2.5 text-red-950">
              <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <p className="text-base font-bold leading-relaxed">{errorBannerUrdu}</p>
            </div>
            <button
              type="button"
              onClick={handleTapMicrophone}
              className="w-full min-h-[56px] bg-red-600 hover:bg-red-700 text-white font-bold text-base rounded-2xl shadow flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <RefreshCw className="w-5 h-5" />
              <span>دوبارہ کوشش کریں</span>
            </button>
          </div>
        )}

        {/* ANSWER CARD + POST-ANSWER ACTION BUTTONS + CALL BUTTONS */}
        {currentAnswer && (
          <div className="bg-emerald-50/90 border-2 border-emerald-600 rounded-3xl p-4 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
              <span className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <span>رتہ کلاں پورٹل کا جواب:</span>
              </span>
              {isSpeakingAnswer && (
                <button
                  type="button"
                  onClick={() => {
                    stopSpeaking();
                    setIsSpeakingAnswer(false);
                  }}
                  className="px-3 py-1 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <VolumeX className="w-4 h-4" />
                  <span>آواز روکیں</span>
                </button>
              )}
            </div>

            {/* Large Answer Text */}
            <div className="text-lg sm:text-xl font-bold text-stone-900 leading-loose whitespace-pre-line bg-white p-3.5 rounded-2xl border border-emerald-200">
              {currentAnswer.displayText}
            </div>

            {/* How-To Target Button Highlight */}
            {currentAnswer.buttonToTap && (
              <div className="bg-amber-100 border-2 border-amber-500 text-stone-950 p-3 rounded-2xl text-sm sm:text-base font-extrabold flex items-center justify-between gap-2">
                <span>👉 یہ بٹن دبائیں:</span>
                <span className="bg-emerald-800 text-amber-300 px-3 py-1 rounded-xl">
                  {currentAnswer.buttonToTap}
                </span>
              </div>
            )}

            {/* Staleness Warning if old */}
            {currentAnswer.stalenessNotice && (
              <div className="bg-amber-100 border border-amber-400 text-amber-950 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-800 shrink-0" />
                <span>{currentAnswer.stalenessNotice}</span>
              </div>
            )}

            {/* Clarification Big Option Buttons if Unclear */}
            {currentAnswer.needsClarification && currentAnswer.clarificationOptions && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {currentAnswer.clarificationOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => processQuestion(opt)}
                    className="min-h-[56px] p-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold text-base shadow border-2 border-amber-600 cursor-pointer transition"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Short List of Best Matches with Big Call Button */}
            {currentAnswer.matchedItems && currentAnswer.matchedItems.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-emerald-950 block">
                  بہترین نتائج (فوری رابطہ اور تفصیل):
                </span>
                {currentAnswer.matchedItems.map((mItem) => (
                  <div
                    key={mItem.id}
                    className="bg-white border-2 border-emerald-500 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs"
                  >
                    <div className="text-right space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-base text-stone-900">
                          {mItem.title}
                        </span>
                        {mItem.badgeText && (
                          <span className="text-[11px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-bold border border-emerald-300">
                            {mItem.badgeText}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-600 font-bold">
                        {mItem.categoryLabel} — 📍 {mItem.area}
                      </div>
                      {mItem.phone && (
                        <div className="font-mono font-bold text-sm text-emerald-800" dir="ltr">
                          {mItem.phone}
                        </div>
                      )}
                    </div>

                    {mItem.phone && (
                      <a
                        href={`tel:${mItem.phone.replace(/[^0-9+]/g, '')}`}
                        className="min-h-[56px] px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-base rounded-2xl shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer transition active:scale-95"
                      >
                        <PhoneCall className="w-5 h-5" />
                        <span>فون کریں</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Direct "فون کریں" (Call) Button Next to Every Phone Number (when not already shown in matchedItems) */}
            {(!currentAnswer.matchedItems || currentAnswer.matchedItems.length === 0) &&
              currentAnswer.phoneNumbers.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-emerald-950 block">
                    فوری رابطہ نمبر (ملا کر بات کریں):
                  </span>
                  {currentAnswer.phoneNumbers.map((item, idx) => (
                    <div
                      key={`${item.phone}-${idx}`}
                      className="bg-white border-2 border-emerald-400 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="text-right overflow-hidden">
                        <div className="font-bold text-base text-stone-900 truncate">
                          {item.label}
                        </div>
                        <div className="font-mono font-bold text-sm text-emerald-800" dir="ltr">
                          {item.phone}
                        </div>
                        {item.sublabel && (
                          <div className="text-xs text-stone-500 truncate">{item.sublabel}</div>
                        )}
                      </div>

                      <a
                        href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`}
                        className="min-h-[56px] px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base rounded-2xl shadow flex items-center gap-2 shrink-0 cursor-pointer transition active:scale-95"
                      >
                        <PhoneCall className="w-5 h-5" />
                        <span>فون کریں</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}

            {/* Quick Follow-Up Question Buttons ("اور کوئی؟", "اس کا نمبر؟", "دوبارہ بتاؤ") */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-bold text-emerald-950">اگلا سوال:</span>
              {['اور کوئی؟', 'اس کا نمبر؟', 'دوبارہ بتاؤ'].map((followUpQ) => (
                <button
                  key={followUpQ}
                  type="button"
                  onClick={() => processQuestion(followUpQ)}
                  className="min-h-[42px] px-3.5 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-emerald-950 border-2 border-emerald-500 text-xs sm:text-sm font-bold cursor-pointer transition"
                >
                  {followUpQ}
                </button>
              ))}
            </div>

            {/* 3 Post-Answer Control Buttons: دوبارہ سنیں | آہستہ سنیں | دوبارہ پوچھیں */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                type="button"
                onClick={() => speakAnswerAloud(currentAnswer.spokenText, false)}
                className="min-h-[56px] p-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm sm:text-base shadow flex flex-col items-center justify-center gap-1 cursor-pointer transition active:scale-95"
              >
                <Volume2 className="w-5 h-5" />
                <span>دوبارہ سنیں</span>
              </button>

              <button
                type="button"
                onClick={() => speakAnswerAloud(currentAnswer.spokenText, true)}
                className="min-h-[56px] p-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-sm sm:text-base shadow flex flex-col items-center justify-center gap-1 cursor-pointer transition active:scale-95"
              >
                <Volume2 className="w-5 h-5" />
                <span>آہستہ سنیں</span>
              </button>

              <button
                type="button"
                onClick={handleTapMicrophone}
                className="min-h-[56px] p-2.5 rounded-2xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-sm sm:text-base shadow flex flex-col items-center justify-center gap-1 cursor-pointer transition active:scale-95"
              >
                <Mic className="w-5 h-5 text-amber-300" />
                <span>دوبارہ پوچھیں</span>
              </button>
            </div>
          </div>
        )}

        {/* BIG EXAMPLE BUTTONS TO TAP INSTEAD OF SPEAKING */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-stone-700 font-bold text-sm px-1">
            <HelpCircle className="w-4 h-4 text-emerald-700" />
            <span>بولنے کے بجائے نیچے بڑا بٹن دبا کر بھی پوچھ سکتے ہیں:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DEFAULT_EXAMPLE_QUESTIONS.map((exampleText) => (
              <button
                key={exampleText}
                type="button"
                onClick={() => processQuestion(exampleText)}
                className="min-h-[58px] px-4 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-stone-900 font-bold text-base sm:text-lg border-2 border-emerald-400 shadow-sm flex items-center justify-between gap-2 text-right cursor-pointer transition active:scale-98"
              >
                <span>{exampleText}</span>
                <Volume2 className="w-5 h-5 text-emerald-700 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Typing Fallback Box (Always works offline & without mic) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (manualInput.trim()) {
              processQuestion(manualInput);
              setManualInput('');
            }
          }}
          className="bg-white p-2.5 rounded-2xl border border-stone-300 flex gap-2"
        >
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="یا اپنا سوال یہاں لکھیں (مثلاً: بجلی والا، مستری، ہسپتال)..."
            className="flex-1 px-3 py-2.5 rounded-xl bg-stone-100 text-stone-900 text-sm sm:text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <button
            type="submit"
            className="min-h-[48px] px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>پوچھیں</span>
          </button>
        </form>

        {/* Recent Questions Stored on Phone (With Clear Button, Zero Audio Saved) */}
        {recentQuestions.length > 0 && (
          <div className="bg-stone-100 rounded-2xl p-3 space-y-2 border border-stone-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-600">
                آپ کے حالیہ سوالات (صرف آپ کے فون پر):
              </span>
              <button
                type="button"
                onClick={handleClearRecentQuestions}
                className="text-xs font-bold text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حالیہ سوالات صاف کریں</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recentQuestions.map((rq) => (
                <button
                  key={rq}
                  type="button"
                  onClick={() => processQuestion(rq)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-stone-800 text-xs sm:text-sm font-bold hover:bg-emerald-50 cursor-pointer"
                >
                  {rq}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const VoiceAskModal: React.FC<VoiceAskModalProps> = ({
  isOpen,
  onClose,
  ...rest
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopSpeaking();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopSpeaking();
          onClose();
        }
      }}
    >
      <VoiceAskPanel {...rest} onClose={onClose} isInlineHomeScreen={false} />
    </div>
  );
};
