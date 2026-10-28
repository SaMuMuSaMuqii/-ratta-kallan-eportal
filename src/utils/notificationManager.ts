import {
  AuthUserSession,
  PortalNotificationItem,
  PushSubscriptionDoc,
  UserNotificationSettings,
  VillageMessage,
} from '../types';
import { app, auth } from '../firebase/config';
import {
  deletePushSubscriptionFromFirestore,
  loadUserNotificationPrefsFromFirestore,
  savePushSubscriptionToFirestore,
  saveUserNotificationPrefsToFirestore,
} from '../firebase/firestoreService';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';

export const NOTIFICATION_SETTINGS_STORAGE_KEY = 'rk_notification_settings_v1';
export const READ_GLOBAL_NOTIFICATIONS_KEY = 'rk_read_global_notifications_v1';
export const CLEARED_GLOBAL_NOTIFICATIONS_KEY = 'rk_cleared_global_notifications_v1';
export const PUSH_SUBSCRIPTION_ID_KEY = 'rk_push_subscription_id_v1';

export const DEFAULT_NOTIFICATION_SETTINGS: UserNotificationSettings = {
  inAppEnabled: true,
  soundEnabled: true,
  pushEnabled: false,
  messageAlerts: true,
  announcementAlerts: true,
  updatedAt: new Date().toISOString(),
};

/**
 * Normalize phone numbers so matching works across +92, 0092, 03xx, or raw digits.
 */
export const normalizePhoneDigits = (phone?: string | null): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('92') && digits.length >= 12) {
    return '0' + digits.slice(2);
  }
  if (digits.startsWith('0092') && digits.length >= 14) {
    return '0' + digits.slice(4);
  }
  return digits;
};

/**
 * Compare two phone strings safely by last 10 digits or full normalized digits.
 */
export const phonesMatch = (a?: string | null, b?: string | null): boolean => {
  const normA = normalizePhoneDigits(a);
  const normB = normalizePhoneDigits(b);
  if (!normA || !normB || normA.length < 7 || normB.length < 7) return false;
  if (normA === normB) return true;
  const tailA = normA.slice(-10);
  const tailB = normB.slice(-10);
  return tailA.length === 10 && tailA === tailB;
};

/**
 * Build a stable key for the current user so settings and read states stay isolated per user.
 */
