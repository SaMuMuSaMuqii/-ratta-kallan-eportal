import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  MapPin,
  Volume2,
  VolumeX,
  ShieldCheck,
  Briefcase,
  Share2,
  DollarSign,
  Clock,
  Send,
  Navigation,
  Check,
  AlertTriangle,
  Mail,
  PhoneCall,
  Edit,
  Trash2,
  Lock,
  KeyRound,
} from 'lucide-react';
import { VillageProfile, Language, AuthUserSession } from '../types';
import { translations, categoryLabels } from '../data/translations';
import { getProfileOperatingStatus } from '../utils/operatingHours';
import {
  speakText,
  stopSpeaking,
  unlockAudioContext,
  getSpeechRate,
  playNotificationChime,
} from '../utils/speech';

interface ProfileDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: VillageProfile | null;
  onOpenMessageModal: (profile: VillageProfile) => void;
  lang: Language;
  unreadCount?: number;
  onOpenInbox?: (mobile: string) => void;
  onReportViolation?: (profile: VillageProfile, reason: string) => void;
  onEditProfile?: (profile: VillageProfile) => void;
  onDeleteProfile?: (profile: VillageProfile) => void;
  activeSession?: AuthUserSession | null;
}

export const ProfileDetailsModal: React.FC<ProfileDetailsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onOpenMessageModal,
  lang,
  unreadCount = 0,
  onOpenInbox,
  onReportViolation,
  onEditProfile,
  onDeleteProfile,
  activeSession,
}) => {
  const t = translations[lang];
  const cats = categoryLabels[lang];

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activePhotoTab, setActivePhotoTab] = useState<'person' | 'business'>('person');
  const [copiedShare, setCopiedShare] = useState(false);

  // Reporting / Violation state
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('female_number');
  const [reportCustomText, setReportCustomText] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  if (!isOpen || !profile) return null;

  const opStatus = getProfileOperatingStatus(profile);

  const audioSummary =
    lang === 'pa'
      ? `ناں: ${profile.name}۔ کم: ${profile.businessName}۔ فون نمبر: ${profile.mobile}۔ تھاں: ${profile.address}، رتہ کلاں جھنگ۔ ریٹ: ${profile.chargesDescription || 'موقعے تے طے شدہ'}۔ ${opStatus.spokenSummary}`
      : `نام: ${profile.name}۔ کاروبار: ${profile.businessName}۔ رابطہ موبائل: ${profile.mobile}۔ پتہ: ${profile.address}، رتہ کلاں جھنگ۔ فیس و ریٹ: ${profile.chargesDescription || 'کام کے مطابق طے شدہ'}۔ ${opStatus.spokenSummary}`;

  const handleToggleVoice = () => {
    unlockAudioContext();
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      playNotificationChime('start');
      speakText(audioSummary, lang, () => setIsPlayingAudio(false), {
        rate: getSpeechRate(),
        pitch: 1.0,
      });
    }
  };

  const handleClose = () => {
    stopSpeaking();
    setIsPlayingAudio(false);
    onClose();
  };

  const handleShare = () => {
    const text = `رتہ کلاں جھنگ پورٹل سے رابطہ:\nنام: ${profile.name}\nکاروبار: ${profile.businessName}\nفون: ${profile.mobile}\nپتہ: ${profile.address}\nپورٹل پر چیک کریں۔`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const whatsappCleanNumber = profile.whatsapp
    ? profile.whatsapp.replace(/\D/g, '').replace(/^0/, '92')
    : profile.mobile.replace(/\D/g, '').replace(/^0/, '92');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border-2 border-emerald-600 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={profile.personImage}
                alt={profile.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-md bg-stone-100"
              />
              {profile.isVerified && (
                <div
                  className="absolute -bottom-1 -right-1 bg-amber-400 text-stone-900 rounded-full p-0.5 shadow"
                  title="تصدیق شدہ"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-900 fill-amber-400" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold font-nastaliq leading-tight">
                  {profile.name}
                </h2>
                {profile.fatherName && (
                  <span className="text-xs text-emerald-200">
                    ({profile.fatherName})
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-amber-200 font-medium">
                {profile.businessName}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-full bg-black/20"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Message Notification Banner if there are unread messages */}
        {unreadCount > 0 && (
          <div className="bg-gradient-to-r from-red-600 to-amber-600 text-white px-4 py-2.5 flex items-center justify-between shadow-inner animate-pulse">
            <div className="flex items-center gap-2 text-xs font-bold font-nastaliq">
              <span className="p-1 bg-white/20 rounded-full">🔔</span>
              <span>اس پروفائل پر {unreadCount} نیا پیغام موصول ہوا ہے!</span>
            </div>
            {onOpenInbox && (
              <button
                onClick={() => {
                  handleClose();
                  onOpenInbox(profile.mobile);
                }}
                className="px-3 py-1 bg-white text-red-700 hover:bg-stone-100 rounded-xl text-xs font-bold font-nastaliq shadow cursor-pointer"
              >
                پیغام کھولیں
              </button>
            )}
          </div>
        )}

        {/* Audio Quick Player & Action Header Strip */}
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={handleToggleVoice}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition shadow ${
              isPlayingAudio
                ? 'bg-red-600 text-white animate-voice-pulse'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
            }`}
          >
            {isPlayingAudio ? (
              <>
                <VolumeX className="w-4 h-4" />
                <span>آواز بند کریں</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>پوری معلومات سنیں (Listen)</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 flex items-center gap-1 shadow-sm transition"
            >
              {copiedShare ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>کاپی ہو گیا!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>شیئر کریں</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable details */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Two Images View: Person and Business */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-emerald-700" />
                <span>تصاویر (بندہ اور کاروبار):</span>
              </span>
              <div className="flex gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                <button
                  type="button"
                  onClick={() => setActivePhotoTab('person')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    activePhotoTab === 'person'
                      ? 'bg-emerald-700 text-white'
                      : 'text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  بندے کی تصویر
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoTab('business')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    activePhotoTab === 'business'
                      ? 'bg-emerald-700 text-white'
                      : 'text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  کاروبار / دکان کی تصویر
                </button>
              </div>
            </div>

            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-stone-900 border border-stone-300 shadow-inner flex items-center justify-center">
              <img
                src={
                  activePhotoTab === 'business' && profile.businessImage
                    ? profile.businessImage
                    : profile.personImage
                }
                alt={activePhotoTab === 'business' ? 'Business' : profile.name}
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2.5 py-1 rounded-lg text-white text-[11px] font-medium">
                {activePhotoTab === 'person' ? 'بندے کا فوٹو' : 'دکان یا ورکشاپ'}
              </div>
            </div>
          </div>

          {/* Quick Contact & Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <a
              href={`tel:${profile.mobile}`}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition"
            >
              <Phone className="w-4 h-4" />
              <span>{t.callNow}</span>
            </a>

            <a
              href={`https://wa.me/${whatsappCleanNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm shadow-md transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t.whatsappNow}</span>
            </a>

            <button
              onClick={() => {
                handleClose();
                onOpenMessageModal(profile);
              }}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 p-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-sm shadow-md transition"
            >
              <Send className="w-4 h-4" />
              <span>{t.leaveMessage}</span>
            </button>
          </div>

          {/* Operating Hours & Breaks Section */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-stone-50 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>اوقاتِ کار اور وقفہ (Operating Hours & Breaks):</span>
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-xs ${opStatus.color}`}>
                <span className={`w-2 h-2 rounded-full ${opStatus.dotClass}`} />
                {opStatus.statusTextUrdu}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
              <div className="bg-white/90 border border-emerald-100 rounded-xl p-2">
                <span className="text-[10px] text-stone-500 block font-semibold">دکان / کام کھلنے کا وقت</span>
                <span className="font-black text-stone-900 text-xs sm:text-sm">{opStatus.openingTime}</span>
              </div>
              <div className="bg-white/90 border border-emerald-100 rounded-xl p-2">
                <span className="text-[10px] text-stone-500 block font-semibold">بند ہونے کا وقت</span>
                <span className="font-black text-stone-900 text-xs sm:text-sm">{opStatus.closingTime}</span>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-white/90 border border-amber-200 rounded-xl p-2">
                <span className="text-[10px] text-amber-700 block font-semibold">لنچ / نماز کا وقفہ</span>
                <span className="font-black text-amber-900 text-xs sm:text-sm">{opStatus.breakTime}</span>
              </div>
            </div>
          </div>

          {/* Availability & Rate Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Availability */}
            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl">
              <span className="text-xs text-stone-500 font-semibold flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>دستیابی (Availability):</span>
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    profile.availability === 'available'
                      ? 'bg-emerald-500 animate-pulse'
                      : profile.availability === 'on_call'
                      ? 'bg-blue-500'
                      : profile.availability === 'busy'
                      ? 'bg-amber-500'
                      : 'bg-stone-400'
                  }`}
                />
                <span className="font-bold text-sm text-stone-900">
                  {profile.availability === 'available'
                    ? t.available
                    : profile.availability === 'on_call'
                    ? t.onCall
                    : profile.availability === 'busy'
                    ? t.busy
                    : t.closed}
                </span>
              </div>
            </div>

            {/* Rates */}
            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl">
              <span className="text-xs text-stone-500 font-semibold flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.chargesTitle}:</span>
              </span>
              <p className="font-bold text-sm text-stone-900 leading-snug">
                {profile.chargesDescription || 'موقع پر طے شدہ (مناسب ریٹ)'}
              </p>
            </div>
          </div>

          {/* Location & Landmark */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>پتہ و گاؤں کی لوکیشن (Ratta Kallan, Jhang):</span>
            </span>
            <p className="text-sm font-semibold text-stone-800 leading-relaxed">
              {profile.address}
            </p>
            {profile.locationLandmark && (
              <p className="text-xs text-stone-600">
                <strong>مشہور نشانی:</strong> {profile.locationLandmark}
              </p>
            )}

            {profile.locationMapUrl && (
              <div className="pt-1">
                <a
                  href={profile.locationMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{t.viewLocation}</span>
                </a>
              </div>
            )}
          </div>

          {/* Services & Skills Badges */}
          {profile.services && profile.services.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-stone-700 block">
                {t.servicesTitle}:
              </span>
              <div className="flex flex-wrap gap-2">
                {profile.services.map((srv, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-stone-100 border border-stone-300 rounded-xl text-xs font-semibold text-stone-800 shadow-sm"
                  >
                    ✓ {srv}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Profile Owner & Security Controls (Password Protected) */}
          <div className="bg-stone-100 border border-stone-300 rounded-2xl p-3 space-y-2 font-nastaliq">
            <div className="flex items-center justify-between text-xs font-bold text-stone-800">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>اختیاراتِ مالک (Owner Controls):</span>
              </span>
              <span className="text-[10px] text-stone-500 font-sans">
                پاس ورڈ سے محفوظ 🔒
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  if (onEditProfile) onEditProfile(profile);
                }}
                className="py-2 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>معلومات میں ترمیم کریں</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onDeleteProfile) onDeleteProfile(profile);
                }}
                className="py-2 px-2.5 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>پروفائل حذف کریں</span>
              </button>
            </div>

            <p className="text-[10px] text-stone-500 text-center pt-0.5">
              کوئی دوسرا شخص آپ کی معلومات تبدیل یا حذف نہیں کر سکتا۔
            </p>
          </div>

          {/* Verification Badge */}
          <div className="bg-stone-50 border border-stone-200 p-3 rounded-2xl flex items-center justify-between text-xs text-stone-500">
            <span>شامل کردہ بذریعہ: {profile.addedByName || 'گاؤں کا شہری'}</span>
            <span className="text-emerald-800 font-bold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t.verifiedStamp}</span>
            </span>
          </div>

          {/* Report Violation & Super Admin Alert Section */}
          <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 font-nastaliq">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>کیا اس پروفائل میں کوئی غلطی یا خلاف ورزی ہے؟</span>
              </div>
              <button
                type="button"
                onClick={() => setShowReportForm((prev) => !prev)}
                className="text-[11px] font-bold text-red-700 hover:text-red-900 underline font-nastaliq cursor-pointer"
              >
                {showReportForm ? 'فارم بند کریں' : 'شکایت یا رپورٹ درج کریں ⚠️'}
              </button>
            </div>

            {reportSubmitted ? (
              <div className="bg-emerald-100 border border-emerald-400 p-2.5 rounded-xl text-emerald-900 text-xs font-nastaliq flex items-center justify-between animate-in fade-in">
                <span>شکریہ! آپ کی شکایت سپر ایڈمن ثمر سعید کو موصول ہو گئی ہے۔ فوری ایکشن لیا جائے گا۔</span>
                <Check className="w-4 h-4 text-emerald-700 shrink-0" />
              </div>
            ) : showReportForm ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const reasonLabels: Record<string, string> = {
                    female_number: 'سخت خلاف ورزی: خاتون (عورت) کا نمبر درج کیا گیا ہے',
                    religious_promo: 'مذہبی پروموشن، فرقہ واریت یا اشتہارات',
                    fake_scam: 'جعلی معلومات یا دھوکہ دہی',
                    wrong_number: 'غلط موبائل نمبر یا غلط پتہ',
                    other: reportCustomText || 'دیگر شکایت',
                  };
                  const finalReason = reasonLabels[reportReason] || reportCustomText || 'شکایت';
                  if (onReportViolation) {
                    onReportViolation(profile, finalReason);
                  }
                  setReportSubmitted(true);
                  playNotificationChime('alert');
                  // Trigger email to Portal Admin
                  const subject = encodeURIComponent(`[Ratta Kallan Report] خلاف ورزی کی اطلاع: ${profile.name}`);
                  const body = encodeURIComponent(
                    `پورٹل ایڈمنسٹریٹر کے نام شکایت:\n\nپروفائل کا نام: ${profile.name}\nکاروبار: ${profile.businessName}\nموبائل: ${profile.mobile}\nپتہ: ${profile.address}\n\nشکایت کی نوعیت: ${finalReason}\nتفصیل: ${reportCustomText || 'کوئی اضافی تفصیل نہیں'}\n\nبرائے مہربانی فوری کارروائی فرمائیں۔`
                  );
                  window.location.href = `mailto:admin@ratta.pk?subject=${subject}&body=${body}`;
                }}
                className="space-y-2 pt-1 font-nastaliq"
              >
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 block">
                    شکایت کی نوعیت منتخب کریں:
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-stone-300 rounded-xl font-sans"
                  >
                    <option value="female_number">خاتون (عورت) کا نمبر یا تصویر ہے (سخت منع)</option>
                    <option value="religious_promo">مذہبی پروموشن یا فرقہ واریت کا اشتہار</option>
                    <option value="fake_scam">جعلی بندہ یا دھوکہ دہی</option>
                    <option value="wrong_number">غلط یا بند فون نمبر ہے</option>
                    <option value="other">دیگر وجہ</option>
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="اضافی تفصیل یا وضاحت لکھیں (اختیاری)..."
                  value={reportCustomText}
                  onChange={(e) => setReportCustomText(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-stone-300 rounded-xl"
                />

                <div className="flex items-center justify-between gap-2 pt-1">
                  <a
                    href="tel:03270019099"
                    className="text-[11px] font-mono text-red-700 font-bold flex items-center gap-1 hover:underline"
                    title="ہیلپ لائن پر براہِ راست بات کریں"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>0327-0019099</span>
                  </a>

                  <button
                    type="submit"
                    className="bg-red-700 hover:bg-red-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow transition flex items-center gap-1 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>سپر ایڈمن کو فوری بھیجیں</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between text-[11px] text-stone-600 font-nastaliq">
                <span>سپر ایڈمن ثمر سعید آفیشل ہیلپ لائن:</span>
                <a
                  href="tel:03270019099"
                  className="text-red-700 font-mono font-bold hover:underline"
                >
                  0327-0019099
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
