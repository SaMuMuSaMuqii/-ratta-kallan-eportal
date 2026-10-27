import {
  db,
  storage,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  storageRef,
  uploadBytesResumable,
  getDownloadURL,
  isFirebaseConfigured,
} from './config';
import {
  VillageProfile,
  VillageNewsEvent,
  BannerSlideImageDoc,
  VillageAnnouncement,
  VillageMosque,
  VillageInstitute,
  VillageTransport,
  VillageHospital,
  VillageMessage,
  AdminAlertItem,
  RoleAssignmentDoc,
  AdminLogEntry,
  UserRoles,
  BannerBenefitPair,
  BannerBenefitsStripConfig,
} from '../types';
import {
  initialProfiles,
  initialAnnouncements,
  initialNewsEvents,
} from '../data/initialProfiles';
import {
  initialMosques,
  initialInstitutes,
  initialTransports,
  initialHospitals,
} from '../data/villageExtraData';
import { sanitizePublicProfile } from '../utils/privacySanitizer';

export const LOCAL_BANNER_IMAGES_DOCS_KEY = 'rk_banner_images_separate_docs_v1';
export const MAX_BANNER_IMAGE_BYTES = 80 * 1024; // 80 KB strict limit
export const LOCAL_DAILY_USAGE_KEY = 'rk_daily_firestore_usage_v1';
export const LOCAL_ADMIN_LOGS_KEY = 'rk_admin_audit_logs_v1';
export const LOCAL_ROLES_COLLECTION_KEY = 'rk_firestore_roles_collection_v1';
export const FREE_SPARK_DAILY_READ_LIMIT = 50000;
export const FREE_SPARK_DAILY_WRITE_LIMIT = 20000;

function getTodayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function recordFirestoreRead(count = 1): void {
  try {
    const raw = localStorage.getItem(LOCAL_DAILY_USAGE_KEY);
    const today = getTodayDateKey();
    const parsed = raw ? JSON.parse(raw) : { date: today, reads: 0, writes: 0 };
    if (parsed.date !== today) {
      localStorage.setItem(LOCAL_DAILY_USAGE_KEY, JSON.stringify({ date: today, reads: count, writes: 0 }));
    } else {
      parsed.reads = (parsed.reads || 0) + count;
      localStorage.setItem(LOCAL_DAILY_USAGE_KEY, JSON.stringify(parsed));
    }
  } catch {}
}

export function recordFirestoreWrite(count = 1): void {
  try {
    const raw = localStorage.getItem(LOCAL_DAILY_USAGE_KEY);
    const today = getTodayDateKey();
    const parsed = raw ? JSON.parse(raw) : { date: today, reads: 0, writes: 0 };
    if (parsed.date !== today) {
      localStorage.setItem(LOCAL_DAILY_USAGE_KEY, JSON.stringify({ date: today, reads: 0, writes: count }));
    } else {
      parsed.writes = (parsed.writes || 0) + count;
      localStorage.setItem(LOCAL_DAILY_USAGE_KEY, JSON.stringify(parsed));
    }
  } catch {}
}

export function getDailyFirestoreUsage(): {
  date: string;
  reads: number;
  writes: number;
  readLimit: number;
  writeLimit: number;
} {
  const today = getTodayDateKey();
  try {
    const raw = localStorage.getItem(LOCAL_DAILY_USAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        return {
          date: today,
          reads: parsed.reads || 0,
          writes: parsed.writes || 0,
          readLimit: FREE_SPARK_DAILY_READ_LIMIT,
          writeLimit: FREE_SPARK_DAILY_WRITE_LIMIT,
        };
      }
    }
  } catch {}
  return {
    date: today,
    reads: 18,
    writes: 2,
    readLimit: FREE_SPARK_DAILY_READ_LIMIT,
    writeLimit: FREE_SPARK_DAILY_WRITE_LIMIT,
  };
}

