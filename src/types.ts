export type Language = 'ur' | 'pa' | 'en';

export interface VillageProfile {
  id: string;
  name: string;
  fatherName?: string;
  businessName: string;
  category:
    | 'electrician'
    | 'mistri'
    | 'tractor'
    | 'doctor'
    | 'karyana'
    | 'tailor'
    | 'milk'
    | 'plumber'
    | 'driver'
    | 'teacher'
    | 'welder'
    | 'barber'
    | 'chakki'
    | 'laborer'
    | 'mechanic'
    | 'agri'
    | 'sweets'
    | 'other';
  customCategory?: string;
  isAvailableForWorkToday?: boolean; // 'آج کام کے لیے دستیاب ہوں' switch for daily wage workers
  mobile: string;
  whatsapp?: string;
  address: string; // Mohalla / Dera / Dhani / Street
  village?: string; // Default: 'Ratta Kallan, Jhang' (رتہ کلاں جھنگ)
  locationMapUrl?: string; // Google maps link or lat,lng
  locationLandmark?: string; // e.g. نزد پرانی عیدگاہ، رتہ کلاں
  services: string[]; // e.g. ["ٹیوب ویل بورنگ", "موٹر وائنڈنگ"]
  personImage?: string; // base64 or URL
  businessImage?: string; // base64 or URL
  chargesDescription?: string; // e.g. "دیہاڑی 1500 روپے، یا وزٹ فیس 300 روپے"
  availability?: 'available' | 'on_call' | 'busy' | 'closed';
  openingTime?: string; // e.g. "08:00 AM"
  closingTime?: string; // e.g. "09:00 PM"
  breakTime?: string; // e.g. "01:00 PM – 02:00 PM"
  addedByName?: string; // Self or relative/friend
  addedByPhone?: string;
  termsAccepted: boolean;
  isVerified?: boolean;
  isApproved?: boolean; // Admin approval state
  isHidden?: boolean; // Admin hide toggle
  isReported?: boolean; // Reported profile flag
  reportReason?: string;
  isDisabled?: boolean; // Account disabled by admin
  ownerUid?: string; // Firebase Auth UID of profile owner
  isBloodDonor?: boolean; // Donor switch (blood group shown only to signed-in users when ON)
  bloodGroup?: string;
  voiceNoteUrl?: string;
  createdAt: string;
  username?: string; // Private owner login ID (never stored in public index/cache)
  password?: string; // Never stored in public cache or Firestore
  email?: string; // Private owner email (never stored in public index/cache)
}

export type PortalRoleKey =
  | 'admin'
  | 'alertManager'
  | 'mosqueEditor'
  | 'schoolEditor'
  | 'hospitalEditor'
  | 'transportEditor';

export interface UserRoles {
  admin?: boolean;
  isTrustedBackupAdmin?: boolean; // Second trusted admin option so one lost account does not stop the portal
  alertManager?: boolean;
  mosqueEditor?: boolean;
  schoolEditor?: boolean;
  hospitalEditor?: boolean;
  transportEditor?: boolean;
  disabled?: boolean;
}

