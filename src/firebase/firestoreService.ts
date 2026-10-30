import {
  db,
  auth,
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
  PortalNotificationItem,
  UserNotificationSettings,
  PushSubscriptionDoc,
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
export interface BannerCropOptions {
  aspectRatio?: '16:9' | '21:9' | '4:3' | 'auto';
  focalX?: number; // 0-100 (default 50)
  focalY?: number; // 0-100 (default 50)
  zoom?: number; // 1.0 - 2.0 (default 1.0)
  isMobileVariant?: boolean;
}

/**
 * Crop (without stretching or distorting) and compress a banner image (File or dataUrl)
 * to 400–800 px wide and strictly under 80 KB.
 */
export async function cropAndCompressBannerImage(
  source: File | string,
  options: BannerCropOptions = {}
): Promise<{
  dataUrl: string;
  width: number;
  height: number;
  byteSize: number;
  originalWidth: number;
  originalHeight: number;
}> {
  return new Promise((resolve, reject) => {
    const loadImg = (srcUrl: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = srcUrl;
      img.onload = () => {
        const origW = img.naturalWidth || img.width || 640;
        const origH = img.naturalHeight || img.height || 360;

        const aspectPref = options.aspectRatio || 'auto';
        const focalX = Math.max(0, Math.min(100, options.focalX ?? 50)) / 100;
        const focalY = Math.max(0, Math.min(100, options.focalY ?? 50)) / 100;
        const zoom = Math.max(1, Math.min(2, options.zoom ?? 1));

        // Compute source crop rectangle (sx, sy, sw, sh) without ever stretching pixels
        let desiredRatio = origW / origH;
        if (aspectPref === '16:9') desiredRatio = 16 / 9;
        else if (aspectPref === '21:9') desiredRatio = 21 / 9;
        else if (aspectPref === '4:3') desiredRatio = 4 / 3;

        let baseSw = origW;
        let baseSh = origH;
        const currentRatio = origW / origH;

        if (aspectPref !== 'auto') {
          if (currentRatio > desiredRatio) {
            // Source is wider than target aspect ratio -> crop width
            baseSw = Math.round(origH * desiredRatio);
            baseSh = origH;
          } else {
            // Source is taller than target aspect ratio -> crop height
            baseSw = origW;
            baseSh = Math.round(origW / desiredRatio);
          }
        }

        // Apply zoom factor cleanly around focal point
        const sw = Math.max(64, Math.round(baseSw / zoom));
        const sh = Math.max(64, Math.round(baseSh / zoom));

        const maxSx = Math.max(0, origW - sw);
        const maxSy = Math.max(0, origH - sh);
        const sx = Math.round(maxSx * focalX);
        const sy = Math.round(maxSy * focalY);

        // Determine target output dimensions (400-760 px wide)
        const maxTargetW = options.isMobileVariant ? 600 : 760;
        let targetWidth = sw;
        let targetHeight = sh;
        if (targetWidth > maxTargetW) {
          targetHeight = Math.max(180, Math.round((targetHeight * maxTargetW) / targetWidth));
          targetWidth = maxTargetW;
        } else if (targetWidth < 400 && targetWidth > 0) {
          targetHeight = Math.max(180, Math.round((targetHeight * 400) / targetWidth));
          targetWidth = 400;
        }

        const canvas = document.createElement('canvas');
        let quality = 0.76;
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
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, currentW, currentH);
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          const base64Part = dataUrl.split(',')[1] || '';
          byteSize = Math.ceil((base64Part.length * 3) / 4);

          if (byteSize <= MAX_BANNER_IMAGE_BYTES && dataUrl.length <= 108000) {
            break;
          }
          quality = Math.max(0.36, quality - 0.12);
          if (currentW > 520) {
            currentH = Math.max(160, Math.round((currentH * 520) / currentW));
            currentW = 520;
          } else if (currentW > 400) {
            currentH = Math.max(150, Math.round((currentH * 400) / currentW));
            currentW = 400;
          }
        }

        resolve({
          dataUrl,
          width: currentW,
          height: currentH,
          byteSize,
          originalWidth: origW,
          originalHeight: origH,
        });
      };
      img.onerror = (err) => reject(err);
    };

    if (typeof source === 'string') {
      loadImg(source);
    } else {
      const reader = new FileReader();
      reader.readAsDataURL(source);
      reader.onload = (event) => loadImg(event.target?.result as string);
      reader.onerror = (err) => reject(err);
    }
  });
}