export const getUserNotificationKey = (
  session?: AuthUserSession | null,
  currentUserPhone?: string | null,
  matchedProfileId?: string | null
): string => {
  if (session?.type === 'admin') return 'admin_super';
  if (session?.profileId) return `prof_${session.profileId}`;
  if (matchedProfileId) return `prof_${matchedProfileId}`;
  if (session?.uid) return `uid_${session.uid}`;
  const normPhone = normalizePhoneDigits(currentUserPhone || session?.mobile);
  if (normPhone) return `tel_${normPhone}`;
  if (session?.email) {
    return `email_${session.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  }
  return 'guest_default';
};

/**
 * Load notification settings from localStorage (with instant fallback to defaults).
 */
export const loadNotificationSettings = (userKey?: string): UserNotificationSettings => {
  try {
    const scopedKey = userKey
      ? `${NOTIFICATION_SETTINGS_STORAGE_KEY}_${userKey}`
      : NOTIFICATION_SETTINGS_STORAGE_KEY;
    const raw =
      localStorage.getItem(scopedKey) ||
      localStorage.getItem(NOTIFICATION_SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      inAppEnabled: parsed.inAppEnabled !== false,
      soundEnabled: parsed.soundEnabled !== false,
      pushEnabled: Boolean(parsed.pushEnabled),
      messageAlerts: parsed.messageAlerts !== false,
      announcementAlerts: parsed.announcementAlerts !== false,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }
};

/**
 * Save notification settings to both generic + user-scoped localStorage and Firestore.
 */
export const saveNotificationSettings = async (
  settings: UserNotificationSettings,
  userKey?: string
): Promise<UserNotificationSettings> => {
  const updated: UserNotificationSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(NOTIFICATION_SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    if (userKey) {
      localStorage.setItem(
        `${NOTIFICATION_SETTINGS_STORAGE_KEY}_${userKey}`,
        JSON.stringify(updated)
      );
      await saveUserNotificationPrefsToFirestore(userKey, updated);
    }
  } catch (err) {
    console.warn('Failed to persist notification settings:', err);
  }
  return updated;
};

/**
 * Sync notification preferences from Firestore when user logs in or switches account.
 */
export const syncNotificationSettingsFromCloud = async (
  userKey: string
): Promise<UserNotificationSettings | null> => {
  if (!userKey || userKey === 'guest_default') return null;
  const remote = await loadUserNotificationPrefsFromFirestore(userKey);
  if (!remote) return null;
  const merged: UserNotificationSettings = {
    inAppEnabled: remote.inAppEnabled !== false,
    soundEnabled: remote.soundEnabled !== false,
    pushEnabled: Boolean(remote.pushEnabled),
    messageAlerts: remote.messageAlerts !== false,
    announcementAlerts: remote.announcementAlerts !== false,
    updatedAt: remote.updatedAt || new Date().toISOString(),
  };
  try {
    localStorage.setItem(NOTIFICATION_SETTINGS_STORAGE_KEY, JSON.stringify(merged));
    localStorage.setItem(
      `${NOTIFICATION_SETTINGS_STORAGE_KEY}_${userKey}`,
      JSON.stringify(merged)
    );
  } catch {
    // ignore storage errors
  }
  return merged;
};

/**
 * Determine whether the current user is the recipient of a message.
 */
export const isCurrentUserRecipientOfMessage = (
  msg: VillageMessage,
  session?: AuthUserSession | null,
  currentUserPhone?: string | null,
  matchedProfileId?: string | null
): boolean => {
  if (msg.deletedByRecipient) return false;
  const isAdmin = session?.type === 'admin' || Boolean(session?.roles?.admin);
  if (msg.targetProfileId === 'admin' && isAdmin) {
    return true;
  }
  const activeProfileId = session?.profileId || matchedProfileId;
  if (activeProfileId && msg.targetProfileId === activeProfileId) {
    return true;
  }
  const activePhone = currentUserPhone || session?.mobile;
  if (activePhone && phonesMatch(msg.targetMobile, activePhone)) {
    return true;
  }
  if (session?.uid && msg.recipientUid && session.uid === msg.recipientUid) {
    return true;
  }
  return false;
};

/**
 * Determine whether the current user is the original sender of a message.
 */
export const isCurrentUserSenderOfMessage = (
  msg: VillageMessage,
  session?: AuthUserSession | null,
  currentUserPhone?: string | null,
  matchedProfileId?: string | null
): boolean => {
  if (msg.deletedBySender) return false;
  const activeProfileId = session?.profileId || matchedProfileId;
  if (activeProfileId && msg.senderProfileId && msg.senderProfileId === activeProfileId) {
    return true;
  }
  const activePhone = currentUserPhone || session?.mobile;
  if (activePhone && phonesMatch(msg.senderMobile, activePhone)) {
    return true;
  }
  if (session?.uid && msg.senderUid && session.uid === msg.senderUid) {
    return true;
  }
  return false;
};

/**
 * Check if a message has unread content specifically for the current user:
 * - If current user is the recipient: unread if `msg.unreadByRecipient === true` or `!msg.isRead`
 * - If current user is the original sender: unread if `msg.unreadBySender === true` (e.g., recipient replied)
 */
export const isMessageUnreadForCurrentUser = (
  msg: VillageMessage,
  session?: AuthUserSession | null,
  currentUserPhone?: string | null,
  matchedProfileId?: string | null
): boolean => {
  const isRecipient = isCurrentUserRecipientOfMessage(
    msg,
    session,
    currentUserPhone,
    matchedProfileId
  );
  const isSender = isCurrentUserSenderOfMessage(
    msg,
    session,
    currentUserPhone,
    matchedProfileId
  );

  if (isRecipient) {
    if (typeof msg.unreadByRecipient === 'boolean') {
      return msg.unreadByRecipient;
    }
    return !msg.isRead;
  }

  if (isSender) {
    if (typeof msg.unreadBySender === 'boolean') {
      return msg.unreadBySender;
    }
    return false;
  }

  return false;
};

/**
 * Get the set of global notification IDs marked as read by this user locally.
 */
export const getReadGlobalNotificationIds = (userKey: string): Set<string> => {
  try {
    const raw = localStorage.getItem(`${READ_GLOBAL_NOTIFICATIONS_KEY}_${userKey}`);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
};

export const markGlobalNotificationIdRead = (userKey: string, notifId: string): void => {
  try {
    const current = getReadGlobalNotificationIds(userKey);
    current.add(notifId);
    localStorage.setItem(
      `${READ_GLOBAL_NOTIFICATIONS_KEY}_${userKey}`,
      JSON.stringify(Array.from(current).slice(-250))
    );
  } catch {
    // ignore
  }
};

export const getClearedNotificationIds = (userKey: string): Set<string> => {
  try {
    const raw = localStorage.getItem(`${CLEARED_GLOBAL_NOTIFICATIONS_KEY}_${userKey}`);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
};

export const markNotificationIdClearedLocally = (
  userKey: string,
  notifId: string
): void => {
  try {
    const current = getClearedNotificationIds(userKey);
    current.add(notifId);
    localStorage.setItem(
      `${CLEARED_GLOBAL_NOTIFICATIONS_KEY}_${userKey}`,
      JSON.stringify(Array.from(current).slice(-350))
    );
  } catch {
    // ignore
  }
};

/**
 * Determine whether a PortalNotificationItem belongs to the current user.
 */
export const isNotificationForCurrentUser = (
  notif: PortalNotificationItem,
  session?: AuthUserSession | null,
  currentUserPhone?: string | null,
  matchedProfileId?: string | null,
  userKey?: string
): boolean => {
  const effectiveKey =
    userKey || getUserNotificationKey(session, currentUserPhone, matchedProfileId);

  if (
    Array.isArray(notif.clearedByKeys) &&
    notif.clearedByKeys.includes(effectiveKey)
  ) {
    return false;
  }
  const locallyCleared = getClearedNotificationIds(effectiveKey);
  if (locallyCleared.has(notif.id)) {
    return false;
  }

  if (notif.isGlobal) {
    return true;
  }

  const isAdmin = session?.type === 'admin' || Boolean(session?.roles?.admin);
  const activeProfileId = session?.profileId || matchedProfileId;
  const activePhone = currentUserPhone || session?.mobile;

  if (notif.recipientProfileId === 'admin' && isAdmin) {
    return true;
  }

  if (activeProfileId && notif.recipientProfileId === activeProfileId) {
    return true;
  }

  if (session?.uid && notif.recipientUid && notif.recipientUid === session.uid) {
    return true;
  }

  if (activePhone && notif.recipientMobile && phonesMatch(activePhone, notif.recipientMobile)) {
    return true;
  }

  return false;
};

/**
 * Check if a notification is unread for the current user.
 */
export const isNotificationUnreadForCurrentUser = (
  notif: PortalNotificationItem,
  userKey: string
): boolean => {
  if (notif.isGlobal) {
    const readIds = getReadGlobalNotificationIds(userKey);
    if (readIds.has(notif.id)) return false;
    if (Array.isArray(notif.readByKeys) && notif.readByKeys.includes(userKey)) return false;
    return true;
  }
  if (Array.isArray(notif.readByKeys) && notif.readByKeys.includes(userKey)) {
    return false;
  }
  return !notif.isRead;
};

/**
 * Browser Push / Notification API Permission Status
 */
export const getPushPermissionStatus = ():
  | 'granted'
  | 'denied'
  | 'default'
  | 'unsupported' => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

/**
 * Request browser/mobile push notification permission and register with Service Worker + Firestore.
 */
export const requestAndRegisterPushNotifications = async (userContext: {
  session?: AuthUserSession | null;
  currentUserPhone?: string | null;
  matchedProfileId?: string | null;
}): Promise<{
  success: boolean;
  permission: 'granted' | 'denied' | 'default' | 'unsupported';
  message: string;
}> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      success: false,
      permission: 'unsupported',
      message: 'آپ کا براؤزر پش نوٹیفکیشنز کو سپورٹ نہیں کرتا۔',
    };
  }

  try {
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      return {
        success: false,
        permission,
        message:
          permission === 'denied'
            ? 'براؤزر میں نوٹیفکیشن کی اجازت بند (Blocked) ہے۔ براہ کرم براؤزر ایڈریس بار کے لاک آئیکن سے اجازت آن کریں۔'
            : 'نوٹیفکیشن کی اجازت نہیں دی گئی۔',
      };
    }

    let swReg: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      swReg = await navigator.serviceWorker.getRegistration();
      if (!swReg) {
        swReg = await navigator.serviceWorker.register('/sw.js').catch(() => undefined);
      }
    }

    let fcmToken: string | undefined;
    try {
      const supported = await isSupported().catch(() => false);
      if (supported && swReg) {
        const messaging = getMessaging(app);
        fcmToken = await getToken(messaging, {
          serviceWorkerRegistration: swReg,
        }).catch(() => undefined);
      }
    } catch {
      // Fallback to standard Service Worker Web Notification registration
    }

    const userKey = getUserNotificationKey(
      userContext.session,
      userContext.currentUserPhone,
      userContext.matchedProfileId
    );
    const subId = `push_${userKey}`.replace(/[^a-zA-Z0-9_-]/g, '_');

    const subDoc: PushSubscriptionDoc = {
      id: subId,
      userKey,
      uid: auth.currentUser?.uid || userContext.session?.uid,
      profileId:
        userContext.session?.profileId ||
        userContext.matchedProfileId ||
        (userContext.session?.type === 'admin' ? 'admin' : undefined),
      mobile: normalizePhoneDigits(
        userContext.currentUserPhone || userContext.session?.mobile
      ),
      fcmToken: fcmToken || undefined,
      userAgent: navigator.userAgent.slice(0, 180),
      enabled: true,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(PUSH_SUBSCRIPTION_ID_KEY, subId);
    } catch {
      // ignore
    }

    await savePushSubscriptionToFirestore(subDoc);

    return {
      success: true,
      permission: 'granted',
      message: 'پش نوٹیفکیشنز کامیابی سے فعال ہو گئیں!',
    };
  } catch (err) {
    console.warn('Error registering push notifications:', err);
    return {
      success: false,
      permission: getPushPermissionStatus(),
      message: 'پش نوٹیفکیشنز فعال کرنے میں مسئلہ پیش آیا۔ دوبارہ کوشش کریں۔',
    };
  }
};

/**
 * Dissociate or remove push subscription from current user on logout so another user on the same device doesn't receive previous user's alerts.
 */
export const dissociatePushSubscriptionOnLogout = async (userContext?: {
  session?: AuthUserSession | null;
  currentUserPhone?: string | null;
  matchedProfileId?: string | null;
}): Promise<void> => {
  try {
    const savedSubId = localStorage.getItem(PUSH_SUBSCRIPTION_ID_KEY);
    if (savedSubId) {
      await deletePushSubscriptionFromFirestore(savedSubId);
      localStorage.removeItem(PUSH_SUBSCRIPTION_ID_KEY);
    } else if (userContext) {
      const userKey = getUserNotificationKey(
        userContext.session,
        userContext.currentUserPhone,
        userContext.matchedProfileId
      );
      const subId = `push_${userKey}`.replace(/[^a-zA-Z0-9_-]/g, '_');
      await deletePushSubscriptionFromFirestore(subId);
    }
  } catch (err) {
    console.warn('Failed to dissociate push subscription on logout:', err);
  }
};

/**
 * Trigger a browser / mobile Service Worker system notification when push notifications are enabled.
 */
export const dispatchSystemPushNotification = async (
  notif: PortalNotificationItem,
  settings: UserNotificationSettings
): Promise<boolean> => {
  if (!settings.pushEnabled) return false;
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  if (notif.type === 'new_message' || notif.type === 'message_reply') {
    if (!settings.messageAlerts) return false;
  }
  if (notif.type === 'announcement' || notif.type === 'emergency_alert') {
    if (!settings.announcementAlerts) return false;
  }

  const payload = {
    title: notif.title || 'رتہ کلاں ڈیجیٹل پورٹل',
    body: notif.body || 'آپ کے لیے ایک نئی اطلاع موجود ہے۔',
    tag: `rk-notif-${notif.id}`,
    url: notif.relatedMessageId
      ? `/?open_message=${encodeURIComponent(notif.relatedMessageId)}&inbox=${encodeURIComponent(
          notif.recipientMobile || notif.recipientProfileId || 'user'
        )}`
      : '/',
    messageId: notif.relatedMessageId || null,
    recipientId: notif.recipientProfileId || null,
    recipientMobile: notif.recipientMobile || null,
    notificationId: notif.id,
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        if (reg.active) {
          reg.active.postMessage({
            type: 'RK_SHOW_NOTIFICATION',
            payload,
          });
          return true;
        }
        await reg.showNotification(payload.title, {
          body: payload.body,
          icon: '/icons/icon-192x192.svg',
          badge: '/icons/icon-192x192.svg',
          tag: payload.tag,
          data: payload,
        });
        return true;
      }
    }

    const browserNotif = new Notification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192x192.svg',
      tag: payload.tag,
      data: payload,
    });
    browserNotif.onclick = () => {
      window.focus();
      window.dispatchEvent(
        new CustomEvent('rk-open-notification-target', { detail: payload })
      );
      browserNotif.close();
    };
    return true;
  } catch (err) {
    console.warn('System push notification dispatch failed:', err);
    return false;
  }
};