export interface RoleAssignmentDoc extends UserRoles {
  uid: string;
  email: string;
  name?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface AdminLogEntry {
  id: string;
  adminEmail: string;
  adminName: string;
  actionType:
    | 'delete_profile'
    | 'hide_item'
    | 'approve_item'
    | 'edit_item'
    | 'delete_item'
    | 'send_flood_alert'
    | 'change_banner'
    | 'manage_role'
    | 'disable_account'
    | 'read_reported_message';
  actionUrdu: string;
  targetId?: string;
  targetTitle: string;
  timestamp: string;
}

export interface MandiRateItem {
  id: string;
  cropNameUrdu: string;
  cropNameEn: string;
  rateText: string; // e.g. "3,950 روپے فی من (40 کلو)"
  marketName: string; // e.g. "غلہ منڈی جھنگ / رتہ کلاں"
  updatedAt: string;
  isHidden?: boolean;
}

export interface ShelterItem {
  id: string;
  name: string;
  location: string;
  capacityText: string;
  contactPerson: string;
  contactPhone: string;
  isOpenNow: boolean;
  updatedAt: string;
  isHidden?: boolean;
}

export interface HelpGuideItem {
  id: string;
  questionUrdu: string;
  keywords: string[];
  stepsUrdu: string[];
  buttonToTap: string;
  updatedAt: string;
  isHidden?: boolean;
}

export interface CustomSearchKeywordItem {
  id: string;
  categoryNameUrdu: string;
  categoryKey: string;
  keywords: string[];
  updatedAt: string;
}

export interface FloodAlertStatus {
  level: 'normal' | 'watch' | 'warning' | 'danger';
  levelUrdu: string;
  messageUrdu: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AuthUserSession {
  type: 'admin' | 'profile_owner' | 'user';
  id: string; // profile id or user uid
  uid?: string; // Firebase Auth UID
  username: string;
  name: string;
  email?: string;
  mobile?: string;
  profileId?: string;
  avatar?: string;
  loginTime: string;
  roles?: UserRoles;
}

export interface ChatDiscussionItem {
  id: string;
  senderRole: 'sender' | 'receiver' | 'admin';
  senderName: string;
  senderMobile?: string;
  text: string;
  audioData?: string;
  audioDurationSeconds?: number;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'video' | 'file';
  timestamp: string;
}

export interface VillageMessage {
  id: string;
  targetProfileId: string;
  targetProfileName: string;
  targetMobile: string;
  senderUid?: string;
  recipientUid?: string;
  senderProfileId?: string;
  senderUsername?: string;
  senderName: string;
  senderMobile: string;
  messageText: string;
  audioData?: string; // base64 audio data for voice message
  audioDurationSeconds?: number;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'video' | 'file';
  inquiryType: 'charges' | 'availability' | 'urgent_work' | 'general';
  createdAt: string;
  isRead: boolean;
  isReported?: boolean; // Admin can read a private message ONLY when it was reported
  reportedAt?: string;
  reportedBy?: string;
  reportReason?: string;
  replyText?: string;
  replyCreatedAt?: string;
  discussionThread?: ChatDiscussionItem[]; // 2-way confidential discussion thread
  deletedBySender?: boolean;
  deletedByRecipient?: boolean;
  deletedAt?: string;
  deletedByRole?: string;
}

export interface DeletedMessageArchiveItem {
  id: string;
  originalMessageId: string;
  targetProfileId: string;
  targetProfileName: string;
  targetMobile: string;
  senderProfileId?: string;
  senderName: string;
  senderMobile: string;
  messageText: string;
  audioData?: string;
  audioDurationSeconds?: number;
  discussionThread?: ChatDiscussionItem[];
  deletedAt: string;
  deletedBy: string;
  deletedByRole: 'sender' | 'receiver' | 'admin';
  originalCreatedAt: string;
}

export type EventCategory =
  | 'janaza'
  | 'shadi'
  | 'bijli_pani'
  | 'medical'
  | 'sports'
  | 'panchayat'
  | 'general';

export interface VillageNewsEvent {
  id: string;
  title: string;
  category: EventCategory;
  content: string;
  date: string;
  time?: string;
  location: string;
  imageUrl?: string;
  hasBannerImage?: boolean; // True when a compressed <80KB image doc exists in bannerImages/{id}
  skipBannerImage?: boolean; // True when admin chose "بغیر تصویر (Skip)" — shows Urdu text on coloured background
  isPopupOnLaunch: boolean;
  isHidden?: boolean;
  isApproved?: boolean;
  voiceAudioText?: string;
  author: string; // Admin / Section Role
  createdAt: string;
}

export interface BannerSlideImageDoc {
  eventId: string;
  imageData: string; // Compressed JPEG data URL (< 80 KB, 400-800 px wide)
  width: number;
  height: number;
  byteSize: number;
  updatedAt: string;
}

export interface VillageAnnouncement {
  id: string;
  title: string;
  content: string;
  voiceAudioText?: string;
  author: string;
  date: string;
  isImportant?: boolean;
  isHidden?: boolean;
  isApproved?: boolean;
}

export interface VillageMosque {
  id: string;
  name: string;
  imamName: string;
  moazzinName?: string;
  contact?: string;
  contactNumber?: string;
  location: string;
  mapUrl?: string;
  image?: string;
  prayerTimes: {
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    jummah: string;
  };
  eidUlFitrTime?: string; // عید الفطر / عید شوال نماز وقت
  eidUlAdhaTime?: string; // عید الاضحیٰ نماز وقت
  features?: string[];
  isHidden?: boolean;
  isApproved?: boolean;
  username?: string;
  password?: string;
  lastUpdated?: string;
}

export interface VillageInstitute {
  id: string;
  name: string;
  type: 'school' | 'college' | 'madrasa' | 'tuition';
  headName: string;
  contact?: string;
  contactNumber?: string;
  location: string;
  mapUrl?: string;
  image?: string;
  classesOffered: string;
  timing: string;
  timetableSchedule?: {
    period: string;
    subject: string;
    time: string;
    teacher?: string;
  }[];
  isHidden?: boolean;
  isApproved?: boolean;
  username?: string;
  password?: string;
  lastUpdated?: string;
}

export interface VillageTransport {
  id: string;
  vehicleNumber: string; // e.g. "JHG-4820"
  vehicleType: 'hiace' | 'bus' | 'rickshaw' | 'bolan';
  title: string; // e.g. "رتہ کلاں تا جھنگ اڈا ہائیس وین"
  driverName: string;
  driverMobile: string;
  image: string;
  departureTime: string; // e.g. "صبح 7:00 بجے"
  arrivalTime: string; // e.g. "صبح 7:45 بجے"
  fare: string; // e.g. "80 روپے"
  route: string; // "رتہ کلاں ➔ ایوب چوک ➔ جھنگ سٹی لاری اڈا"
  stopsSchedule: {
    stopName: string;
    time: string;
  }[];
  isHidden?: boolean;
  isApproved?: boolean;
  username?: string;
  password?: string;
  lastUpdated?: string;
}

export interface VillageHospital {
  id: string;
  name: string;
  category: 'hospital' | 'rhc' | 'ambulance' | 'clinic' | 'pharmacy';
  categoryUrdu: string;
  contact: string;
  contactPhone?: string;
  emergencyPhone?: string;
  address: string;
  distance: string; // e.g. "گاؤں کے اندر" or "18 کلومیٹر جھنگ سٹی"
  timing: string; // e.g. "24 گھنٹے ایمرجنسی کھلی ہے"
  doctorInCharge?: string;
  services: string[];
  facilities?: string[];
  image: string;
  mapUrl?: string;
  is24Hours: boolean;
  isHidden?: boolean;
  isApproved?: boolean;
  username?: string;
  password?: string;
  lastUpdated?: string;
}

// AI Village School Types
export type SubjectKey =
  | 'math'
  | 'english'
  | 'urdu'
  | 'islamiyat'
  | 'bio'
  | 'chemistry'
  | 'pak_studies'
  | 'physics'
  | 'arabic'
  | 'general';

export interface AiTeacher {
  id: SubjectKey;
  subjectNameUrdu: string;
  subjectNameEnglish: string;
  teacherName: string;
  avatar: string;
  qualification: string;
  greeting: string;
  welcomeVoice: string;
  dailyHomework: {
    title: string;
    task: string;
    exampleSolution: string;
    gradeLevel: string;
  };
  quickLessons: {
    title: string;
    summary: string;
    fullExplanation?: string;
  }[];
}

export interface AiSchoolStudent {
  id: string; // generated roll number / school ID e.g. "RK-2026-4921"
  name: string; // بچے کا نام
  fatherName: string; // والد کا نام
  grade?: string; // کلاس / جماعت
  registeredAt?: string;
  phone?: string;
  completedHomeworkCount?: number;
  stars?: number;
  rollNumber?: string;
  classGrade?: string;
  admissionDate?: string;
  completedHomework?: string[];
  photo?: string;
}

export interface AdminAlertItem {
  id: string;
  type: 'violation_report' | 'new_registration' | 'reported_message';
  title: string;
  details: string;
  targetProfileId?: string;
  targetProfileName?: string;
  targetMessageId?: string;
  reporterPhone?: string;
  reporterName?: string;
  createdAt: string;
  isResolved?: boolean;
}

