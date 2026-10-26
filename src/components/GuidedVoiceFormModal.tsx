import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Volume2,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { Language } from '../types';
import {
  speakText,
  stopSpeaking,
  playNotificationChime,
  VoiceRecognizer,
  isSpeechRecognitionSupported,
  unlockAudioContext,
} from '../utils/speech';
import { parseSpokenPhoneNumber, parseSpokenEmail } from '../utils/voiceFormHelper';

export interface GuidedFormData {
  name: string;
  mobile: string;
  address: string;
  businessName: string;
  category: string;
  customCategory: string;
  services: string[];
  email: string;
}

interface GuidedVoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onFormCompleted: (data: GuidedFormData) => void;
}

interface StepQuestion {
  key: keyof GuidedFormData;
  promptUrdu: string;
  promptPunjabi: string;
  promptEnglish: string;
  placeholder: string;
  type: 'text' | 'phone' | 'email';
}

const QUESTIONS: StepQuestion[] = [
  {
    key: 'name',
    promptUrdu: 'آپ کا نام کیا ہے؟',
    promptPunjabi: 'تہاڈا ناں کی اے؟',
    promptEnglish: 'What is your name?',
    placeholder: 'مثلاً: محمد ارشد',
    type: 'text',
  },
  {
    key: 'mobile',
    promptUrdu: 'آپ کا موبائل نمبر کیا ہے؟',
    promptPunjabi: 'تہاڈا موبائل نمبر کی اے؟',
    promptEnglish: 'What is your mobile number?',
    placeholder: '0300-1234567',
    type: 'phone',
  },
  {
    key: 'address',
    promptUrdu: 'آپ کہاں رہتے ہیں؟',
    promptPunjabi: 'تسی کیتھے رہندے او؟',
    promptEnglish: 'Where do you live in Ratta Kallan?',
    placeholder: 'مثلاً: محلہ عید گاہ، رتہ کلاں',
    type: 'text',
  },
  {
    key: 'businessName',
    promptUrdu: 'آپ کا کام یا کاروبار کیا ہے؟',
    promptPunjabi: 'تہاڈا کم کار یا دکان کی اے؟',
    promptEnglish: 'What is your trade or shop name?',
    placeholder: 'مثلاً: ارشد الیکٹریشن اینڈ موٹر وائنڈنگ',
    type: 'text',
  },
  {
    key: 'services',
    promptUrdu: 'آپ کون سی خدمات دیتے ہیں؟',
    promptPunjabi: 'تسی کیہڑیاں خذمتاں دیندے او؟',
    promptEnglish: 'What services or skills do you provide?',
    placeholder: 'مثلاً: موٹر وائنڈنگ، بجلی فٹنگ، استری مرمت',
    type: 'text',
  },
  {
    key: 'email',
    promptUrdu: 'آپ کا ای میل کیا ہے؟',
    promptPunjabi: 'تہاڈا ای میل کی اے؟',
    promptEnglish: 'What is your email address?',
    placeholder: 'name@example.com',
    type: 'email',
  },
];

