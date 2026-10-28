import React, { useState } from 'react';
import {
  X,
  Camera,
  Upload,
  Mic,
  MicOff,
  MapPin,
  Phone,
  Briefcase,
  User,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Clock,
  KeyRound,
  Eye,
  EyeOff,
  Mail,
  Lock,
} from 'lucide-react';
import { VillageProfile, Language } from '../types';
import { translations, categoryLabels } from '../data/translations';
import { VoiceRecognizer, isSpeechRecognitionSupported } from '../utils/speech';
import { GuidedVoiceFormModal, GuidedFormData } from './GuidedVoiceFormModal';
import { parseSpokenPhoneNumber, parseSpokenEmail } from '../utils/voiceFormHelper';
import { ImageUploadFieldCard } from './ImageUploadFieldCard';

interface AddProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: Omit<VillageProfile, 'id' | 'createdAt' | 'isVerified'> | VillageProfile) => void;
  defaultMobile?: string;
  lang: Language;
  editingProfile?: VillageProfile | null;
  existingProfiles?: VillageProfile[];
}

export const AddProfileModal: React.FC<AddProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultMobile = '',
  lang,
  editingProfile = null,
  existingProfiles = [],
}) => {
  const t = translations[lang];
  const cats = categoryLabels[lang];

  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<VillageProfile['category']>('mistri');
  const [customCategory, setCustomCategory] = useState('');
  const [mobile, setMobile] = useState(defaultMobile);

  // Individual Credential Fields for Profile Owner
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');

  // Pre-fill if editing existing profile
  React.useEffect(() => {
    if (editingProfile) {
      setName(editingProfile.name || '');
      setFatherName(editingProfile.fatherName || '');
      setBusinessName(editingProfile.businessName || '');
      setCategory(editingProfile.category || 'mistri');
      setCustomCategory(editingProfile.customCategory || '');
      setMobile(editingProfile.mobile || '');
      setWhatsapp(editingProfile.whatsapp || '');
      setAddress(editingProfile.address || '');
      setLocationLandmark(editingProfile.locationLandmark || '');
      setLocationMapUrl(editingProfile.locationMapUrl || '');
      setServicesInput((editingProfile.services || []).join('، '));
      setChargesDescription(editingProfile.chargesDescription || '');
      setOpeningTime(editingProfile.openingTime || '08:00 AM');
      setClosingTime(editingProfile.closingTime || '09:00 PM');
      setBreakTime(editingProfile.breakTime || '01:00 PM – 02:00 PM');
      setAvailability(editingProfile.availability || 'available');
      setPersonImage(editingProfile.personImage || '');
      setBusinessImage(editingProfile.businessImage || '');
      setAddedByName(editingProfile.addedByName || '');
      setUsername(editingProfile.username || editingProfile.name.toLowerCase().replace(/\s+/g, '_'));
      setPassword(editingProfile.password || '');
      setEmail(editingProfile.email || '');
      setTermsAccepted(true);
      setNoFemaleCertAccepted(true);
    } else {
      if (defaultMobile && !mobile) {
        setMobile(defaultMobile);
      }
    }
  }, [editingProfile, defaultMobile, isOpen]);

  // Guided Voice Form Modal state
  const [isGuidedVoiceModalOpen, setIsGuidedVoiceModalOpen] = useState(false);

  // Suggestions for custom category from existing profiles
  const existingCustomCategories = Array.from(
    new Set(
      (existingProfiles || [])
        .map((p) => p.customCategory?.trim())
        .filter((c): c is string => Boolean(c && c.length > 1))
    )
  );
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [locationLandmark, setLocationLandmark] = useState('');
  const [locationMapUrl, setLocationMapUrl] = useState('');
  const [servicesInput, setServicesInput] = useState('');
  const [chargesDescription, setChargesDescription] = useState('');
  const [openingTime, setOpeningTime] = useState('08:00 AM');
  const [closingTime, setClosingTime] = useState('09:00 PM');
  const [breakTime, setBreakTime] = useState('01:00 PM – 02:00 PM');
  const [availability, setAvailability] = useState<VillageProfile['availability']>('available');
  const [personImage, setPersonImage] = useState<string>('');
  const [businessImage, setBusinessImage] = useState<string>('');
  const [addedByName, setAddedByName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [noFemaleCertAccepted, setNoFemaleCertAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Active voice field
  const [activeVoiceField, setActiveVoiceField] = useState<string | null>(null);
  const [recognizer, setRecognizer] = useState<VoiceRecognizer | null>(null);

  if (!isOpen) return null;

  const handleStartVoiceForField = (fieldName: string) => {
    if (activeVoiceField === fieldName) {
      if (recognizer) recognizer.stop();
      setActiveVoiceField(null);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      alert(t.voiceUnsupported);
      return;
    }

    const vr = new VoiceRecognizer(lang);
    setRecognizer(vr);
    setActiveVoiceField(fieldName);

    vr.start(
      (transcript, isFinal) => {
        if (fieldName === 'name') setName((prev) => (isFinal ? transcript : transcript));
        if (fieldName === 'businessName') setBusinessName((prev) => (isFinal ? transcript : transcript));
        if (fieldName === 'customCategory') setCustomCategory((prev) => (isFinal ? transcript : transcript));
        if (fieldName === 'mobile') setMobile((prev) => (isFinal ? parseSpokenPhoneNumber(transcript) : transcript));
        if (fieldName === 'whatsapp') setWhatsapp((prev) => (isFinal ? parseSpokenPhoneNumber(transcript) : transcript));
        if (fieldName === 'email') setEmail((prev) => (isFinal ? parseSpokenEmail(transcript) : transcript));
        if (fieldName === 'address') setAddress((prev) => (isFinal ? transcript : transcript));
        if (fieldName === 'locationLandmark') setLocationLandmark((prev) => (isFinal ? transcript : transcript));
        if (fieldName === 'services') setServicesInput((prev) => (isFinal ? transcript : transcript));
        if (fieldName === 'charges') setChargesDescription((prev) => (isFinal ? transcript : transcript));
      },
      (err) => {
        console.warn('Voice recognition error on field:', err);
        setActiveVoiceField(null);
      },
      () => {
        setActiveVoiceField(null);
      }
    );
  };

  const handleGuidedFormCompleted = (data: GuidedFormData) => {
    if (data.name) setName(data.name);
    if (data.mobile) setMobile(data.mobile);
    if (data.address) setAddress(data.address);
    if (data.businessName) setBusinessName(data.businessName);
    if (data.customCategory) {
      setCategory('other');
      setCustomCategory(data.customCategory);
    }
    if (data.services && data.services.length > 0) {
      setServicesInput(data.services.join('، '));
    }
    if (data.email) setEmail(data.email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('براہ کرم بندے کا نام درج کریں۔');
      return;
    }
    if (!businessName.trim()) {
      setErrorMsg('کاروبار، ہنر یا سروس کا نام درج کریں۔');
      return;
    }
    if (!mobile.trim() || mobile.replace(/\D/g, '').length < 10) {
      setErrorMsg('درست 11 ہندسوں کا موبائل نمبر درج کریں (مثلاً: 03001234567)');
      return;
    }
    if (!address.trim()) {
      setErrorMsg('رتہ کلاں میں محلہ، ڈیرہ یا پتہ درج کریں۔');
      return;
    }

    // Validate Username and Password for Personal Security
    const cleanUser = (username.trim() || name.trim().toLowerCase().replace(/\s+/g, '_')).toLowerCase();
    const isTaken = existingProfiles.some(
      (p) => p.id !== editingProfile?.id && (p.username || '').toLowerCase() === cleanUser
    );
    if (isTaken) {
      setErrorMsg('This Username is already taken. Please choose a different Username.');
      return;
    }

    const cleanPass = password.trim();
    if (cleanPass.length < 4) {
      setErrorMsg('Please set a Password of at least 4 characters to protect your account.');
      return;
    }

    if (!termsAccepted || !noFemaleCertAccepted) {
      setErrorMsg('براہ کرم تصدیق کریں کہ آپ نے شرائط قبول کیں اور یہ کسی خاتون کا نمبر نہیں ہے۔');
      return;
    }

    // Process services
    const services = servicesInput
      .split(/[,،\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const basePayload = {
      name: name.trim(),
      fatherName: fatherName.trim(),
      businessName: businessName.trim(),
      category,
      customCategory: category === 'other' ? customCategory.trim() : undefined,
      mobile: mobile.trim(),
      whatsapp: whatsapp.trim() || mobile.trim(),
      address: address.trim(),
      village: 'Ratta Kallan, Jhang',
      locationLandmark: locationLandmark.trim(),
      locationMapUrl:
        locationMapUrl.trim() ||
        `https://maps.google.com/?q=${encodeURIComponent('Ratta Kallan Jhang ' + address)}`,
      services: services.length > 0 ? services : [businessName.trim()],
      personImage: personImage || '',
      businessImage: businessImage || '',
      chargesDescription: chargesDescription.trim() || 'کام کے مطابق طے شدہ',
      openingTime: openingTime.trim() || '08:00 AM',
      closingTime: closingTime.trim() || '09:00 PM',
      breakTime: breakTime.trim() || '01:00 PM – 02:00 PM',
      availability,
      addedByName: addedByName.trim() || 'گاؤں کا شہری',
      termsAccepted: true,
      username: cleanUser,
      password: cleanPass,
      email: email.trim(),
    };

    if (editingProfile) {
      onSave({
        ...editingProfile,
        ...basePayload,
      });
    } else {
      onSave(basePayload);
    }

    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
        <div className="bg-white border-2 border-emerald-600 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-700/60 flex items-center justify-center border border-emerald-500/30">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-nastaliq">
                  {editingProfile ? 'پروفائل میں ترمیم کریں (Edit Profile)' : t.addPersonBtn}
                </h2>
                <p className="text-xs text-emerald-200">
                  {editingProfile
                    ? 'پروفائل مالک اور سپر ایڈمن کے لیے اختیارات'
                    : t.addAnotherPersonHint}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-emerald-200 hover:text-white rounded-full bg-black/20 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Warning rule reminder */}
            <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-3.5 flex items-start gap-3 text-red-900 text-xs sm:text-sm">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-nastaliq text-base text-red-800 mb-0.5">
                  {t.femaleRuleWarning}
                </strong>
                <span>{t.femaleRuleDetail}</span>
              </div>
            </div>

            {/* Big Button: بول کر فارم بھریں (Voice Guided Form) */}
            <button
              type="button"
              onClick={() => setIsGuidedVoiceModalOpen(true)}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 hover:from-emerald-800 hover:to-teal-800 text-white font-bold rounded-2xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2.5 cursor-pointer font-nastaliq text-base border-2 border-emerald-400/40"
            >
              <Mic className="w-5 h-5 text-amber-300 animate-pulse" />
              <span>بول کر فارم بھریں (صوتی رہنمائی برائے ناخواندہ افراد) 🔊</span>
            </button>

            {/* Photos Section: Person Profile Picture & Business / Shop Picture with Crop, Zoom, Reposition & Camera */}
            <div className="space-y-4">
              <ImageUploadFieldCard
                label={`1. ${t.personPhoto} (پروفائل فوٹو / سیلفی)`}
                subtitle="چہرے کو گول اور چوکور پروفائل فریم میں ایڈجسٹ، کراپ اور زوم کرنے کی سہولت"
                value={personImage}
                onChange={setPersonImage}
                mode="avatar"
                accentColor="emerald"
              />

              <ImageUploadFieldCard
                label={`2. ${t.businessPhoto} (کاروبار، دکان یا کام کی تصویر)`}
                subtitle="دکان کا بورڈ، لوگو یا کام کی تصویر کراپ، زوم اور مکمل فٹ کرنے کی سہولت"
                value={businessImage}
                onChange={setBusinessImage}
                mode="business"
                accentColor="blue"
              />
            </div>

            {/* Field: Name with mic */}
            <div>
              <label className="block text-sm font-bold text-stone-800 mb-1.5">
                بندے کا پورا نام * (Name)
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً: استاد محمد ارشد یا ثمر سعید"
                  className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium pl-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => handleStartVoiceForField('name')}
                  className={`absolute left-2 p-1.5 rounded-lg transition ${
                    activeVoiceField === 'name'
                      ? 'bg-red-500 text-white animate-voice-pulse'
                      : 'bg-stone-100 text-stone-600 hover:bg-emerald-100 hover:text-emerald-700'
                  }`}
                  title="بول کر لکھیں"
                >
                  {activeVoiceField === 'name' ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Father Name (optional) */}
            <div>
              <label className="block text-sm font-bold text-stone-800 mb-1.5">
                ولدیت (Father Name - اختیاری)
              </label>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder="مثلاً: ولد حاجی محمد بوٹا"
                className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            {/* Category selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-stone-800 mb-1.5">
                  کاروبار کی کیٹیگری / شعبہ *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                >
                  <option value="tractor">{cats.tractor}</option>
                  <option value="mistri">{cats.mistri}</option>
                  <option value="electrician">{cats.electrician}</option>
                  <option value="plumber">{cats.plumber}</option>
                  <option value="doctor">{cats.doctor}</option>
                  <option value="karyana">{cats.karyana}</option>
                  <option value="milk">{cats.milk}</option>
                  <option value="tailor">{cats.tailor}</option>
                  <option value="driver">{cats.driver}</option>
                  <option value="chakki">{cats.chakki}</option>
                  <option value="welder">{cats.welder}</option>
                  <option value="barber">{cats.barber}</option>
                  <option value="teacher">{cats.teacher}</option>
                  <option value="other">{cats.other}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-800 mb-1.5">
                  دستیابی کی حالت *
                </label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value as any)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                >
                  <option value="available">🟢 {t.available}</option>
                  <option value="on_call">📞 {t.onCall}</option>
                  <option value="busy">🟡 {t.busy}</option>
                  <option value="closed">⚪ {t.closed}</option>
                </select>
              </div>
            </div>

            {/* Custom Category Input for Other Category */}
            {category === 'other' && (
              <div className="space-y-1.5 animate-in fade-in p-3 bg-amber-50/60 rounded-2xl border border-amber-200">
                <label className="block text-sm font-bold text-stone-800">
                  اپنے کام یا کاروبار کی قسم لکھیں یا بول کر بتائیں *
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="مثلاً: سولر کاریگر، پنکچر شاپ، قصاب، ویلڈر، وغیرہ"
                    className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium pl-12 bg-white"
                    required={category === 'other'}
                  />
                  <button
                    type="button"
                    onClick={() => handleStartVoiceForField('customCategory')}
                    className={`absolute left-2 p-1.5 rounded-lg transition ${
                      activeVoiceField === 'customCategory'
                        ? 'bg-red-500 text-white animate-voice-pulse'
                        : 'bg-stone-100 text-stone-600 hover:bg-emerald-100 hover:text-emerald-700'
                    }`}
                    title="بول کر لکھیں"
                  >
                    {activeVoiceField === 'customCategory' ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Suggestions from already registered custom categories */}
                {existingCustomCategories.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-stone-500">پہلے سے درج مشورے:</span>
                    {existingCustomCategories.slice(0, 6).map((catName) => (
                      <button
                        key={catName}
                        type="button"
                        onClick={() => setCustomCategory(catName)}
                        className="px-2 py-0.5 bg-white hover:bg-emerald-100 hover:text-emerald-900 border border-stone-200 rounded-lg text-xs text-stone-700 cursor-pointer transition shadow-xs"
                      >
                        + {catName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Business / Service Title with Voice */}
            <div>
              <label className="block text-sm font-bold text-stone-800 mb-1.5">
                کاروبار یا دکان کا نام / ہنر *
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="مثلاً: ارشد زرعی ٹریکٹر سروس یا ستار سولر"
                  className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium pl-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => handleStartVoiceForField('businessName')}
                  className={`absolute left-2 p-1.5 rounded-lg transition ${
                    activeVoiceField === 'businessName'
                      ? 'bg-red-500 text-white animate-voice-pulse'
                      : 'bg-stone-100 text-stone-600 hover:bg-emerald-100 hover:text-emerald-700'
                  }`}
                  title="بول کر لکھیں"
                >
                  {activeVoiceField === 'businessName' ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile & WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-stone-800 mb-1.5">
                  موبائل نمبر * (Mobile Phone)
                </label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-emerald-600 absolute right-3 pointer-events-none" />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full rounded-xl border border-stone-300 pr-10 pl-4 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-800 mb-1.5">
                  واٹس ایپ نمبر (اگر مختلف ہو)
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="03001234567"
                  className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Address with Voice */}
            <div>
              <label className="block text-sm font-bold text-stone-800 mb-1.5">
                گاؤں کا پتہ و محلہ * (Address in Ratta Kallan)
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="مثلاً: محلہ دارالسلام، نزد جامع مسجد، رتہ کلاں جھنگ"
                  className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium pl-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => handleStartVoiceForField('address')}
                  className={`absolute left-2 p-1.5 rounded-lg transition ${
                    activeVoiceField === 'address'
                      ? 'bg-red-500 text-white animate-voice-pulse'
                      : 'bg-stone-100 text-stone-600 hover:bg-emerald-100 hover:text-emerald-700'
                  }`}
                  title="بول کر پتہ لکھیں"
                >
                  {activeVoiceField === 'address' ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Google Map Link & Landmark */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-stone-800 mb-1.5">
                  مشہور نشانی / لینڈمارک
                </label>
                <div className="relative flex items-center">
                  <MapPin className="w-4 h-4 text-emerald-600 absolute right-3 pointer-events-none" />
                  <input
                    type="text"
                    value={locationLandmark}
                    onChange={(e) => setLocationLandmark(e.target.value)}
                    placeholder="مثلاً: پرانی نہر پل، یا مسجد کے سامنے"
                    className="w-full rounded-xl border border-stone-300 pr-10 pl-4 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-800 mb-1.5">
                  گوگل میپ لوکیشن لنک (Google Map Link)
                </label>
                <input
                  type="url"
                  value={locationMapUrl}
                  onChange={(e) => setLocationMapUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Operating Hours & Breaks */}
            <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200/80 space-y-3">
              <label className="block text-sm font-bold text-stone-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>اوقاتِ کار اور وقفہ (Opening, Closing & Break Hours)</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="block text-xs font-semibold text-stone-600 mb-1">کھلنے کا وقت</span>
                  <input
                    type="text"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    placeholder="08:00 AM"
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 font-semibold text-xs sm:text-sm bg-white"
                  />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-stone-600 mb-1">بند ہونے کا وقت</span>
                  <input
                    type="text"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    placeholder="09:00 PM"
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 font-semibold text-xs sm:text-sm bg-white"
                  />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-amber-800 mb-1">لنچ / نماز کا وقفہ</span>
                  <input
                    type="text"
                    value={breakTime}
                    onChange={(e) => setBreakTime(e.target.value)}
                    placeholder="01:00 PM – 02:00 PM"
                    className="w-full rounded-xl border border-amber-300 px-3 py-2 text-stone-900 font-semibold text-xs sm:text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Rates & Charges */}
            <div>
              <label className="block text-sm font-bold text-stone-800 mb-1.5">
                اجرت / فیس / ریٹ کی تفصیل (Charges & Rates)
              </label>
              <div className="relative flex items-center">
                <DollarSign className="w-4 h-4 text-emerald-600 absolute right-3 pointer-events-none" />
                <input
                  type="text"
                  value={chargesDescription}
                  onChange={(e) => setChargesDescription(e.target.value)}
                  placeholder="مثلاً: دیہاڑی 1800 روپے، یا وزٹ فیس 300 روپے"
                  className="w-full rounded-xl border border-stone-300 pr-10 pl-12 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleStartVoiceForField('charges')}
                  className={`absolute left-2 p-1.5 rounded-lg transition ${
                    activeVoiceField === 'charges'
                      ? 'bg-red-500 text-white animate-voice-pulse'
                      : 'bg-stone-100 text-stone-600 hover:bg-emerald-100 hover:text-emerald-700'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Skills & Services tags */}
            <div>
              <label className="block text-sm font-bold text-stone-800 mb-1.5">
                خصوصی خدمات و کام (الگ الگ کام کوما کے ساتھ لکھیں)
              </label>
              <textarea
                value={servicesInput}
                onChange={(e) => setServicesInput(e.target.value)}
                placeholder="مثلاً: مکان چنائی، پلستر، چھت ڈالنا، ماربل ٹائل"
                rows={2}
                className="w-full rounded-xl border border-stone-300 px-4 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm"
              />
            </div>

            {/* Added by name */}
            <div>
              <label className="block text-sm font-bold text-stone-800 mb-1.5">
                اندراج کرنے والے کا نام (اگر آپ کسی دوسرے بھائی کا نمبر ڈال رہے ہیں)
              </label>
              <input
                type="text"
                value={addedByName}
                onChange={(e) => setAddedByName(e.target.value)}
                placeholder="مثلاً: اپنا نام یا 'خود'"
                className="w-full rounded-xl border border-stone-300 px-4 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm"
              />
            </div>

            {/* Individual Security Credentials (Username, Password, Email Address) */}
            <div
              dir="ltr"
              lang="en"
              className="bg-gradient-to-r from-amber-50 to-emerald-50/70 p-4 rounded-2xl border-2 border-emerald-500/60 space-y-3 font-sans text-left"
            >
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm font-sans leading-tight tracking-tight">
                <KeyRound className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Account Sign In & Password Recovery Credentials</span>
              </div>
              <p className="text-[11px] text-stone-600 font-sans leading-snug">
                Your <strong>Username</strong> and <strong>Password</strong> remain private and allow you to sign in later to edit or delete your profile. Your <strong>Email Address</strong> is used to send a password reset link if you forget your password.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="e.g., asif_electrician"
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 focus:ring-2 focus:ring-emerald-500 font-mono text-xs bg-white"
                    required
                  />
                  <span className="text-[10px] text-stone-500 font-sans">Lowercase letters, numbers, and underscores (_)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 4 characters"
                      className="w-full rounded-xl border border-stone-300 px-3 pr-9 py-2 text-stone-900 focus:ring-2 focus:ring-emerald-500 font-mono text-xs bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-stone-500 font-sans">Keep this password private for account sign-in</span>
                </div>
              </div>

              <div className="pt-1">
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., yourname@gmail.com"
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 focus:ring-2 focus:ring-emerald-500 font-sans text-xs bg-white pl-9"
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute left-2.5 top-2.5 pointer-events-none" />
                </div>
                <span className="text-[10px] text-emerald-800 font-sans">
                  Used for "Forgot Password?" recovery to receive a password reset link.
                </span>
              </div>
            </div>

            {/* Strict Certifications */}
            <div className="space-y-3 bg-red-50/70 p-4 rounded-2xl border border-red-300">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noFemaleCertAccepted}
                  onChange={(e) => setNoFemaleCertAccepted(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-red-400 text-red-600 focus:ring-red-500"
                  required
                />
                <span className="text-xs sm:text-sm font-bold text-red-900">
                  میں حلفاً اقرار کرتا ہوں کہ یہ کسی خاتون (عورت) کا نمبر نہیں ہے، اور نہ ہی کوئی جعلی معلومات ہے۔
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-stone-400 text-emerald-600 focus:ring-emerald-500"
                  required
                />
                <span className="text-xs sm:text-sm font-semibold text-stone-800">
                  میں اقرار کرتا ہوں کہ مذہبی پروموشن یا فرقہ واریت سے مکمل پرہیز کروں گا۔ (پورٹل صرف روزگار اور ہنر کے لیے ہے)
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-semibold text-sm transition"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                <span>{t.saveProfile}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Guided Voice Form Modal */}
      <GuidedVoiceFormModal
        isOpen={isGuidedVoiceModalOpen}
        onClose={() => setIsGuidedVoiceModalOpen(false)}
        lang={lang}
        onFormCompleted={handleGuidedFormCompleted}
      />
    </>
  );
};