// Compress image on client device before upload (target < 300KB)
export async function compressImageFile(file: File, maxWidth = 1200, quality = 0.75): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const elem = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        elem.width = width;
        elem.height = height;
        const ctx = elem.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        ctx.canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else resolve(file);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Free-plan Banner Rule:
 * Compress each banner image on the phone to 400–800 px wide and strictly under 80 KB.
 * Returns a small dataUrl to be stored in a separate document (bannerImages/{eventId}),
 * never in Cloud Storage and never inside the newsEvents list document.
 */
export async function compressBannerImageToUnder80KB(
  file: File
): Promise<{ dataUrl: string; width: number; height: number; byteSize: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        // Clamp target width between 400 and 800 px
        let targetWidth = img.width;
        let targetHeight = img.height;
        if (targetWidth > 720) {
          targetHeight = Math.round((targetHeight * 720) / targetWidth);
          targetWidth = 720;
        } else if (targetWidth < 400 && targetWidth > 0) {
          targetHeight = Math.round((targetHeight * 400) / targetWidth);
          targetWidth = 400;
        }

        const canvas = document.createElement('canvas');
        let quality = 0.72;
        let currentW = targetWidth;
        let currentH = targetHeight;
        let dataUrl = '';
        let byteSize = 0;

        for (let attempt = 0; attempt < 6; attempt++) {
          canvas.width = currentW;
          canvas.height = currentH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
          }
          ctx.clearRect(0, 0, currentW, currentH);
          ctx.drawImage(img, 0, 0, currentW, currentH);
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          // Calculate actual binary byte size from base64 length
          const base64Part = dataUrl.split(',')[1] || '';
          byteSize = Math.ceil((base64Part.length * 3) / 4);

          if (byteSize <= MAX_BANNER_IMAGE_BYTES && dataUrl.length <= 108000) {
            break;
          }
          // Step down quality and width while keeping width >= 400 px
          quality = Math.max(0.35, quality - 0.12);
          if (currentW > 480) {
            currentH = Math.round((currentH * 480) / currentW);
            currentW = 480;
          } else if (currentW > 400) {
            currentH = Math.round((currentH * 400) / currentW);
            currentW = 400;
          }
        }

        resolve({
          dataUrl,
          width: currentW,
          height: currentH,
          byteSize,
        });
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Store a banner slide's compressed image in a separate document (`bannerImages/{eventId}`).
 */
export async function saveBannerSlideImageDoc(
  eventId: string,
  docData: BannerSlideImageDoc
): Promise<void> {
  if (docData.byteSize > MAX_BANNER_IMAGE_BYTES) {
    throw new Error('بینر تصویر کا سائز 80 KB سے کم ہونا لازمی ہے۔');
  }
  try {
    const raw = localStorage.getItem(LOCAL_BANNER_IMAGES_DOCS_KEY);
    const map: Record<string, BannerSlideImageDoc> = raw ? JSON.parse(raw) : {};
    map[eventId] = docData;
    localStorage.setItem(LOCAL_BANNER_IMAGES_DOCS_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Local banner doc save notice:', e);
  }

  if (isFirebaseConfigured()) {
    await setDoc(doc(db, 'bannerImages', eventId), docData, { merge: true });
  }
}

/**
 * Lazily load a single banner slide's separate image document (`bannerImages/{eventId}`).
 */
export async function getBannerSlideImageDoc(
  eventId: string
): Promise<BannerSlideImageDoc | null> {
  try {
    const raw = localStorage.getItem(LOCAL_BANNER_IMAGES_DOCS_KEY);
    if (raw) {
      const map: Record<string, BannerSlideImageDoc> = JSON.parse(raw);
      if (map[eventId]) return map[eventId];
    }
  } catch {}

  if (!isFirebaseConfigured()) return null;
  try {
    const snap = await getDoc(doc(db, 'bannerImages', eventId));
    if (snap.exists()) {
      const data = snap.data() as BannerSlideImageDoc;
      try {
        const raw = localStorage.getItem(LOCAL_BANNER_IMAGES_DOCS_KEY);
        const map: Record<string, BannerSlideImageDoc> = raw ? JSON.parse(raw) : {};
        map[eventId] = data;
        localStorage.setItem(LOCAL_BANNER_IMAGES_DOCS_KEY, JSON.stringify(map));
      } catch {}
      return data;
    }
  } catch (e) {
    console.warn('Lazy load banner image notice:', e);
  }
  return null;
}

/**
 * Remove a banner slide's separate image document (`bannerImages/{eventId}`).
 */
export async function deleteBannerSlideImageDoc(eventId: string): Promise<void> {
  try {
    const raw = localStorage.getItem(LOCAL_BANNER_IMAGES_DOCS_KEY);
    if (raw) {
      const map: Record<string, BannerSlideImageDoc> = JSON.parse(raw);
      delete map[eventId];
      localStorage.setItem(LOCAL_BANNER_IMAGES_DOCS_KEY, JSON.stringify(map));
    }
  } catch {}

  if (isFirebaseConfigured()) {
    try {
      await deleteDoc(doc(db, 'bannerImages', eventId));
    } catch (e) {
      console.warn('Delete banner image doc notice:', e);
    }
  }
}

// Upload file to Firebase Storage with progress tracking
export function uploadFileWithProgress(
  file: File | Blob,
  path: string,
  onProgress?: (progressPercent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isFirebaseConfigured()) {
      // In local demo mode, create local object URL
      const localUrl = URL.createObjectURL(file);
      if (onProgress) onProgress(100);
      resolve(localUrl);
      return;
    }

    const fileRef = storageRef(storage, path);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.error('Storage upload error:', error);
        reject(error);
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadUrl);
      }
    );
  });
}

