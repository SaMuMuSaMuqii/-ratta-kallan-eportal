import React, { useState } from 'react';
import {
  X,
  AlertCircle,
  Heart,
  Droplet,
  Search,
  Plus,
  Send,
  Phone,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { Language, AuthUserSession } from '../types';

export interface HelpNoticeItem {
  id: string;
  type: 'blood' | 'lost' | 'urgent_aid' | 'other';
  title: string;
  details: string;
  contactName: string;
  contactMobile: string;
  bloodGroup?: string;
  location: string;
  createdAt: string;
  isApproved: boolean;
}

interface CommunityHelpNoticeboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  activeSession?: AuthUserSession | null;
  onPostNotice?: (notice: Omit<HelpNoticeItem, 'id' | 'createdAt' | 'isApproved'>) => void;
}

const DEFAULT_NOTICES: HelpNoticeItem[] = [
  {
    id: 'notice-1',
    type: 'blood',
    title: 'خون کی فوری ضرورت (O+ پازیٹو)',
    details: 'رتہ کلاں کے رہائشی کے لیے ڈسٹرکٹ ہسپتال جھنگ میں ایمرجنسی میں 2 بوتل O+ خون درکار ہے۔',
    contactName: 'حاجی محمد بشیر',
    contactMobile: '0300-7711223',
    bloodGroup: 'O+',
    location: 'ڈی ایچ کیو ہسپتال جھنگ',
    createdAt: 'آج صبح 9:00 بجے',
    isApproved: true,
  },
  {
    id: 'notice-2',
    type: 'lost',
    title: 'گمشدہ دستاویزات / فائل',
    details: 'رتہ کلاں اڈا کے قریب موٹر سائیکل سوار کی نیلی فائل جس میں شناختی کارڈ اور زرعی کاغذات ہیں گر گئی ہے۔ جس کو ملے رابطہ فرمائے۔',
    contactName: 'طارق محمود',
    contactMobile: '0301-4455667',
    location: 'رتہ کلاں مین اڈا',
    createdAt: 'کل شام',
    isApproved: true,
  },
];