/**
 * Free-plan Banner Rule:
 * Compress each banner image on the phone to 400–800 px wide and strictly under 80 KB.
 * Returns a small dataUrl to be stored in a separate document (bannerImages/{eventId}),
 * never in Cloud Storage and never inside the newsEvents list document.
 */
export async function compressBannerImageToUnder80KB(
  file: File,
  options: BannerCropOptions = {}
): Promise<{ dataUrl: string; width: number; height: number; byteSize: number }> {
  const res = await cropAndCompressBannerImage(file, options);
  return {
    dataUrl: res.dataUrl,
    width: res.width,
    height: res.height,
    byteSize: res.byteSize,
  };
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
  const cleanDoc = stripUndefined(docData);
  try {
    const raw = localStorage.getItem(LOCAL_BANNER_IMAGES_DOCS_KEY);
    const map: Record<string, BannerSlideImageDoc> = raw ? JSON.parse(raw) : {};
    map[eventId] = cleanDoc;
    localStorage.setItem(LOCAL_BANNER_IMAGES_DOCS_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Local banner doc save notice:', e);
  }

  if (isFirebaseConfigured()) {
    await setDoc(doc(db, 'bannerImages', eventId), cleanDoc, { merge: true });
  }
}

/**
 * Store a separate mobile banner image for a slide (`bannerImages/{eventId}_mobile`).
 */
export async function saveMobileBannerSlideImageDoc(
  eventId: string,
  docData: BannerSlideImageDoc
): Promise<void> {
  return saveBannerSlideImageDoc(`${eventId}_mobile`, {
    ...docData,
    eventId: `${eventId}_mobile`,
    isMobileVariant: true,
  });
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
 * Load the optional mobile-specific banner image document (`bannerImages/{eventId}_mobile`).
 */
export async function getMobileBannerSlideImageDoc(
  eventId: string
): Promise<BannerSlideImageDoc | null> {
  return getBannerSlideImageDoc(`${eventId}_mobile`);
}

/**
 * Remove only the mobile banner image document (`bannerImages/{eventId}_mobile`).
 */
export async function deleteMobileBannerSlideImageDoc(eventId: string): Promise<void> {
  const mobileKey = `${eventId}_mobile`;
  try {
    const raw = localStorage.getItem(LOCAL_BANNER_IMAGES_DOCS_KEY);
    if (raw) {
      const map: Record<string, BannerSlideImageDoc> = JSON.parse(raw);
      delete map[mobileKey];
      localStorage.setItem(LOCAL_BANNER_IMAGES_DOCS_KEY, JSON.stringify(map));
    }
  } catch {}

  if (isFirebaseConfigured()) {
    try {
      await deleteDoc(doc(db, 'bannerImages', mobileKey));
    } catch (e) {
      console.warn('Delete mobile banner image doc notice:', e);
    }
  }
}

/**
 * Remove a banner slide's separate image document (`bannerImages/{eventId}`) and its mobile variant.
 */
export async function deleteBannerSlideImageDoc(eventId: string): Promise<void> {
  try {
    const raw = localStorage.getItem(LOCAL_BANNER_IMAGES_DOCS_KEY);
    if (raw) {
      const map: Record<string, BannerSlideImageDoc> = JSON.parse(raw);
      delete map[eventId];
      delete map[`${eventId}_mobile`];
      localStorage.setItem(LOCAL_BANNER_IMAGES_DOCS_KEY, JSON.stringify(map));
    }
  } catch {}

  if (isFirebaseConfigured()) {
    try {
      await deleteDoc(doc(db, 'bannerImages', eventId));
      await deleteDoc(doc(db, 'bannerImages', `${eventId}_mobile`));
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

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// Remove undefined properties before writing to Firestore (Firestore rejects undefined values)
function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const clean: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      clean[key] = val;
    }
  });
  return clean as T;
}

// ================= REAL-TIME FIRESTORE SUBSCRIBERS =================

let hasSeededInitialCollections = false;

export async function ensureInitialFirestoreSeed(seedData: {
  profiles: VillageProfile[];
  mosques: VillageMosque[];
  institutes: VillageInstitute[];
  transports: VillageTransport[];
  hospitals: VillageHospital[];
  newsEvents: VillageNewsEvent[];
  announcements: VillageAnnouncement[];
}): Promise<void> {
  if (!isFirebaseConfigured() || hasSeededInitialCollections) return;
  hasSeededInitialCollections = true;

  try {
    // 1. Check and seed profiles if empty or missing any default initialProfiles
    const profilesSnap = await getDocs(collection(db, 'profiles'));
    const existingProfileIds = new Set<string>();
    profilesSnap.forEach((docSnap) => existingProfileIds.add(docSnap.id));
    if (seedData.profiles.length > 0) {
      for (const p of seedData.profiles) {
        if (!existingProfileIds.has(p.id)) {
          const clean = stripUndefined(sanitizePublicProfile(p));
          await setDoc(doc(db, 'profiles', clean.id), clean, { merge: true });
        }
      }
    }

    // 2. Check and seed mosques if empty
    const mosquesSnap = await getDocs(collection(db, 'mosques'));
    if (mosquesSnap.empty && seedData.mosques.length > 0) {
      for (const m of seedData.mosques) {
        await setDoc(doc(db, 'mosques', m.id), stripUndefined(m), { merge: true });
      }
    }

    // 3. Check and seed institutes if empty
    const instSnap = await getDocs(collection(db, 'institutes'));
    if (instSnap.empty && seedData.institutes.length > 0) {
      for (const inst of seedData.institutes) {
        await setDoc(doc(db, 'institutes', inst.id), stripUndefined(inst), { merge: true });
      }
    }

    // 4. Check and seed transports if empty
    const transSnap = await getDocs(collection(db, 'transports'));
    if (transSnap.empty && seedData.transports.length > 0) {
      for (const tr of seedData.transports) {
        await setDoc(doc(db, 'transports', tr.id), stripUndefined(tr), { merge: true });
      }
    }

    // 5. Check and seed hospitals if empty
    const hospSnap = await getDocs(collection(db, 'hospitals'));
    if (hospSnap.empty && seedData.hospitals.length > 0) {
      for (const h of seedData.hospitals) {
        await setDoc(doc(db, 'hospitals', h.id), stripUndefined(h), { merge: true });
      }
    }

    // 6. Check and seed newsEvents & local bannerImages if empty
    const newsSnap = await getDocs(collection(db, 'newsEvents'));
    if (newsSnap.empty && seedData.newsEvents.length > 0) {
      for (const n of seedData.newsEvents) {
        const { imageData, ...restNews } = n as any;
        await setDoc(doc(db, 'newsEvents', n.id), stripUndefined(restNews), { merge: true });
      }
      // Also upload any locally stored banner images
      try {
        const rawBanners = localStorage.getItem(LOCAL_BANNER_IMAGES_DOCS_KEY);
        if (rawBanners) {
          const bannerMap: Record<string, BannerSlideImageDoc> = JSON.parse(rawBanners);
          for (const [evId, bDoc] of Object.entries(bannerMap)) {
            if (bDoc && bDoc.imageData && bDoc.byteSize <= MAX_BANNER_IMAGE_BYTES) {
              await setDoc(doc(db, 'bannerImages', evId), stripUndefined(bDoc), { merge: true });
            }
          }
        }
      } catch {}
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'initialSeed');
  }
}

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
    (err) => handleFirestoreError(err, OperationType.LIST, 'profiles')
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
    (err) => handleFirestoreError(err, OperationType.LIST, 'newsEvents')
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
    (err) => handleFirestoreError(err, OperationType.LIST, 'announcements')
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
    (err) => handleFirestoreError(err, OperationType.LIST, 'mosques')
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
    (err) => handleFirestoreError(err, OperationType.LIST, 'institutes')
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
    (err) => handleFirestoreError(err, OperationType.LIST, 'transports')
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
    (err) => handleFirestoreError(err, OperationType.LIST, 'hospitals')
  );
}

