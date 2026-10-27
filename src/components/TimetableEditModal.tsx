import React, { useState } from 'react';
import {
  X,
  Lock,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Compass,
  GraduationCap,
  Plus,
  Trash2,
  MapPin,
  Phone,
  AlertTriangle,
  HeartPulse,
  Bus,
  Activity,
  Calendar,
  Save,
} from 'lucide-react';
import {
  VillageMosque,
  VillageInstitute,
  VillageHospital,
  VillageTransport,
  Language,
  AuthUserSession,
} from '../types';

export type EntityLoginType = 'mosque' | 'institute' | 'hospital' | 'transport';

interface TimetableEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityLoginType;
  mosque?: VillageMosque | null;
  institute?: VillageInstitute | null;
  hospital?: VillageHospital | null;
  transport?: VillageTransport | null;
  onSaveMosque?: (updated: VillageMosque) => void;
  onSaveInstitute?: (updated: VillageInstitute) => void;
  onSaveHospital?: (updated: VillageHospital) => void;
  onSaveTransport?: (updated: VillageTransport) => void;
  lang: Language;
  activeSession?: AuthUserSession | null;
}

export const TimetableEditModal: React.FC<TimetableEditModalProps> = ({
  isOpen,
  onClose,
  entityType,
  mosque,
  institute,
  hospital,
  transport,
  onSaveMosque,
  onSaveInstitute,
  onSaveHospital,
  onSaveTransport,
  activeSession,
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  // Mosque Edit Form State
  const [mosqueName, setMosqueName] = useState('');
  const [mosqueImam, setMosqueImam] = useState('');
  const [mosqueContact, setMosqueContact] = useState('');
  const [mosqueLocation, setMosqueLocation] = useState('');
  const [mosqueMapUrl, setMosqueMapUrl] = useState('');
  const [fajr, setFajr] = useState('');
  const [dhuhr, setDhuhr] = useState('');
  const [asr, setAsr] = useState('');
  const [maghrib, setMaghrib] = useState('');
  const [isha, setIsha] = useState('');
  const [jummah, setJummah] = useState('');
  const [eidUlFitr, setEidUlFitr] = useState('');
  const [eidUlAdha, setEidUlAdha] = useState('');
  const [mosqueNewPass, setMosqueNewPass] = useState('');

  // Institute Edit Form State
  const [instName, setInstName] = useState('');
  const [instHead, setInstHead] = useState('');
  const [instContact, setInstContact] = useState('');
  const [instLocation, setInstLocation] = useState('');
  const [instTiming, setInstTiming] = useState('');
  const [instClasses, setInstClasses] = useState('');
  const [instMapUrl, setInstMapUrl] = useState('');
  const [instNewPass, setInstNewPass] = useState('');
  const [timetablePeriods, setTimetablePeriods] = useState<
    Array<{ period: string; subject: string; time: string; teacher?: string }>
  >([]);

  // Hospital Edit Form State
  const [hospName, setHospName] = useState('');
  const [hospContact, setHospContact] = useState('');
  const [hospEmergencyPhone, setHospEmergencyPhone] = useState('');
  const [hospDoctor, setHospDoctor] = useState('');
  const [hospTiming, setHospTiming] = useState('');
  const [hospIs24Hours, setHospIs24Hours] = useState(false);
  const [hospServicesText, setHospServicesText] = useState('');
  const [hospNewPass, setHospNewPass] = useState('');

  // Transport Edit Form State
  const [transTitle, setTransTitle] = useState('');
  const [transVehicleNumber, setTransVehicleNumber] = useState('');
  const [transDriverName, setTransDriverName] = useState('');
  const [transDriverMobile, setTransDriverMobile] = useState('');
  const [transDepartureTime, setTransDepartureTime] = useState('');
  const [transArrivalTime, setTransArrivalTime] = useState('');
  const [transFare, setTransFare] = useState('');
  const [transRoute, setTransRoute] = useState('');
  const [transStops, setTransStops] = useState<Array<{ stopName: string; time: string }>>([]);
  const [transNewPass, setTransNewPass] = useState('');

  // Sync state when modal opens
  React.useEffect(() => {
    if (entityType === 'mosque' && mosque) {
      setMosqueName(mosque.name);
      setMosqueImam(mosque.imamName);
      setMosqueContact(mosque.contact || '');
      setMosqueLocation(mosque.location);
      setMosqueMapUrl(mosque.mapUrl || '');
      setFajr(mosque.prayerTimes.fajr);
      setDhuhr(mosque.prayerTimes.dhuhr);
      setAsr(mosque.prayerTimes.asr);
      setMaghrib(mosque.prayerTimes.maghrib);
      setIsha(mosque.prayerTimes.isha);
      setJummah(mosque.prayerTimes.jummah);
      setEidUlFitr(mosque.eidUlFitrTime || '07:15 AM');
      setEidUlAdha(mosque.eidUlAdhaTime || '07:00 AM');
      setUsernameInput(mosque.username || '');
      setMosqueNewPass('');
    } else if (entityType === 'institute' && institute) {
      setInstName(institute.name);
      setInstHead(institute.headName);
      setInstContact(institute.contact || '');
      setInstLocation(institute.location);
      setInstTiming(institute.timing || 'صبح 8:00 بجے تا دوپہر 1:30 بجے');
      setInstClasses(institute.classesOffered || '');
      setInstMapUrl(institute.mapUrl || '');
      setTimetablePeriods(
        institute.timetableSchedule || [
          { period: 'پیریڈ 1', subject: 'انگریزی', time: '08:00 AM' },
          { period: 'پیریڈ 2', subject: 'ریاضی', time: '08:45 AM' },
        ]
      );
      setUsernameInput(institute.username || '');
      setInstNewPass('');
    } else if (entityType === 'hospital' && hospital) {
      setHospName(hospital.name);
      setHospContact(hospital.contact || '');
      setHospEmergencyPhone(hospital.emergencyPhone || '');
      setHospDoctor(hospital.doctorInCharge || '');
      setHospTiming(hospital.timing || '');
      setHospIs24Hours(hospital.is24Hours);
      setHospServicesText(hospital.services.join('\n'));
      setUsernameInput(hospital.username || '');
      setHospNewPass('');
    } else if (entityType === 'transport' && transport) {
      setTransTitle(transport.title);
      setTransVehicleNumber(transport.vehicleNumber);
      setTransDriverName(transport.driverName);
      setTransDriverMobile(transport.driverMobile);
      setTransDepartureTime(transport.departureTime);
      setTransArrivalTime(transport.arrivalTime);
      setTransFare(transport.fare);
      setTransRoute(transport.route);
      setTransStops(transport.stopsSchedule || []);
      setUsernameInput(transport.username || '');
      setTransNewPass('');
    }
    setIsAuthenticated(false);
    setPasswordInput('');
    setAuthError('');
  }, [entityType, mosque, institute, hospital, transport, isOpen]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    // If current logged in session already has admin or section editor role
    if (activeSession) {
      if (activeSession.type === 'admin' || activeSession.roles?.admin) {
        setIsAuthenticated(true);
        return;
      }
      if (entityType === 'mosque' && activeSession.roles?.mosqueEditor) {
        setIsAuthenticated(true);
        return;
      }
      if (entityType === 'institute' && activeSession.roles?.schoolEditor) {
        setIsAuthenticated(true);
        return;
      }
      if (entityType === 'hospital' && activeSession.roles?.hospitalEditor) {
        setIsAuthenticated(true);
        return;
      }
      if (entityType === 'transport' && activeSession.roles?.transportEditor) {
        setIsAuthenticated(true);
        return;
      }
    }

    if (entityType === 'mosque' && mosque) {
      const validUser = (mosque.username || 'admin').toLowerCase().trim();
      const validPass = (mosque.password || '').trim();

      if (
        validPass &&
        usernameInput.toLowerCase().trim() === validUser &&
        passwordInput.trim() === validPass
      ) {
        setIsAuthenticated(true);
      } else {
        setAuthError(
          'Invalid Username or Password. Only the authorized Mosque Imam or Administrator can update prayer schedules.'
        );
      }
    } else if (entityType === 'institute' && institute) {
      const validUser = (institute.username || 'admin').toLowerCase().trim();
      const validPass = (institute.password || '').trim();

      if (
        validPass &&
        usernameInput.toLowerCase().trim() === validUser &&
        passwordInput.trim() === validPass
      ) {
        setIsAuthenticated(true);
      } else {
        setAuthError(
          'Invalid Username or Password. Only the authorized School Principal or Administrator can update the timetable.'
        );
      }
    } else if (entityType === 'hospital' && hospital) {
      const validUser = (hospital.username || 'admin').toLowerCase().trim();
      const validPass = (hospital.password || '').trim();

      if (
        validPass &&
        usernameInput.toLowerCase().trim() === validUser &&
        passwordInput.trim() === validPass
      ) {
        setIsAuthenticated(true);
      } else {
        setAuthError(
          'Invalid Username or Password. Only the authorized Hospital In-Charge or Administrator can update medical details.'
        );
      }
    } else if (entityType === 'transport' && transport) {
      const validUser = (transport.username || 'admin').toLowerCase().trim();
      const validPass = (transport.password || '').trim();

      if (
        validPass &&
        usernameInput.toLowerCase().trim() === validUser &&
        passwordInput.trim() === validPass
      ) {
        setIsAuthenticated(true);
      } else {
        setAuthError(
          'Invalid Username or Password. Only the authorized Driver or Administrator can update transport schedules.'
        );
      }
    }
  };

  const handleSaveMosqueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mosque || !onSaveMosque) return;

    const updated: VillageMosque = {
      ...mosque,
      name: mosqueName.trim() || mosque.name,
      imamName: mosqueImam.trim() || mosque.imamName,
      contact: mosqueContact.trim() || mosque.contact,
      location: mosqueLocation.trim() || mosque.location,
      mapUrl: mosqueMapUrl.trim() || mosque.mapUrl,
      prayerTimes: {
        fajr: fajr.trim(),
        dhuhr: dhuhr.trim(),
        asr: asr.trim(),
        maghrib: maghrib.trim(),
        isha: isha.trim(),
        jummah: jummah.trim(),
      },
      eidUlFitrTime: eidUlFitr.trim(),
      eidUlAdhaTime: eidUlAdha.trim(),
      password: mosqueNewPass.trim() ? mosqueNewPass.trim() : mosque.password,
      lastUpdated: new Date().toISOString(),
    };

    onSaveMosque(updated);
    onClose();
  };

  const handleSaveInstituteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!institute || !onSaveInstitute) return;

    const updated: VillageInstitute = {
      ...institute,
      name: instName.trim() || institute.name,
      headName: instHead.trim() || institute.headName,
      contact: instContact.trim() || institute.contact,
      location: instLocation.trim() || institute.location,
      timing: instTiming.trim() || institute.timing,
      classesOffered: instClasses.trim() || institute.classesOffered,
      mapUrl: instMapUrl.trim() || institute.mapUrl,
      timetableSchedule: timetablePeriods,
      password: instNewPass.trim() ? instNewPass.trim() : institute.password,
      lastUpdated: new Date().toISOString(),
    };

    onSaveInstitute(updated);
    onClose();
  };

  const handleSaveHospitalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospital || !onSaveHospital) return;

    const services = hospServicesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const updated: VillageHospital = {
      ...hospital,
      name: hospName.trim() || hospital.name,
      contact: hospContact.trim() || hospital.contact,
      emergencyPhone: hospEmergencyPhone.trim() || hospital.emergencyPhone,
      doctorInCharge: hospDoctor.trim() || hospital.doctorInCharge,
      timing: hospTiming.trim() || hospital.timing,
      is24Hours: hospIs24Hours,
      services: services.length > 0 ? services : hospital.services,
      password: hospNewPass.trim() ? hospNewPass.trim() : hospital.password,
      lastUpdated: new Date().toISOString(),
    };

    onSaveHospital(updated);
    onClose();
  };

  const handleSaveTransportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transport || !onSaveTransport) return;

    const updated: VillageTransport = {
      ...transport,
      title: transTitle.trim() || transport.title,
      vehicleNumber: transVehicleNumber.trim() || transport.vehicleNumber,
      driverName: transDriverName.trim() || transport.driverName,
      driverMobile: transDriverMobile.trim() || transport.driverMobile,
      departureTime: transDepartureTime.trim() || transport.departureTime,
      arrivalTime: transArrivalTime.trim() || transport.arrivalTime,
      fare: transFare.trim() || transport.fare,
      route: transRoute.trim() || transport.route,
      stopsSchedule: transStops,
      password: transNewPass.trim() ? transNewPass.trim() : transport.password,
      lastUpdated: new Date().toISOString(),
    };

    onSaveTransport(updated);
    onClose();
  };

  const getEntityIcon = () => {
    switch (entityType) {
      case 'mosque':
        return <Compass className="w-5 h-5 text-emerald-950" />;
      case 'institute':
        return <GraduationCap className="w-5 h-5 text-emerald-950" />;
      case 'hospital':
        return <HeartPulse className="w-5 h-5 text-emerald-950" />;
      case 'transport':
        return <Bus className="w-5 h-5 text-emerald-950" />;
    }
  };

  const getEntityTitle = () => {
    switch (entityType) {
      case 'mosque':
        return `اوقاتِ نماز و عیدین (${mosque?.name || 'مسجد'})`;
      case 'institute':
        return `اسکول ٹائم ٹیبل و شیڈول (${institute?.name || 'ادارہ'})`;
      case 'hospital':
        return `طبی سروس و ایمرجنسی اوقات (${hospital?.name || 'ہسپتال'})`;
      case 'transport':
        return `گاڑی کے اوقات و کرایہ (${transport?.title || 'ٹرانسپورٹ'})`;
    }
  };

  const getEntityDesignation = () => {
    switch (entityType) {
      case 'mosque':
        return 'امام مسجد / خطیب / متولی';
      case 'institute':
        return 'ہیڈ ماسٹر / پرنسپل / استاد';
      case 'hospital':
        return 'ڈاکٹر انچارج / میڈیکل سپرنٹنڈنٹ';
      case 'transport':
        return 'ڈرائیور / گاڑی کا مالک';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border-2 border-emerald-600 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400 text-stone-950 rounded-2xl shadow">
              {getEntityIcon()}
            </div>
            <div>
              <h3 className="font-bold font-nastaliq text-base sm:text-lg leading-tight text-amber-200">
                {getEntityTitle()}
              </h3>
              <p className="text-[11px] text-emerald-200 font-nastaliq">
                محفوظ لاگ ان رسائی: مجاز {getEntityDesignation()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-full bg-black/20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: AUTHENTICATION LOGIN FORM */}
        {!isAuthenticated ? (
          <form
            onSubmit={handleLogin}
            dir="ltr"
            lang="en"
            className="p-5 sm:p-6 space-y-4 font-sans text-left"
            noValidate
          >
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-6 h-6 text-emerald-700" />
              </div>
              <h4 className="font-bold text-base text-stone-900">
                Section Manager Sign In
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Enter your assigned <strong>Username</strong> and <strong>Password</strong> to manage schedules and details for this section.
              </p>
            </div>

            {authError && (
              <div
                role="alert"
                className="bg-red-50 border-2 border-red-300 text-red-900 p-3 rounded-2xl text-xs font-semibold flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-3 text-left">
              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter your assigned username"
                  dir="ltr"
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-sm focus:border-emerald-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter your password"
                  dir="ltr"
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-sm focus:border-emerald-600 focus:outline-none"
                  required
                />
              </div>

              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-300 text-[11px] text-amber-950 space-y-1">
                <div className="flex items-center gap-1 font-bold text-amber-900">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Forgot Password?</span>
                </div>
                <p>
                  If you need to reset your section password, please contact the Portal Administrator.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white font-bold rounded-2xl shadow-lg transition active:scale-95 cursor-pointer text-sm flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          </form>
        ) : (
          /* STEP 2: AUTHENTICATED EDIT FORMS */
          <div className="p-4 sm:p-5 overflow-y-auto max-h-[75vh] space-y-4">
            <div
              dir="ltr"
              lang="en"
              className="bg-emerald-50 border border-emerald-300 rounded-2xl p-2.5 flex items-center justify-between text-xs font-sans text-emerald-950"
            >
              <span className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Authenticated — Signed In</span>
              </span>
              <button
                type="button"
                onClick={() => setIsAuthenticated(false)}
                className="text-rose-700 hover:text-rose-900 text-xs font-bold underline cursor-pointer"
              >
                Sign Out
              </button>
            </div>

            {/* 1. MOSQUE EDIT FORM */}
            {entityType === 'mosque' && (
              <form onSubmit={handleSaveMosqueSubmit} className="space-y-4 font-nastaliq text-right">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">مسجد کا نام:</label>
                  <input
                    type="text"
                    value={mosqueName}
                    onChange={(e) => setMosqueName(e.target.value)}
                    className="w-full p-2 rounded-xl border text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">امام صاحب کا نام:</label>
                    <input
                      type="text"
                      value={mosqueImam}
                      onChange={(e) => setMosqueImam(e.target.value)}
                      className="w-full p-2 rounded-xl border text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">رابطہ نمبر:</label>
                    <input
                      type="text"
                      value={mosqueContact}
                      onChange={(e) => setMosqueContact(e.target.value)}
                      className="w-full p-2 rounded-xl border text-xs"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="bg-stone-50 p-3 rounded-2xl border space-y-2">
                  <span className="text-xs font-bold text-stone-800 block">پنجگانہ نمازوں کے اوقات:</span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-stone-600 block">فجر:</span>
                      <input
                        type="text"
                        value={fajr}
                        onChange={(e) => setFajr(e.target.value)}
                        className="w-full p-1.5 border rounded-lg"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-600 block">ظہر:</span>
                      <input
                        type="text"
                        value={dhuhr}
                        onChange={(e) => setDhuhr(e.target.value)}
                        className="w-full p-1.5 border rounded-lg"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-600 block">عصر:</span>
                      <input
                        type="text"
                        value={asr}
                        onChange={(e) => setAsr(e.target.value)}
                        className="w-full p-1.5 border rounded-lg"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-600 block">مغرب:</span>
                      <input
                        type="text"
                        value={maghrib}
                        onChange={(e) => setMaghrib(e.target.value)}
                        className="w-full p-1.5 border rounded-lg"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-600 block">عشاء:</span>
                      <input
                        type="text"
                        value={isha}
                        onChange={(e) => setIsha(e.target.value)}
                        className="w-full p-1.5 border rounded-lg"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-600 block">نماز جمعہ:</span>
                      <input
                        type="text"
                        value={jummah}
                        onChange={(e) => setJummah(e.target.value)}
                        className="w-full p-1.5 border rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-amber-950 block mb-1">
                      نماز عید الفطر وقت:
                    </label>
                    <input
                      type="text"
                      value={eidUlFitr}
                      onChange={(e) => setEidUlFitr(e.target.value)}
                      placeholder="07:15 AM"
                      className="w-full p-1.5 border rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-amber-950 block mb-1">
                      نماز عید الاضحیٰ وقت:
                    </label>
                    <input
                      type="text"
                      value={eidUlAdha}
                      onChange={(e) => setEidUlAdha(e.target.value)}
                      placeholder="07:00 AM"
                      className="w-full p-1.5 border rounded-lg bg-white"
                    />
                  </div>
                </div>

                {/* Password reset option for Mosque */}
                <div dir="ltr" lang="en" className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 font-sans text-left">
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    New Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={mosqueNewPass}
                    onChange={(e) => setMosqueNewPass(e.target.value)}
                    placeholder="Enter new password to update"
                    dir="ltr"
                    className="w-full p-2 rounded-xl border text-xs bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl shadow transition cursor-pointer text-xs flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>اوقاتِ نماز و معلومات محفوظ کریں</span>
                </button>
              </form>
            )}

            {/* 2. INSTITUTE EDIT FORM */}
            {entityType === 'institute' && (
              <form onSubmit={handleSaveInstituteSubmit} className="space-y-4 font-nastaliq text-right">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">ادارے کا نام:</label>
                    <input
                      type="text"
                      value={instName}
                      onChange={(e) => setInstName(e.target.value)}
                      className="w-full p-2 rounded-xl border text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">ہیڈ / پرنسپل کا نام:</label>
                    <input
                      type="text"
                      value={instHead}
                      onChange={(e) => setInstHead(e.target.value)}
                      className="w-full p-2 rounded-xl border text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">اسکول اوقات (Timing):</label>
                    <input
                      type="text"
                      value={instTiming}
                      onChange={(e) => setInstTiming(e.target.value)}
                      className="w-full p-2 rounded-xl border text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">کلاسز (Classes):</label>
                    <input
                      type="text"
                      value={instClasses}
                      onChange={(e) => setInstClasses(e.target.value)}
                      className="w-full p-2 rounded-xl border text-xs"
                    />
                  </div>
                </div>

                {/* Timetable Schedule Editor */}
                <div className="bg-stone-50 p-3 rounded-2xl border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800">روزانہ ٹائم ٹیبل و پیریڈز:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setTimetablePeriods((prev) => [
                          ...prev,
                          {
                            period: `پیریڈ ${prev.length + 1}`,
                            subject: 'نیا مضمون',
                            time: '08:00 AM',
                          },
                        ])
                      }
                      className="px-2 py-0.5 bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>پیریڈ شامل کریں</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {timetablePeriods.map((p, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-2 rounded-xl border flex items-center gap-1.5 text-xs"
                      >
                        <input
                          type="text"
                          value={p.period}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTimetablePeriods((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, period: val } : item))
                            );
                          }}
                          placeholder="پیریڈ"
                          className="w-20 p-1 border rounded"
                        />
                        <input
                          type="text"
                          value={p.subject}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTimetablePeriods((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, subject: val } : item))
                            );
                          }}
                          placeholder="مضمون"
                          className="flex-1 p-1 border rounded"
                        />
                        <input
                          type="text"
                          value={p.time}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTimetablePeriods((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, time: val } : item))
                            );
                          }}
                          placeholder="وقت"
                          className="w-24 p-1 border rounded"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setTimetablePeriods((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Password reset option for School */}
                <div dir="ltr" lang="en" className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 font-sans text-left">
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    New Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={instNewPass}
                    onChange={(e) => setInstNewPass(e.target.value)}
                    placeholder="Enter new password to update"
                    dir="ltr"
                    className="w-full p-2 rounded-xl border text-xs bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-2xl shadow transition cursor-pointer text-xs flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>اسکول ٹائم ٹیبل محفوظ کریں</span>
                </button>
              </form>
            )}

            {/* 3. HOSPITAL / CLINIC EDIT FORM */}
            {entityType === 'hospital' && (
              <form onSubmit={handleSaveHospitalSubmit} className="space-y-4 font-nastaliq text-right">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">سروس / ہسپتال کا نام:</label>
                    <input
                      type="text"
                      value={hospName}
                      onChange={(e) => setHospName(e.target.value)}
                      className="w-full p-2 rounded-xl border text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">ڈاکٹر / انچارج کا نام:</label>
                    <input
                      type="text"
                      value={hospDoctor}
                      onChange={(e) => setHospDoctor(e.target.value)}
                      className="w-full p-2 rounded-xl border text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">عمومی رابطہ نمبر:</label>
                    <input
                      type="text"
                      value={hospContact}
                      onChange={(e) => setHospContact(e.target.value)}
                      className="w-full p-2 rounded-xl border text-xs"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">ایمرجنسی فون نمبر:</label>
                    <input
                      type="text"
                      value={hospEmergencyPhone}
                      onChange={(e) => setHospEmergencyPhone(e.target.value)}
                      className="w-full p-2 rounded-xl border text-xs text-red-600 font-bold"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="bg-red-50 p-3 rounded-2xl border border-red-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-950">24 گھنٹے ایمرجنسی دستیابی:</span>
                    <button
                      type="button"
                      onClick={() => setHospIs24Hours((prev) => !prev)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        hospIs24Hours
                          ? 'bg-red-700 text-white shadow-sm'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {hospIs24Hours ? '✓ 24 گھنٹے الرٹ فعال' : 'بند / محدود اوقات'}
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">اوقاتِ کار (Timings):</label>
                    <input
                      type="text"
                      value={hospTiming}
                      onChange={(e) => setHospTiming(e.target.value)}
                      className="w-full p-2 rounded-xl border text-xs bg-white"
                      placeholder="مثلاً: 24 گھنٹے کھلی ہے یا صبح 8 تا شام 8"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    اہم سہولیات و ٹیسٹ (ہر لائن میں ایک سہولت لکھیں):
                  </label>
                  <textarea
                    rows={3}
                    value={hospServicesText}
                    onChange={(e) => setHospServicesText(e.target.value)}
                    className="w-full p-2 rounded-xl border text-xs leading-relaxed"
                  />
                </div>

                {/* Password reset option for Hospital */}
                <div dir="ltr" lang="en" className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 font-sans text-left">
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    New Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={hospNewPass}
                    onChange={(e) => setHospNewPass(e.target.value)}
                    placeholder="Enter new password to update"
                    dir="ltr"
                    className="w-full p-2 rounded-xl border text-xs bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-2xl shadow transition cursor-pointer text-xs flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>ہسپتال / ایمرجنسی تفصیلات محفوظ کریں</span>
                </button>
              </form>
            )}

            {/* 4. TRANSPORT EDIT FORM */}
            {entityType === 'transport' && (
              <form onSubmit={handleSaveTransportSubmit} className="space-y-4 font-nastaliq text-right">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">گاڑی کا عنوان:</label>
                    <input
                      type="text"
                      value={transTitle}
                      onChange={(e) => setTransTitle(e.target.value)}
                      className="w-full p-2 rounded-xl border text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">گاڑی کا نمبر:</label>
                    <input
                      type="text"
                      value={transVehicleNumber}
                      onChange={(e) => setTransVehicleNumber(e.target.value)}
                      className="w-full p-2 rounded-xl border text-xs font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">ڈرائیور کا نام:</label>
                    <input
                      type="text"
                      value={transDriverName}
                      onChange={(e) => setTransDriverName(e.target.value)}
                      className="w-full p-2 rounded-xl border text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">ڈرائیور موبائل نمبر:</label>
                    <input
                      type="text"
                      value={transDriverMobile}
                      onChange={(e) => setTransDriverMobile(e.target.value)}
                      className="w-full p-2 rounded-xl border text-xs"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">روانگی وقت:</label>
                    <input
                      type="text"
                      value={transDepartureTime}
                      onChange={(e) => setTransDepartureTime(e.target.value)}
                      placeholder="07:00 AM"
                      className="w-full p-2 rounded-xl border text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">آمد وقت:</label>
                    <input
                      type="text"
                      value={transArrivalTime}
                      onChange={(e) => setTransArrivalTime(e.target.value)}
                      placeholder="07:45 AM"
                      className="w-full p-2 rounded-xl border text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">کرایہ (Fare):</label>
                    <input
                      type="text"
                      value={transFare}
                      onChange={(e) => setTransFare(e.target.value)}
                      placeholder="80 روپے"
                      className="w-full p-2 rounded-xl border text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">روٹ کی تفصیل:</label>
                  <input
                    type="text"
                    value={transRoute}
                    onChange={(e) => setTransRoute(e.target.value)}
                    className="w-full p-2 rounded-xl border text-xs"
                  />
                </div>

                {/* Password reset option for Transport */}
                <div dir="ltr" lang="en" className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 font-sans text-left">
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    New Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={transNewPass}
                    onChange={(e) => setTransNewPass(e.target.value)}
                    placeholder="Enter new password to update"
                    dir="ltr"
                    className="w-full p-2 rounded-xl border text-xs bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl shadow transition cursor-pointer text-xs flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>گاڑی کے اوقات و کرایہ محفوظ کریں</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