export const CommunityHelpNoticeboardModal: React.FC<CommunityHelpNoticeboardModalProps> = ({
  isOpen,
  onClose,
  lang,
  activeSession,
  onPostNotice,
}) => {
  const [notices, setNotices] = useState<HelpNoticeItem[]>(() => {
    try {
      const saved = localStorage.getItem('rk_help_notices_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_NOTICES;
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'blood' | 'lost' | 'urgent_aid'>('all');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // New notice form
  const [newType, setNewType] = useState<HelpNoticeItem['type']>('blood');
  const [newTitle, setNewTitle] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [newName, setNewName] = useState(activeSession?.name || '');
  const [newMobile, setNewMobile] = useState(activeSession?.mobile || '');
  const [newBloodGroup, setNewBloodGroup] = useState('O+');
  const [newLocation, setNewLocation] = useState('رتہ کلاں، جھنگ');
  const [submittedMsg, setSubmittedMsg] = useState(false);

  if (!isOpen) return null;

  const handleSaveNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newName.trim() || !newMobile.trim()) return;

    const item: HelpNoticeItem = {
      id: `notice-${Date.now()}`,
      type: newType,
      title: newTitle.trim(),
      details: newDetails.trim(),
      contactName: newName.trim(),
      contactMobile: newMobile.trim(),
      bloodGroup: newType === 'blood' ? newBloodGroup : undefined,
      location: newLocation.trim(),
      createdAt: 'ابھی حال ہی میں',
      isApproved: true,
    };

    const updated = [item, ...notices];
    setNotices(updated);
    try {
      localStorage.setItem('rk_help_notices_v1', JSON.stringify(updated));
    } catch {}

    if (onPostNotice) {
      onPostNotice({
        type: newType,
        title: item.title,
        details: item.details,
        contactName: item.contactName,
        contactMobile: item.contactMobile,
        bloodGroup: item.bloodGroup,
        location: item.location,
      });
    }

    setSubmittedMsg(true);
    setTimeout(() => {
      setSubmittedMsg(false);
      setIsSubmittingNew(false);
      setNewTitle('');
      setNewDetails('');
    }, 1500);
  };

  const filteredNotices = notices.filter((n) => {
    if (activeFilter === 'all') return true;
    return n.type === activeFilter;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border-2 border-rose-500 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl my-auto flex flex-col font-nastaliq max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-950 via-red-900 to-stone-900 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center shadow">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                مدد درکار ہے (Community Help Noticeboard)
              </h3>
              <p className="text-[11px] text-rose-200">
                خون کا عطیہ، گمشدگی، یا فوری باہمی امداد — رتہ کلاں کے بہن بھائیوں کے لیے
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-rose-200 hover:text-white rounded-full bg-black/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toggle Bar */}
        <div className="p-3 bg-stone-100 border-b border-stone-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => {
                setIsSubmittingNew(false);
                setActiveFilter('all');
              }}
              className={`px-2.5 py-1 rounded-xl font-bold transition ${
                !isSubmittingNew && activeFilter === 'all'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-200'
              }`}
            >
              تمام ({notices.length})
            </button>
            <button
              onClick={() => {
                setIsSubmittingNew(false);
                setActiveFilter('blood');
              }}
              className={`px-2.5 py-1 rounded-xl font-bold transition flex items-center gap-1 ${
                !isSubmittingNew && activeFilter === 'blood'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-white text-red-700 hover:bg-red-50'
              }`}
            >
              <Droplet className="w-3.5 h-3.5" />
              <span>خون درکار</span>
            </button>
            <button
              onClick={() => {
                setIsSubmittingNew(false);
                setActiveFilter('lost');
              }}
              className={`px-2.5 py-1 rounded-xl font-bold transition ${
                !isSubmittingNew && activeFilter === 'lost'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-200'
              }`}
            >
              گمشدہ
            </button>
          </div>

          <button
            onClick={() => setIsSubmittingNew((prev) => !prev)}
            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>نئی اپیل درج کریں</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {/* Submit New Notice Form */}
          {isSubmittingNew ? (
            <form onSubmit={handleSaveNotice} className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3.5 space-y-3">
              <h4 className="text-sm font-bold text-rose-950 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-700" />
                <span>نئی امدادی اپیل یا گمشدگی کا نوٹس</span>
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">نوعیت اپیل *</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as HelpNoticeItem['type'])}
                    className="w-full p-2 border rounded-xl bg-white focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="blood">خون کا عطیہ (Blood Donation)</option>
                    <option value="lost">گمشدہ چیز یا دستاویز (Lost & Found)</option>
                    <option value="urgent_aid">ہنگامی مالی یا راشن مدد</option>
                    <option value="other">دیگر ضرورت</option>
                  </select>
                </div>

                {newType === 'blood' ? (
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">بلڈ گروپ *</label>
                    <select
                      value={newBloodGroup}
                      onChange={(e) => setNewBloodGroup(e.target.value)}
                      className="w-full p-2 border rounded-xl bg-white font-mono font-bold"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">مقام *</label>
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="مثلاً: رتہ کلاں مین بازار"
                      className="w-full p-2 border rounded-xl bg-white text-xs"
                      required
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">عنوان *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثلاً: مریض کے لیے فوری 1 بوتل خون درکار ہے"
                  className="w-full p-2 border rounded-xl bg-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">تفصیلات *</label>
                <textarea
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  placeholder="مریض کی حالت، ہسپتال کا وارڈ یا گمشدہ چیز کی نشانیاں..."
                  rows={2}
                  className="w-full p-2 border rounded-xl bg-white text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">رابطہ کار کا نام *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="مثلاً: احمد خان"
                    className="w-full p-2 border rounded-xl bg-white text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">موبائل فون نمبر *</label>
                  <input
                    type="tel"
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full p-2 border rounded-xl bg-white text-xs font-mono"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              {submittedMsg && (
                <div className="p-2 bg-emerald-100 text-emerald-800 text-xs rounded-xl flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>آپ کا نوٹس شائع ہو چکا ہے!</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsSubmittingNew(false)}
                  className="px-3 py-1.5 border rounded-xl text-xs"
                >
                  منسوخ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>نوٹس شائع کریں</span>
                </button>
              </div>
            </form>
          ) : null}

          {/* Notices List */}
          {filteredNotices.length === 0 ? (
            <div className="text-center py-8 text-stone-500 space-y-2">
              <Heart className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="text-xs">اس کیٹیگری میں فی الحال کوئی فعال اپیل موجود نہیں ہے۔</p>
            </div>
          ) : (
            filteredNotices.map((n) => {
              const isBlood = n.type === 'blood';
              return (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-2xl border shadow-xs space-y-2 ${
                    isBlood
                      ? 'bg-red-50/80 border-red-200'
                      : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isBlood ? 'bg-red-600 text-white' : 'bg-stone-700 text-white'
                        }`}
                      >
                        {isBlood ? <Droplet className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-stone-900 leading-tight">
                          {n.title}
                        </h4>
                        <span className="text-[10px] text-stone-500">{n.location} • {n.createdAt}</span>
                      </div>
                    </div>

                    {n.bloodGroup && (
                      <span className="px-2 py-0.5 rounded-lg bg-red-600 text-white font-mono font-bold text-xs">
                        {n.bloodGroup}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-700 leading-relaxed">{n.details}</p>

                  <div className="pt-1.5 border-t border-stone-200/80 flex items-center justify-between">
                    <span className="text-[11px] text-stone-600">
                      رابطہ: <strong>{n.contactName}</strong>
                    </span>
                    <a
                      href={`tel:${n.contactMobile}`}
                      className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>کال کریں ({n.contactMobile})</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