export function subscribeMessages(onUpdate: (messages: VillageMessage[]) => void): () => void {
  if (!isFirebaseConfigured()) return () => {};
  const q = collection(db, 'messages');
  return onSnapshot(
    q,
    (snapshot) => {
      recordFirestoreRead(Math.max(1, snapshot.docChanges().length));
      const list: VillageMessage[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as VillageMessage), id: docSnap.id });
      });
      // Sort by latest activity (updatedAt -> replyCreatedAt -> createdAt) descending
      list.sort((a, b) => {
        const tA = new Date(a.updatedAt || a.replyCreatedAt || a.createdAt || 0).getTime();
        const tB = new Date(b.updatedAt || b.replyCreatedAt || b.createdAt || 0).getTime();
        return tB - tA;
      });
      onUpdate(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'messages')
  );
}

export function subscribeNotifications(
  onUpdate: (notifications: PortalNotificationItem[]) => void
): () => void {
  if (!isFirebaseConfigured()) return () => {};
  const q = collection(db, 'notifications');
  return onSnapshot(
    q,
    (snapshot) => {
      recordFirestoreRead(Math.max(1, snapshot.docChanges().length));
      const list: PortalNotificationItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as PortalNotificationItem), id: docSnap.id });
      });
      list.sort((a, b) => {
        const tA = new Date(a.createdAt || 0).getTime();
        const tB = new Date(b.createdAt || 0).getTime();
        return tB - tA;
      });
      onUpdate(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
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
    (err) => handleFirestoreError(err, OperationType.LIST, 'adminAlerts')
  );
}