// ================= REAL-TIME FIRESTORE SUBSCRIBERS =================

export function subscribeProfiles(onUpdate: (profiles: VillageProfile[]) => void): () => void {
  if (!isFirebaseConfigured()) {
    return () => {};
  }
  const q = collection(db, 'profiles');
  return onSnapshot(
    q,
    (snapshot) => {
      const list: VillageProfile[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as VillageProfile), id: docSnap.id });
      });
      if (list.length > 0) {
        onUpdate(list);
      }
    },
    (err) => console.warn('Profiles sync notice:', err)
  );
}

export function subscribeNewsEvents(onUpdate: (news: VillageNewsEvent[]) => void): () => void {
  if (!isFirebaseConfigured()) return () => {};
  const q = collection(db, 'newsEvents');
  return onSnapshot(
    q,
    (snapshot) => {
      const list: VillageNewsEvent[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as VillageNewsEvent), id: docSnap.id });
      });
      if (list.length > 0) onUpdate(list);
    },
    (err) => console.warn('News sync notice:', err)
  );
}

export function subscribeAnnouncements(onUpdate: (items: VillageAnnouncement[]) => void): () => void {
  if (!isFirebaseConfigured()) return () => {};
  const q = collection(db, 'announcements');
  return onSnapshot(
    q,
    (snapshot) => {
      const list: VillageAnnouncement[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as VillageAnnouncement), id: docSnap.id });
      });
      if (list.length > 0) onUpdate(list);
    },
    (err) => console.warn('Announcements sync notice:', err)
  );
}

export function subscribeMosques(onUpdate: (mosques: VillageMosque[]) => void): () => void {
  if (!isFirebaseConfigured()) return () => {};
  const q = collection(db, 'mosques');
  return onSnapshot(
    q,
    (snapshot) => {
      const list: VillageMosque[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as VillageMosque), id: docSnap.id });
      });
      if (list.length > 0) onUpdate(list);
    },
    (err) => console.warn('Mosques sync notice:', err)
  );
}

export function subscribeInstitutes(onUpdate: (institutes: VillageInstitute[]) => void): () => void {
  if (!isFirebaseConfigured()) return () => {};
  const q = collection(db, 'institutes');
  return onSnapshot(
    q,
    (snapshot) => {
      const list: VillageInstitute[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as VillageInstitute), id: docSnap.id });
      });
      if (list.length > 0) onUpdate(list);
    },
    (err) => console.warn('Institutes sync notice:', err)
  );
}

export function subscribeTransports(onUpdate: (transports: VillageTransport[]) => void): () => void {
  if (!isFirebaseConfigured()) return () => {};
  const q = collection(db, 'transports');
  return onSnapshot(
    q,
    (snapshot) => {
      const list: VillageTransport[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as VillageTransport), id: docSnap.id });
      });
      if (list.length > 0) onUpdate(list);
    },
    (err) => console.warn('Transports sync notice:', err)
  );
}

