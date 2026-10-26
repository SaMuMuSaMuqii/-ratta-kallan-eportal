import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Mic,
  MicOff,
  PhoneCall,
  Sliders,
  CheckCircle2,
  X,
  HelpCircle,
  Stethoscope,
  Tractor,
  Zap,
  Hammer,
  GraduationCap,
  Bus,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Language } from '../types';
import {
  speakText,
  stopSpeaking,
  playNotificationChime,
  getSpeechRate,
  setSpeechRate,
  unlockAudioContext,
  VoiceRecognizer,
  isSpeechRecognitionSupported,
  cleanSpeechText,
} from '../utils/speech';

interface AiVillageAssistantProps {
  lang: Language;
  onOpenTerms?: () => void;
  onSearch?: (query: string) => void;
  onOpenSchool?: () => void;
  onOpenMosques?: () => void;
  onOpenTransport?: () => void;
  onOpenHospitals?: () => void;
}

interface VoiceTopic {
  id: string;
  title: string;
  icon: string;
  spokenUrdu: string;
  categoryFilter?: string;
  actionType?: 'search' | 'school' | 'mosques' | 'transport' | 'hospitals' | 'terms';
}

export const AiVillageAssistant: React.FC<AiVillageAssistantProps> = ({
  lang,
  onOpenTerms,
  onSearch,
  onOpenSchool,
  onOpenMosques,
  onOpenTransport,
  onOpenHospitals,
}) => {
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');

  // Speech rate
  const [speed, setSpeed] = useState<number>(() => getSpeechRate());

  // UI state
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Live Microphone Listening state
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const [recognizedVoiceQuery, setRecognizedVoiceQuery] = useState<string>('');
  const voiceRecognizerRef = useRef<VoiceRecognizer | null>(null);

  // Equalizer visualizer animation state
  const [equalizerBars, setEqualizerBars] = useState<number[]>([40, 70, 30, 85, 50, 90, 60, 45]);

  useEffect(() => {
    let eqTimer: any;
    if (isPlaying) {
      eqTimer = setInterval(() => {
        setEqualizerBars([
          Math.floor(25 + Math.random() * 75),
          Math.floor(30 + Math.random() * 70),
          Math.floor(20 + Math.random() * 80),
          Math.floor(40 + Math.random() * 60),
          Math.floor(25 + Math.random() * 75),
          Math.floor(35 + Math.random() * 65),
          Math.floor(20 + Math.random() * 80),
          Math.floor(30 + Math.random() * 70),
        ]);
      }, 140);
    } else {
      setEqualizerBars([20, 25, 20, 30, 20, 25, 20, 20]);
    }
    return () => clearInterval(eqTimer);
  }, [isPlaying]);

  // Neutral voice topics for villagers
  const VOICE_TOPICS: VoiceTopic[] = [
    {
      id: 'welcome',
      title: 'خوش آمدید (رتہ کلاں مددگار)',
      icon: '👋',
      spokenUrdu:
        'السلام علیکم! رتہ کلاں پورٹل میں خوش آمدید۔ آپ یہاں کسی بھی کاریگر، ڈاکٹر، مستری، ٹریکٹر، اسکول اور مساجد کی معلومات آواز کے ذریعے حاصل کر سکتے ہیں۔',
    },
    {
      id: 'doctor',
      title: 'ڈاکٹر اور ایمرجنسی 1122',
      icon: '🩺',
      spokenUrdu:
        'رتہ کلاں اور اردگرد تمام ڈاکٹرز، کلینکس اور ریسکیو 1122 ایمرجنسی سروسز چوبیس گھنٹے حاضر ہیں۔ بنیادی مرکزِ صحت سے فوری رابطہ کریں۔',
      categoryFilter: 'ڈاکٹر',
      actionType: 'hospitals',
    },
    {
      id: 'tractor',
      title: 'زرعی ٹریکٹر و تھریشر',
      icon: '🚜',
      spokenUrdu:
        'فصلوں کی بوائی، ہل چلانے اور زرعی کاموں کے لیے ٹریکٹر سروس اور دیگر ماہر ڈرائیورز دستیاب ہیں۔',
      categoryFilter: 'ٹریکٹر',
      actionType: 'search',
    },
    {
      id: 'electrician',
      title: 'الیکٹریشن و سولر سسٹم',
      icon: '⚡',
      spokenUrdu:
        'سولر پینل فٹنگ، ٹیوب ویل موٹر وائنڈنگ اور گھریلو وائرنگ کے لیے تجربہ کار کاریگر حاضر ہیں۔',
      categoryFilter: 'الیکٹریشن',
      actionType: 'search',
    },
    {
      id: 'mistri',
      title: 'مستری و تعمیراتی کام',
      icon: '🔨',
      spokenUrdu:
        'مکان کی چنائی، لینٹر ڈالنے، پلستر اور ٹائلوں کے تجربہ کار مستری مناسب دیہاڑی پر دستیاب ہیں۔',
      categoryFilter: 'مستری',
      actionType: 'search',
    },
    {
      id: 'school',
      title: 'ورچوئل اسکول و ہوم ورک',
      icon: '🎒',
      spokenUrdu:
        'ورچوئل اسکول میں نرسری سے دسویں جماعت تک مفت صوتی تعلیم، روزانہ کا ہوم ورک اور کوئز دستیاب ہیں۔',
      actionType: 'school',
    },
    {
      id: 'mosques',
      title: 'مساجد و اوقاتِ نماز',
      icon: '🕌',
      spokenUrdu:
        'رتہ کلاں کی تمام مساجد کے اوقاتِ نماز، امام صاحبان کے نام اور جمعہ کے اوقات پورٹل پر موجود ہیں۔',
      actionType: 'mosques',
    },
    {
      id: 'transport',
      title: 'جھنگ گاڑیاں و وینز',
      icon: '🚐',
      spokenUrdu:
        'رتہ کلاں اڈا سے جھنگ جانے والی وینز، بسوں کے اوقات اور کرائے کی تفصیلات جانیے۔',
      actionType: 'transport',
    },
    {
      id: 'rules',
      title: 'پورٹل کے رہنما اصول',
      icon: '📜',
      spokenUrdu:
        'ضروری ہدایات: یہ پورٹل صرف روزگار اور باہمی تعاون کے لیے ہے۔ خواتین کا ڈیٹا شیئر کرنا اور فرقہ واریت سخت منع ہے۔',
      actionType: 'terms',
    },
  ];

  // Speak a selected voice topic
  const handlePlayTopic = (topic: VoiceTopic) => {
    unlockAudioContext();
    if (isPlaying && activeTopicId === topic.id) {
      stopSpeaking();
      setIsPlaying(false);
      setActiveTopicId(null);
      return;
    }

    stopSpeaking();
    setIsPlaying(true);
    setActiveTopicId(topic.id);
    setSpokenTranscript(topic.spokenUrdu);
    playNotificationChime('start');

    speakText(
      cleanSpeechText(topic.spokenUrdu),
      lang,
      () => {
        setIsPlaying(false);
        setActiveTopicId(null);
      },
      {
        rate: getSpeechRate(),
        pitch: 1.0,
      }
    );

    // Trigger associated action if specified
    if (topic.actionType === 'search' && topic.categoryFilter && onSearch) {
      onSearch(topic.categoryFilter);
    } else if (topic.actionType === 'school' && onOpenSchool) {
      onOpenSchool();
    } else if (topic.actionType === 'mosques' && onOpenMosques) {
      onOpenMosques();
    } else if (topic.actionType === 'transport' && onOpenTransport) {
      onOpenTransport();
    } else if (topic.actionType === 'hospitals' && onOpenHospitals) {
      onOpenHospitals();
    } else if (topic.actionType === 'terms' && onOpenTerms) {
      onOpenTerms();
    }
  };

  // Live Microphone Assistant: Listen to spoken Urdu and intelligently respond
  const handleStartMic = () => {
    unlockAudioContext();
    if (isListeningMic) {
      if (voiceRecognizerRef.current) {
        voiceRecognizerRef.current.stop();
      }
      setIsListeningMic(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      alert('مائیکروفون اس براؤزر میں سپورٹ نہیں ہے، براہ کرم نیچے دیے گئے موضوعات پر کلک کریں۔');
      return;
    }

    const vr = new VoiceRecognizer(lang);
    voiceRecognizerRef.current = vr;
    setIsListeningMic(true);
    setRecognizedVoiceQuery('');
    playNotificationChime('start');

    vr.start(
      (transcript, isFinal) => {
        setRecognizedVoiceQuery(transcript);
        if (isFinal) {
          setIsListeningMic(false);
          processVoiceQuery(transcript);
        }
      },
      (err) => {
        console.warn('Voice recognizer error:', err);
        setIsListeningMic(false);
      },
      () => {
        setIsListeningMic(false);
      }
    );
  };

  // Process voice query
  const processVoiceQuery = (rawQuery: string) => {
    const q = rawQuery.trim();
    if (!q) return;

    if (q.includes('ڈاکٹر') || q.includes('ہسپتال') || q.includes('طبیعت') || q.includes('کلینک') || q.includes('1122')) {
      const top = VOICE_TOPICS.find((t) => t.id === 'doctor');
      if (top) handlePlayTopic(top);
    } else if (q.includes('ٹریکٹر') || q.includes('ہل') || q.includes('زمین') || q.includes('تھریشر')) {
      const top = VOICE_TOPICS.find((t) => t.id === 'tractor');
      if (top) handlePlayTopic(top);
    } else if (q.includes('الیکٹریشن') || q.includes('بجلی') || q.includes('موٹر') || q.includes('سولر')) {
      const top = VOICE_TOPICS.find((t) => t.id === 'electrician');
      if (top) handlePlayTopic(top);
    } else if (q.includes('مستری') || q.includes('تعمیر') || q.includes('مکان') || q.includes('لینٹر')) {
      const top = VOICE_TOPICS.find((t) => t.id === 'mistri');
      if (top) handlePlayTopic(top);
    } else if (q.includes('اسکول') || q.includes('تعلیم') || q.includes('پڑھائی') || q.includes('بچے') || q.includes('ہوم ورک')) {
      const top = VOICE_TOPICS.find((t) => t.id === 'school');
      if (top) handlePlayTopic(top);
    } else if (q.includes('نماز') || q.includes('مسجد') || q.includes('اذان') || q.includes('جمعہ')) {
      const top = VOICE_TOPICS.find((t) => t.id === 'mosques');
      if (top) handlePlayTopic(top);
    } else if (q.includes('گاڑی') || q.includes('وین') || q.includes('بس') || q.includes('جھنگ') || q.includes('کرایہ')) {
      const top = VOICE_TOPICS.find((t) => t.id === 'transport');
      if (top) handlePlayTopic(top);
    } else {
      if (onSearch) {
        onSearch(q);
      }
      speakText(
        `آپ نے پوچھا: ${q}۔ رتہ کلاں پورٹل میں تلاش کیا جا رہا ہے۔`,
        lang,
        undefined,
        { rate: getSpeechRate(), pitch: 1.0 }
      );
    }
  };

  const handleStopAll = () => {
    stopSpeaking();
    setIsPlaying(false);
    setActiveTopicId(null);
    if (isListeningMic && voiceRecognizerRef.current) {
      voiceRecognizerRef.current.stop();
      setIsListeningMic(false);
    }
  };

  const handleTestVoice = () => {
    const welcome = VOICE_TOPICS[0];
    handlePlayTopic(welcome);
  };

  const handleChangeSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
    setSpeechRate(newSpeed);
  };

  return (
    <>
      {/* 1. FLOATING QUICK-ACCESS ORB (Always visible in bottom left corner) */}
      <button
        onClick={() => {
          setIsModalOpen(true);
          unlockAudioContext();
        }}
        className="fixed bottom-20 sm:bottom-6 left-3 sm:left-6 z-40 bg-gradient-to-r from-emerald-800 via-teal-800 to-green-900 hover:from-emerald-700 hover:to-teal-700 text-white px-3.5 py-2 rounded-full shadow-2xl border-2 border-amber-400 flex items-center gap-2 font-nastaliq font-bold text-xs hover:scale-105 active:scale-95 transition cursor-pointer"
        title="رتہ کلاں مددگار صوتی رہنمائی کھولیں"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-300" />
        </span>
        <span className="text-sm">🎙️</span>
        <span className="text-[11px] font-bold text-amber-200 tracking-wide">رتہ کلاں مددگار</span>
      </button>

      {/* 2. INLINE HOMEPAGE ASSISTANT BANNER */}
      <div className="bg-gradient-to-br from-emerald-950 via-teal-950 to-stone-950 text-white rounded-3xl p-3.5 sm:p-4 shadow-xl border-2 border-emerald-500/80 relative overflow-hidden my-2.5 animate-in fade-in duration-200">
        {/* Ambient atmospheric glows */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="relative z-10 flex items-center justify-between pb-2.5 mb-2.5 border-b border-emerald-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-stone-950 flex items-center justify-center font-bold shadow-md shrink-0 border border-amber-300">
              <span className="text-lg">🎙️</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base font-nastaliq text-amber-200 leading-tight">
                  رتہ کلاں مددگار — صوتی رہنمائی
                </h3>
              </div>
              <p className="text-[11px] text-emerald-300 font-nastaliq">
                عام بول چال میں رتہ کلاں کی تمام سروسز، اوقاتِ کار اور فون نمبر سنیں
              </p>
            </div>
          </div>

          {/* Quick Actions & Settings Trigger */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowSettings((prev) => !prev)}
              className={`p-2 rounded-xl text-xs font-bold font-nastaliq border transition flex items-center gap-1 cursor-pointer ${
                showSettings
                  ? 'bg-amber-400 text-stone-950 border-amber-300'
                  : 'bg-white/10 hover:bg-white/20 text-stone-200 border-white/15'
              }`}
              title="رفتار کی ترتیبات"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">رفتار</span>
            </button>

            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 border border-white/15 transition cursor-pointer"
              title={isExpanded ? 'سکیڑیں' : 'کھولیں'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Body */}
        {isExpanded && (
          <div className="relative z-10 space-y-3">
            {/* Audio Visualizer & Spoken Transcript Bar */}
            <div className="bg-black/50 border border-emerald-500/40 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-md">
              {/* Dynamic Animated Equalizer Bars */}
              <div className="flex items-center gap-1.5 h-9 shrink-0 px-2 py-1 bg-black/40 rounded-xl border border-emerald-700/50">
                {equalizerBars.map((height, i) => (
                  <span
                    key={i}
                    style={{ height: `${height}%` }}
                    className={`w-1.5 rounded-full transition-all duration-150 ${
                      isPlaying
                        ? i % 2 === 0
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                        : 'bg-stone-600'
                    }`}
                  />
                ))}
              </div>

              {/* Spoken Text Display */}
              <div className="flex-1 text-center sm:text-right px-1">
                {isPlaying ? (
                  <p className="text-xs text-amber-200 font-nastaliq leading-relaxed line-clamp-2">
                    🔊 {spokenTranscript}
                  </p>
                ) : isListeningMic ? (
                  <p className="text-xs text-red-300 font-nastaliq animate-pulse">
                    🎙️ مائیکروفون فعال ہے، اپنا سوال بولیں... {recognizedVoiceQuery && `"${recognizedVoiceQuery}"`}
                  </p>
                ) : (
                  <p className="text-xs text-emerald-200/90 font-nastaliq">
                    نیچے کسی بھی بٹن کو دبائیں، رتہ کلاں مددگار آپ کو مکمل تفصیلات بول کر سنائے گا۔
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {isPlaying ? (
                  <button
                    onClick={handleStopAll}
                    className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold font-nastaliq text-xs flex items-center gap-1.5 shadow transition cursor-pointer active:scale-95 animate-pulse"
                  >
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>آواز روکیں</span>
                  </button>
                ) : (
                  <button
                    onClick={handleTestVoice}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 hover:from-amber-300 hover:to-amber-400 font-bold font-nastaliq text-xs flex items-center gap-1.5 shadow transition cursor-pointer active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>آواز سنیں</span>
                  </button>
                )}

                {/* Direct Microphone Speech Search Button */}
                <button
                  onClick={handleStartMic}
                  className={`px-3.5 py-1.5 rounded-xl font-bold font-nastaliq text-xs flex items-center gap-1.5 shadow transition cursor-pointer active:scale-95 ${
                    isListeningMic
                      ? 'bg-red-600 text-white ring-2 ring-red-400 animate-pulse'
                      : 'bg-emerald-700 hover:bg-emerald-600 text-amber-200 border border-emerald-500'
                  }`}
                  title="مائیکروفون سے بول کر سوال کریں"
                >
                  {isListeningMic ? (
                    <>
                      <MicOff className="w-3.5 h-3.5 text-white" />
                      <span>سن رہے ہیں...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-amber-300" />
                      <span>بول کر پوچھیں</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Expandable Voice Settings Drawer */}
            {showSettings && (
              <div className="bg-emerald-900/50 border border-emerald-600/60 p-3 rounded-2xl space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {/* Speed Selector */}
                  <div className="flex items-center gap-1 text-xs font-nastaliq flex-wrap">
                    <span className="text-amber-200 font-bold ml-1">رفتار بول چال:</span>
                    {[
                      { label: '0.85x آرام سے', val: 0.85 },
                      { label: '0.95x عام بول چال ⭐', val: 0.95 },
                      { label: '1.1x تھوڑا تیز', val: 1.1 },
                    ].map((s) => (
                      <button
                        key={s.val}
                        onClick={() => handleChangeSpeed(s.val)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                          Math.abs(speed - s.val) < 0.05
                            ? 'bg-amber-400 text-stone-950 shadow'
                            : 'bg-black/30 text-stone-300 hover:text-white'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  <span className="text-[11px] text-emerald-200 font-nastaliq">
                    فون کی ڈیفالٹ آواز سے صوتی جواب
                  </span>
                </div>
              </div>
            )}

            {/* Topic Grid */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-amber-300 font-bold font-nastaliq block">
                کسی بھی عنوان پر کلک کریں اور بول کر تفصیلات سنیں:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {VOICE_TOPICS.map((topic) => {
                  const isCurrentPlaying = isPlaying && activeTopicId === topic.id;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => handlePlayTopic(topic)}
                      className={`p-2 rounded-2xl text-right font-nastaliq text-xs transition border flex items-center gap-2 cursor-pointer shadow-sm active:scale-98 ${
                        isCurrentPlaying
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 font-bold border-amber-300 ring-2 ring-amber-300'
                          : 'bg-white/10 hover:bg-emerald-900/60 text-stone-100 border-white/10 hover:border-emerald-500/50'
                      }`}
                    >
                      <span className="text-xl shrink-0 p-1 bg-black/20 rounded-xl">
                        {topic.icon}
                      </span>
                      <div className="truncate min-w-0">
                        <strong className="block text-xs font-nastaliq truncate leading-tight">
                          {topic.title}
                        </strong>
                        <span className="text-[10px] text-emerald-200 block font-mono">
                          {isCurrentPlaying ? 'بول رہے ہیں...' : '🔊 سنیں'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. FULL INTERACTIVE VOICE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-emerald-950 via-teal-950 to-stone-950 text-white border-2 border-amber-400 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-5 space-y-4 my-auto">
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-emerald-800">
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-xl shadow-lg">
                  🎙️
                </div>
                <div>
                  <h3 className="font-bold text-base font-nastaliq text-amber-200">
                    رتہ کلاں مددگار — صوتی رہنمائی
                  </h3>
                  <span className="text-xs text-emerald-300 font-nastaliq">
                    بول کر سوال پوچھیں یا فوری رہنمائی سنیں
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  handleStopAll();
                  setIsModalOpen(false);
                }}
                className="p-2 text-stone-300 hover:text-white rounded-full bg-white/10 transition cursor-pointer"
                title="بند کریں"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Central Microphone Pulse Box */}
            <div className="bg-black/40 border border-emerald-500/50 rounded-3xl p-5 text-center space-y-3">
              <div className="relative inline-block">
                <button
                  onClick={handleStartMic}
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition cursor-pointer active:scale-95 ${
                    isListeningMic
                      ? 'bg-red-600 text-white ring-8 ring-red-500/40 animate-pulse'
                      : 'bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 text-white hover:scale-105'
                  }`}
                  title="مائیکروفون دبائیں اور بولیں"
                >
                  {isListeningMic ? (
                    <MicOff className="w-9 h-9" />
                  ) : (
                    <Mic className="w-9 h-9 text-amber-200" />
                  )}
                </button>
              </div>

              <div>
                <strong className="block text-sm font-nastaliq text-amber-300">
                  {isListeningMic ? 'مائیکروفون فعال ہے... بولیں' : 'مائیک دبائیں اور عام الفاظ میں بات کریں'}
                </strong>
                <p className="text-xs text-stone-300 font-nastaliq mt-1">
                  مثلاً: "مجھے ڈاکٹر چاہیے"، "ٹریکٹر والا کون ہے"، "نماز کا وقت"، یا "اسکول کھولو"
                </p>
              </div>

              {recognizedVoiceQuery && (
                <div className="bg-emerald-900/70 border border-emerald-400 p-2.5 rounded-2xl text-xs font-bold text-amber-200 font-nastaliq animate-in zoom-in-95">
                  "{recognizedVoiceQuery}"
                </div>
              )}
            </div>

            {/* Equalizer Visualizer */}
            <div className="bg-black/50 p-3 rounded-2xl border border-emerald-700/50 flex items-center justify-between">
              <div className="flex items-center gap-1.5 h-7">
                {equalizerBars.map((height, i) => (
                  <span
                    key={i}
                    style={{ height: `${height}%` }}
                    className={`w-1 rounded-full ${
                      isPlaying ? 'bg-amber-400' : 'bg-stone-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-nastaliq text-amber-200 truncate flex-1 text-right px-2">
                {spokenTranscript || 'آواز بند ہے — بٹن دبا کر سنیں'}
              </span>
              {isPlaying && (
                <button
                  onClick={handleStopAll}
                  className="px-2.5 py-1 bg-red-600 text-white rounded-xl text-xs font-bold font-nastaliq shrink-0"
                >
                  روکیں
                </button>
              )}
            </div>

            {/* Quick Voice Topics inside Modal */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-amber-300 font-nastaliq block">
                فوری صوتی موضوعات:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {VOICE_TOPICS.slice(1, 7).map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => handlePlayTopic(topic)}
                    className="p-2.5 bg-white/10 hover:bg-emerald-800/80 rounded-2xl border border-emerald-700/50 text-right font-nastaliq text-xs flex items-center gap-2 transition cursor-pointer"
                  >
                    <span className="text-lg">{topic.icon}</span>
                    <span className="truncate">{topic.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer with neutral helper info */}
            <div className="flex items-center justify-between pt-2 border-t border-emerald-800 text-xs font-nastaliq text-stone-300">
              <span>رتہ کلاں مددگار — خودکار صوتی معاون</span>
              <button
                onClick={() => {
                  handleStopAll();
                  setIsModalOpen(false);
                }}
                className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl"
              >
                بند کریں
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
