import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  GraduationCap,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Send,
  BookOpen,
  Award,
  Play,
  Pause,
  RotateCcw,
  IdCard,
  Printer,
  Trash2,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { Language, SubjectKey, AiSchoolStudent } from '../types';
import {
  speakText,
  stopSpeaking,
  pauseSpeaking,
  resumeSpeaking,
  subscribeSpeechState,
  speakSequentialCounting,
  playNotificationChime,
  VoiceRecognizer,
  isSpeechRecognitionSupported,
  unlockAudioContext,
  getSpeechRate,
  setGlobalSpeechSlowMode,
  getGlobalSpeechSlowMode,
  cleanSpeechText,
  getVoiceAvailabilityStatus,
} from '../utils/speech';
import { askOnlineTeacherDetailed } from '../utils/geminiTeacher';
import { EducationalSourceCitation } from '../utils/aiKnowledgeEngine';
import { getSchoolOperatingStatus } from '../utils/operatingHours';
import {
  URDU_ALPHABETS,
  COUNTING_TOYS,
  ENGLISH_ABC,
  OBJECTS_COLORS_SHAPES,
  EARLY_LEARNING_QUIZ_QUESTIONS,
  EarlyLearningItem,
  EarlyLearningMode,
  getEarlyLearningSpeechPayload,
  validateLearningItemMapping,
} from '../data/earlyLearningData';
import { saveStudentProgressToFirestore } from '../firebase/firestoreService';

interface AiSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

const STORAGE_STUDENT_KEY = 'rk_ai_school_current_student_v2';
const STORAGE_SESSIONS_KEY = 'rk_ai_school_chat_sessions_v2';

export interface SchoolChatMessage {
  id: string;
  sender: 'student' | 'teacher';
  text: string;
  spokenText?: string;
  followUpQuestion?: string;
  sources?: EducationalSourceCitation[];
  usedOnlineSearch?: boolean;
  provider?: string;
  timestamp: string;
}

// 12 Classes from Nursery to 10th Matric
export const VILLAGE_SCHOOL_CLASSES = [
  { id: 'nursery', name: 'نرسری (Nursery)', grade: 'نرسری' },
  { id: 'prep', name: 'پریپ / کے جی (Prep/KG)', grade: 'پریپ' },
  { id: 'class1', name: 'پہلی جماعت (Class 1)', grade: 'اول' },
  { id: 'class2', name: 'دوسری جماعت (Class 2)', grade: 'دوم' },
  { id: 'class3', name: 'تیسری جماعت (Class 3)', grade: 'سوم' },
  { id: 'class4', name: 'چوتھی جماعت (Class 4)', grade: 'چہارم' },
  { id: 'class5', name: 'پانچویں جماعت (Class 5 - پرائمری)', grade: 'پنجم' },
  { id: 'class6', name: 'چھٹی جماعت (Class 6)', grade: 'ششم' },
  { id: 'class7', name: 'ساتویں جماعت (Class 7)', grade: 'ہفتم' },
  { id: 'class8', name: 'آٹھویں جماعت (Class 8 - مڈل)', grade: 'ہشتم' },
  { id: 'class9', name: 'نویں جماعت (Class 9 - نہم)', grade: 'نہم' },
  { id: 'class10', name: 'دسویں جماعت (Class 10 - میٹرک)', grade: 'دہم' },
];

// Interactive subjects
export const SCHOOL_SUBJECTS: { key: SubjectKey; title: string; icon: string }[] = [
  { key: 'math', title: 'ریاضی و دیہاتی حساب', icon: '🔢' },
  { key: 'urdu', title: 'اردو و خوشخطی', icon: '📖' },
  { key: 'english', title: 'انگریزی بول چال', icon: '🔤' },
  { key: 'islamiyat', title: 'اسلامیات و مسنون دعائیں', icon: '🕌' },
  { key: 'bio', title: 'سائنس و بائیولوجی', icon: '🌿' },
  { key: 'physics', title: 'فزکس و بجلی کا نظام', icon: '⚡' },
  { key: 'chemistry', title: 'کیمسٹری و کھاد', icon: '🧪' },
  { key: 'pak_studies', title: 'مطالعہ پاکستان و جغرافیہ', icon: '🇵🇰' },
  { key: 'general', title: 'زرعی رہنمائی و جنرل نالج', icon: '🌾' },
];