export function subscribeHospitals(onUpdate: (hospitals: VillageHospital[]) => void): () => void {
  if (!isFirebaseConfigured()) return () => {};
  const q = collection(db, 'hospitals');
  return onSnapshot(
    q,
    (snapshot) => {
      const list: VillageHospital[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as VillageHospital), id: docSnap.id });
      });
      if (list.length > 0) onUpdate(list);
    },
    (err) => console.warn('Hospitals sync notice:', err)
  );
}

export function subscribeMessages(onUpdate: (messages: VillageMessage[]) => void): () => void {
  if (!isFirebaseConfigured()) return () => {};
  const q = collection(db, 'messages');
  return onSnapshot(
    q,
    (snapshot) => {
      const list: VillageMessage[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as VillageMessage), id: docSnap.id });
      });
      onUpdate(list);
    },
    (err) => console.warn('Messages sync notice:', err)
  );
}

export function subscribeAlerts(onUpdate: (alerts: AdminAlertItem[]) => void): () => void {
  if (!isFirebaseConfigured()) return () => {};
  const q = collection(db, 'adminAlerts');
  return onSnapshot(
    q,
    (snapshot) => {
      const list: AdminAlertItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as AdminAlertItem), id: docSnap.id });
      });
      onUpdate(list);
    },
    (err) => console.warn('Alerts sync notice:', err)
  );
}

// ================= ROLES ("roles" collection) & ADMIN LOG ("ایڈمن لاگ") =================

export function getLocalRolesCollection(): Record<string, RoleAssignmentDoc> {
  try {
    const raw = localStorage.getItem(LOCAL_ROLES_COLLECTION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export async function fetchUserRolesDoc(uidOrEmail: string): Promise<RoleAssignmentDoc | null> {
  if (!uidOrEmail) return null;
  const cleanKey = uidOrEmail.trim().toLowerCase();
  recordFirestoreRead(1);

  try {
    const map = getLocalRolesCollection();
    if (map[uidOrEmail]) return map[uidOrEmail];
    if (map[cleanKey]) return map[cleanKey];
    const byEmail = Object.values(map).find(
      (r) => (r.email || '').trim().toLowerCase() === cleanKey || (r.uid || '').trim() === uidOrEmail.trim()
    );
    if (byEmail) return byEmail;
  } catch {}

  if (!isFirebaseConfigured()) return null;
  try {
    const snap = await getDoc(doc(db, 'roles', uidOrEmail.trim()));
    if (snap.exists()) {
      return snap.data() as RoleAssignmentDoc;
    }
  } catch (e) {
    console.warn('Fetch user roles doc notice:', e);
  }
  return null;
}

export async function saveRoleAssignmentToFirestore(roleDoc: RoleAssignmentDoc): Promise<void> {
  recordFirestoreWrite(1);
  try {
    const map = getLocalRolesCollection();
    map[roleDoc.uid] = roleDoc;
    if (roleDoc.email) {
      map[roleDoc.email.trim().toLowerCase()] = roleDoc;
    }
    localStorage.setItem(LOCAL_ROLES_COLLECTION_KEY, JSON.stringify(map));
  } catch {}

  if (isFirebaseConfigured()) {
    await setDoc(doc(db, 'roles', roleDoc.uid), roleDoc, { merge: true });
  }
}

export async function deleteRoleAssignmentFromFirestore(uidOrEmail: string): Promise<void> {
  recordFirestoreWrite(1);
  try {
    const map = getLocalRolesCollection();
    delete map[uidOrEmail];
    delete map[uidOrEmail.trim().toLowerCase()];
    localStorage.setItem(LOCAL_ROLES_COLLECTION_KEY, JSON.stringify(map));
  } catch {}

  if (isFirebaseConfigured()) {
    await deleteDoc(doc(db, 'roles', uidOrEmail));
  }
}

export function loadAdminLogs(): AdminLogEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_ADMIN_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export async function appendAdminLogEntry(
  entry: Omit<AdminLogEntry, 'id' | 'timestamp'>
): Promise<AdminLogEntry> {
  const fullEntry: AdminLogEntry = {
    ...entry,
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
  };
  recordFirestoreWrite(1);
  try {
    const existing = loadAdminLogs();
    const updated = [fullEntry, ...existing].slice(0, 200);
    localStorage.setItem(LOCAL_ADMIN_LOGS_KEY, JSON.stringify(updated));
  } catch {}

  if (isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, 'adminLogs', fullEntry.id), fullEntry);
    } catch (e) {
      console.warn('Admin log write notice:', e);
    }
  }
  return fullEntry;
}

