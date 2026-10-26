import { VillageProfile } from '../types';

export interface OperatingHoursStatus {
  isOpen: boolean;
  isOnBreak: boolean;
  statusTextUrdu: string;
  statusTextEnglish: string;
  color: 'emerald' | 'amber' | 'rose';
  dotClass: string;
  openingTime: string;
  closingTime: string;
  breakTime: string;
  spokenSummary: string;
}

// Category-specific default timings for village businesses
const categoryDefaultTimings: Record<
  string,
  { open: string; close: string; break: string }
> = {
  doctor: { open: '09:00 AM', close: '10:00 PM', break: '02:00 PM – 04:30 PM' },
  karyana: { open: '07:00 AM', close: '10:00 PM', break: '01:00 PM – 02:00 PM' },
  mistri: { open: '08:00 AM', close: '06:00 PM', break: '01:00 PM – 02:00 PM' },
  electrician: { open: '08:00 AM', close: '08:00 PM', break: '01:00 PM – 02:00 PM' },
  tailor: { open: '09:00 AM', close: '10:00 PM', break: '01:30 PM – 03:00 PM' },
  tractor: { open: '06:00 AM', close: '07:00 PM', break: '01:00 PM – 02:00 PM' },
  barber: { open: '09:00 AM', close: '11:00 PM', break: '01:30 PM – 03:00 PM' },
  plumber: { open: '08:00 AM', close: '07:00 PM', break: '01:00 PM – 02:00 PM' },
  welder: { open: '08:00 AM', close: '07:00 PM', break: '01:00 PM – 02:00 PM' },
  chakki: { open: '06:30 AM', close: '08:30 PM', break: '12:30 PM – 02:00 PM' },
  milk: { open: '06:00 AM', close: '08:00 PM', break: '12:00 PM – 02:00 PM' },
  driver: { open: '06:00 AM', close: '09:00 PM', break: '01:00 PM – 02:00 PM' },
  teacher: { open: '08:00 AM', close: '03:00 PM', break: '10:30 AM – 11:00 AM' },
  other: { open: '08:00 AM', close: '09:00 PM', break: '01:00 PM – 02:00 PM' },
};

/**
 * Converts a 12-hour time string (e.g. "08:00 AM" or "09:30 PM") into minutes from midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = (match[3] || '').toUpperCase();

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Gets current minutes from midnight in Pakistan Time (PKT, UTC+5)
 */
export function getCurrentPakistanMinutes(): number {
  try {
    const now = new Date();
    // Use Intl for Pakistan timezone
    const pktString = now.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Karachi',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    const [h, m] = pktString.split(':').map((num) => parseInt(num, 10));
    return h * 60 + m;
  } catch {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }
}

/**
 * Computes live operating status for any village profile/business card
 */
