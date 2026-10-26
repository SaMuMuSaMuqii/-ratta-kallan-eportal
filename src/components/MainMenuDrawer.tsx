import React from 'react';
import {
  X,
  Home,
  Compass,
  GraduationCap,
  Bus,
  MapPin,
  Megaphone,
  Mail,
  ShieldCheck,
  Globe,
  Info,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Lock,
  HeartPulse,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface MainMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (
    destination:
      | 'home'
      | 'hospitals'
      | 'mosques'
      | 'institutes'
      | 'aischool'
      | 'management'
      | 'transport'
      | 'planner'
      | 'news'
      | 'messages'
      | 'add'
      | 'terms'
      | 'admin'
      | 'auth'
      | 'reset_password'
  ) => void;
  currentLang: Language;
  onSetLang: (lang: Language) => void;
  unreadCount: number;
  eventsCount: number;
}

export const MainMenuDrawer: React.FC<MainMenuDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentLang,
  onSetLang,
  unreadCount,
  eventsCount,
}) => {
  const t = translations[currentLang];

  if (!isOpen) return null;

  const handleItemClick = (
    dest:
      | 'home'
      | 'hospitals'
      | 'mosques'
      | 'institutes'
      | 'aischool'
      | 'management'
      | 'transport'
      | 'planner'
      | 'news'
      | 'messages'
      | 'add'
      | 'terms'
      | 'admin'
      | 'auth'
      | 'reset_password'
  ) => {
    onNavigate(dest);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Body */}
      <div className="w-full max-w-xs sm:max-w-sm bg-stone-900 text-white h-full shadow-2xl flex flex-col border-l border-emerald-700/60 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 border-b border-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <h3 className="font-bold text-base font-nastaliq text-amber-200 leading-tight">
                رتہ کلاں جھنگ پورٹل
              </h3>
              <span className="text-[10px] text-emerald-200 block">
                مرکزی مینیو (Main Navigation)
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-300 hover:text-white rounded-full bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Quick Switcher */}
        <div className="bg-stone-800/80 px-4 py-2 border-b border-stone-700 flex items-center justify-between text-xs">
          <span className="text-stone-300 font-semibold flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>زبان منتخب کریں:</span>
          </span>
          <div className="flex items-center gap-1 bg-stone-900 p-0.5 rounded-lg border border-stone-700">
            <button
              onClick={() => onSetLang('ur')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                currentLang === 'ur' ? 'bg-emerald-600 text-white' : 'text-stone-400'
              }`}
            >
              اردو
            </button>
            <button
              onClick={() => onSetLang('pa')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                currentLang === 'pa' ? 'bg-emerald-600 text-white' : 'text-stone-400'
              }`}
            >
              پنجابی
            </button>
            <button
              onClick={() => onSetLang('en')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                currentLang === 'en' ? 'bg-emerald-600 text-white' : 'text-stone-400'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Nav Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 text-sm font-medium font-nastaliq">
          {/* Home */}
          <button
            onClick={() => handleItemClick('home')}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-emerald-950/60 text-stone-100 transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <Home className="w-5 h-5 text-emerald-400" />
              <span>ہوم و کاریگر ڈائریکٹری</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-stone-500" />
          </button>

          {/* Hospitals & Emergency - Dedicated High-Priority Item */}
          <button
            onClick={() => handleItemClick('hospitals')}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-red-950 to-rose-950 border border-red-500/60 text-red-100 transition active:scale-98 shadow-sm hover:border-red-400"
          >
            <div className="flex items-center gap-3">
              <HeartPulse className="w-5 h-5 text-red-400 animate-pulse" />
              <div className="text-right">
                <span className="font-bold text-sm block text-red-200">ہسپتال اور ایمرجنسی خدمات</span>
                <span className="text-[10px] text-red-300 block">DHQ جھنگ، RHC، 1122، فارمیسی</span>
              </div>
            </div>
            <span className="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
              24/7 الرٹ
            </span>
          </button>

          {/* AI Virtual School - PROMINENT HIGHLIGHT */}
          <button
            onClick={() => handleItemClick('aischool')}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-indigo-950 to-purple-950 border border-indigo-500/50 text-amber-200 transition active:scale-98 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <div className="text-right">
                <span className="font-bold text-sm block">ورچوئل AI اسکول</span>
                <span className="text-[10px] text-pink-300 block">ہوم ورک اور صوتی سبق</span>
              </div>
            </div>
            <span className="text-[9px] bg-pink-600 text-white px-2 py-0.5 rounded-full font-bold">
              مفت
            </span>
          </button>

          {/* Mosques */}
          <button
            onClick={() => handleItemClick('mosques')}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-emerald-950/60 text-stone-100 transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <Compass className="w-5 h-5 text-amber-400" />
              <span>گاؤں کی مساجد و اوقات نماز</span>
            </div>
            <span className="text-[10px] bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
              عیدین وقت
            </span>
          </button>

          {/* Institutes / Schools */}
          <button
            onClick={() => handleItemClick('institutes')}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-emerald-950/60 text-stone-100 transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-blue-400" />
              <span>اسکولز و تعلیمی ادارے</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-stone-500" />
          </button>

          {/* Mosque & School Management Portal Login */}
          <button
            onClick={() => handleItemClick('management')}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-stone-800/90 hover:bg-stone-800 text-emerald-300 transition active:scale-98 border border-emerald-700/50"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-amber-400" />
              <div className="text-right">
                <span className="font-bold text-xs block">انتظامیہ لاگ ان (مسجد و اسکول)</span>
                <span className="text-[10px] text-stone-400 block">امام و پرنسپل اوقات تبدیل کریں</span>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-stone-500" />
          </button>

          {/* Public Transport */}
          <button
            onClick={() => handleItemClick('transport')}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-emerald-950/60 text-stone-100 transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <Bus className="w-5 h-5 text-emerald-400" />
              <span>رتہ کلاں تا جھنگ بسیں و وینز</span>
            </div>
            <span className="text-[10px] bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full font-bold">
              اوقات
            </span>
          </button>

          {/* Route Planner */}
          <button
            onClick={() => handleItemClick('planner')}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-emerald-950/60 text-stone-100 transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-red-400" />
              <span>سفر و منزل پلانر (شہروں کا راستہ)</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-stone-500" />
          </button>

          {/* News & Events */}
          <button
            onClick={() => handleItemClick('news')}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-emerald-950/60 text-stone-100 transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <Megaphone className="w-5 h-5 text-amber-400" />
              <span>گاؤں کے واقعات و خبریں</span>
            </div>
            {eventsCount > 0 && (
              <span className="text-[10px] bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full font-bold">
                {eventsCount}
              </span>
            )}
          </button>

          {/* Messages */}
          <button
            onClick={() => handleItemClick('messages')}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-emerald-950/60 text-stone-100 transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-teal-400" />
              <span>میرے نجی پیغامات (ان باکس)</span>
            </div>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          <div className="pt-2 border-t border-stone-800 space-y-1">
            {/* My Account / Owner Login */}
            <button
              onClick={() => handleItemClick('auth')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-200 transition active:scale-98 border border-emerald-700/50"
            >
              <div className="flex items-center gap-3">
                <KeyRound className="w-5 h-5 text-amber-300" />
                <span>میرا اکاؤنٹ / کاریگر لاگ ان</span>
              </div>
              <ChevronLeft className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Forgot Password Reset via Email */}
            <button
              onClick={() => handleItemClick('reset_password')}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-stone-800 text-stone-300 hover:text-amber-200 transition active:scale-98 text-xs"
            >
              <div className="flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <span>پاس ورڈ ری سیٹ (بذریعہ ای میل)</span>
              </div>
            </button>

            {/* Terms & Guidelines */}
            <button
              onClick={() => handleItemClick('terms')}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition active:scale-98 text-xs"
            >
              <div className="flex items-center gap-3">
                <Info className="w-4 h-4" />
                <span>شرائط و ضوابط (عورتوں کا ڈیٹا و تحفظ)</span>
              </div>
            </button>
          </div>
        </div>

        {/* Drawer Footer with Credits */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 text-center space-y-1 text-[11px] text-stone-400 font-nastaliq">
          <p className="text-amber-300 font-bold">
            بانی و سربراہ: ثمر سعید (Samar Saeed)
          </p>
          <p className="text-[10px] text-stone-500">
            معاونین: عاطف رفیق، حامد محبوب، محمد عباس، سر ندیم، یاسر محمود، موسٰی
          </p>
        </div>
      </div>
    </div>
  );
};