// ================= FIRESTORE WRITE OPERATIONS =================

export async function saveProfileToFirestore(profile: VillageProfile): Promise<void> {
  recordFirestoreWrite(1);
  if (!isFirebaseConfigured()) return;
  // Strictly strip email, username, and password from public profiles collection
  const publicSafeProfile = sanitizePublicProfile(profile);
  const docRef = doc(db, 'profiles', publicSafeProfile.id);
  await setDoc(docRef, publicSafeProfile, { merge: true });

  // Store private email/username (never password!) in profilePrivate/{uid} if owner exists
  if (profile.ownerUid && (profile.email || profile.username)) {
    const privateDocRef = doc(db, 'profilePrivate', profile.ownerUid);
    await setDoc(
      privateDocRef,
      {
        ownerUid: profile.ownerUid,
        profileId: profile.id,
        email: profile.email || '',
        username: profile.username || '',
        bloodGroup: profile.bloodGroup || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }
}

export async function deleteProfileFromFirestore(profileId: string): Promise<void> {
  recordFirestoreWrite(1);
  if (!isFirebaseConfigured()) return;
  const docRef = doc(db, 'profiles', profileId);
  await deleteDoc(docRef);
}

export async function saveMessageToFirestore(message: VillageMessage): Promise<void> {
  recordFirestoreWrite(1);
  if (!isFirebaseConfigured()) return;
  const docRef = doc(db, 'messages', message.id);
  await setDoc(docRef, message, { merge: true });
}

export async function deleteMessageFromFirestore(messageId: string): Promise<void> {
  recordFirestoreWrite(1);
  if (!isFirebaseConfigured()) return;
  const docRef = doc(db, 'messages', messageId);
  await deleteDoc(docRef);
}

export const LOCAL_BANNER_BENEFITS_STRIP_KEY = 'rk_banner_benefits_strip_v1';

export const DEFAULT_BANNER_BENEFIT_PAIRS: BannerBenefitPair[] = [
  {
    id: 'pair-1',
    useUrdu: 'استعمال: گاؤں کے مستری، مزدور، دکاندار اور ڈاکٹر ایک جگہ تلاش کریں۔',
    benefitUrdu: 'فائدہ: روزگار اور کام گھر بیٹھے ملتا ہے۔',
    isHidden: false,
  },
  {
    id: 'pair-2',
    useUrdu: 'استعمال: مسجد، اسکول، ہسپتال اور گاڑیوں کے اوقات دیکھیں۔',
    benefitUrdu: 'فائدہ: وقت اور پیسہ بچتا ہے۔',
    isHidden: false,
  },
  {
    id: 'pair-3',
    useUrdu: 'استعمال: بول کر سوال پوچھیں، لکھنا ضروری نہیں۔',
    benefitUrdu: 'فائدہ: ان پڑھ بھائی بہن بھی آسانی سے استعمال کر سکتے ہیں۔',
    isHidden: false,
  },
  {
    id: 'pair-4',
    useUrdu: 'استعمال: خبریں، ہنگامی نمبر اور مفت آن لائن اسکول۔',
    benefitUrdu: 'فائدہ: پورا پورٹل بالکل مفت ہے۔',
    isHidden: false,
  },
];

export function getDefaultBannerBenefitsStripConfig(): BannerBenefitsStripConfig {
  return {
    hideAll: false,
    pairs: DEFAULT_BANNER_BENEFIT_PAIRS.map((p) => ({ ...p })),
    updatedAt: new Date().toISOString(),
  };
}

export function loadBannerBenefitsStripConfigSync(): BannerBenefitsStripConfig {
  try {
    const raw = localStorage.getItem(LOCAL_BANNER_BENEFITS_STRIP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BannerBenefitsStripConfig;
      if (parsed && Array.isArray(parsed.pairs) && parsed.pairs.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return getDefaultBannerBenefitsStripConfig();
}

export async function loadBannerBenefitsStripConfig(): Promise<BannerBenefitsStripConfig> {
  const localFallback = loadBannerBenefitsStripConfigSync();
  if (!isFirebaseConfigured()) return localFallback;
  try {
    recordFirestoreRead(1);
    const snap = await getDoc(doc(db, 'settings', 'bannerBenefitsStrip'));
    if (snap.exists()) {
      const data = snap.data() as BannerBenefitsStripConfig;
      if (data && Array.isArray(data.pairs) && data.pairs.length > 0) {
        try {
          localStorage.setItem(LOCAL_BANNER_BENEFITS_STRIP_KEY, JSON.stringify(data));
        } catch {}
        return data;
      }
    }
  } catch (e) {
    console.warn('Fallback to local banner benefits strip config:', e);
  }
  return localFallback;
}

export async function saveBannerBenefitsStripConfig(
  config: BannerBenefitsStripConfig
): Promise<void> {
  const payload: BannerBenefitsStripConfig = {
    hideAll: Boolean(config.hideAll),
    pairs:
      Array.isArray(config.pairs) && config.pairs.length > 0
        ? config.pairs
        : DEFAULT_BANNER_BENEFIT_PAIRS.map((p) => ({ ...p })),
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(LOCAL_BANNER_BENEFITS_STRIP_KEY, JSON.stringify(payload));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rk-banner-benefits-updated', { detail: payload }));
    }
  } catch {}
  if (!isFirebaseConfigured()) return;
  try {
    recordFirestoreWrite(1);
    await setDoc(doc(db, 'settings', 'bannerBenefitsStrip'), payload, { merge: true });
  } catch (e) {
    console.warn('Error saving bannerBenefitsStrip to Firestore settings:', e);
  }
}

export async function saveNewsEventToFirestore(news: VillageNewsEvent): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const docRef = doc(db, 'newsEvents', news.id);
  await setDoc(docRef, news, { merge: true });
}

export async function deleteNewsEventFromFirestore(newsId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const docRef = doc(db, 'newsEvents', newsId);
  await deleteDoc(docRef);
}

export async function saveMosqueToFirestore(mosque: VillageMosque): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const docRef = doc(db, 'mosques', mosque.id);
  await setDoc(docRef, mosque, { merge: true });
}

export async function deleteMosqueFromFirestore(mosqueId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const docRef = doc(db, 'mosques', mosqueId);
  await deleteDoc(docRef);
}

export async function saveInstituteToFirestore(institute: VillageInstitute): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const docRef = doc(db, 'institutes', institute.id);
  await setDoc(docRef, institute, { merge: true });
}

export async function deleteInstituteFromFirestore(instId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const docRef = doc(db, 'institutes', instId);
  await deleteDoc(docRef);
}

export async function saveTransportToFirestore(transport: VillageTransport): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const docRef = doc(db, 'transports', transport.id);
  await setDoc(docRef, transport, { merge: true });
}

