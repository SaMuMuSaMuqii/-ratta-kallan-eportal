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
  CheckCircle,
  HelpCircle,
  Sparkles,
  Calendar,
  Award,
  Play,
  RotateCcw,
  Check,
  User,
  ShieldCheck,
  IdCard,
  QrCode,
  LogOut,
  ChevronRight,
  Maximize2,
  Star,
  Printer,
  Sparkle,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { Language, SubjectKey, AiSchoolStudent } from '../types';
import {
  speakText,
  stopSpeaking,
  playNotificationChime,
  VoiceRecognizer,
  isSpeechRecognitionSupported,
  unlockAudioContext,
  getSpeechRate,
  cleanSpeechText,
} from '../utils/speech';
import { askSirAshraf } from '../utils/geminiTeacher';
import { getSchoolOperatingStatus } from '../utils/operatingHours';
import { URDU_ALPHABETS, COUNTING_TOYS, ENGLISH_ABC } from '../data/earlyLearningData';
import { saveStudentProgressToFirestore, loadStudentProgressFromFirestore } from '../firebase/firestoreService';

interface AiSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

const STORAGE_STUDENT_KEY = 'rk_ai_school_current_student_v2';
const STORAGE_ALL_STUDENTS_KEY = 'rk_ai_school_all_students_v2';

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

  // Selected Class (Nursery to 10th Matric)
  const [selectedClassId, setSelectedClassId] = useState<string>('class5');
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<SubjectKey>('math');

  // Active view tab (Classroom, Nursery Fun Learning, Homework, ID Card)
  const [activeTab, setActiveTab] = useState<'classroom' | 'nursery' | 'homework' | 'idcard'>('classroom');
  const [nurseryCategory, setNurseryCategory] = useState<'urdu' | 'counting' | 'english' | 'quiz'>('urdu');
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);

  // Question & Answer state
  const [questionInput, setQuestionInput] = useState('');
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'student' | 'teacher'; text: string }>>([
    {
      sender: 'teacher',
      text: 'السلام علیکم! آج کون سا سبق پڑھنا ہے؟ نرسری سے دسویں جماعت تک کوئی بھی سوال پوچھیں یا بول کر بتائیں۔',
    },
  ]);

  // Voice recording state
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const voiceRecognizerRef = useRef<VoiceRecognizer | null>(null);

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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert('تصویر کا سائز 4 ایم بی سے کم ہونا چاہیے۔');
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
    }
  }, [currentStudent]);

  // Warm welcome for students on opening the Virtual School
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        unlockAudioContext();
        playNotificationChime('teacher');
        speakText(
          'السلام علیکم! رتہ کلاں ورچوئل اسکول میں آپ کا خیر مقدم ہے۔ نرسری سے لے کر دسویں جماعت کے تمام مضامین میں کوئی بھی سوال پوچھیں یا ہوم ورک حل کریں۔ آئیے مل کر پڑھتے ہیں!',
          lang,
          undefined,
          { isFemaleVillageVoice: false, rate: 0.95, pitch: 1.0 }
        );
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, lang]);

  if (!isOpen) return null;

  const schoolStatus = getSchoolOperatingStatus();
  const currentClassObj =
    VILLAGE_SCHOOL_CLASSES.find((c) => c.id === selectedClassId) || VILLAGE_SCHOOL_CLASSES[4];
  const currentHomework = homeworkBySubject[selectedSubjectKey];

  const handleSchoolGreeting = () => {
    unlockAudioContext();
    playNotificationChime('teacher');
    speakText(
      'السلام علیکم! رتہ کلاں ورچوئل اسکول میں آپ کا خیر مقدم ہے۔ نرسری سے لے کر دسویں جماعت کے تمام مضامین میں کوئی بھی سوال پوچھیں یا ہوم ورک حل کریں۔ آئیے مل کر پڑھتے ہیں!',
      lang,
      undefined,
      { isFemaleVillageVoice: false, rate: 0.95, pitch: 1.0 }
    );
  };

  const handlePlayEarlyItem = (item: { id: string; spokenText: string }) => {
    unlockAudioContext();
    setActivePlayingId(item.id);
    playNotificationChime('chime');
    speakText(
      item.spokenText,
      lang,
      () => setActivePlayingId(null),
      { isFemaleVillageVoice: false, rate: 0.95, pitch: 1.0 }
    );
  };

  const handleAskQuestion = async (customQ?: string) => {
    const q = (customQ || questionInput).trim();
    if (!q) return;

    unlockAudioContext();
    playNotificationChime('start');
    setChatHistory((prev) => [...prev, { sender: 'student', text: q }]);
    setQuestionInput('');
    setIsLoadingAnswer(true);

    try {
      const answer = await askSirAshraf(q, currentClassObj.name, selectedSubjectKey);
      setChatHistory((prev) => [...prev, { sender: 'teacher', text: answer }]);
      playNotificationChime('teacher');

      // Speak answer aloud
      setIsPlayingAudio(true);
      speakText(cleanSpeechText(answer), lang, () => setIsPlayingAudio(false), {
        isFemaleVillageVoice: false, // Male respected teacher voice
        rate: getSpeechRate(),
        pitch: 1.0,
      });
    } catch (e) {
      console.error('Error asking Sir Ashraf:', e);
    } finally {
      setIsLoadingAnswer(false);
    }
  };

  const handleToggleVoiceQuestion = () => {
    unlockAudioContext();
    if (isListeningVoice) {
      if (voiceRecognizerRef.current) {
        voiceRecognizerRef.current.stop();
      }
      setIsListeningVoice(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      alert('مائیکروفون اس براؤزر میں سپورٹ نہیں ہے، براہ کرم سوال لکھ کر پوچھیں۔');
      return;
    }

    playNotificationChime('start');
    setIsListeningVoice(true);
    const vr = new VoiceRecognizer(lang);
    voiceRecognizerRef.current = vr;

    vr.start(
      (transcript, isFinal) => {
        setQuestionInput(transcript);
        if (isFinal) {
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
    setIsPlayingAudio(false);
  };

  const handleSpeakText = (text: string) => {
    unlockAudioContext();
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      playNotificationChime('teacher');
      speakText(cleanSpeechText(text), lang, () => setIsPlayingAudio(false), {
        isFemaleVillageVoice: false,
        rate: getSpeechRate(),
        pitch: 1.0,
      });
    }
  };

  const handleSubmitHomework = () => {
    if (selectedAnswerIndex === null) {
      alert('براہ کرم کسی ایک جواب کا انتخاب کریں!');
      return;
    }

    unlockAudioContext();
    const isCorrect = selectedAnswerIndex === currentHomework.correctIndex;
    setIsHomeworkSubmitted(true);

    if (isCorrect) {
      playNotificationChime('success');
      const rewardText = `ماشاء اللہ بہت خوب! بالکل درست جواب۔ ${currentHomework.explanation} آپ کو +2 ستارے مل چکے ہیں۔`;
      setHomeworkFeedback(rewardText);

      // Award +2 stars
      if (currentStudent) {
        const updatedStars = (currentStudent.stars || 0) + 2;
        setCurrentStudent((prev) =>
          prev ? { ...prev, stars: updatedStars } : prev
        );
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

      speakText(cleanSpeechText(rewardText), lang, undefined, {
        isFemaleVillageVoice: false,
        pitch: 1.0,
      });
    } else {
      playNotificationChime('alert');
      const tryAgainText = `دوبارہ کوشش کریں بیٹا! صحیح جواب یہ تھا: ${
        currentHomework.options[currentHomework.correctIndex]
      }۔ ${currentHomework.explanation}`;
      setHomeworkFeedback(tryAgainText);

      speakText(cleanSpeechText(tryAgainText), lang, undefined, {
        isFemaleVillageVoice: false,
        pitch: 1.0,
      });
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
      stars: 5, // Welcome bonus
      completedHomework: [],
      photo: regPhoto || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&h=200&fit=crop',
    };

    setCurrentStudent(newStudent);
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

    speakText(
      `مبارک ہو ${newStudent.name}! ورچوئل اسکول رتہ کلاں میں آپ کا داخلہ ہو چکا ہے۔ آپ کا رول نمبر ${newStudent.rollNumber} ہے۔`,
      lang,
      undefined,
      { isFemaleVillageVoice: false, pitch: 1.0 }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2.5 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border-2 border-indigo-500 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto flex flex-col max-h-[92vh]">
        {/* Top Header Banner: Sir Ashraf */}
        <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-stone-950 text-white p-3.5 sm:p-4 relative overflow-hidden shrink-0">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-200 text-stone-950 flex items-center justify-center font-bold shadow-lg shrink-0 border-2 border-white/20">
                <GraduationCap className="w-7 h-7 text-indigo-950" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold font-nastaliq text-amber-200 leading-tight">
                    رتہ کلاں ورچوئل AI اسکول
                  </h3>
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-nastaliq">
                    اسکول رہنمائی
                  </span>
                </div>
                <p className="text-[11px] text-indigo-200 font-nastaliq">
                  نرسری تا دسویں جماعت (Matric) — مفت صوتی تعلیم، ہوم ورک اور سوال جواب
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {isPlayingAudio && (
                <button
                  onClick={handleStopAudio}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer animate-pulse"
                  title="آواز بند کریں"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span className="font-nastaliq hidden xs:inline">بند کریں</span>
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

          {/* School Dedicated Operating Hours & Live Status Badge */}
          <div className="bg-black/35 backdrop-blur-xs px-3 py-1.5 rounded-2xl border border-white/15 flex items-center justify-between text-xs font-nastaliq mt-2.5">
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${schoolStatus.dotClass}`} />
              <span className="font-bold text-amber-300">{schoolStatus.statusTextUrdu}</span>
              <span className="text-[10px] text-indigo-200 font-mono">({schoolStatus.statusTextEnglish})</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-stone-200">
              <span className="font-mono">⏰ {schoolStatus.openingTime} – {schoolStatus.closingTime}</span>
              <span className="hidden sm:inline bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-amber-200">
                وقفہ: {schoolStatus.breakTime}
              </span>
            </div>
          </div>

          {/* Quick Tabs: Classroom, Nursery & Early Fun Learning, Homework, Student ID Card */}
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
              <span className="truncate">نرسری کھلونے</span>
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
        {/* TAB 1: CLASSROOM & SIR ASHRAF INTERACTIVE Q&A */}
        {/* ========================================================================= */}
        {activeTab === 'classroom' && (
          <div className="p-3 sm:p-4 flex-1 overflow-y-auto flex flex-col space-y-3">
            {/* Class Selector Row: Nursery to 10th Matric */}
            <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-2xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-stone-800 font-nastaliq flex items-center gap-1">
                  <span>🎓 جماعت کا انتخاب کریں (Select Class):</span>
                </span>
                <span className="text-[11px] font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-full font-nastaliq">
                  منتخب: {currentClassObj.name}
                </span>
              </div>

              {/* Horizontal Scroll Classes Chips */}
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
                    unlockAudioContext();
                    playNotificationChime('teacher');
                    speakText(`آپ نے ${sub.title} منتخب کیا ہے۔`, lang, undefined, {
                      isFemaleVillageVoice: false,
                    });
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

            {/* School Greeting & Voice Help */}
            <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 border-2 border-amber-500 rounded-2xl p-3 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-stone-950">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl p-1.5 bg-white/70 rounded-xl shadow-xs shrink-0">🏫</span>
                <div>
                  <strong className="text-stone-950 font-nastaliq block text-sm leading-tight">
                    "السلام علیکم! رتہ کلاں ورچوئل اسکول میں خوش آمدید۔"
                  </strong>
                  <span className="text-[11px] text-stone-800 font-nastaliq">
                    رتہ کلاں ورچوئل اسکول تعلیمی رہنمائی
                  </span>
                </div>
              </div>
              <button
                onClick={handleSchoolGreeting}
                className="px-3 py-1.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-amber-300 font-bold font-nastaliq text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95 transition"
                title="تعلیمی رہنمائی کی آواز سنیں"
              >
                <Volume2 className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>تعلیمی رہنمائی سنیں 🔊</span>
              </button>
            </div>

            {/* Quick Nursery / Early Learning Shortcut if Early Class Selected */}
            {['nursery', 'prep', 'class1', 'class2'].includes(selectedClassId) && (
              <div
                onClick={() => setActiveTab('nursery')}
                className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white p-2.5 rounded-2xl flex items-center justify-between text-xs font-nastaliq shadow cursor-pointer hover:opacity-95 transition active:scale-98"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🧸</span>
                  <span className="font-bold">
                    نرسری تا دوسری جماعت: کھلونے، کارٹون اور تصویری سبق کے لیے یہاں کلک کریں!
                  </span>
                </div>
                <span className="bg-white text-stone-950 font-bold px-2 py-0.5 rounded-lg text-[10px] shrink-0">
                  کھلونے والی کلاس ➔
                </span>
              </div>
            )}

            {/* Chat Conversation Box */}
            <div className="flex-1 bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-2.5 min-h-[160px] max-h-[260px] overflow-y-auto">
              {chatHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    item.sender === 'student' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-2.5 text-xs font-nastaliq shadow-sm relative ${
                      item.sender === 'student'
                        ? 'bg-indigo-700 text-white rounded-br-none'
                        : 'bg-white text-stone-900 border border-stone-200 rounded-bl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold opacity-80">
                        {item.sender === 'student' ? 'آپ (طالب علم)' : 'اسکول مددگار'}
                      </span>
                      {item.sender === 'teacher' && (
                        <button
                          onClick={() => handleSpeakText(item.text)}
                          className="text-stone-500 hover:text-indigo-700 p-0.5 cursor-pointer"
                          title="آواز سنیں"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="whitespace-pre-line leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
              {isLoadingAnswer && (
                <div className="flex items-center gap-2 text-xs text-indigo-700 font-nastaliq">
                  <div className="w-3 h-3 rounded-full bg-indigo-600 animate-ping" />
                  <span>اسکول مددگار جواب تیار کر رہے ہیں...</span>
                </div>
              )}
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
                      ? 'اسکول مددگار سن رہے ہیں... اپنا سوال بولیں'
                      : `اسکول مددگار سے ${currentClassObj.name} کا سوال پوچھیں...`
                  }
                  className="flex-1 text-xs sm:text-sm text-stone-900 px-2 py-1 font-nastaliq focus:outline-none bg-transparent"
                />

                {/* Voice Input Mic Button */}
                <button
                  type="button"
                  onClick={handleToggleVoiceQuestion}
                  className={`p-2 rounded-xl text-xs font-bold transition shadow cursor-pointer active:scale-95 ${
                    isListeningVoice
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-900'
                  }`}
                  title="بول کر سوال پوچھیں (Voice Input)"
                >
                  {isListeningVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-indigo-800" />}
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

              {/* Sample 1-Tap Questions */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] text-stone-600 font-nastaliq">
                <span className="shrink-0 font-bold text-indigo-900">فوری سوالات:</span>
                {[
                  '12 کا پہاڑا سنائیں',
                  'پانی کا کیمیائی فارمولا کیا ہے؟',
                  'انگریزی میں سلام کا جواب کیا ہے؟',
                  'ایک ایکڑ میں کتنے مرلے ہوتے ہیں؟',
                  'وضو کے فرائض بتائیں',
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
        {/* TAB 2: NURSERY & EARLY CHILDHOOD CARTOON & TOY-BASED LEARNING */}
        {/* ========================================================================= */}
        {activeTab === 'nursery' && (
          <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-3 font-nastaliq">
            {/* Child-Friendly Header Banner with Sir Ashraf */}
            <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-3xl p-3 sm:p-4 text-white shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between gap-2 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-2xl shadow shrink-0">
                    🧸
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-amber-200 leading-tight">
                      نرسری تا دوسری جماعت: کھلونے اور کارٹون لرننگ
                    </h3>
                    <p className="text-[11px] text-pink-100">
                      چھوٹے بچوں کے لیے صوتی تصاویر، کھلونے اور آسان تعلیمی رہنمائی
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    unlockAudioContext();
                    playNotificationChime('teacher');
                    speakText(
                      'شاباش! کسی بھی کھلونے یا حرف پر کلک کریں اور مزے سے سنیں اور سیکھیں!',
                      lang,
                      undefined,
                      { isFemaleVillageVoice: false, rate: 0.95, pitch: 1.0 }
                    );
                  }}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow cursor-pointer shrink-0 active:scale-95 transition"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>سنیں 🔊</span>
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
                  <span>حروفِ تہجی (18 کارٹون)</span>
                </button>

                <button
                  onClick={() => setNurseryCategory('counting')}
                  className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                    nurseryCategory === 'counting'
                      ? 'bg-amber-400 text-stone-950 shadow'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <span>🧸</span>
                  <span>گنتی و کھلونے (1 تا 10)</span>
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
                  <span>انگلش اے بی سی (ABC)</span>
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
                  <span>کھلونا کوئز (ستارے جیتیں)</span>
                </button>
              </div>
            </div>

            {/* Instruction strip for illiterate kids/parents */}
            <div className="bg-amber-100 border border-amber-300 rounded-2xl p-2 px-3 flex items-center justify-between text-xs text-amber-950">
              <span className="flex items-center gap-1.5 font-bold">
                <span>💡</span>
                <span>کسی بھی کارڈ کو دبائیں، فون خود بول کر نام اور کام سکھائے گا!</span>
              </span>
              <span className="text-[10px] bg-amber-200 px-2 py-0.5 rounded font-mono font-bold">1-Tap Voice</span>
            </div>

            {/* 1. Urdu Haroof-e-Tahajji Grid */}
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
                      } ${isPlaying ? 'ring-4 ring-amber-400 animate-pulse bg-amber-100' : ''}`}
                    >
                      <span className="text-3xl sm:text-4xl drop-shadow">{item.icon}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-2xl font-black text-indigo-950">{item.char}</span>
                        <span className="text-sm font-bold">{item.word}</span>
                      </div>
                      <span className="text-[10px] text-stone-500 font-sans">{item.englishWord}</span>

                      <button
                        className="mt-1 p-1 bg-white/80 hover:bg-white rounded-full shadow text-indigo-900"
                        title="آواز سنیں"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. Counting & Toys 1-10 Grid */}
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
                      } ${isPlaying ? 'ring-4 ring-amber-400 animate-pulse bg-amber-100' : ''}`}
                    >
                      <span className="text-3xl sm:text-4xl drop-shadow">{item.icon}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-2xl font-mono font-black text-indigo-950">{item.char}</span>
                        <span className="text-xs font-bold">{item.word}</span>
                      </div>
                      <span className="text-[10px] text-stone-500 font-sans">{item.englishWord}</span>

                      <button
                        className="mt-1 p-1 bg-white/80 hover:bg-white rounded-full shadow text-indigo-900"
                        title="گنتی سنیں"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. English ABC Grid */}
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
                      } ${isPlaying ? 'ring-4 ring-amber-400 animate-pulse bg-amber-100' : ''}`}
                    >
                      <span className="text-3xl sm:text-4xl drop-shadow">{item.icon}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-2xl font-mono font-black text-indigo-950">{item.char}</span>
                        <span className="text-xs font-bold font-sans">{item.word}</span>
                      </div>
                      <span className="text-[10px] text-stone-600 font-nastaliq">{item.englishWord}</span>

                      <button
                        className="mt-1 p-1 bg-white/80 hover:bg-white rounded-full shadow text-indigo-900"
                        title="Listen ABC"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 4. Toy Quiz for Early Learners */}
            {nurseryCategory === 'quiz' && (
              <div className="bg-white border-2 border-purple-300 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <h4 className="font-bold text-sm text-purple-950">
                        ننھا کھلونا کوئز!
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        صحیح کھلونا چنیں اور +2 ستارے انعام پائیں
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-400 text-stone-950 font-bold rounded-xl text-xs font-mono">
                    ⭐ +2 Stars
                  </span>
                </div>

                <div className="bg-purple-50 p-3 rounded-2xl border border-purple-200 text-center space-y-1">
                  <span className="text-xs text-purple-900 font-bold block">
                    سوال: ان میں سے "بلی (Cat 🐱)" کون سی ہے؟
                  </span>
                  <span className="text-[11px] text-stone-600">
                    نیچے دی گئی تصویروں میں سے بلی کو چھوئیں:
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  {[
                    { icon: '🍎', label: 'سیب', isCorrect: false },
                    { icon: '🐱', label: 'بلی (Cat)', isCorrect: true },
                    { icon: '🚗', label: 'گاڑی', isCorrect: false },
                  ].map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        unlockAudioContext();
                        if (opt.isCorrect) {
                          playNotificationChime('success');
                          if (currentStudent) {
                            setCurrentStudent((prev) =>
                              prev ? { ...prev, stars: (prev.stars || 0) + 2 } : prev
                            );
                          }
                          speakText(
                            'ماشاء اللہ بہت خوب بیٹا! بالکل درست جواب۔ یہ پیاری بلی ہے۔ آپ کو دو ستارے مل گئے!',
                            lang,
                            undefined,
                            { isFemaleVillageVoice: false, rate: 0.95, pitch: 1.0 }
                          );
                        } else {
                          playNotificationChime('alert');
                          speakText(
                            'دوبارہ کوشش کریں بیٹا! بلی میانو میانو کرتی ہے۔ درمیان والی تصویر دیکھیں۔',
                            lang,
                            undefined,
                            { isFemaleVillageVoice: false, rate: 0.95, pitch: 1.0 }
                          );
                        }
                      }}
                      className="p-3.5 rounded-2xl bg-stone-50 hover:bg-purple-100 border-2 border-stone-200 hover:border-purple-400 transition cursor-pointer flex flex-col items-center justify-center gap-1 active:scale-95"
                    >
                      <span className="text-4xl">{opt.icon}</span>
                      <span className="text-xs font-bold text-stone-800 font-nastaliq">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DAILY HOMEWORK & STARS REWARD */}
        {/* ========================================================================= */}
        {activeTab === 'homework' && (
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {/* Student Stats Banner */}
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

            {/* Subject Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {SCHOOL_SUBJECTS.map((sub) => (
                <button
                  key={sub.key}
                  onClick={() => {
                    setSelectedSubjectKey(sub.key);
                    setSelectedAnswerIndex(null);
                    setIsHomeworkSubmitted(false);
                    setHomeworkFeedback(null);
                    unlockAudioContext();
                    playNotificationChime('teacher');
                    speakText(
                      `آپ نے ${sub.title} کا ہوم ورک منتخب کیا ہے۔`,
                      lang,
                      undefined,
                      { isFemaleVillageVoice: false }
                    );
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

            {/* Homework Question Card */}
            <div className="bg-white border-2 border-indigo-200 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500 font-nastaliq flex-wrap gap-2">
                <span className="bg-indigo-100 text-indigo-950 px-2.5 py-0.5 rounded-full font-bold">
                  روزانہ ٹاسک — {currentClassObj.name}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      unlockAudioContext();
                      playNotificationChime('teacher');
                      speakText(`سوال: ${currentHomework.question}`, lang, undefined, {
                        isFemaleVillageVoice: false,
                      });
                    }}
                    className="text-indigo-700 hover:underline flex items-center gap-1 font-bold cursor-pointer text-xs"
                    title="صرف سوال سنیں"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>سوال سنیں</span>
                  </button>
                  <button
                    onClick={() => {
                      unlockAudioContext();
                      playNotificationChime('teacher');
                      const optStr = currentHomework.options
                        .map((o, i) => `آپشن ${i + 1}: ${o}`)
                        .join('۔ ');
                      speakText(
                        `سوال: ${currentHomework.question}۔ ${optStr}`,
                        lang,
                        undefined,
                        { isFemaleVillageVoice: false }
                      );
                    }}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-900 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 font-bold cursor-pointer text-[11px]"
                    title="سوال اور چاروں آپشنز آواز میں سنیں"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-indigo-700" />
                    <span>سوال مع جوابات سنیں 🔊</span>
                  </button>
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-stone-900 font-nastaliq leading-relaxed">
                {currentHomework.question}
              </h3>

              {/* Multiple Choice Options */}
              <div className="space-y-2 pt-1">
                {currentHomework.options.map((opt, idx) => {
                  const isSelected = selectedAnswerIndex === idx;
                  let optStyle =
                    'border-stone-200 bg-stone-50 hover:bg-indigo-50 text-stone-900';
                  if (isSelected) {
                    optStyle = 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-400';
                  }
                  if (isHomeworkSubmitted) {
                    if (idx === currentHomework.correctIndex) {
                      optStyle = 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-400';
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
                          unlockAudioContext();
                          speakText(`آپشن ${idx + 1}: ${opt}`, lang, undefined, {
                            isFemaleVillageVoice: false,
                          });
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

              {/* Feedback Alert */}
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

              {/* Submit / Reset Actions */}
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
        {/* TAB 3: ADMISSION & STUDENT ID CARD */}
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
                  رتہ کلاں کے تمام بچوں اور بیٹیوں کے لیے آن لائن اسکول کارڈ اور رول نمبر مفت جاری کیا جاتا ہے۔
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

                  {/* Photo / Selfie Upload Option */}
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
                          <img src={regPhoto} alt="Student preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setRegPhoto('')}
                            className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 text-[10px]"
                            title="تصویر ہٹائیں"
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
                        <span>{regPhoto ? 'تصویر تبدیل کریں 📷' : 'کیمرہ سے سیلفی لیں یا گیلری سے منتخب کریں 📷'}</span>
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
                {/* Official Student Card */}
                <div className="bg-gradient-to-br from-indigo-950 via-purple-950 to-stone-900 border-2 border-amber-400 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Card Header */}
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

                  {/* Student Details with live Photo / Avatar */}
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
                      <h3 className="font-bold text-lg text-white">
                        {currentStudent.name}
                      </h3>
                      {currentStudent.fatherName && (
                        <p className="text-xs text-stone-300">
                          ولد: {currentStudent.fatherName}
                        </p>
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

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRegistering(true)}
                    className="flex-1 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-900 font-bold rounded-2xl text-xs font-nastaliq transition cursor-pointer"
                  >
                    کارڈ تبدیل / نیا داخلہ
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