// Interactive homework bank for classes
interface HomeworkItem {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const homeworkBySubject: Record<SubjectKey, HomeworkItem> = {
  math: {
    question: 'اگر گندم کی 1 بوری 3,500 روپے کی ہو تو 4 بوریوں کی کل قیمت کیا ہوگی؟',
    options: ['12,000 روپے', '14,000 روپے', '10,500 روپے', '16,000 روپے'],
    correctIndex: 1,
    explanation: 'حل: 3500 × 4 = 14,000 روپے۔ شاباش! ضرب روزمرہ دیہاتی حساب میں بہت ضروری ہے۔',
  },
  english: {
    question: 'جب کوئی آپ سے کہے "How are you?" تو شائستہ انگریزی جواب کیا ہوگا؟',
    options: [
      'I am fine, thank you.',
      'What is your name?',
      'Good night.',
      'I am going home.',
    ],
    correctIndex: 0,
    explanation: 'حل: "I am fine, thank you" کا مطلب ہے "میں ٹھیک ہوں، شکریہ"۔',
  },
  urdu: {
    question: 'مندرجہ ذیل میں سے کس جملے کی املا درست ہے؟',
    options: [
      'علم حاصل کرنا ہر مرد اور عورت پر فرض ہے۔',
      'الم ہاصل کرنا ہر مرد پر فرز ہے۔',
      'علم ہاسل کرنا ہر انسان پر فجر ہے۔',
      'الام حاصل کرنا عورت پر فرز ہے۔',
    ],
    correctIndex: 0,
    explanation: 'حل: "علم حاصل کرنا ہر مرد اور عورت پر فرض ہے۔" درست املا ہے۔',
  },
  islamiyat: {
    question: 'اسلام کا دوسرا بنیادی ستون کون سا ہے جو روزانہ پانچ بار ادا کیا جاتا ہے؟',
    options: ['روزہ (صوم)', 'نماز (صلوٰۃ)', 'حج', 'زکوٰۃ'],
    correctIndex: 1,
    explanation: 'حل: نماز دین کا ستون ہے اور ہر روز پانچ وقت ادا کرنا فرض ہے۔',
  },
  bio: {
    question: 'پودے سورج کی روشنی اور پانی سے اپنی خوراک بناتے ہیں، اس عمل کو کیا کہتے ہیں؟',
    options: ['ضیائی تالیف (Photosynthesis)', 'تنفس (Respiration)', 'جراثیم', 'پھول کھلنا'],
    correctIndex: 0,
    explanation: 'حل: ضیائی تالیف (Photosynthesis) سے پودے خوراک اور آکسیجن پیدا کرتے ہیں۔',
  },
  physics: {
    question: 'گاؤں میں سولر پینل کس توانائی کو بجلی میں تبدیل کرتے ہیں؟',
    options: ['ہوا کی توانائی کو', 'سورج کی روشنی کی توانائی کو', 'پانی کی توانائی کو', 'کوئلے کی توانائی کو'],
    correctIndex: 1,
    explanation: 'حل: سولر پینل سورج کی دھوپ کو براہ راست بجلی میں تبدیل کرتے ہیں۔',
  },
  chemistry: {
    question: 'پینے کے صاف پانی کا درست کیمیائی فارمولا کیا ہے؟',
    options: ['CO2', 'H2O', 'NaCl', 'O2'],
    correctIndex: 1,
    explanation: 'حل: پانی کا فارمولا H2O ہے یعنی ہائیڈروجن اور آکسیجن کا مرکب۔',
  },
  pak_studies: {
    question: 'ہمارا پیارا وطن پاکستان کس تاریخی تاریخ کو معرضِ وجود میں آیا؟',
    options: ['23 مارچ 1940', '14 اگست 1947', '6 ستمبر 1965', '25 دسمبر 1876'],
    correctIndex: 1,
    explanation: 'حل: 14 اگست 1947 کو 27 ویں رمضان المبارک کے دن پاکستان آزاد ہوا۔',
  },
  general: {
    question: 'زمین کی پیمائش میں ایک ایکڑ (قلعہ) میں کتنے کنال ہوتے ہیں؟',
    options: ['4 کنال', '8 کنال', '12 کنال', '16 کنال'],
    correctIndex: 1,
    explanation: 'حل: 1 ایکڑ میں 8 کنال یعنی 160 مرلے ہوتے ہیں۔',
  },
  arabic: {
    question: 'عربی زبان میں شکریہ ادا کرنے کے لیے کیا کہا جاتا ہے؟',
    options: ['شکراً جزیلاً', 'مرحباً', 'کیف حالک', 'نعم'],
    correctIndex: 0,
    explanation: 'حل: عربی میں شکر گزاری کے لیے "شکراً جزیلاً" کہتے ہیں۔',
  },
};

const createInitialWelcomeMessage = (studentName?: string): SchoolChatMessage => ({
  id: 'welcome-msg',
  sender: 'teacher',
  text: studentName
    ? `السلام علیکم ${studentName} بیٹا! آج کون سا سبق پڑھنا ہے؟ نرسری سے دسویں جماعت تک کوئی بھی سوال پوچھیں یا مائیک دبا کر بولیں۔`
    : 'السلام علیکم! آج کون سا سبق پڑھنا ہے؟ نرسری سے دسویں جماعت تک کوئی بھی سوال پوچھیں یا بول کر بتائیں۔',
  timestamp: new Date().toLocaleTimeString('ur-PK', { hour: '2-digit', minute: '2-digit' }),
});

export const AiSchoolModal: React.FC<AiSchoolModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  // Current student admission profile
  const [currentStudent, setCurrentStudent] = useState<AiSchoolStudent | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_STUDENT_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Student Session Isolation: Map of studentId -> SchoolChatMessage[]
  const [sessionsMap, setSessionsMap] = useState<Record<string, SchoolChatMessage[]>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SESSIONS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  });

  const activeSessionKey = currentStudent?.id || 'guest_student';
  const chatHistory: SchoolChatMessage[] = sessionsMap[activeSessionKey] || [
    createInitialWelcomeMessage(currentStudent?.name),
  ];

  const updateCurrentSessionChat = (updater: (prev: SchoolChatMessage[]) => SchoolChatMessage[]) => {
    setSessionsMap((prevMap) => {
      const currentList = prevMap[activeSessionKey] || [createInitialWelcomeMessage(currentStudent?.name)];
      const nextList = updater(currentList);
      const updatedMap = { ...prevMap, [activeSessionKey]: nextList };
      try {
        localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(updatedMap));
      } catch {}
      return updatedMap;
    });
  };

  // Selected Class (Nursery to 10th Matric)
  const [selectedClassId, setSelectedClassId] = useState<string>('class5');
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<SubjectKey>('math');

  // Active view tab (Classroom, Nursery Fun Learning, Homework, ID Card)
  const [activeTab, setActiveTab] = useState<'classroom' | 'nursery' | 'homework' | 'idcard'>('classroom');
  const [nurseryCategory, setNurseryCategory] = useState<'urdu' | 'counting' | 'english' | 'objects' | 'quiz'>('urdu');
  const [learningMode, setLearningMode] = useState<EarlyLearningMode>('full');
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [isSequentialCounting, setIsSequentialCounting] = useState<boolean>(false);
  const [repeatSlowlyCounting, setRepeatSlowlyCounting] = useState<boolean>(true);
  const [activeQuizIdx, setActiveQuizIdx] = useState<number>(0);
  const [quizFeedbackText, setQuizFeedbackText] = useState<string | null>(null);

  // Question & Answer state
  const [questionInput, setQuestionInput] = useState('');
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);

  // Voice recording & playback state
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [activeSpokenSegment, setActiveSpokenSegment] = useState<string>('');
  const [lastSpokenText, setLastSpokenText] = useState<string>('');
  const [teacherVoiceGender, setTeacherVoiceGender] = useState<'male' | 'female'>('male');
  const [slowMode, setSlowMode] = useState<boolean>(() => getGlobalSpeechSlowMode());
  const voiceRecognizerRef = useRef<VoiceRecognizer | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Homework interactive state
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isHomeworkSubmitted, setIsHomeworkSubmitted] = useState(false);
  const [homeworkFeedback, setHomeworkFeedback] = useState<string | null>(null);

  // Admission form state
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regFatherName, setRegFatherName] = useState('');
  const [regClass, setRegClass] = useState('پانچویں جماعت (Class 5)');
  const [regPhoto, setRegPhoto] = useState<string>('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to global speech state for accurate play/pause tracking
  useEffect(() => {
    const unsubscribe = subscribeSpeechState((state) => {
      setIsPlayingAudio(state.isPlaying);
      setIsPausedAudio(state.isPaused);
      if (!state.isPlaying) {
        setIsSequentialCounting(false);
        setActiveSpokenSegment('');
      }
    });
    return unsubscribe;
  }, []);

  // Auto-scroll chat to bottom when new message arrives
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory.length, isLoadingAnswer]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setRegPhoto(base64);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (currentStudent) {
      try {
        localStorage.setItem(STORAGE_STUDENT_KEY, JSON.stringify(currentStudent));
      } catch {}
    } else {
      try {
        localStorage.removeItem(STORAGE_STUDENT_KEY);
      } catch {}
    }
  }, [currentStudent]);

  // Warm welcome for students on opening the Virtual School
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        unlockAudioContext();
        playNotificationChime('teacher');
        const greeting =
          'السلام علیکم! رتہ کلاں ورچوئل اسکول میں آپ کا خیر مقدم ہے۔ نرسری سے لے کر دسویں جماعت کے تمام مضامین میں کوئی بھی سوال پوچھیں یا ہوم ورک حل کریں۔ آئیے مل کر پڑھتے ہیں!';
        setLastSpokenText(greeting);
        speakText(greeting, lang, undefined, {
          isFemaleVillageVoice: teacherVoiceGender === 'female',
          voiceGender: teacherVoiceGender,
          rate: slowMode ? 0.84 : 0.95,
          pitch: 1.0,
        });
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const schoolStatus = getSchoolOperatingStatus();
  const voiceStatus = getVoiceAvailabilityStatus(lang);
  const currentClassObj =
    VILLAGE_SCHOOL_CLASSES.find((c) => c.id === selectedClassId) || VILLAGE_SCHOOL_CLASSES[6];
  const currentHomework = homeworkBySubject[selectedSubjectKey];
  const currentQuiz =
    EARLY_LEARNING_QUIZ_QUESTIONS[activeQuizIdx % EARLY_LEARNING_QUIZ_QUESTIONS.length];

  const speakWithTeacherVoice = (text: string, onEnd?: () => void, customRate?: number) => {
    unlockAudioContext();
    const cleaned = cleanSpeechText(text);
    setLastSpokenText(cleaned);
    setActiveSpokenSegment(cleaned);
    speakText(cleaned, lang, onEnd, {
      isFemaleVillageVoice: teacherVoiceGender === 'female',
      voiceGender: teacherVoiceGender,
      rate: customRate || (slowMode ? 0.82 : getSpeechRate()),
      pitch: 1.0,
      onSegmentChange: (seg) => setActiveSpokenSegment(seg),
    });
  };

  const handleSchoolGreeting = () => {
    playNotificationChime('teacher');
    speakWithTeacherVoice(
      'السلام علیکم! رتہ کلاں ورچوئل اسکول میں آپ کا خیر مقدم ہے۔ نرسری سے لے کر دسویں جماعت کے تمام مضامین میں کوئی بھی سوال پوچھیں یا ہوم ورک حل کریں۔ آئیے مل کر پڑھتے ہیں!'
    );
  };

  // Verified Early Learning Item Speech with Mode Selection
  const handlePlayEarlyItem = (item: EarlyLearningItem, overrideMode?: EarlyLearningMode) => {
    unlockAudioContext();
    setIsSequentialCounting(false);

    // Validate image-to-label mapping before speaking
    const validation = validateLearningItemMapping(item);
    if (!validation.valid) {
      console.warn('Learning item validation failed:', validation.warningUrdu);
      return;
    }

    const modeToUse = overrideMode || learningMode;
    const payload = getEarlyLearningSpeechPayload(item, modeToUse, lang);

    setActivePlayingId(item.id);
    setLastSpokenText(payload.text);
    setActiveSpokenSegment(payload.text);
    playNotificationChime('chime');
    speakText(
      payload.text,
      payload.lang,
      () => setActivePlayingId(null),
      {
        isFemaleVillageVoice: teacherVoiceGender === 'female',
        voiceGender: teacherVoiceGender,
        rate: slowMode ? 0.8 : 0.92,
        pitch: 1.0,
      }
    );
  };

  // Sequential Counting 1 to 10 with Visual Card Highlighting
  const handleStartSequentialCounting = () => {
    unlockAudioContext();
    if (isSequentialCounting) {
      stopSpeaking();
      setIsSequentialCounting(false);
      setActivePlayingId(null);
      return;
    }

    const oneToTen = COUNTING_TOYS.filter(
      (item) => item.numberValue && item.numberValue >= 1 && item.numberValue <= 10
    );

    setIsSequentialCounting(true);
    playNotificationChime('teacher');

    const useEnglishOnly = learningMode === 'english_only';
    speakSequentialCounting(
      oneToTen.map((item) => ({
        id: item.id,
        text: useEnglishOnly
          ? `${item.numberValue}, ${item.englishNumberWord}. ${item.objectLabelEn}.`
          : `${item.urduNumberWord}۔ ${item.numberValue} (${item.englishNumberWord})۔ ${item.objectLabelUrdu}۔`,
        lang: useEnglishOnly ? 'en' : 'ur',
      })),
      {
        repeatEach: repeatSlowlyCounting,
        slowMode: slowMode || repeatSlowlyCounting,
        voiceGender: teacherVoiceGender,
        onItemStart: (id) => setActivePlayingId(id),
        onComplete: () => {
          setIsSequentialCounting(false);
          setActivePlayingId(null);
        },
      }
    );
  };

  const handleAskQuestion = async (customQ?: string) => {
    const q = (customQ || questionInput).trim();
    if (!q) return;

    // Barge-in: immediately stop any ongoing speech before answering new question
    stopSpeaking();
    unlockAudioContext();
    playNotificationChime('start');

    const studentMsg: SchoolChatMessage = {
      id: `stu-${Date.now()}`,
      sender: 'student',
      text: q,
      timestamp: new Date().toLocaleTimeString('ur-PK', { hour: '2-digit', minute: '2-digit' }),
    };

    const historySnapshot = [...chatHistory, studentMsg];
    updateCurrentSessionChat(() => historySnapshot);
    setQuestionInput('');
    setIsLoadingAnswer(true);

    try {
      const response = await askOnlineTeacherDetailed({
        question: q,
        selectedClass: currentClassObj.name,
        subject: selectedSubjectKey,
        studentId: currentStudent?.id || 'guest_student',
        studentName: currentStudent?.name,
        history: historySnapshot.slice(-8).map((m) => ({
          sender: m.sender,
          text: m.text,
        })),
      });

      const teacherMsg: SchoolChatMessage = {
        id: `tea-${Date.now()}`,
        sender: 'teacher',
        text: response.answer,
        spokenText: response.spokenText,
        followUpQuestion: response.followUpQuestion,
        sources: response.sources,
        usedOnlineSearch: response.usedOnlineSearch,
        provider: response.provider,
        timestamp: new Date().toLocaleTimeString('ur-PK', { hour: '2-digit', minute: '2-digit' }),
      };

      updateCurrentSessionChat((prev) => [...prev, teacherMsg]);
      playNotificationChime('teacher');

      // Speak the clean conversational response aloud
      speakWithTeacherVoice(response.spokenText || response.answer);
    } catch (e) {
      console.error('Error asking Online Teacher:', e);
    } finally {
      setIsLoadingAnswer(false);
    }
  };

  const handleToggleVoiceQuestion = () => {
    unlockAudioContext();
    // Barge-in support: if the teacher is currently speaking, stop speaking immediately so student can talk
    if (isPlayingAudio) {
      stopSpeaking();
    }

    if (isListeningVoice) {
      if (voiceRecognizerRef.current) {
        voiceRecognizerRef.current.stop();
      }
      setIsListeningVoice(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      return;
    }

    playNotificationChime('start');
    setIsListeningVoice(true);
    const vr = new VoiceRecognizer(lang);
    voiceRecognizerRef.current = vr;

    vr.start(
      (transcript, isFinal) => {
        setQuestionInput(transcript);
        if (isFinal && transcript.trim()) {
          setIsListeningVoice(false);
          handleAskQuestion(transcript);
        }
      },
      (err) => {
        console.warn('Voice question error:', err);
        setIsListeningVoice(false);
      },
      () => {
        setIsListeningVoice(false);
      }
    );
  };

  const handleStopAudio = () => {
    stopSpeaking();
    setActivePlayingId(null);
    setIsSequentialCounting(false);
  };

  const handleTogglePauseResume = () => {
    if (isPausedAudio) {
      resumeSpeaking();
    } else {
      pauseSpeaking();
    }
  };

  const handleReplayLastAudio = () => {
    if (!lastSpokenText) return;
    speakWithTeacherVoice(lastSpokenText);
  };

  const handleToggleSlowMode = () => {
    const next = !slowMode;
    setSlowMode(next);
    setGlobalSpeechSlowMode(next);
  };

  const handleClearStudentChat = () => {
    stopSpeaking();
    updateCurrentSessionChat(() => [createInitialWelcomeMessage(currentStudent?.name)]);
  };

  const handleLogoutStudent = () => {
    stopSpeaking();
    setCurrentStudent(null);
    setIsRegistering(false);
  };

  const handleSubmitHomework = () => {
    if (selectedAnswerIndex === null) return;

    unlockAudioContext();
    const isCorrect = selectedAnswerIndex === currentHomework.correctIndex;
    setIsHomeworkSubmitted(true);

    if (isCorrect) {
      playNotificationChime('success');
      const rewardText = `ماشاء اللہ بہت خوب! بالکل درست جواب۔ ${currentHomework.explanation} آپ کو +2 ستارے مل چکے ہیں۔`;
      setHomeworkFeedback(rewardText);

      if (currentStudent) {
        const updatedStars = (currentStudent.stars || 0) + 2;
        setCurrentStudent((prev) => (prev ? { ...prev, stars: updatedStars } : prev));
        saveStudentProgressToFirestore({
          id: currentStudent.id,
          name: currentStudent.name,
          fatherName: currentStudent.fatherName,
          grade: currentStudent.classGrade || '1',
          rollNumber: currentStudent.rollNumber,
          stars: updatedStars,
          lastActive: new Date().toISOString(),
        }).catch((err) => console.warn('Student progress save notice:', err));
      }

      speakWithTeacherVoice(rewardText);
    } else {
      playNotificationChime('alert');
      const tryAgainText = `حوصلہ رکھیں بیٹا، دوبارہ غور کریں! صحیح جواب یہ تھا: ${
        currentHomework.options[currentHomework.correctIndex]
      }۔ ${currentHomework.explanation}`;
      setHomeworkFeedback(tryAgainText);
      speakWithTeacherVoice(tryAgainText);
    }
  };

  const handleCreateAdmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) return;

    const rollNo = `RK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newStudent: AiSchoolStudent = {
      id: `student-${Date.now()}`,
      name: regName.trim(),
      fatherName: regFatherName.trim(),
      rollNumber: rollNo,
      classGrade: regClass,
      admissionDate: new Date().toLocaleDateString('ur-PK'),
      stars: 5,
      completedHomework: [],
      photo:
        regPhoto ||
        'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&h=200&fit=crop',
    };

    setCurrentStudent(newStudent);
    // Initialize isolated session for new student
    setSessionsMap((prev) => {
      const updated = {
        ...prev,
        [newStudent.id]: [createInitialWelcomeMessage(newStudent.name)],
      };
      try {
        localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    saveStudentProgressToFirestore({
      id: newStudent.id,
      name: newStudent.name,
      fatherName: newStudent.fatherName,
      grade: newStudent.classGrade || regClass || '1',
      rollNumber: newStudent.rollNumber,
      stars: newStudent.stars,
      enrolledAt: newStudent.admissionDate,
      lastActive: new Date().toISOString(),
    }).catch((err) => console.warn('Student enrollment save notice:', err));
    setIsRegistering(false);
    setActiveTab('idcard');
    playNotificationChime('success');

    speakWithTeacherVoice(
      `مبارک ہو ${newStudent.name}! ورچوئل اسکول رتہ کلاں میں آپ کا داخلہ ہو چکا ہے۔ آپ کا رول نمبر ${newStudent.rollNumber} ہے۔`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2.5 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border-2 border-indigo-500 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto flex flex-col max-h-[94vh]">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-stone-950 text-white p-3.5 sm:p-4 relative overflow-hidden shrink-0">
          <div className="flex items-center justify-between relative z-10 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-200 text-stone-950 flex items-center justify-center font-bold shadow-lg shrink-0 border-2 border-white/20">
                <GraduationCap className="w-6 h-6 text-indigo-950" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold font-nastaliq text-amber-200 leading-tight">
                    رتہ کلاں ورچوئل AI اسکول و آن لائن استاد
                  </h3>
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-nastaliq">
                    {currentStudent ? `طالب علم: ${currentStudent.name}` : 'مفت صوتی اسکول'}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-200 font-nastaliq">
                  نرسری تا دسویں جماعت (Matric) — ہر سوال کا درست اور تفصیلی جواب
                </p>
              </div>
            </div>

            {/* Top Audio & Close Controls */}
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {isPlayingAudio && (
                <>
                  <button
                    onClick={handleTogglePauseResume}
                    className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                    title={isPausedAudio ? 'جاری رکھیں' : 'وقفہ کریں'}
                  >
                    {isPausedAudio ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    <span className="font-nastaliq hidden sm:inline">
                      {isPausedAudio ? 'جاری' : 'وقفہ'}
                    </span>
                  </button>
                  <button
                    onClick={handleStopAudio}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer animate-pulse"
                    title="آواز بند کریں"
                  >
                    <VolumeX className="w-3.5 h-3.5" />
                    <span className="font-nastaliq hidden xs:inline">روکیں</span>
                  </button>
                </>
              )}

              {!isPlayingAudio && lastSpokenText && (
                <button
                  onClick={handleReplayLastAudio}
                  className="px-2 py-1 bg-white/15 hover:bg-white/25 text-amber-200 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                  title="پچھلا سبق دوبارہ سنیں"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="font-nastaliq hidden sm:inline">دوبارہ سنیں</span>
                </button>
              )}

              <button
                onClick={() => {
                  stopSpeaking();
                  onClose();
                }}
                className="p-1.5 text-stone-300 hover:text-white rounded-full bg-black/30 transition cursor-pointer"
                title="بند کریں"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Voice Settings & Operating Status Bar */}
          <div className="bg-black/35 backdrop-blur-xs px-3 py-1.5 rounded-2xl border border-white/15 flex items-center justify-between flex-wrap gap-2 text-xs font-nastaliq mt-2">
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${schoolStatus.dotClass}`} />
              <span className="font-bold text-amber-300">{schoolStatus.statusTextUrdu}</span>
              <span className="text-[10px] text-emerald-300 bg-emerald-950/80 border border-emerald-600/40 px-1.5 py-0.5 rounded-md">
                🎙️ {voiceStatus.statusMessageUrdu}
              </span>
            </div>

            {/* Voice Gender & Slow Mode Toggles */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() =>
                  setTeacherVoiceGender((prev) => (prev === 'male' ? 'female' : 'male'))
                }
                className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-200 border border-white/15 cursor-pointer"
                title="استاد کی آواز تبدیل کریں"
              >
                {teacherVoiceGender === 'male' ? '👨‍🏫 استاد (مردانہ آواز)' : '👩‍🏫 استانی (زنانہ آواز)'}
              </button>

              <button
                type="button"
                onClick={handleToggleSlowMode}
                className={`px-2 py-0.5 rounded-lg border cursor-pointer transition ${
                  slowMode
                    ? 'bg-amber-400 text-stone-950 font-bold border-amber-300'
                    : 'bg-white/10 text-stone-200 border-white/15 hover:bg-white/20'
                }`}
                title="بچوں کے لیے آہستہ اور واضح آواز"
              >
                🐢 آہستہ بولیں {slowMode ? '(آن)' : '(آف)'}
              </button>
            </div>
          </div>

          {/* Live Spoken Sentence Subtitle Banner */}
          {isPlayingAudio && activeSpokenSegment && (
            <div className="mt-2 bg-amber-400/20 border border-amber-300/40 rounded-xl px-3 py-1 text-xs text-amber-100 font-nastaliq flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-amber-300 shrink-0 animate-bounce" />
              <span className="truncate">{activeSpokenSegment}</span>
            </div>
          )}

          {/* Quick Tabs */}
          <div className="grid grid-cols-4 gap-1.5 mt-2.5 pt-2 border-t border-white/10 text-xs font-nastaliq">
            <button
              onClick={() => setActiveTab('classroom')}
              className={`py-1.5 px-1 sm:px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition cursor-pointer text-center ${
                activeTab === 'classroom'
                  ? 'bg-amber-400 text-stone-950 shadow'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">کلاس روم</span>
            </button>

            <button
              onClick={() => setActiveTab('nursery')}
              className={`py-1.5 px-1 sm:px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition cursor-pointer text-center ${
                activeTab === 'nursery'
                  ? 'bg-amber-400 text-stone-950 shadow'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <span className="text-sm shrink-0">🧸</span>
              <span className="truncate">نرسری و قاعدہ</span>
            </button>

            <button
              onClick={() => setActiveTab('homework')}
              className={`py-1.5 px-1 sm:px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition cursor-pointer text-center ${
                activeTab === 'homework'
                  ? 'bg-amber-400 text-stone-950 shadow'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Award className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">ہوم ورک</span>
            </button>

            <button
              onClick={() => setActiveTab('idcard')}
              className={`py-1.5 px-1 sm:px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition cursor-pointer text-center ${
                activeTab === 'idcard'
                  ? 'bg-amber-400 text-stone-950 shadow'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <IdCard className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">داخلہ کارڈ</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: CLASSROOM & INTERACTIVE ONLINE TEACHER */}
        {/* ========================================================================= */}
        {activeTab === 'classroom' && (
          <div className="p-3 sm:p-4 flex-1 overflow-y-auto flex flex-col space-y-2.5">
            {/* Class Selector Row: Nursery to 10th Matric */}
            <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-2xl">
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                <span className="text-xs font-bold text-stone-800 font-nastaliq flex items-center gap-1">
                  <span>🎓 جماعت کا انتخاب کریں (Select Class):</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-full font-nastaliq">
                    منتخب: {currentClassObj.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearStudentChat}
                    className="text-[11px] text-stone-600 hover:text-red-700 bg-stone-200/70 hover:bg-red-100 px-2 py-0.5 rounded-full font-nastaliq flex items-center gap-1 cursor-pointer"
                    title="اس طالب علم کی گفتگو صاف کریں"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>نئی گفتگو</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {VILLAGE_SCHOOL_CLASSES.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer font-nastaliq ${
                      selectedClassId === cls.id
                        ? 'bg-indigo-700 text-white shadow'
                        : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {cls.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Subjects Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {SCHOOL_SUBJECTS.map((sub) => (
                <button
                  key={sub.key}
                  onClick={() => {
                    setSelectedSubjectKey(sub.key);
                    playNotificationChime('teacher');
                    speakWithTeacherVoice(`آپ نے ${sub.title} منتخب کیا ہے۔ اپنا سوال پوچھیں۔`);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 font-nastaliq ${
                    selectedSubjectKey === sub.key
                      ? 'bg-amber-400 text-stone-950 shadow border-amber-300'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                  }`}
                >
                  <span>{sub.icon}</span>
                  <span>{sub.title}</span>
                </button>
              ))}
            </div>

            {/* Quick Early Learning Banner for Nursery - Class 2 */}
            {['nursery', 'prep', 'class1', 'class2'].includes(selectedClassId) && (
              <div
                onClick={() => setActiveTab('nursery')}
                className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white p-2.5 rounded-2xl flex items-center justify-between text-xs font-nastaliq shadow cursor-pointer hover:opacity-95 transition active:scale-98"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🧸</span>
                  <span className="font-bold">
                    نرسری تا دوسری جماعت: مکمل اردو قاعدہ (38 حروف)، A تا Z، گنتی اور کھلونے یہاں سیکھیں!
                  </span>
                </div>
                <span className="bg-white text-stone-950 font-bold px-2 py-0.5 rounded-lg text-[10px] shrink-0">
                  قاعدہ کھولیں ➔
                </span>
              </div>
            )}

            {/* Chat Conversation Box */}
            <div className="flex-1 bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-3 min-h-[190px] max-h-[290px] overflow-y-auto">
              {chatHistory.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col ${
                    item.sender === 'student' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl p-3 text-xs font-nastaliq shadow-sm relative ${
                      item.sender === 'student'
                        ? 'bg-indigo-700 text-white rounded-br-none'
                        : 'bg-white text-stone-900 border border-stone-200 rounded-bl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1 pb-1 border-b border-black/5">
                      <span className="text-[10px] font-bold opacity-85">
                        {item.sender === 'student'
                          ? `👤 ${currentStudent?.name || 'طالب علم'}`
                          : '👨‍🏫 آن لائن استاد (Online Teacher)'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] opacity-65 font-sans">{item.timestamp}</span>
                        {item.sender === 'teacher' && (
                          <button
                            onClick={() => speakWithTeacherVoice(item.spokenText || item.text)}
                            className="text-indigo-700 hover:text-indigo-950 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer"
                            title="جواب آواز میں سنیں"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span className="text-[10px]">سنیں</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="whitespace-pre-line leading-relaxed">{item.text}</p>

                    {/* Follow-up question chip to encourage interactive learning */}
                    {item.sender === 'teacher' && item.followUpQuestion && (
                      <div className="mt-2 pt-2 border-t border-stone-200/80 flex items-center justify-between gap-2 text-[11px] text-indigo-900 bg-indigo-50/70 px-2.5 py-1.5 rounded-xl">
                        <span>🤔 {item.followUpQuestion}</span>
                      </div>
                    )}

                    {/* Verified Online Source Citations */}
                    {item.sender === 'teacher' && item.sources && item.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-stone-200/80 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-800 block">
                          🌐 تصدیق شدہ معلوماتی لنکس (Verified Sources):
                        </span>
                        <div className="flex flex-wrap gap-1.5 font-sans">
                          {item.sources.map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-lg transition"
                            >
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate max-w-[180px]">{src.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoadingAnswer && (
                <div className="flex items-center gap-2 text-xs text-indigo-800 font-nastaliq bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-2xl w-fit">
                  <div className="w-3 h-3 rounded-full bg-indigo-600 animate-ping" />
                  <span>آن لائن استاد آپ کے سوال کا درست جواب تیار کر رہے ہیں...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Question Input Box with Voice Mic & Text */}
            <div className="space-y-1.5 pt-1">
              <div
                className={`flex items-center gap-2 p-1.5 rounded-2xl border-2 transition ${
                  isListeningVoice
                    ? 'border-red-500 ring-2 ring-red-300 bg-red-50/30'
                    : 'border-indigo-400 bg-white'
                }`}
              >
                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                  placeholder={
                    isListeningVoice
                      ? '🎙️ استاد سن رہے ہیں... اپنا سوال بولیں'
                      : `کوئی بھی سوال لکھیں یا مائیک دبائیں (${currentClassObj.name})...`
                  }
                  className="flex-1 text-xs sm:text-sm text-stone-900 px-2 py-1 font-nastaliq focus:outline-none bg-transparent"
                />

                {/* Voice Input Mic Button */}
                <button
                  type="button"
                  onClick={handleToggleVoiceQuestion}
                  className={`p-2 rounded-xl text-xs font-bold transition shadow cursor-pointer active:scale-95 flex items-center gap-1 ${
                    isListeningVoice
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-900'
                  }`}
                  title="بول کر سوال پوچھیں (Voice Input)"
                >
                  {isListeningVoice ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4 text-indigo-800" />
                  )}
                </button>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => handleAskQuestion()}
                  disabled={isLoadingAnswer || !questionInput.trim()}
                  className="px-3.5 py-2 bg-indigo-800 hover:bg-indigo-900 disabled:opacity-50 text-white font-bold rounded-xl text-xs font-nastaliq shadow cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>پوچھیں</span>
                </button>
              </div>

              {/* Sample 1-Tap Curriculum Questions */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] text-stone-600 font-nastaliq pb-0.5">
                <span className="shrink-0 font-bold text-indigo-900">فوری سوالات:</span>
                {[
                  'What is 2 + 2?',
                  'What is 15 multiplied by 6?',
                  'What is the capital of Pakistan?',
                  'Explain photosynthesis in simple Urdu.',
                  'What is a noun? Give three English examples.',
                  'Why should we wash our hands before eating?',
                  'پاکستان میں بارش کیوں ہوتی ہے؟',
                  'Explain the water cycle to a class-three student.',
                  'Who is the current Prime Minister of Pakistan?',
                ].map((sample) => (
                  <button
                    key={sample}
                    onClick={() => {
                      setQuestionInput(sample);
                      handleAskQuestion(sample);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-indigo-100 text-stone-800 border border-stone-200 whitespace-nowrap cursor-pointer"
                  >
                    💡 {sample}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: NURSERY & EARLY CHILDHOOD VERIFIED VOICE LEARNING */}
        {/* ========================================================================= */}
        {activeTab === 'nursery' && (
          <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-3 font-nastaliq">
            {/* Child-Friendly Header Banner */}
            <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-3xl p-3 sm:p-4 text-white shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between gap-2 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-2xl shadow shrink-0">
                    🧸
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-amber-200 leading-tight">
                      نرسری تا دوسری جماعت: مکمل صوتی قاعدہ، گنتی اور کھلونے
                    </h3>
                    <p className="text-[11px] text-pink-100">
                      ہر حرف کا درست نام، فونیٹکس آواز (Phonics) اور مثال الگ الگ سنیں
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    playNotificationChime('teacher');
                    speakWithTeacherVoice(
                      'شاباش بچو! کسی بھی حرف، نمبر یا کھلونے پر کلک کریں اور اس کا درست نام، آواز اور لفظ سیکھیں!'
                    );
                  }}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow cursor-pointer shrink-0 active:scale-95 transition"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>ہنمائی سنیں 🔊</span>
                </button>
              </div>

              {/* Sub-Category Pills for Nursery */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-3 border-t border-white/20 mt-2.5 scrollbar-none text-xs">
                <button
                  onClick={() => setNurseryCategory('urdu')}
                  className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                    nurseryCategory === 'urdu'
                      ? 'bg-amber-400 text-stone-950 shadow'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <span>🍎</span>
                  <span>اردو حروفِ تہجی ({URDU_ALPHABETS.length} حروف)</span>
                </button>

                <button
                  onClick={() => setNurseryCategory('english')}
                  className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                    nurseryCategory === 'english'
                      ? 'bg-amber-400 text-stone-950 shadow'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <span>🔤</span>
                  <span>انگلش اے بی سی (A تا Z - {ENGLISH_ABC.length})</span>
                </button>

                <button
                  onClick={() => setNurseryCategory('counting')}
                  className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                    nurseryCategory === 'counting'
                      ? 'bg-amber-400 text-stone-950 shadow'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <span>🔢</span>
                  <span>گنتی و کھلونے (1 تا 100)</span>
                </button>

                <button
                  onClick={() => setNurseryCategory('objects')}
                  className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                    nurseryCategory === 'objects'
                      ? 'bg-amber-400 text-stone-950 shadow'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <span>🎨</span>
                  <span>اشیاء، رنگ اور اشکال</span>
                </button>

                <button
                  onClick={() => setNurseryCategory('quiz')}
                  className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                    nurseryCategory === 'quiz'
                      ? 'bg-amber-400 text-stone-950 shadow'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <span>⭐</span>
                  <span>تصویری کوئز</span>
                </button>
              </div>
            </div>

            {/* Voice Pronunciation Mode Selector Bar */}
            {nurseryCategory !== 'quiz' && (
              <div className="bg-stone-100 border border-stone-200 rounded-2xl p-2 flex items-center justify-between flex-wrap gap-1.5 text-xs">
                <span className="font-bold text-indigo-950 px-1">
                  🔊 بولنے کا انداز (Learning Mode):
                </span>
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                  {[
                    { id: 'full' as EarlyLearningMode, label: 'مکمل سبق' },
                    { id: 'letter_name' as EarlyLearningMode, label: 'حرف / نمبر کا نام' },
                    { id: 'phonics' as EarlyLearningMode, label: 'آواز (Phonics)' },
                    { id: 'word_only' as EarlyLearningMode, label: 'صرف لفظ و تصویر' },
                    { id: 'urdu_only' as EarlyLearningMode, label: 'صرف اردو' },
                    { id: 'english_only' as EarlyLearningMode, label: 'English Only' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setLearningMode(m.id)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap cursor-pointer transition ${
                        learningMode === m.id
                          ? 'bg-indigo-800 text-white shadow'
                          : 'bg-white text-stone-700 border border-stone-200 hover:bg-indigo-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sequential Counting Bar when inside Counting tab */}
            {nurseryCategory === 'counting' && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-2.5 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔢</span>
                  <div>
                    <strong className="text-stone-900 block">
                      ترتیب وار گنتی پلیئر (Sequential Counting 1 to 10)
                    </strong>
                    <span className="text-[11px] text-stone-600">
                      ہر نمبر ہائی لائٹ ہوگا اور واضح وقفے کے ساتھ بولا جائے گا
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-[11px] text-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={repeatSlowlyCounting}
                      onChange={(e) => setRepeatSlowlyCounting(e.target.checked)}
                      className="rounded accent-indigo-700"
                    />
                    <span>آہستہ دہرائیں</span>
                  </label>
                  <button
                    onClick={handleStartSequentialCounting}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer ${
                      isSequentialCounting
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-indigo-900 hover:bg-indigo-800 text-amber-300'
                    }`}
                  >
                    {isSequentialCounting ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>گنتی روکیں</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>1 تا 10 ترتیب وار سنیں</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 1. Complete 38-Letter Urdu Haroof-e-Tahajji Grid */}
            {nurseryCategory === 'urdu' && (
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2.5">
                {URDU_ALPHABETS.map((item) => {
                  const isPlaying = activePlayingId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handlePlayEarlyItem(item)}
                      className={`p-3 rounded-2xl border-2 transition cursor-pointer flex flex-col items-center text-center gap-1 relative shadow-sm hover:scale-102 active:scale-95 ${
                        item.bgColor
                      } ${isPlaying ? 'ring-4 ring-amber-400 bg-amber-100' : ''}`}
                    >
                      <span className="text-3xl sm:text-4xl drop-shadow">{item.icon}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-2xl font-black text-indigo-950">{item.char}</span>
                        <span className="text-sm font-bold">{item.objectLabelUrdu}</span>
                      </div>
                      <span className="text-[10px] text-stone-600 font-sans">
                        {item.letterNameUrdu} • {item.objectLabelEn}
                      </span>

                      {/* Sub-buttons for Letter Name, Phonics, Word */}
                      <div
                        className="flex items-center gap-1 mt-1 pt-1 border-t border-black/10 w-full justify-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handlePlayEarlyItem(item, 'letter_name')}
                          className="px-1.5 py-0.5 bg-white/85 hover:bg-white rounded text-[10px] font-bold text-indigo-900 shadow-2xs cursor-pointer"
                          title="صرف حرف کا نام سنیں"
                        >
                          حرف
                        </button>
                        <button
                          onClick={() => handlePlayEarlyItem(item, 'phonics')}
                          className="px-1.5 py-0.5 bg-white/85 hover:bg-white rounded text-[10px] font-bold text-purple-900 shadow-2xs cursor-pointer"
                          title="حرف کی فونیٹکس آواز سنیں"
                        >
                          آواز
                        </button>
                        <button
                          onClick={() => handlePlayEarlyItem(item, 'word_only')}
                          className="px-1.5 py-0.5 bg-white/85 hover:bg-white rounded text-[10px] font-bold text-emerald-900 shadow-2xs cursor-pointer"
                          title="مثال کا لفظ سنیں"
                        >
                          لفظ
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. Complete 26-Letter English ABC Grid */}
            {nurseryCategory === 'english' && (
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2.5">
                {ENGLISH_ABC.map((item) => {
                  const isPlaying = activePlayingId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handlePlayEarlyItem(item)}
                      className={`p-3 rounded-2xl border-2 transition cursor-pointer flex flex-col items-center text-center gap-1 relative shadow-sm hover:scale-102 active:scale-95 ${
                        item.bgColor
                      } ${isPlaying ? 'ring-4 ring-amber-400 bg-amber-100' : ''}`}
                    >
                      <span className="text-3xl sm:text-4xl drop-shadow">{item.icon}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-2xl font-mono font-black text-indigo-950">
                          {item.char}
                        </span>
                        <span className="text-xs font-bold font-sans">{item.objectLabelEn}</span>
                      </div>
                      <span className="text-[11px] text-stone-700 font-nastaliq">
                        {item.objectLabelUrdu} ({item.phonicsSoundEn})
                      </span>

                      <div
                        className="flex items-center gap-1 mt-1 pt-1 border-t border-black/10 w-full justify-center font-sans"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handlePlayEarlyItem(item, 'letter_name')}
                          className="px-1.5 py-0.5 bg-white/85 hover:bg-white rounded text-[10px] font-bold text-indigo-900 shadow-2xs cursor-pointer"
                        >
                          Letter
                        </button>
                        <button
                          onClick={() => handlePlayEarlyItem(item, 'phonics')}
                          className="px-1.5 py-0.5 bg-white/85 hover:bg-white rounded text-[10px] font-bold text-purple-900 shadow-2xs cursor-pointer"
                        >
                          Phonics
                        </button>
                        <button
                          onClick={() => handlePlayEarlyItem(item, 'word_only')}
                          className="px-1.5 py-0.5 bg-white/85 hover:bg-white rounded text-[10px] font-bold text-emerald-900 shadow-2xs cursor-pointer"
                        >
                          Word
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. Counting & Numbers (1-10, 25, 50, 100) Grid */}
            {nurseryCategory === 'counting' && (
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2.5">
                {COUNTING_TOYS.map((item) => {
                  const isPlaying = activePlayingId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handlePlayEarlyItem(item)}
                      className={`p-3 rounded-2xl border-2 transition cursor-pointer flex flex-col items-center text-center gap-1 relative shadow-sm hover:scale-102 active:scale-95 ${
                        item.bgColor
                      } ${isPlaying ? 'ring-4 ring-amber-400 bg-amber-100 scale-103' : ''}`}
                    >
                      <span className="text-3xl sm:text-4xl drop-shadow">{item.icon}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-2xl font-mono font-black text-indigo-950">
                          {item.char}
                        </span>
                        <span className="text-xs font-bold">{item.urduNumberWord}</span>
                      </div>
                      <span className="text-[10px] text-stone-700 font-sans font-bold">
                        {item.englishNumberWord}
                      </span>
                      <span className="text-[11px] text-stone-600">{item.objectLabelUrdu}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 4. Verified Colors, Shapes, Toys & Everyday Objects Grid */}
            {nurseryCategory === 'objects' && (
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2.5">
                {OBJECTS_COLORS_SHAPES.map((item) => {
                  const isPlaying = activePlayingId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handlePlayEarlyItem(item)}
                      className={`p-3 rounded-2xl border-2 transition cursor-pointer flex flex-col items-center text-center gap-1 relative shadow-sm hover:scale-102 active:scale-95 ${
                        item.bgColor
                      } ${isPlaying ? 'ring-4 ring-amber-400 bg-amber-100' : ''}`}
                    >
                      <span className="text-3xl sm:text-4xl drop-shadow">{item.icon}</span>
                      <span className="text-sm font-bold text-stone-900 mt-1">
                        {item.objectLabelUrdu}
                      </span>
                      <span className="text-[11px] text-stone-600 font-sans font-bold">
                        {item.objectLabelEn}
                      </span>
                      <div
                        className="flex items-center gap-1 mt-1 pt-1 border-t border-black/10 w-full justify-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handlePlayEarlyItem(item, 'urdu_only')}
                          className="px-2 py-0.5 bg-white/85 hover:bg-white rounded text-[10px] font-bold text-indigo-900 cursor-pointer"
                        >
                          اردو
                        </button>
                        <button
                          onClick={() => handlePlayEarlyItem(item, 'english_only')}
                          className="px-2 py-0.5 bg-white/85 hover:bg-white rounded text-[10px] font-bold text-emerald-900 font-sans cursor-pointer"
                        >
                          English
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 5. Multi-Question Interactive Toy & Picture Quiz */}
            {nurseryCategory === 'quiz' && (
              <div className="bg-white border-2 border-purple-300 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <h4 className="font-bold text-sm text-purple-950">
                        ننھا تصویری کوئز (سوال {activeQuizIdx + 1} از{' '}
                        {EARLY_LEARNING_QUIZ_QUESTIONS.length})
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        صحیح تصویر چنیں اور +2 ستارے انعام پائیں
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        speakWithTeacherVoice(currentQuiz.questionUrdu);
                      }}
                      className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>سوال سنیں</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveQuizIdx((prev) => (prev + 1) % EARLY_LEARNING_QUIZ_QUESTIONS.length);
                        setQuizFeedbackText(null);
                      }}
                      className="px-2.5 py-1 bg-indigo-800 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      اگلا سوال ➔
                    </button>
                  </div>
                </div>

                <div className="bg-purple-50 p-3 rounded-2xl border border-purple-200 text-center space-y-1">
                  <span className="text-sm text-purple-950 font-bold block">
                    {currentQuiz.questionUrdu}
                  </span>
                  <span className="text-xs text-stone-600 font-sans block">
                    {currentQuiz.questionEn}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  {currentQuiz.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        unlockAudioContext();
                        if (opt.isCorrect) {
                          playNotificationChime('success');
                          setQuizFeedbackText(opt.hintUrdu);
                          if (currentStudent) {
                            setCurrentStudent((prev) =>
                              prev ? { ...prev, stars: (prev.stars || 0) + 2 } : prev
                            );
                          }
                          speakWithTeacherVoice(opt.hintUrdu);
                        } else {
                          playNotificationChime('alert');
                          setQuizFeedbackText(opt.hintUrdu);
                          speakWithTeacherVoice(opt.hintUrdu);
                        }
                      }}
                      className="p-3.5 rounded-2xl bg-stone-50 hover:bg-purple-100 border-2 border-stone-200 hover:border-purple-400 transition cursor-pointer flex flex-col items-center justify-center gap-1 active:scale-95"
                    >
                      <span className="text-4xl">{opt.icon}</span>
                      <span className="text-xs font-bold text-stone-800 font-nastaliq">
                        {opt.labelUrdu}
                      </span>
                      <span className="text-[10px] text-stone-500 font-sans">{opt.labelEn}</span>
                    </button>
                  ))}
                </div>

                {quizFeedbackText && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-stone-900 font-bold text-center">
                    {quizFeedbackText}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DAILY HOMEWORK & STARS REWARD */}
        {/* ========================================================================= */}
        {activeTab === 'homework' && (
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 rounded-2xl p-3 shadow text-stone-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-stone-950 text-amber-300 flex items-center justify-center font-bold text-lg shadow">
                  ⭐
                </div>
                <div>
                  <h4 className="font-bold text-sm font-nastaliq">
                    {currentStudent ? currentStudent.name : 'مہمان طالب علم'} کے ستارے
                  </h4>
                  <p className="text-[11px] text-stone-800 font-nastaliq">
                    ہر درست ہوم ورک پر +2 ستارے ملیں گے!
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-xl sm:text-2xl font-black block">
                  {currentStudent ? currentStudent.stars : 0} ⭐
                </span>
                <span className="text-[10px] font-bold font-nastaliq">کل ستارے</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {SCHOOL_SUBJECTS.map((sub) => (
                <button
                  key={sub.key}
                  onClick={() => {
                    setSelectedSubjectKey(sub.key);
                    setSelectedAnswerIndex(null);
                    setIsHomeworkSubmitted(false);
                    setHomeworkFeedback(null);
                    playNotificationChime('teacher');
                    speakWithTeacherVoice(`آپ نے ${sub.title} کا ہوم ورک منتخب کیا ہے۔`);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 font-nastaliq ${
                    selectedSubjectKey === sub.key
                      ? 'bg-indigo-800 text-white shadow'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <span>{sub.icon}</span>
                  <span>{sub.title}</span>
                </button>
              ))}
            </div>

            <div className="bg-white border-2 border-indigo-200 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500 font-nastaliq flex-wrap gap-2">
                <span className="bg-indigo-100 text-indigo-950 px-2.5 py-0.5 rounded-full font-bold">
                  روزانہ ٹاسک — {currentClassObj.name}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      playNotificationChime('teacher');
                      speakWithTeacherVoice(`سوال: ${currentHomework.question}`);
                    }}
                    className="text-indigo-700 hover:underline flex items-center gap-1 font-bold cursor-pointer text-xs"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>سوال سنیں</span>
                  </button>
                  <button
                    onClick={() => {
                      playNotificationChime('teacher');
                      const optStr = currentHomework.options
                        .map((o, i) => `آپشن ${i + 1}: ${o}`)
                        .join('۔ ');
                      speakWithTeacherVoice(`سوال: ${currentHomework.question}۔ ${optStr}`);
                    }}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-900 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 font-bold cursor-pointer text-[11px]"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-indigo-700" />
                    <span>سوال مع جوابات سنیں 🔊</span>
                  </button>
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-stone-900 font-nastaliq leading-relaxed">
                {currentHomework.question}
              </h3>

              <div className="space-y-2 pt-1">
                {currentHomework.options.map((opt, idx) => {
                  const isSelected = selectedAnswerIndex === idx;
                  let optStyle =
                    'border-stone-200 bg-stone-50 hover:bg-indigo-50 text-stone-900';
                  if (isSelected) {
                    optStyle =
                      'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-400';
                  }
                  if (isHomeworkSubmitted) {
                    if (idx === currentHomework.correctIndex) {
                      optStyle =
                        'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-400';
                    } else if (isSelected) {
                      optStyle = 'border-red-600 bg-red-50 text-red-950 ring-2 ring-red-400';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (!isHomeworkSubmitted) {
                          setSelectedAnswerIndex(idx);
                          speakWithTeacherVoice(`آپشن ${idx + 1}: ${opt}`);
                        }
                      }}
                      disabled={isHomeworkSubmitted}
                      className={`w-full p-3 rounded-2xl border-2 text-right text-xs sm:text-sm font-nastaliq font-bold flex items-center justify-between transition cursor-pointer ${optStyle}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-900 text-xs flex items-center justify-center font-bold font-mono">
                          {idx + 1}
                        </span>
                        <span>{opt}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-3.5 h-3.5 text-stone-400 hover:text-indigo-600" />
                        <span className="w-5 h-5 rounded-full border border-stone-300 flex items-center justify-center shrink-0">
                          {isSelected && '✓'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {homeworkFeedback && (
                <div
                  className={`p-3 rounded-2xl text-xs font-nastaliq leading-relaxed border ${
                    selectedAnswerIndex === currentHomework.correctIndex
                      ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                      : 'bg-amber-50 text-amber-950 border-amber-300'
                  }`}
                >
                  {homeworkFeedback}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                {!isHomeworkSubmitted ? (
                  <button
                    onClick={handleSubmitHomework}
                    className="flex-1 py-2.5 bg-indigo-800 hover:bg-indigo-900 text-white font-bold rounded-2xl text-xs sm:text-sm font-nastaliq shadow transition active:scale-95 cursor-pointer"
                  >
                    جواب جمع کروائیں (+2 ستارے)
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsHomeworkSubmitted(false);
                      setSelectedAnswerIndex(null);
                      setHomeworkFeedback(null);
                    }}
                    className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold rounded-2xl text-xs sm:text-sm font-nastaliq shadow transition active:scale-95 cursor-pointer"
                  >
                    دوبارہ حل کریں 🔄
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ADMISSION & STUDENT ID CARD (WITH SESSION ISOLATION) */}
        {/* ========================================================================= */}
        {activeTab === 'idcard' && (
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {!currentStudent || isRegistering ? (
              <form
                onSubmit={handleCreateAdmission}
                className="bg-white border-2 border-indigo-200 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center gap-2 text-indigo-950 font-nastaliq">
                  <IdCard className="w-5 h-5 text-indigo-700" />
                  <h4 className="font-bold text-sm sm:text-base">
                    ورچوئل اسکول میں مفت داخلہ فارم (Admission Form)
                  </h4>
                </div>
                <p className="text-xs text-stone-500 font-nastaliq">
                  رتہ کلاں کے تمام بچوں اور بیٹیوں کے لیے الگ تعلیمی سیشن، اسکول کارڈ اور رول نمبر مفت جاری کیا جاتا ہے۔
                </p>

                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-bold text-stone-700 font-nastaliq block mb-1">
                      طالب علم کا نام *
                    </label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="مثلاً: محمد احمد، فاطمہ بی بی"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-nastaliq focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 font-nastaliq block mb-1">
                      والد کا نام (اختیاری)
                    </label>
                    <input
                      type="text"
                      value={regFatherName}
                      onChange={(e) => setRegFatherName(e.target.value)}
                      placeholder="والد صاحب کا نام"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-nastaliq focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 font-nastaliq block mb-1">
                      جماعت (Class)
                    </label>
                    <select
                      value={regClass}
                      onChange={(e) => setRegClass(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-nastaliq focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    >
                      {VILLAGE_SCHOOL_CLASSES.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 font-nastaliq block mb-1">
                      طالب علم کی تصویر یا سیلفی (Photo / Selfie)
                    </label>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <div className="flex items-center gap-2.5">
                      {regPhoto ? (
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-indigo-500 shadow shrink-0">
                          <img
                            src={regPhoto}
                            alt="Student preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setRegPhoto('')}
                            className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 text-[10px]"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border-2 border-dashed border-indigo-300 text-indigo-400 flex items-center justify-center text-xl shrink-0">
                          📷
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold font-nastaliq flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                      >
                        <span>
                          {regPhoto
                            ? 'تصویر تبدیل کریں 📷'
                            : 'کیمرہ سے سیلفی لیں یا گیلری سے منتخب کریں 📷'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-800 hover:bg-indigo-900 text-white font-bold rounded-2xl text-xs sm:text-sm font-nastaliq shadow transition active:scale-95 cursor-pointer"
                  >
                    داخلہ مکمل کریں اور کارڈ حاصل کریں
                  </button>
                  {currentStudent && (
                    <button
                      type="button"
                      onClick={() => setIsRegistering(false)}
                      className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-2xl text-xs font-nastaliq cursor-pointer"
                    >
                      منسوخ
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-indigo-950 via-purple-950 to-stone-900 border-2 border-amber-400 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/20 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-amber-300" />
                      <div>
                        <h4 className="font-bold text-sm sm:text-base font-nastaliq text-amber-200">
                          رتہ کلاں ورچوئل AI اسکول
                        </h4>
                        <span className="text-[10px] text-stone-300 font-nastaliq">
                          تحصیل و ضلع جھنگ، پنجاب — آفیشل اسٹوڈنٹ کارڈ
                        </span>
                      </div>
                    </div>
                    <span className="bg-amber-400 text-stone-950 font-mono text-xs font-bold px-2 py-0.5 rounded-lg">
                      {currentStudent.rollNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-2xl shadow shrink-0 border-2 border-amber-300">
                      {currentStudent.photo ? (
                        <img
                          src={currentStudent.photo}
                          alt={currentStudent.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>🎓</span>
                      )}
                    </div>
                    <div className="space-y-1 font-nastaliq">
                      <h3 className="font-bold text-lg text-white">{currentStudent.name}</h3>
                      {currentStudent.fatherName && (
                        <p className="text-xs text-stone-300">ولد: {currentStudent.fatherName}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-amber-300">
                        <span>جماعت: {currentStudent.classGrade}</span>
                        <span>•</span>
                        <span>ستارے: {currentStudent.stars} ⭐</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-stone-400 border-t border-white/10 pt-3 mt-4">
                    <span>ادارہ: رتہ کلاں ورچوئل اسکول</span>
                    <span>تاریخ داخلہ: {currentStudent.admissionDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setIsRegistering(true)}
                    className="flex-1 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-900 font-bold rounded-2xl text-xs font-nastaliq transition cursor-pointer"
                  >
                    نیا طالب علم / کارڈ تبدیل کریں
                  </button>
                  <button
                    onClick={handleLogoutStudent}
                    className="px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-900 font-bold rounded-2xl text-xs font-nastaliq transition cursor-pointer flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>لاگ آؤٹ</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2.5 bg-indigo-800 hover:bg-indigo-900 text-white font-bold rounded-2xl text-xs font-nastaliq transition cursor-pointer flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>پرنٹ کریں</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="bg-stone-100 p-3 border-t border-stone-200 flex items-center justify-between text-xs font-nastaliq shrink-0">
          <span className="text-stone-600">
            ورچوئل اسکول رتہ کلاں — زیر سرپرستی: ثمر سعید (0327-0019099)
          </span>
          <button
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-xl text-xs cursor-pointer"
          >
            بند کریں
          </button>
        </div>
      </div>
    </div>
  );
};