export async function deleteTransportFromFirestore(transId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const docRef = doc(db, 'transports', transId);
  await deleteDoc(docRef);
}

export async function saveHospitalToFirestore(hospital: VillageHospital): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const docRef = doc(db, 'hospitals', hospital.id);
  await setDoc(docRef, hospital, { merge: true });
}

export async function deleteHospitalFromFirestore(hospId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const docRef = doc(db, 'hospitals', hospId);
  await deleteDoc(docRef);
}

// Student Progress & Stars Persistence
export async function saveStudentProgressToFirestore(student: {
  id: string;
  name: string;
  grade: string;
  stars?: number;
  rollNumber?: string;
  fatherName?: string;
  villageName?: string;
  avatarIcon?: string;
  enrolledAt?: string;
  lastActive?: string;
}): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const docRef = doc(db, 'studentProgress', student.id);
  await setDoc(docRef, student, { merge: true });
}

export async function loadStudentProgressFromFirestore(studentId: string): Promise<any | null> {
  if (!isFirebaseConfigured()) return null;
  const docRef = doc(db, 'studentProgress', studentId);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
}

// ================= ONE-TIME STARTER DATA IMPORT =================

export async function importStarterDataToFirestore(): Promise<{ count: number; error?: string }> {
  if (!isFirebaseConfigured()) {
    return { count: 0, error: 'Firebase is not yet configured. Please set environment variables in .env' };
  }

  try {
    let count = 0;

    // 1. Profiles
    for (const p of initialProfiles) {
      await setDoc(doc(db, 'profiles', p.id), p, { merge: true });
      count++;
    }

    // 2. Mosques
    for (const m of initialMosques) {
      await setDoc(doc(db, 'mosques', m.id), m, { merge: true });
      count++;
    }

    // 3. Institutes
    for (const inst of initialInstitutes) {
      await setDoc(doc(db, 'institutes', inst.id), inst, { merge: true });
      count++;
    }

    // 4. Transports
    for (const tr of initialTransports) {
      await setDoc(doc(db, 'transports', tr.id), tr, { merge: true });
      count++;
    }

    // 5. Hospitals
    for (const h of initialHospitals) {
      await setDoc(doc(db, 'hospitals', h.id), h, { merge: true });
      count++;
    }

    // 6. News Events
    for (const n of initialNewsEvents) {
      await setDoc(doc(db, 'newsEvents', n.id), n, { merge: true });
      count++;
    }

    // 7. Announcements
    for (const a of initialAnnouncements) {
      await setDoc(doc(db, 'announcements', a.id), a, { merge: true });
      count++;
    }

    return { count };
  } catch (err: any) {
    console.error('Import starter data error:', err);
    return { count: 0, error: err.message || 'Error importing starter data' };
  }
}