export const GuidedVoiceFormModal: React.FC<GuidedVoiceFormModalProps> = ({
  isOpen,
  onClose,
  lang,
  onFormCompleted,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [formData, setFormData] = useState<GuidedFormData>({
    name: '',
    mobile: '',
    address: '',
    businessName: '',
    category: 'other',
    customCategory: '',
    services: [],
    email: '',
  });

  const [isListening, setIsListening] = useState(false);
  const [selectedVoiceLang, setSelectedVoiceLang] = useState<Language>(lang);
  const [voiceError, setVoiceError] = useState<string>('');
  const recognizerRef = useRef<VoiceRecognizer | null>(null);

  const currentQ = QUESTIONS[currentStepIdx];

  // Ask question aloud when moving to a step
  useEffect(() => {
    if (isOpen && currentQ && !isAwaitingConfirmation) {
      const prompt =
        selectedVoiceLang === 'pa'
          ? currentQ.promptPunjabi
          : selectedVoiceLang === 'en'
          ? currentQ.promptEnglish
          : currentQ.promptUrdu;

      const timer = setTimeout(() => {
        unlockAudioContext();
        speakText(prompt, selectedVoiceLang, () => {
          // Automatically start microphone after question
          startListeningForAnswer();
        });
      }, 350);

      return () => {
        clearTimeout(timer);
        stopSpeaking();
      };
    }
  }, [currentStepIdx, isAwaitingConfirmation, isOpen, selectedVoiceLang]);

  if (!isOpen) return null;

  const startListeningForAnswer = () => {
    if (!isSpeechRecognitionSupported()) {
      setVoiceError('اس براؤزر میں مائیکروفون کی سہولت دستیاب نہیں ہے، برائے مہربانی گوگل کروم استعمال کریں۔');
      return;
    }
    setVoiceError('');
    setIsListening(true);

    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }

    const vr = new VoiceRecognizer(selectedVoiceLang);
    recognizerRef.current = vr;

    vr.start(
      (transcript, isFinal) => {
        let processed = transcript;
        if (currentQ.type === 'phone') {
          processed = parseSpokenPhoneNumber(transcript);
        } else if (currentQ.type === 'email') {
          processed = parseSpokenEmail(transcript);
        }

        setCurrentAnswer(processed);

        if (isFinal && processed.trim()) {
          vr.stop();
          setIsListening(false);
          askForConfirmation(processed);
        }
      },
      (err: any) => {
        setIsListening(false);
        const errStr = String(err?.error || err?.message || err || '');
        if (errStr.includes('not-allowed')) {
          setVoiceError('مائیکروفون کی اجازت نہیں ملی۔ براہ کرم براؤزر کی سیٹنگ سے اجازت دیں۔');
        } else if (errStr.includes('no-speech')) {
          setVoiceError('کوئی آواز نہیں سنی گئی۔ براہ کرم مائیک کے قریب آ کر دوبارہ بولیں۔');
        } else {
          setVoiceError('آواز سننے میں مسئلہ پیش آیا۔ آپ نیچے لکھ بھی سکتے ہیں۔');
        }
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const askForConfirmation = (answer: string) => {
    setIsAwaitingConfirmation(true);
    unlockAudioContext();
    const confirmPrompt =
      selectedVoiceLang === 'pa'
        ? `تسی آکھیا: ${answer}۔ کی ایہ ٹھیک اے؟`
        : selectedVoiceLang === 'en'
        ? `You said: ${answer}. Is this correct?`
        : `آپ نے کہا: ${answer}۔ کیا یہ درست ہے؟`;

    playNotificationChime('chime');
    speakText(confirmPrompt, selectedVoiceLang);
  };

  const handleConfirmAnswer = () => {
    stopSpeaking();
    playNotificationChime('success');

    // Save to formData
    const key = currentQ.key;
    const updated = { ...formData };
    if (key === 'services') {
      updated.services = currentAnswer.split(/[,،\n]+/).map((s) => s.trim()).filter(Boolean);
    } else {
      (updated as any)[key] = currentAnswer;
    }

    if (key === 'businessName') {
      updated.customCategory = currentAnswer;
    }

    setFormData(updated);
    setIsAwaitingConfirmation(false);
    setCurrentAnswer('');

    if (currentStepIdx < QUESTIONS.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    } else {
      // Completed all questions
      playNotificationChime('success');
      speakText('ماشاء اللہ! تمام سوالات مکمل ہو گئے۔ براہ کرم فارم چیک کر کے محفوظ کریں۔', selectedVoiceLang);
      onFormCompleted(updated);
      onClose();
    }
  };

  const handleRetryAnswer = () => {
    stopSpeaking();
    setIsAwaitingConfirmation(false);
    setCurrentAnswer('');
    startListeningForAnswer();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border-2 border-emerald-600 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200 font-nastaliq">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-amber-200">
                بول کر فارم بھریں (صوتی رہنمائی)
              </h3>
              <p className="text-[11px] text-emerald-200">
                سوال سنیں، جواب بولیں اور خودکار فارم مکمل کریں
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <select
              value={selectedVoiceLang}
              onChange={(e) => setSelectedVoiceLang(e.target.value as Language)}
              className="bg-black/40 text-amber-300 text-xs rounded-xl px-2.5 py-1.5 border border-white/20 font-sans focus:outline-none"
            >
              <option value="ur">اردو</option>
              <option value="pa">پنجابی</option>
              <option value="en">English</option>
            </select>

            <button
              onClick={() => {
                stopSpeaking();
                if (recognizerRef.current) recognizerRef.current.stop();
                onClose();
              }}
              className="p-1.5 text-stone-300 hover:text-white rounded-full bg-black/30 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-stone-100 h-2 w-full flex">
          {QUESTIONS.map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 transition-all duration-300 ${
                idx <= currentStepIdx ? 'bg-emerald-600' : 'bg-stone-200'
              }`}
            />
          ))}
        </div>

        {/* Question & Answer Body */}
        <div className="p-5 sm:p-6 space-y-5 text-center">
          <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full text-xs font-bold">
            سوال نمبر {currentStepIdx + 1} از {QUESTIONS.length}
          </span>

          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 leading-relaxed">
            {selectedVoiceLang === 'pa'
              ? currentQ.promptPunjabi
              : selectedVoiceLang === 'en'
              ? currentQ.promptEnglish
              : currentQ.promptUrdu}
          </h2>

          {/* Voice listening status or error */}
          {voiceError ? (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{voiceError}</span>
            </div>
          ) : isListening ? (
            <div className="flex items-center justify-center gap-2 text-emerald-700 animate-pulse text-sm font-bold">
              <Mic className="w-5 h-5 text-red-600" />
              <span>پورٹل سن رہا ہے... بولئے</span>
            </div>
          ) : (
            <div className="text-stone-400 text-xs">
              جواب بولنے کے لیے مائیکروفون پر کلک کریں
            </div>
          )}

          {/* Answer Preview Box (with typing fallback) */}
          <div className="space-y-1.5 text-right">
            <label className="text-xs font-bold text-stone-700 block">
              آپ کا جواب (سن کر یا لکھ کر درست کریں):
            </label>
            <div className="relative">
              <input
                type="text"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder={currentQ.placeholder}
                className="w-full p-3.5 bg-stone-50 border-2 border-stone-300 rounded-2xl text-center text-base sm:text-lg font-bold text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white shadow-inner font-sans"
              />
              <button
                type="button"
                onClick={startListeningForAnswer}
                className={`absolute left-3 top-3 p-2 rounded-xl transition ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                }`}
                title="بولیں"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Confirmation Controls or Navigation */}
          {isAwaitingConfirmation ? (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-bold text-amber-950">
                کیا آپ کا درج شدہ جواب بالکل درست ہے؟
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRetryAnswer}
                  className="flex-1 py-3 bg-stone-200 hover:bg-stone-300 text-stone-900 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                >
                  <RotateCcw className="w-4 h-4 text-stone-700" />
                  <span>دوبارہ بولیں</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAnswer}
                  className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg transition active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>جی ہاں، درست ہے</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-2">
              {currentStepIdx > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    stopSpeaking();
                    setCurrentStepIdx((prev) => prev - 1);
                    setIsAwaitingConfirmation(false);
                  }}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  پیچھے
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (currentAnswer.trim()) {
                    askForConfirmation(currentAnswer);
                  } else {
                    startListeningForAnswer();
                  }
                }}
                className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <span>اگلا سوال ➔</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