export function getProfileOperatingStatus(
  profile: Partial<VillageProfile>
): OperatingHoursStatus {
  const cat = profile.category || 'other';
  const defaults = categoryDefaultTimings[cat] || categoryDefaultTimings.other;

  const openingTime = profile.openingTime || defaults.open;
  const closingTime = profile.closingTime || defaults.close;
  const breakTime = profile.breakTime || defaults.break;

  if (profile.availability === 'closed') {
    return {
      isOpen: false,
      isOnBreak: false,
      statusTextUrdu: 'آج چھٹی / بند ہے',
      statusTextEnglish: 'Closed Today',
      color: 'rose',
      dotClass: 'bg-rose-500',
      openingTime,
      closingTime,
      breakTime,
      spokenSummary: `اوقاتِ کار صبح ${openingTime} سے ${closingTime} تک ہیں۔ فی الحال یہ کاروبار بند ہے۔`,
    };
  }

  const currentMinutes = getCurrentPakistanMinutes();
  const openMinutes = timeStringToMinutes(openingTime);
  const closeMinutes = timeStringToMinutes(closingTime);

  // Parse break hours: e.g. "01:00 PM – 02:00 PM"
  const breakParts = breakTime.split(/[–\-تاto]/i).map((s) => s.trim());
  let breakStart = 0;
  let breakEnd = 0;
  if (breakParts.length >= 2) {
    breakStart = timeStringToMinutes(breakParts[0]);
    breakEnd = timeStringToMinutes(breakParts[1]);
  }

  const isDuringBreak =
    breakStart > 0 &&
    breakEnd > breakStart &&
    currentMinutes >= breakStart &&
    currentMinutes < breakEnd;

  const isDuringOpen =
    currentMinutes >= openMinutes && currentMinutes < closeMinutes;

  if (isDuringBreak) {
    return {
      isOpen: false,
      isOnBreak: true,
      statusTextUrdu: 'دوپہر وقفہ / لنچ',
      statusTextEnglish: 'Break / Lunch',
      color: 'amber',
      dotClass: 'bg-amber-400 animate-pulse',
      openingTime,
      closingTime,
      breakTime,
      spokenSummary: `اوقاتِ کار صبح ${openingTime} سے شام ${closingTime} تک ہیں۔ ابھی دوپہر کے کھانے اور نماز کا وقفہ ہے جو ${breakTime} تک رہے گا۔`,
    };
  }

  if (isDuringOpen) {
    return {
      isOpen: true,
      isOnBreak: false,
      statusTextUrdu: 'ابھی کھلا ہے',
      statusTextEnglish: 'Open Now',
      color: 'emerald',
      dotClass: 'bg-emerald-500 animate-pulse',
      openingTime,
      closingTime,
      breakTime,
      spokenSummary: `اوقاتِ کار صبح ${openingTime} سے رات ${closingTime} تک ہیں۔ وقفہ ${breakTime} ہے۔ ابھی یہ کاروبار کھلا ہے۔`,
    };
  }

  return {
    isOpen: false,
    isOnBreak: false,
    statusTextUrdu: 'ابھی بند ہے',
    statusTextEnglish: 'Closed',
    color: 'rose',
    dotClass: 'bg-rose-500',
    openingTime,
    closingTime,
    breakTime,
    spokenSummary: `اوقاتِ کار صبح ${openingTime} سے رات ${closingTime} تک ہیں۔ وقفہ ${breakTime} ہے۔ فی الحال یہ کاروبار بند ہے۔`,
  };
}

/**
 * Computes live operating status for Virtual AI School
 */
export function getSchoolOperatingStatus(): OperatingHoursStatus {
  const openingTime = '08:00 AM';
  const closingTime = '02:00 PM';
  const breakTime = '10:30 AM – 11:00 AM';

  const currentMinutes = getCurrentPakistanMinutes();
  const openMinutes = timeStringToMinutes(openingTime);
  const closeMinutes = timeStringToMinutes(closingTime);
  const breakStart = timeStringToMinutes('10:30 AM');
  const breakEnd = timeStringToMinutes('11:00 AM');

  const isBreak = currentMinutes >= breakStart && currentMinutes < breakEnd;
  const isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;

  if (isBreak) {
    return {
      isOpen: false,
      isOnBreak: true,
      statusTextUrdu: 'تفریح / لنچ بریک',
      statusTextEnglish: 'Recess Break',
      color: 'amber',
      dotClass: 'bg-amber-400 animate-pulse',
      openingTime,
      closingTime,
      breakTime,
      spokenSummary: 'اسکول کا وقت صبح 8:00 سے دوپہر 2:00 بجے تک ہے۔ ابھی تفریح اور لنچ کا وقفہ ہے۔',
    };
  }

  if (isOpen) {
    return {
      isOpen: true,
      isOnBreak: false,
      statusTextUrdu: 'اسکول کھلا ہے',
      statusTextEnglish: 'School Open Now',
      color: 'emerald',
      dotClass: 'bg-emerald-500 animate-pulse',
      openingTime,
      closingTime,
      breakTime,
      spokenSummary: 'رتہ کلاں ورچوئل اسکول ابھی کھلا ہے۔ اسکول مددگار تدریس کے لیے حاضر ہے۔',
    };
  }

  return {
    isOpen: false,
    isOnBreak: false,
    statusTextUrdu: 'اسکول اوقات ختم (تعطیل)',
    statusTextEnglish: 'School Closed',
    color: 'rose',
    dotClass: 'bg-rose-500',
    openingTime,
    closingTime,
    breakTime,
    spokenSummary: 'اسکول کا تدریسی وقت صبح 8:00 سے دوپہر 2:00 بجے تک ہے۔ ہوم ورک اور سوال جواب کسی بھی وقت کیے جا سکتے ہیں۔',
  };
}