// ================= BACKUP EXPORT & RESTORE (JSON) =================

export async function exportDatabaseBackupJSON(): Promise<string> {
  const backupData: Record<string, any> = {};

  if (!isFirebaseConfigured()) {
    // Export current local data snapshot
    backupData.profiles = initialProfiles;
    backupData.mosques = initialMosques;
    backupData.institutes = initialInstitutes;
    backupData.transports = initialTransports;
    backupData.hospitals = initialHospitals;
    backupData.newsEvents = initialNewsEvents;
    backupData.announcements = initialAnnouncements;
    backupData.exportedAt = new Date().toISOString();
    return JSON.stringify(backupData, null, 2);
  }

  const collectionsToExport = [
    'profiles',
    'mosques',
    'institutes',
    'transports',
    'hospitals',
    'newsEvents',
    'announcements',
    'messages',
    'helpRequests',
  ];

  for (const colName of collectionsToExport) {
    try {
      const snap = await getDocs(collection(db, colName));
      const items: any[] = [];
      snap.forEach((d) => items.push({ ...d.data(), id: d.id }));
      backupData[colName] = items;
    } catch (e) {
      console.warn(`Export skipping collection ${colName}:`, e);
    }
  }

  backupData.exportedAt = new Date().toISOString();
  return JSON.stringify(backupData, null, 2);
}

export async function restoreDatabaseBackupJSON(jsonString: string): Promise<{ restored: number; error?: string }> {
  try {
    const data = JSON.parse(jsonString);
    let count = 0;

    const collections = [
      'profiles',
      'mosques',
      'institutes',
      'transports',
      'hospitals',
      'newsEvents',
      'announcements',
    ];

    for (const col of collections) {
      if (Array.isArray(data[col])) {
        for (const item of data[col]) {
          if (item && item.id && isFirebaseConfigured()) {
            await setDoc(doc(db, col, item.id), item, { merge: true });
            count++;
          }
        }
      }
    }

    return { restored: count };
  } catch (err: any) {
    return { restored: 0, error: err.message || 'Invalid JSON format' };
  }
}
