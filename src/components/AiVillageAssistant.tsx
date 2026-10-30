import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Mic,
  MicOff,
  Sliders,
  X,
  ChevronDown,
  ChevronUp,
  Send,
  Trash2,
} from 'lucide-react';
import { Language } from '../types';
import {
  speakText,
  stopSpeaking,
  pauseSpeaking,
  resumeSpeaking,
  subscribeSpeechState,
  playNotificationChime,
  getSpeechRate,
  setGlobalSpeechSlowMode,
  unlockAudioContext,
  VoiceRecognizer,
  isSpeechRecognitionSupported,
  cleanSpeechText,
  getVoiceAvailabilityStatus,
} from '../utils/speech';
import { answerVoiceQuestion } from '../utils/voiceAskEngine';
import { analyzePeopleQuery } from '../utils/searchEngine';
import { askOnlineTeacherDetailed } from '../utils/geminiTeacher';
import { initialProfiles, initialNewsEvents, initialAnnouncements } from '../data/initialProfiles';
import {
  initialMosques,
  initialInstitutes,
  initialTransports,
  initialHospitals,
} from '../data/villageExtraData';

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

interface AssistantTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
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
  const [isPaused, setIsPaused] = useState(false);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');
  const [lastSpokenText, setLastSpokenText] = useState<string>('');
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('male');

  // Speech rate
  const [speed, setSpeed] = useState<number>(() => getSpeechRate());

  // UI state
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Live Microphone & Text Conversation state
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [recognizedVoiceQuery, setRecognizedVoiceQuery] = useState<string>('');
  const [textQueryInput, setTextQueryInput] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<AssistantTurn[]>([
    {
      id: 'init-welcome',
      role: 'assistant',
      text: 'السلام علیکم! میں رتہ کلاں کا صوتی مددگار ہوں۔ آپ مجھ سے گاؤں کے کاریگر، ڈاکٹر، مستری، ٹریکٹر، اوقاتِ نماز یا تعلیمی سوالات اردو یا انگریزی میں پوچھ سکتے ہیں۔',
      timestamp: new Date().toLocaleTimeString('ur-PK', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const voiceRecognizerRef = useRef<VoiceRecognizer | null>(null);

  // Equalizer visualizer animation state
  const [equalizerBars, setEqualizerBars] = useState<number[]>([40, 70, 30, 85, 50, 90, 60, 45]);

  // Subscribe to speech engine state
  useEffect(() => {
    const unsubscribe = subscribeSpeechState((state) => {
      setIsPlaying(state.isPlaying);
      setIsPaused(state.isPaused);
      if (!state.isPlaying) {
        setActiveTopicId(null);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let eqTimer: any;
    if (isPlaying && !isPaused) {
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
  }, [isPlaying, isPaused]);

  const voiceStatus = getVoiceAvailabilityStatus(lang);

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

  const speakAssistantReply = (text: string, topicId: string | null = null) => {
    unlockAudioContext();
    stopSpeaking();
    const cleaned = cleanSpeechText(text);
    setActiveTopicId(topicId);
    setSpokenTranscript(cleaned);
    setLastSpokenText(cleaned);

    speakText(
      cleaned,
      lang,
      () => {
        setIsPlaying(false);
        setActiveTopicId(null);
      },
      {
        isFemaleVillageVoice: voiceGender === 'female',
        voiceGender,
        rate: speed,
        pitch: 1.0,
        onSegmentChange: (seg) => setSpokenTranscript(seg),
      }
    );
  };

  // Speak a selected voice topic
  const handlePlayTopic = (topic: VoiceTopic) => {
    unlockAudioContext();
    if (isPlaying && activeTopicId === topic.id) {
      stopSpeaking();
      setIsPlaying(false);
      setActiveTopicId(null);
      return;
    }

    playNotificationChime('start');
    speakAssistantReply(topic.spokenUrdu, topic.id);

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

  // Live Microphone Assistant with Barge-In Support
  const handleStartMic = () => {
    unlockAudioContext();
    // Barge-in: if assistant is currently speaking, stop speaking immediately so user can talk
    if (isPlaying) {
      stopSpeaking();
    }

    if (isListeningMic) {
      if (voiceRecognizerRef.current) {
        voiceRecognizerRef.current.stop();
      }
      setIsListeningMic(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setRecognizedVoiceQuery(
        'مائیکروفون اس براؤزر میں سپورٹ نہیں ہے، براہ کرم اپنا سوال لکھ کر پوچھیں۔'
      );
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
        if (isFinal && transcript.trim()) {
          setIsListeningMic(false);
          processConversationQuery(transcript);
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

  // Process voice or typed query using Portal Data first, then Smart Answer Engine for general/educational questions
  const processConversationQuery = async (rawQuery: string) => {
    const q = rawQuery.trim();
    if (!q) return;

    stopSpeaking();
    setTextQueryInput('');
    const userTurn: AssistantTurn = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString('ur-PK', { hour: '2-digit', minute: '2-digit' }),
    };
    setConversationHistory((prev) => [...prev, userTurn]);
    setIsThinking(true);

    try {
      // 1. Check Portal Directory Data first
      const portalRes = answerVoiceQuestion(
        q,
        {
          profiles: initialProfiles,
          mosques: initialMosques,
          institutes: initialInstitutes,
          transports: initialTransports,
          hospitals: initialHospitals,
          newsEvents: initialNewsEvents,
          announcements: initialAnnouncements,
        },
        lang
      );

      const foundInPortal =
        portalRes.intent !== 'not_found' && portalRes.intent !== 'unclear';

      if (foundInPortal && onSearch) {
        onSearch(q);
      }

      let finalDisplay = portalRes.displayText;
      let finalSpoken = portalRes.spokenText;

      // 2. If not a portal listing match and looks like a general/educational/conversational question (NOT a person/profile lookup), consult Smart Engine
      const isPeopleLookup = analyzePeopleQuery(q).isPeopleQuery;
      if (!foundInPortal && portalRes.intent === 'not_found' && !isPeopleLookup && !portalRes.needsClarification) {
        const smartRes = await askOnlineTeacherDetailed({
          question: q,
          selectedClass: 'جنرل معلومات',
          subject: 'general',
          history: conversationHistory.slice(-6).map((t) => ({
            sender: t.role === 'user' ? 'student' : 'teacher',
            text: t.text,
          })),
        });
        if (smartRes && smartRes.answer) {
          finalDisplay = smartRes.answer;
          finalSpoken = smartRes.spokenText || smartRes.answer;
        }
      }

      const assistantTurn: AssistantTurn = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: finalDisplay,
        timestamp: new Date().toLocaleTimeString('ur-PK', { hour: '2-digit', minute: '2-digit' }),
      };

      setConversationHistory((prev) => [...prev, assistantTurn]);
      setRecognizedVoiceQuery(`${q} — ${finalDisplay}`);
      speakAssistantReply(finalSpoken, null);
    } catch (err) {
      console.warn('Assistant query error:', err);
    } finally {
      setIsThinking(false);
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

  const handleTogglePauseResume = () => {
    if (isPaused) {
      resumeSpeaking();
    } else {
      pauseSpeaking();
    }
  };

  const handleReplayLast = () => {
    const textToSpeak = lastSpokenText || VOICE_TOPICS[0].spokenUrdu;
    speakAssistantReply(textToSpeak, null);
  };

  const handleTestVoice = () => {
    const welcome = VOICE_TOPICS[0];
    handlePlayTopic(welcome);
  };

  const handleChangeSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
    setGlobalSpeechSlowMode(newSpeed < 0.88);
  };

  return (
    <>
      {/* 1. FLOATING QUICK-ACCESS ORB */}
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
        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="relative z-10 flex items-center justify-between pb-2.5 mb-2.5 border-b border-emerald-800/80 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-stone-950 flex items-center justify-center font-bold shadow-md shrink-0 border border-amber-300">
              <span className="text-lg">🎙️</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base font-nastaliq text-amber-200 leading-tight">
                  رتہ کلاں مددگار — انسانی انداز میں صوتی و تحریری رہنمائی
                </h3>
                <span className="text-[10px] bg-emerald-900/90 border border-emerald-500/40 text-emerald-200 px-2 py-0.5 rounded-full font-nastaliq">
                  {voiceStatus.statusMessageUrdu}
                </span>
              </div>
              <p className="text-[11px] text-emerald-300 font-nastaliq">
                عام بول چال میں رتہ کلاں کی تمام سروسز، اوقاتِ کار، فون نمبر اور سوالات کے جواب سنیں
              </p>
            </div>
          </div>

          {/* Quick Actions & Settings Trigger */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold font-nastaliq shadow cursor-pointer"
            >
              مکمل گفتگو کھولیں 💬
            </button>

            <button
              onClick={() => setShowSettings((prev) => !prev)}
              className={`p-2 rounded-xl text-xs font-bold font-nastaliq border transition flex items-center gap-1 cursor-pointer ${
                showSettings
                  ? 'bg-amber-400 text-stone-950 border-amber-300'
                  : 'bg-white/10 hover:bg-white/20 text-stone-200 border-white/15'
              }`}
              title="آواز اور رفتار کی ترتیبات"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">آواز</span>
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
                      isPlaying && !isPaused
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
                {isThinking ? (
                  <p className="text-xs text-amber-300 font-nastaliq animate-pulse">
                    ⏳ آپ کے سوال کا درست جواب تلاش کیا جا رہا ہے...
                  </p>
                ) : isPlaying ? (
                  <p className="text-xs text-amber-200 font-nastaliq leading-relaxed line-clamp-2">
                    🔊 {spokenTranscript}
                  </p>
                ) : isListeningMic ? (
                  <p className="text-xs text-red-300 font-nastaliq animate-pulse">
                    🎙️ مائیکروفون فعال ہے، اپنا سوال بولیں...{' '}
                    {recognizedVoiceQuery && `"${recognizedVoiceQuery}"`}
                  </p>
                ) : (
                  <p className="text-xs text-emerald-200/90 font-nastaliq">
                    نیچے مائیک دبا کر بولیں، سوال لکھیں یا کسی بھی بٹن کو دبائیں۔
                  </p>
                )}
              </div>

              {/* Playback & Mic Controls */}
              <div className="flex items-center gap-1.5 flex-wrap justify-center shrink-0">
                {isPlaying ? (
                  <>
                    <button
                      onClick={handleTogglePauseResume}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold font-nastaliq text-xs flex items-center gap-1 shadow cursor-pointer"
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      <span>{isPaused ? 'جاری' : 'وقفہ'}</span>
                    </button>
                    <button
                      onClick={handleStopAll}
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold font-nastaliq text-xs flex items-center gap-1 shadow transition cursor-pointer"
                    >
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>روکیں</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleTestVoice}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 hover:from-amber-300 hover:to-amber-400 font-bold font-nastaliq text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>آواز سنیں</span>
                    </button>
                    {lastSpokenText && (
                      <button
                        onClick={handleReplayLast}
                        className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 font-bold font-nastaliq text-xs flex items-center gap-1 cursor-pointer"
                        title="دوبارہ سنیں"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}

                {/* Direct Microphone Speech Search Button */}
                <button
                  onClick={handleStartMic}
                  className={`px-3 py-1.5 rounded-xl font-bold font-nastaliq text-xs flex items-center gap-1.5 shadow transition cursor-pointer active:scale-95 ${
                    isListeningMic
                      ? 'bg-red-600 text-white ring-2 ring-red-400 animate-pulse'
                      : 'bg-emerald-700 hover:bg-emerald-600 text-amber-200 border border-emerald-500'
                  }`}
                  title="مائیکروفون سے بول کر سوال کریں"
                >
                  {isListeningMic ? (
                    <>
                      <MicOff className="w-3.5 h-3.5 text-white" />
                      <span>سن رہا ہوں...</span>
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

            {/* Direct Text Input Alternative Bar */}
            <div className="flex items-center gap-2 bg-black/35 border border-emerald-600/50 rounded-2xl p-1.5">
              <input
                type="text"
                value={textQueryInput}
                onChange={(e) => setTextQueryInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && processConversationQuery(textQueryInput)
                }
                placeholder="یہاں لکھ کر بھی سوال پوچھ سکتے ہیں (مثلاً: ڈاکٹر کا نمبر، ٹریکٹر والا، یا کوئی تعلیمی سوال)..."
                className="flex-1 bg-transparent text-xs text-white placeholder-emerald-200/60 px-2.5 py-1 font-nastaliq focus:outline-none"
              />
              <button
                type="button"
                onClick={() => processConversationQuery(textQueryInput)}
                disabled={!textQueryInput.trim() || isThinking}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-stone-950 font-bold rounded-xl text-xs font-nastaliq flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>پوچھیں</span>
              </button>
            </div>

            {/* Expandable Voice Settings Drawer */}
            {showSettings && (
              <div className="bg-emerald-900/50 border border-emerald-600/60 p-3 rounded-2xl space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {/* Speed Selector */}
                  <div className="flex items-center gap-1 text-xs font-nastaliq flex-wrap">
                    <span className="text-amber-200 font-bold ml-1">رفتار بول چال:</span>
                    {[
                      { label: '0.84x آہستہ (بچوں و بزرگوں کے لیے)', val: 0.84 },
                      { label: '0.95x قدرتی پاکستانی لب و لہجہ ⭐', val: 0.95 },
                      { label: '1.08x تیز', val: 1.08 },
                    ].map((s) => (
                      <button
                        key={s.val}
                        onClick={() => handleChangeSpeed(s.val)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                          Math.abs(speed - s.val) < 0.05
                            ? 'bg-amber-400 text-stone-950 shadow'
                            : 'bg-black/30 text-stone-300 hover:text-white'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Voice Gender Choice */}
                  <div className="flex items-center gap-1.5 text-xs font-nastaliq">
                    <button
                      type="button"
                      onClick={() =>
                        setVoiceGender((prev) => (prev === 'male' ? 'female' : 'male'))
                      }
                      className="px-2.5 py-1 rounded-xl bg-black/40 hover:bg-black/60 text-amber-200 border border-emerald-500/40 cursor-pointer"
                    >
                      {voiceGender === 'male' ? '👨 مردانہ آواز (Asad)' : '👩 زنانہ آواز (Uzma)'}
                    </button>

                    <button
                      type="button"
                      onClick={handleTestVoice}
                      className="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1 shadow cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>آواز سنیں</span>
                    </button>
                  </div>
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

      {/* 3. FULL INTERACTIVE CONVERSATIONAL VOICE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-emerald-950 via-teal-950 to-stone-950 text-white border-2 border-amber-400 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-4 sm:p-5 space-y-3.5 my-auto flex flex-col max-h-[92vh]">
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between pb-2.5 border-b border-emerald-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-xl shadow-lg">
                  🎙️
                </div>
                <div>
                  <h3 className="font-bold text-base font-nastaliq text-amber-200">
                    رتہ کلاں مددگار — براہِ راست گفتگو
                  </h3>
                  <span className="text-xs text-emerald-300 font-nastaliq">
                    بول کر یا لکھ کر بات کریں — فوری انسانی انداز میں جواب
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    setConversationHistory([
                      {
                        id: `init-${Date.now()}`,
                        role: 'assistant',
                        text: 'السلام علیکم! نئی گفتگو شروع ہو چکی ہے۔ آپ کیا پوچھنا چاہتے ہیں؟',
                        timestamp: new Date().toLocaleTimeString('ur-PK', {
                          hour: '2-digit',
                          minute: '2-digit',
                        }),
                      },
                    ])
                  }
                  className="p-2 text-stone-300 hover:text-white rounded-full bg-white/10 transition cursor-pointer"
                  title="گفتگو صاف کریں"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
            </div>

            {/* Central Microphone & Status Box */}
            <div className="bg-black/40 border border-emerald-500/50 rounded-3xl p-4 text-center space-y-2.5 shrink-0">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleStartMic}
                  className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition cursor-pointer active:scale-95 ${
                    isListeningMic
                      ? 'bg-red-600 text-white ring-8 ring-red-500/40 animate-pulse'
                      : 'bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 text-white hover:scale-105'
                  }`}
                  title="مائیکروفون دبائیں اور بولیں"
                >
                  {isListeningMic ? (
                    <MicOff className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8 text-amber-200" />
                  )}
                </button>

                {isPlaying && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTogglePauseResume}
                      className="px-3 py-2 bg-amber-400 text-stone-950 rounded-2xl text-xs font-bold font-nastaliq flex items-center gap-1 cursor-pointer"
                    >
                      {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      <span>{isPaused ? 'جاری رکھیں' : 'وقفہ'}</span>
                    </button>
                    <button
                      onClick={handleStopAll}
                      className="px-3 py-2 bg-red-600 text-white rounded-2xl text-xs font-bold font-nastaliq flex items-center gap-1 cursor-pointer"
                    >
                      <VolumeX className="w-4 h-4" />
                      <span>روکیں</span>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <strong className="block text-sm font-nastaliq text-amber-300">
                  {isListeningMic
                    ? '🎙️ میں سن رہا ہوں... اپنا سوال بولیں'
                    : isThinking
                    ? '⏳ جواب تیار ہو رہا ہے...'
                    : isPlaying
                    ? '🔊 مددگار بول رہا ہے (درمیان میں بات کرنے کے لیے مائیک دبائیں)'
                    : 'مائیک دبائیں یا نیچے لکھ کر بات کریں'}
                </strong>
              </div>
            </div>

            {/* Multi-Turn Conversation Transcript History */}
            <div className="flex-1 bg-black/35 border border-emerald-800/80 rounded-2xl p-3 space-y-2.5 overflow-y-auto min-h-[150px] max-h-[240px]">
              {conversationHistory.map((turn) => (
                <div
                  key={turn.id}
                  className={`flex flex-col ${
                    turn.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-2.5 text-xs font-nastaliq ${
                      turn.role === 'user'
                        ? 'bg-amber-400 text-stone-950 font-bold rounded-br-none'
                        : 'bg-emerald-900/80 text-white border border-emerald-600/40 rounded-bl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1 opacity-80 text-[10px]">
                      <span>{turn.role === 'user' ? 'آپ' : 'رتہ کلاں مددگار'}</span>
                      {turn.role === 'assistant' && (
                        <button
                          onClick={() => speakAssistantReply(turn.text, null)}
                          className="text-amber-300 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>سنیں</span>
                        </button>
                      )}
                    </div>
                    <p className="whitespace-pre-line leading-relaxed">{turn.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Text Input inside Modal */}
            <div className="flex items-center gap-2 bg-black/50 border border-emerald-500/50 rounded-2xl p-1.5 shrink-0">
              <input
                type="text"
                value={textQueryInput}
                onChange={(e) => setTextQueryInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && processConversationQuery(textQueryInput)
                }
                placeholder="اپنا سوال یہاں لکھیں..."
                className="flex-1 bg-transparent text-xs text-white placeholder-emerald-200/60 px-2.5 py-1 font-nastaliq focus:outline-none"
              />
              <button
                type="button"
                onClick={() => processConversationQuery(textQueryInput)}
                disabled={!textQueryInput.trim() || isThinking}
                className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-stone-950 font-bold rounded-xl text-xs font-nastaliq flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>بھیجیں</span>
              </button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-emerald-800 text-xs font-nastaliq text-stone-300 shrink-0">
              <span>رتہ کلاں مددگار — خودکار صوتی و تحریری معاون</span>
              <button
                onClick={() => {
                  handleStopAll();
                  setIsModalOpen(false);
                }}
                className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl cursor-pointer"
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
