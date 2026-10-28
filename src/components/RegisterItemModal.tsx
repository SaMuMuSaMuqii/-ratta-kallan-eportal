import React, { useState } from 'react';
import {
  X,
  Camera,
  Upload,
  MapPin,
  Phone,
  Briefcase,
  User,
  Compass,
  GraduationCap,
  Bus,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Plus,
  Trash2,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Mic,
  Sparkles,
} from 'lucide-react';
import {
  VillageProfile,
  VillageMosque,
  VillageInstitute,
  VillageTransport,
  Language,
} from '../types';
import { categoryLabels } from '../data/translations';
import { GuidedVoiceFormModal, GuidedFormData } from './GuidedVoiceFormModal';
import { ImageUploadFieldCard } from './ImageUploadFieldCard';

export type RegistrationTab = 'profile' | 'mosque' | 'institute' | 'transport';

interface RegisterItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: RegistrationTab;
  defaultMobile?: string;
  lang: Language;
  existingProfiles?: VillageProfile[];
  onSaveProfile: (profile: Omit<VillageProfile, 'id' | 'createdAt' | 'isVerified'>) => void;
  onSaveMosque: (mosque: VillageMosque) => void;
  onSaveInstitute: (institute: VillageInstitute) => void;
  onSaveTransport: (transport: VillageTransport) => void;
}

