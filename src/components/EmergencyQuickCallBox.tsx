import React from 'react';
import { PhoneCall, HeartPulse, ShieldAlert, Ambulance, Activity } from 'lucide-react';
import { Language } from '../types';

interface EmergencyQuickCallBoxProps {
  lang: Language;
  onOpenHospitals: () => void;
}

export const EmergencyQuickCallBox: React.FC<EmergencyQuickCallBoxProps> = ({
  onOpenHospitals,
}) => {
  return (
    <div className="bg-gradient-to-r from-red-950 via-rose-900 to-red-900 text-white rounded-3xl p-3.5 sm:p-4 shadow-lg border-2 border-red-400 relative overflow-hidden font-nastaliq">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shadow shrink-0 animate-pulse">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm sm:text-base text-amber-300 leading-snug break-words">
              ہنگامی و طبی ایمرجنسی (فوری ۱-ٹیپ کال)
            </h4>
            <p className="text-[11px] text-red-100 leading-relaxed break-words">
              رتہ کلاں اور اردگرد فوری طبی امداد — کسی بھی ایمرجنسی میں بٹن دبائیں
            </p>
          </div>
        </div>

        <button
          onClick={onOpenHospitals}
          className="min-h-[38px] text-xs px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl transition cursor-pointer shrink-0 border border-white/25"
        >
          تمام ہسپتال ➔
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
        {/* Rescue 1122 */}
        <a
          href="tel:1122"
          className="min-h-[76px] bg-white/10 hover:bg-white/25 border border-red-300/40 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center text-center transition active:scale-95 group min-w-0"
          title="ریسکیو 1122 کال کریں"
        >
          <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center mb-1 group-hover:bg-red-500 shadow shrink-0">
            <Ambulance className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-white leading-relaxed py-0.5 break-words">ریسکیو 1122</span>
          <span className="text-[10px] text-amber-300 font-mono font-bold mt-0.5" dir="ltr">1122 (مفت)</span>
        </a>

        {/* BHU Ratta Kallan */}
        <a
          href="tel:047123456"
          className="min-h-[76px] bg-white/10 hover:bg-white/25 border border-emerald-300/40 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center text-center transition active:scale-95 group min-w-0"
          title="بنیادی مرکز صحت رتہ کلاں کال کریں"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-1 group-hover:bg-emerald-500 shadow shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-white leading-relaxed py-0.5 break-words">ہیلتھ سنٹر رتہ</span>
          <span className="text-[10px] text-emerald-200 mt-0.5 leading-relaxed">گورنمنٹ BHU</span>
        </a>

        {/* Police 15 */}
        <a
          href="tel:15"
          className="min-h-[76px] bg-white/10 hover:bg-white/25 border border-blue-300/40 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center text-center transition active:scale-95 group min-w-0"
          title="پولیس مدد 15 کال کریں"
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mb-1 group-hover:bg-blue-500 shadow shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-white leading-relaxed py-0.5 break-words">پولیس مدد</span>
          <span className="text-[10px] text-blue-200 font-mono font-bold mt-0.5" dir="ltr">15 (ہیلپ لائن)</span>
        </a>
      </div>
    </div>
  );
};