export function subscribePortalSettings(
  onUpdate: (settingsData: Record<string, any>) => void
): () => void {
  if (!isFirebaseConfigured()) return () => {};
  const docRef = doc(db, 'settings', 'portalSharedState');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as Record<string, any>);
      }
    },
    (err) => handleFirestoreError(err, OperationType.GET, 'settings/portalSharedState')
  );
}

export async function savePortalSettingsToFirestore(
  partialSettings: Record<string, any>
): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    recordFirestoreWrite(1);
    await setDoc(
      doc(db, 'settings', 'portalSharedState'),
      stripUndefined({
        ...partialSettings,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/portalSharedState');
  }
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
  try {
    // Strictly strip email, username, and password from public profiles collection
    const publicSafeProfile = stripUndefined(sanitizePublicProfile(profile));
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
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `profiles/${profile.id}`);
  }
}

export async function deleteProfileFromFirestore(profileId: string): Promise<void> {
  recordFirestoreWrite(1);
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, 'profiles', profileId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `profiles/${profileId}`);
  }
}

export async function saveMessageToFirestore(message: VillageMessage): Promise<boolean> {
  recordFirestoreWrite(1);
  if (!isFirebaseConfigured()) return true;
  try {
    const docRef = doc(db, 'messages', message.id);
    // Recursively strip undefined inside discussionThread items as well
    const cleanPayload = stripUndefined({
      ...message,
      discussionThread: Array.isArray(message.discussionThread)
        ? message.discussionThread.map((item) => stripUndefined(item as Record<string, any>))
        : [],
    });
    await setDoc(docRef, cleanPayload, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `messages/${message.id}`);
    return false;
  }
}

export async function deleteMessageFromFirestore(messageId: string): Promise<boolean> {
  recordFirestoreWrite(1);
  if (!isFirebaseConfigured()) return true;
  try {
    const docRef = doc(db, 'messages', messageId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `messages/${messageId}`);
    return false;
  }
}