export const RegisterItemModal: React.FC<RegisterItemModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'profile',
  defaultMobile = '',
  lang,
  existingProfiles = [],
  onSaveProfile,
  onSaveMosque,
  onSaveInstitute,
  onSaveTransport,
}) => {
  const [activeTab, setActiveTab] = useState<RegistrationTab>(defaultTab);

  // Sync activeTab if defaultTab changes when opening
  React.useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab, isOpen]);

  // 1. Profile State
  const [profName, setProfName] = useState('');
  const [profFather, setProfFather] = useState('');
  const [profBusiness, setProfBusiness] = useState('');
  const [profCategory, setProfCategory] = useState<VillageProfile['category']>('mistri');
  const [profCustomCat, setProfCustomCat] = useState('');
  const [profMobile, setProfMobile] = useState(defaultMobile);

  // Profile Credential Security State
  const [profUsername, setProfUsername] = useState('');
  const [profPassword, setProfPassword] = useState('');
  const [showProfPassword, setShowProfPassword] = useState(false);
  const [profEmail, setProfEmail] = useState('');

  React.useEffect(() => {
    if (defaultMobile) {
      if (!profMobile) setProfMobile(defaultMobile);
      if (!mosqueContact) setMosqueContact(defaultMobile);
      if (!instContact) setInstContact(defaultMobile);
      if (!transMobile) setTransMobile(defaultMobile);
    }
  }, [defaultMobile]);
  const [profWhatsapp, setProfWhatsapp] = useState('');
  const [profAddress, setProfAddress] = useState('');
  const [profLandmark, setProfLandmark] = useState('');
  const [profMapUrl, setProfMapUrl] = useState('');
  const [profServices, setProfServices] = useState('');
  const [profCharges, setProfCharges] = useState('');
  const [profPersonImg, setProfPersonImg] = useState('');
  const [profBizImg, setProfBizImg] = useState('');
  const [profNoFemaleChecked, setProfNoFemaleChecked] = useState(false);

  // 2. Mosque State
  const [mosqueName, setMosqueName] = useState('');
  const [mosqueImam, setMosqueImam] = useState('');
  const [mosqueContact, setMosqueContact] = useState('');
  const [mosqueLocation, setMosqueLocation] = useState('');
  const [mosqueMapUrl, setMosqueMapUrl] = useState('');
  const [mosqueImage, setMosqueImage] = useState('');
  const [fajrTime, setFajrTime] = useState('5:15 AM');
  const [dhuhrTime, setDhuhrTime] = useState('1:30 PM');
  const [asrTime, setAsrTime] = useState('4:45 PM');
  const [maghribTime, setMaghribTime] = useState('غروب آفتاب');
  const [ishaTime, setIshaTime] = useState('8:00 PM');
  const [jummahTime, setJummahTime] = useState('1:45 PM');

  // 3. School/Institute State
  const [instName, setInstName] = useState('');
  const [instType, setInstType] = useState<VillageInstitute['type']>('school');
  const [instHead, setInstHead] = useState('');
  const [instContact, setInstContact] = useState('');
  const [instLocation, setInstLocation] = useState('');
  const [instMapUrl, setInstMapUrl] = useState('');
  const [instClasses, setInstClasses] = useState('نرسری تا میٹرک (سائنس و آرٹس)');
  const [instTiming, setInstTiming] = useState('صبح 8:00 بجے تا دوپہر 1:30 بجے');
  const [instImage, setInstImage] = useState('');

  // 4. Transport State
  const [transTitle, setTransTitle] = useState('');
  const [transNumber, setTransNumber] = useState('');
  const [transType, setTransType] = useState<VillageTransport['vehicleType']>('hiace');
  const [transDriver, setTransDriver] = useState('');
  const [transMobile, setTransMobile] = useState('');
  const [transDeparture, setTransDeparture] = useState('صبح 7:00 بجے');
  const [transArrival, setTransArrival] = useState('صبح 7:45 بجے');
  const [transFare, setTransFare] = useState('80 روپے');
  const [transRoute, setTransRoute] = useState('رتہ کلاں اڈا ➔ ایوب چوک ➔ جھنگ لاری اڈا');
  const [transImage, setTransImage] = useState('');
  const [stopsList, setStopsList] = useState<Array<{ stopName: string; time: string }>>([
    { stopName: 'رتہ کلاں اڈا', time: '7:00 AM' },
    { stopName: 'کوٹ سمابہ موڑ', time: '7:15 AM' },
    { stopName: 'ایوب چوک', time: '7:35 AM' },
    { stopName: 'جھنگ لاری اڈا', time: '7:45 AM' },
  ]);

  // Error/Success
  const [errorMsg, setErrorMsg] = useState('');

  // Guided Voice Form Modal state
  const [isGuidedVoiceOpen, setIsGuidedVoiceOpen] = useState(false);

  // Suggestions for custom category from existing profiles
  const existingCustomCats = Array.from(
    new Set(
      (existingProfiles || [])
        .map((p) => p.customCategory?.trim())
        .filter((c): c is string => Boolean(c && c.length > 1))
    )
  );

  const handleGuidedFormCompleted = (data: GuidedFormData) => {
    if (data.name) setProfName(data.name);
    if (data.mobile) setProfMobile(data.mobile);
    if (data.address) setProfAddress(data.address);
    if (data.businessName) setProfBusiness(data.businessName);
    if (data.category) {
      setProfCategory(data.category as VillageProfile['category']);
    }
    if (data.customCategory) {
      setProfCustomCat(data.customCategory);
    }
    if (data.services && data.services.length > 0) {
      setProfServices(data.services.join('، '));
    }
    if (data.email) setProfEmail(data.email);
  };

  if (!isOpen) return null;

  // Submit Profile
  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!profName.trim() || !profBusiness.trim() || !profMobile.trim()) {
      setErrorMsg('براہ کرم نام، کاروبار اور موبائل نمبر ضرور درج کریں۔');
      return;
    }

    // Validate Unique Username & Secure Password
    const cleanUser = (
      profUsername.trim() ||
      profName.trim().toLowerCase().replace(/\s+/g, '_')
    ).toLowerCase();

    const isTaken = existingProfiles.some(
      (p) => (p.username || '').toLowerCase() === cleanUser
    );
    if (isTaken) {
      setErrorMsg('This Username is already taken. Please choose a different Username.');
      return;
    }

    const cleanPass = profPassword.trim();
    if (cleanPass.length < 4) {
      setErrorMsg('Please set a Password of at least 4 characters to protect your account.');
      return;
    }

    if (!profNoFemaleChecked) {
      setErrorMsg('خواتین کے پرسنل نمبر کے تحفظ کی شرط پر ٹک لگانا لازمی ہے۔');
      return;
    }

    const services = profServices
      .split(/[,،\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    onSaveProfile({
      name: profName.trim(),
      fatherName: profFather.trim() || undefined,
      businessName: profBusiness.trim(),
      category: profCategory,
      customCategory: profCategory === 'other' ? profCustomCat.trim() : undefined,
      mobile: profMobile.trim(),
      whatsapp: profWhatsapp.trim() || profMobile.trim(),
      address: profAddress.trim() || 'رتہ کلاں، جھنگ',
      village: 'Ratta Kallan, Jhang',
      locationLandmark: profLandmark.trim(),
      locationMapUrl: profMapUrl.trim(),
      services: services.length ? services : [profBusiness.trim()],
      chargesDescription: profCharges.trim() || 'رابطہ پر طے ہو گا',
      availability: 'available',
      personImage:
        profPersonImg ||
        `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80`,
      businessImage: profBizImg || undefined,
      termsAccepted: true,
      username: cleanUser,
      password: cleanPass,
      email: profEmail.trim(),
    });

    onClose();
  };

  // Submit Mosque
  const handleSubmitMosque = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!mosqueName.trim() || !mosqueImam.trim()) {
      setErrorMsg('مسجد کا نام اور امام صاحب کا نام درج کرنا لازمی ہے۔');
      return;
    }

    const newMosque: VillageMosque = {
      id: `mosque-${Date.now()}`,
      name: mosqueName.trim(),
      imamName: mosqueImam.trim(),
      contact: mosqueContact.trim() || undefined,
      location: mosqueLocation.trim() || 'مرکزی آبادی، رتہ کلاں جھنگ',
      mapUrl:
        mosqueMapUrl.trim() ||
        `https://maps.google.com/?q=${encodeURIComponent(mosqueName.trim() + ' رتہ کلاں جھنگ')}`,
      image:
        mosqueImage ||
        'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=600&auto=format&fit=crop&q=80',
      prayerTimes: {
        fajr: fajrTime,
        dhuhr: dhuhrTime,
        asr: asrTime,
        maghrib: maghribTime,
        isha: ishaTime,
        jummah: jummahTime,
      },
      features: ['پنج وقتہ باجماعت نماز', 'وضو خانہ و پنکھے', 'نماز جمعہ'],
    };

    onSaveMosque(newMosque);
    onClose();
  };

  // Submit School/Institute
  const handleSubmitInstitute = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!instName.trim() || !instHead.trim()) {
      setErrorMsg('ادارے کا نام اور سربراہ / پرنسپل کا نام درج کرنا لازمی ہے۔');
      return;
    }

    const newInst: VillageInstitute = {
      id: `inst-${Date.now()}`,
      name: instName.trim(),
      type: instType,
      headName: instHead.trim(),
      contact: instContact.trim() || undefined,
      location: instLocation.trim() || 'مین روڈ، رتہ کلاں جھنگ',
      mapUrl:
        instMapUrl.trim() ||
        `https://maps.google.com/?q=${encodeURIComponent(instName.trim() + ' رتہ کلاں')}`,
      image:
        instImage ||
        'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&auto=format&fit=crop&q=80',
      classesOffered: instClasses.trim(),
      timing: instTiming.trim(),
    };

    onSaveInstitute(newInst);
    onClose();
  };

  // Submit Transport
  const handleSubmitTransport = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!transTitle.trim() || !transDriver.trim() || !transMobile.trim()) {
      setErrorMsg('گاڑی کی تفصیل، ڈرائیور کا نام اور رابطہ نمبر لازمی ہے۔');
      return;
    }

    const newTrans: VillageTransport = {
      id: `trans-${Date.now()}`,
      title: transTitle.trim(),
      vehicleNumber: transNumber.trim() || 'جھنگ روٹ',
      vehicleType: transType,
      driverName: transDriver.trim(),
      driverMobile: transMobile.trim(),
      image:
        transImage ||
        'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&auto=format&fit=crop&q=80',
      departureTime: transDeparture.trim(),
      arrivalTime: transArrival.trim(),
      fare: transFare.trim(),
      route: transRoute.trim(),
      stopsSchedule: stopsList,
    };

    onSaveTransport(newTrans);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
        <div className="bg-white border-2 border-emerald-600 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-950 text-white p-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-nastaliq flex items-center gap-2">
                <span>نیا اندراج و رجسٹریشن (رتہ کلاں پورٹل)</span>
              </h2>
              <p className="text-[11px] text-emerald-200">
                گاؤں کا کوئی بھی شہری اپنا یا کسی کا بھی کاروبار، مسجد، سکول یا گاڑی رجسٹر کر سکتا ہے
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-emerald-300 hover:text-white rounded-full bg-black/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Type Selection Tabs */}
          <div className="grid grid-cols-4 p-2 gap-1.5 bg-stone-100 border-b border-stone-200 text-xs font-nastaliq">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 font-bold cursor-pointer transition-all ${
                activeTab === 'profile'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span className="truncate">کاروبار / ہنر</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mosque')}
              className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 font-bold cursor-pointer transition-all ${
                activeTab === 'mosque'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="truncate">جامع مسجد</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('institute')}
              className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 font-bold cursor-pointer transition-all ${
                activeTab === 'institute'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-stone-700 hover:bg-stone-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span className="truncate">سکول / کالج</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('transport')}
              className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 font-bold cursor-pointer transition-all ${
                activeTab === 'transport'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Bus className="w-4 h-4" />
              <span className="truncate">گاڑی / ٹرانسپورٹ</span>
            </button>
          </div>

          {/* Error Message if any */}
          {errorMsg && (
            <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-700 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* TAB 1: Profile Registration */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSubmitProfile} className="space-y-3.5">
                {/* Guided Voice Form Assistant Banner */}
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border-2 border-emerald-300 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-emerald-950 font-nastaliq">
                        بول کر خودکار فارم بھریں (آواز سے رجسٹریشن)
                      </h4>
                      <p className="text-[11px] text-emerald-700">
                        لکھنے کی ضرورت نہیں، رتہ کلاں مددگار سوال پوچھے گا اور فارم خود بھرے گا
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsGuidedVoiceOpen(true)}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold font-nastaliq flex items-center justify-center gap-1.5 shadow transition shrink-0"
                  >
                    <Mic className="w-4 h-4 text-emerald-200 animate-bounce" />
                    <span>بول کر فارم بھریں</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      شہری / کاریگر کا نام *
                    </label>
                    <input
                      type="text"
                      value={profName}
                      onChange={(e) => setProfName(e.target.value)}
                      placeholder="مثلاً: محمد اسلم / ثمر سعید"
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      ولدیت (اختیاری)
                    </label>
                    <input
                      type="text"
                      value={profFather}
                      onChange={(e) => setProfFather(e.target.value)}
                      placeholder="مثلاً: ولد حاجی برکت علی"
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      کاروبار / دکان / ہنر کا نام *
                    </label>
                    <input
                      type="text"
                      value={profBusiness}
                      onChange={(e) => setProfBusiness(e.target.value)}
                      placeholder="مثلاً: اسلم ٹریکٹر ریپئرنگ و زرعی اوزار"
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      شعبہ / کیٹیگری
                    </label>
                    <select
                      value={profCategory}
                      onChange={(e) =>
                        setProfCategory(e.target.value as VillageProfile['category'])
                      }
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="mistri">مستری / راج مزدور</option>
                      <option value="electrician">الیکٹریشن و سولر موٹر</option>
                      <option value="tractor">ٹریکٹر و زرعی مشینری</option>
                      <option value="doctor">ڈاکٹر / کلینک / ادویات</option>
                      <option value="karyana">کریانہ و جنرل سٹور</option>
                      <option value="tailor">درزی و سلائی ماسٹر</option>
                      <option value="milk">دودھ و ڈیری فارم</option>
                      <option value="plumber">پلمبر و سینیٹری</option>
                      <option value="driver">ڈرائیور / رکشہ / ویگن</option>
                      <option value="welder">ویلڈر و لوہار</option>
                      <option value="chakki">آٹا چکی و چوکر</option>
                      <option value="other">دیگر خدمت (Other)</option>
                    </select>
                  </div>
                </div>

                {/* Custom Category Input if 'other' is selected */}
                {profCategory === 'other' && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                    <label className="block text-xs font-bold text-amber-950">
                      شعبہ یا کام کا نام لکھیں (Custom Category) *
                    </label>
                    <input
                      type="text"
                      value={profCustomCat}
                      onChange={(e) => setProfCustomCat(e.target.value)}
                      placeholder="مثلاً: لکڑی کا کاریگر، نائی / حجام، رنگ روغن، ویٹرنری ڈاکٹر"
                      className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 bg-white"
                      required
                    />
                    {existingCustomCats.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-stone-500 font-semibold">پہلے سے موجود کیٹیگریز:</span>
                        {existingCustomCats.slice(0, 6).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setProfCustomCat(cat)}
                            className="text-[11px] px-2 py-0.5 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition"
                          >
                            + {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      موبائل نمبر (صرف مرد حضرات کا) *
                    </label>
                    <input
                      type="tel"
                      value={profMobile}
                      onChange={(e) => setProfMobile(e.target.value)}
                      placeholder="03001234567"
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      واٹس ایپ نمبر
                    </label>
                    <input
                      type="tel"
                      value={profWhatsapp}
                      onChange={(e) => setProfWhatsapp(e.target.value)}
                      placeholder="03001234567"
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    گاؤں میں پتہ / گلی / ڈیرہ
                  </label>
                  <input
                    type="text"
                    value={profAddress}
                    onChange={(e) => setProfAddress(e.target.value)}
                    placeholder="مثلاً: محلہ عیدگاہ والا، نزد چھپر، رتہ کلاں"
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    گوگل میپ لائیو لوکیشن لنک (یا نشان دہی)
                  </label>
                  <input
                    type="text"
                    value={profMapUrl}
                    onChange={(e) => setProfMapUrl(e.target.value)}
                    placeholder="https://maps.app.goo.gl/... یا خالی چھوڑیں"
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* 2 Photos: Person Profile Picture and Business Picture with Crop, Zoom, Reposition & Camera */}
                <div className="space-y-3 pt-1">
                  <ImageUploadFieldCard
                    label="1. بندے کی پروفائل تصویر (سیلفی یا فوٹو)"
                    subtitle="چہرے کو گول اور چوکور پروفائل فریم میں ایڈجسٹ، کراپ اور زوم کرنے کی سہولت"
                    value={profPersonImg}
                    onChange={setProfPersonImg}
                    mode="avatar"
                    accentColor="emerald"
                  />

                  <ImageUploadFieldCard
                    label="2. دکان / کاروبار یا کام کی تصویر"
                    subtitle="دکان کا بورڈ، لوگو یا کام کی تصویر کراپ، زوم اور مکمل فٹ کرنے کی سہولت"
                    value={profBizImg}
                    onChange={setProfBizImg}
                    mode="business"
                    accentColor="blue"
                  />
                </div>

                {/* Personal Security & Ownership Credentials */}
                <div
                  dir="ltr"
                  lang="en"
                  className="bg-gradient-to-r from-amber-50 to-emerald-50/70 p-3.5 rounded-2xl border-2 border-emerald-500/60 space-y-2.5 font-sans text-xs text-left"
                >
                  <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-xs font-sans leading-tight tracking-tight">
                    <KeyRound className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Account Sign In & Password Recovery Credentials</span>
                  </div>
                  <p className="text-[11px] text-stone-600 font-sans leading-snug">
                    Your <strong>Username</strong> and <strong>Password</strong> remain private and allow you to sign in later to edit or delete your profile.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-800 mb-1">
                        Username *
                      </label>
                      <input
                        type="text"
                        value={profUsername}
                        onChange={(e) => setProfUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                        placeholder="e.g., arshad_tractor"
                        className="w-full px-3 py-2 border rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-800 mb-1">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showProfPassword ? 'text' : 'password'}
                          value={profPassword}
                          onChange={(e) => setProfPassword(e.target.value)}
                          placeholder="Minimum 4 characters"
                          className="w-full px-3 pr-9 py-2 border rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowProfPassword((prev) => !prev)}
                          className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 cursor-pointer"
                          title={showProfPassword ? 'Hide password' : 'Show password'}
                          aria-label={showProfPassword ? 'Hide password' : 'Show password'}
                        >
                          {showProfPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-0.5">
                    <label className="block text-[11px] font-bold text-stone-800 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={profEmail}
                        onChange={(e) => setProfEmail(e.target.value)}
                        placeholder="e.g., yourname@gmail.com"
                        className="w-full px-3 py-2 border rounded-xl font-sans text-xs focus:ring-2 focus:ring-emerald-500 bg-white pl-8"
                      />
                      <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5 pointer-events-none" />
                    </div>
                    <span className="text-[10px] text-emerald-800 font-sans block mt-0.5">
                      Used for "Forgot Password?" recovery to receive a password reset link.
                    </span>
                  </div>
                </div>

                {/* Protection Checkbox */}
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profNoFemaleChecked}
                      onChange={(e) => setProfNoFemaleChecked(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      required
                    />
                    <span className="text-amber-900 leading-relaxed font-nastaliq">
                      میں حلفاً اقرار کرتا ہوں کہ یہ کسی عورت یا فیمیل کا ذاتی نمبر نہیں ہے۔
                      پورٹل صرف مردوں کے روزگار اور گاؤں کی سہولت کے لیے ہے۔
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md cursor-pointer text-sm font-nastaliq"
                >
                  کاروبار / پروفائل محفوظ کریں
                </button>
              </form>
            )}

            {/* TAB 2: Mosque Registration */}
            {activeTab === 'mosque' && (
              <form onSubmit={handleSubmitMosque} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    جامع مسجد کا نام *
                  </label>
                  <input
                    type="text"
                    value={mosqueName}
                    onChange={(e) => setMosqueName(e.target.value)}
                    placeholder="مثلاً: جامع مسجد نورِ مدینہ / مرکزی جامع مسجد"
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      امام صاحب / خطیب کا نام *
                    </label>
                    <input
                      type="text"
                      value={mosqueImam}
                      onChange={(e) => setMosqueImam(e.target.value)}
                      placeholder="مثلاً: مولانا محمد طاہر صاحب"
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      رابطہ فون نمبر (امام / متولی)
                    </label>
                    <input
                      type="tel"
                      value={mosqueContact}
                      onChange={(e) => setMosqueContact(e.target.value)}
                      placeholder="03001234567"
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    مقام / گلی / محلہ (رتہ کلاں)
                  </label>
                  <input
                    type="text"
                    value={mosqueLocation}
                    onChange={(e) => setMosqueLocation(e.target.value)}
                    placeholder="مثلاً: مشرقی محلہ، بالمقابل پرائمری سکول، رتہ کلاں"
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    گوگل میپ لائیو لوکیشن لنک (یا کوآرڈینیٹس)
                  </label>
                  <input
                    type="text"
                    value={mosqueMapUrl}
                    onChange={(e) => setMosqueMapUrl(e.target.value)}
                    placeholder="https://maps.google.com/?q=... یا پن لنک"
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Prayer Times Grid */}
                <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200">
                  <p className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1 font-nastaliq">
                    <Clock className="w-3.5 h-3.5" />
                    <span>اوقاتِ نماز درج کریں:</span>
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-stone-500 block">فجر</span>
                      <input
                        type="text"
                        value={fajrTime}
                        onChange={(e) => setFajrTime(e.target.value)}
                        className="w-full px-1.5 py-1 border rounded-lg text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block">ظہر</span>
                      <input
                        type="text"
                        value={dhuhrTime}
                        onChange={(e) => setDhuhrTime(e.target.value)}
                        className="w-full px-1.5 py-1 border rounded-lg text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block">عصر</span>
                      <input
                        type="text"
                        value={asrTime}
                        onChange={(e) => setAsrTime(e.target.value)}
                        className="w-full px-1.5 py-1 border rounded-lg text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block">مغرب</span>
                      <input
                        type="text"
                        value={maghribTime}
                        onChange={(e) => setMaghribTime(e.target.value)}
                        className="w-full px-1.5 py-1 border rounded-lg text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block">عشاء</span>
                      <input
                        type="text"
                        value={ishaTime}
                        onChange={(e) => setIshaTime(e.target.value)}
                        className="w-full px-1.5 py-1 border rounded-lg text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block font-bold text-emerald-700">
                        جمعہ
                      </span>
                      <input
                        type="text"
                        value={jummahTime}
                        onChange={(e) => setJummahTime(e.target.value)}
                        className="w-full px-1.5 py-1 border rounded-lg text-center font-bold text-emerald-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Mosque Image with Crop, Zoom, Reposition & Camera */}
                <ImageUploadFieldCard
                  label="مسجد کی تصویر (گیلری یا کیمرہ)"
                  subtitle="مسجد کی عمارت کی تصویر کو کراپ، زوم اور ایڈجسٹ کریں"
                  value={mosqueImage}
                  onChange={setMosqueImage}
                  mode="general"
                  accentColor="emerald"
                />

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md cursor-pointer text-sm font-nastaliq"
                >
                  جامع مسجد رجسٹر کریں
                </button>
              </form>
            )}

            {/* TAB 3: School/Institute Registration */}
            {activeTab === 'institute' && (
              <form onSubmit={handleSubmitInstitute} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    ادارے / سکول / کالج کا نام *
                  </label>
                  <input
                    type="text"
                    value={instName}
                    onChange={(e) => setInstName(e.target.value)}
                    placeholder="مثلاً: گورنمنٹ ہائی سکول رتہ کلاں جھنگ"
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      نوعیت ادارہ
                    </label>
                    <select
                      value={instType}
                      onChange={(e) =>
                        setInstType(e.target.value as VillageInstitute['type'])
                      }
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="school">سکول (پرائمری / مڈل / ہائی)</option>
                      <option value="college">کالج / ہائر سیکنڈری</option>
                      <option value="madrasa">دینی درسگاہ / مدرسہ</option>
                      <option value="tuition">اکیڈمی / ٹیوشن سینٹر</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      سربراہ / پرنسپل کا نام *
                    </label>
                    <input
                      type="text"
                      value={instHead}
                      onChange={(e) => setInstHead(e.target.value)}
                      placeholder="مثلاً: سر ندیم صاحب / پرنسپل"
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      رابطہ نمبر
                    </label>
                    <input
                      type="tel"
                      value={instContact}
                      onChange={(e) => setInstContact(e.target.value)}
                      placeholder="03001234567"
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      کلاسز کی تفصیل
                    </label>
                    <input
                      type="text"
                      value={instClasses}
                      onChange={(e) => setInstClasses(e.target.value)}
                      placeholder="مثلاً: نرسری تا دسویں جماعت"
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    پتہ و گوگل لائیو میپ لوکیشن
                  </label>
                  <input
                    type="text"
                    value={instLocation}
                    onChange={(e) => setInstLocation(e.target.value)}
                    placeholder="مین جھنگ روڈ، رتہ کلاں"
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 mb-2"
                  />
                  <input
                    type="text"
                    value={instMapUrl}
                    onChange={(e) => setInstMapUrl(e.target.value)}
                    placeholder="https://maps.google.com/?q=... گوگل میپ پن"
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* School / Institute Image with Crop, Zoom, Reposition & Camera */}
                <ImageUploadFieldCard
                  label="عمارت / سکول کی تصویر (گیلری یا کیمرہ)"
                  subtitle="تعلیمی ادارے کی تصویر کو کراپ، زوم اور ایڈجسٹ کریں"
                  value={instImage}
                  onChange={setInstImage}
                  mode="general"
                  accentColor="blue"
                />

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md cursor-pointer text-sm font-nastaliq"
                >
                  تعلیمی ادارہ رجسٹر کریں
                </button>
              </form>
            )}

            {/* TAB 4: Transport/Vehicle Registration */}
            {activeTab === 'transport' && (
              <form onSubmit={handleSubmitTransport} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    گاڑی / سروس کا نام *
                  </label>
                  <input
                    type="text"
                    value={transTitle}
                    onChange={(e) => setTransTitle(e.target.value)}
                    placeholder="مثلاً: رتہ کلاں تا جھنگ لاری اڈا ہائیس وین سروس"
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      گاڑی کا نمبر (پلیٹ نمبر) *
                    </label>
                    <input
                      type="text"
                      value={transNumber}
                      onChange={(e) => setTransNumber(e.target.value)}
                      placeholder="مثلاً: JHG-4820 یا FSD-1092"
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      گاڑی کی قسم
                    </label>
                    <select
                      value={transType}
                      onChange={(e) =>
                        setTransType(e.target.value as VillageTransport['vehicleType'])
                      }
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="hiace">ہائیس وین (Toyota HiAce)</option>
                      <option value="bus">بس (Bus / Coach)</option>
                      <option value="rickshaw">چنگچی رکشہ / آٹو</option>
                      <option value="bolan">بولان / کیری ڈبہ</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      ڈرائیور کا نام *
                    </label>
                    <input
                      type="text"
                      value={transDriver}
                      onChange={(e) => setTransDriver(e.target.value)}
                      placeholder="مثلاً: استاد قیصر محمود"
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      ڈرائیور کا موبائل فون نمبر *
                    </label>
                    <input
                      type="tel"
                      value={transMobile}
                      onChange={(e) => setTransMobile(e.target.value)}
                      placeholder="03011234567"
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      رتہ کلاں روانگی وقت
                    </label>
                    <input
                      type="text"
                      value={transDeparture}
                      onChange={(e) => setTransDeparture(e.target.value)}
                      placeholder="صبح 7:00 بجے"
                      className="w-full px-2.5 py-1.5 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      جھنگ پہنچنے کا وقت
                    </label>
                    <input
                      type="text"
                      value={transArrival}
                      onChange={(e) => setTransArrival(e.target.value)}
                      placeholder="صبح 7:45 بجے"
                      className="w-full px-2.5 py-1.5 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      کرایہ فی سواری
                    </label>
                    <input
                      type="text"
                      value={transFare}
                      onChange={(e) => setTransFare(e.target.value)}
                      placeholder="80 روپے"
                      className="w-full px-2.5 py-1.5 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    مکمل روٹ
                  </label>
                  <input
                    type="text"
                    value={transRoute}
                    onChange={(e) => setTransRoute(e.target.value)}
                    placeholder="رتہ کلاں اڈا ➔ ایوب چوک ➔ جھنگ سٹی لاری اڈا"
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Vehicle Image with Crop, Zoom, Reposition & Camera */}
                <ImageUploadFieldCard
                  label="گاڑی کی تصویر (گیلری یا کیمرہ)"
                  subtitle="گاڑی یا وین کی تصویر کو کراپ، زوم اور ایڈجسٹ کریں"
                  value={transImage}
                  onChange={setTransImage}
                  mode="general"
                  accentColor="amber"
                />

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md cursor-pointer text-sm font-nastaliq"
                >
                  پبلک ٹرانسپورٹ گاڑی رجسٹر کریں
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Guided Voice Form Modal */}
      <GuidedVoiceFormModal
        isOpen={isGuidedVoiceOpen}
        onClose={() => setIsGuidedVoiceOpen(false)}
        lang={lang}
        onFormCompleted={handleGuidedFormCompleted}
      />
    </>
  );
};