export async function saveNotificationToFirestore(
  notif: PortalNotificationItem
): Promise<boolean> {
  recordFirestoreWrite(1);
  if (!isFirebaseConfigured()) return true;
  try {
    const docRef = doc(db, 'notifications', notif.id);
    await setDoc(docRef, stripUndefined(notif), { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `notifications/${notif.id}`);
    return false;
  }
}

export async function deleteNotificationFromFirestore(notifId: string): Promise<boolean> {
  recordFirestoreWrite(1);
  if (!isFirebaseConfigured()) return true;
  try {
    const docRef = doc(db, 'notifications', notifId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `notifications/${notifId}`);
    return false;
  }
}

export async function savePushSubscriptionToFirestore(
  sub: PushSubscriptionDoc
): Promise<boolean> {
  recordFirestoreWrite(1);
  if (!isFirebaseConfigured()) return true;
  try {
    const docRef = doc(db, 'pushSubscriptions', sub.id);
    await setDoc(docRef, stripUndefined(sub), { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `pushSubscriptions/${sub.id}`);
    return false;
  }
}

export async function deletePushSubscriptionFromFirestore(subId: string): Promise<boolean> {
  recordFirestoreWrite(1);
  if (!isFirebaseConfigured()) return true;
  try {
    const docRef = doc(db, 'pushSubscriptions', subId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `pushSubscriptions/${subId}`);
    return false;
  }
}

export async function saveUserNotificationPrefsToFirestore(
  userKey: string,
  prefs: UserNotificationSettings
): Promise<boolean> {
  if (!userKey) return false;
  const safeDocId = userKey.replace(/[^a-zA-Z0-9_\-@.]/g, '_').slice(0, 120);
  recordFirestoreWrite(1);
  if (!isFirebaseConfigured()) return true;
  try {
    await setDoc(doc(db, 'userNotificationPrefs', safeDocId), stripUndefined(prefs), {
      merge: true,
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `userNotificationPrefs/${safeDocId}`);
    return false;
  }
}

export async function loadUserNotificationPrefsFromFirestore(
  userKey: string
): Promise<UserNotificationSettings | null> {
  if (!userKey || !isFirebaseConfigured()) return null;
  const safeDocId = userKey.replace(/[^a-zA-Z0-9_\-@.]/g, '_').slice(0, 120);
  try {
    recordFirestoreRead(1);
    const snap = await getDoc(doc(db, 'userNotificationPrefs', safeDocId));
    if (snap.exists()) {
      return snap.data() as UserNotificationSettings;
    }
  } catch (err) {
    console.warn('Could not load user notification prefs from Firestore:', err);
  }
  return null;
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
    handleFirestoreError(e, OperationType.WRITE, 'settings/bannerBenefitsStrip');
  }
}

export async function saveNewsEventToFirestore(news: VillageNewsEvent): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const { imageData, ...restNews } = news as any;
    const docRef = doc(db, 'newsEvents', news.id);
    await setDoc(docRef, stripUndefined(restNews), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `newsEvents/${news.id}`);
  }
}

export async function deleteNewsEventFromFirestore(newsId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, 'newsEvents', newsId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `newsEvents/${newsId}`);
  }
}

export async function saveMosqueToFirestore(mosque: VillageMosque): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, 'mosques', mosque.id);
    await setDoc(docRef, stripUndefined(mosque), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `mosques/${mosque.id}`);
  }
}

export async function deleteMosqueFromFirestore(mosqueId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, 'mosques', mosqueId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `mosques/${mosqueId}`);
  }
}

export async function saveInstituteToFirestore(institute: VillageInstitute): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, 'institutes', institute.id);
    await setDoc(docRef, stripUndefined(institute), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `institutes/${institute.id}`);
  }
}

export async function deleteInstituteFromFirestore(instId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, 'institutes', instId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `institutes/${instId}`);
  }
}

export async function saveTransportToFirestore(transport: VillageTransport): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, 'transports', transport.id);
    await setDoc(docRef, stripUndefined(transport), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `transports/${transport.id}`);
  }
}

export async function deleteTransportFromFirestore(transId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, 'transports', transId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `transports/${transId}`);
  }
}

export async function saveHospitalToFirestore(hospital: VillageHospital): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, 'hospitals', hospital.id);
    await setDoc(docRef, stripUndefined(hospital), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `hospitals/${hospital.id}`);
  }
}

export async function deleteHospitalFromFirestore(hospId: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, 'hospitals', hospId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `hospitals/${hospId}`);
  }
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
